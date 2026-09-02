import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/security.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rks_property_intelligence_super_secret_jwt_key_2026';

// POST /api/auth/login - Sign In with Brute-Force Rate Limiting
router.post('/login', createRateLimiter(60000, 15, 'Too many login attempts. Please wait a minute and try again.'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const userResult = await query(
      'SELECT id, name, email, password_hash, role, phone, avatar_url FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (userResult.rowCount === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = userResult.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', {
      message: error?.message,
      stack: error?.stack,
      body: { email: req.body?.email },
    });
    res.status(500).json({ error: error?.message || 'Internal server error during login' });
  }
});

// POST /api/auth/customer-login - Record Customer Visit (stores name & phone)
router.post('/customer-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email } = req.body;

    const customerName = (name || '').trim() || 'Guest Customer';
    const customerPhone = (phone || '').trim() || null;
    const customerEmail = (email || '').trim() || null;

    // If phone is provided, upsert (update visit_count if returning customer)
    if (customerPhone) {
      const existing = await query(
        'SELECT id, visit_count FROM customer_visitors WHERE phone = $1',
        [customerPhone]
      );

      if (existing.rowCount > 0) {
        // Returning customer — increment visit count and update name/last_visited
        await query(
          `UPDATE customer_visitors SET name = $1, email = COALESCE($2, email), visit_count = visit_count + 1, last_visited_at = CURRENT_TIMESTAMP WHERE phone = $3`,
          [customerName, customerEmail, customerPhone]
        );
        res.json({
          message: 'Welcome back!',
          customer: { id: existing.rows[0].id, name: customerName, phone: customerPhone, visit_count: existing.rows[0].visit_count + 1 },
        });
        return;
      }
    }

    // New customer — insert
    const result = await query(
      `INSERT INTO customer_visitors (name, phone, email) VALUES ($1, $2, $3) RETURNING id, name, phone, visit_count`,
      [customerName, customerPhone, customerEmail]
    );

    res.status(201).json({
      message: 'Welcome to RKS Property Intelligence!',
      customer: result.rows[0],
    });
  } catch (error: any) {
    console.error('Customer login error:', error);
    // Don't block customer — still let them in even if DB write fails
    res.json({
      message: 'Welcome!',
      customer: { id: 0, name: req.body.name || 'Guest', phone: req.body.phone || '' },
    });
  }
});

// POST /api/auth/register - Sign Up / Register New Public Member
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
       VALUES ($1, $2, $3, 'VIEWER', $4, $5) RETURNING id, name, email, role, phone, avatar_url`,
      [name.trim(), normalizedEmail, passwordHash, phone ? phone.trim() : null, defaultAvatar]
    );

    const newUser = insertResult.rows[0];

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'USER', $3, 'REGISTER', $4)`,
      [newUser.id, newUser.name, newUser.id, `New member registered: ${newUser.name} (${newUser.email})`]
    );

    res.status(201).json({
      message: 'Account created successfully! Welcome to RKS Property Intelligence.',
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

// POST /api/auth/users - Add New Staff Member (Admin & Manager Only)
router.post('/users', authenticate, authorize(['ADMIN', 'MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password = 'rks_password123', role = 'EMPLOYEE', phone } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      res.status(409).json({ error: 'A team member with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, phone, avatar_url, created_at`,
      [name.trim(), normalizedEmail, passwordHash, role.toUpperCase(), phone ? phone.trim() : null, defaultAvatar]
    );

    const createdUser = insertResult.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'USER', $3, 'CREATE_STAFF', $4)`,
      [req.user?.id || null, req.user?.name || 'Admin', createdUser.id, `Created staff member: ${createdUser.name} with role ${createdUser.role}`]
    );

    res.status(201).json({
      message: `Team member ${createdUser.name} successfully added as ${createdUser.role}!`,
      user: createdUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create team member' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userResult = await query(
      'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/auth/users - List all Members / Staff
router.get('/users', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, name, email, role, phone, avatar_url, created_at FROM users ORDER BY id ASC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// PUT /api/auth/users/:id - Edit Team Member Details (Admin Only)
router.put('/users/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, role, password } = req.body;

    // 1. Check user exists
    const existingRes = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }

    const current = existingRes.rows[0];

    // 2. Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];
    const newRole = role ? String(role).toUpperCase() : current.role;
    if (!validRoles.includes(newRole)) {
      res.status(400).json({ error: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    // 3. Safety Check: Prevent demoting the last remaining ADMIN account
    if (current.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCountRes = await query(`SELECT count(*)::int as admin_count FROM users WHERE role = 'ADMIN' AND id != $1`, [id]);
      const otherAdmins = adminCountRes.rows[0]?.admin_count || 0;
      if (otherAdmins === 0) {
        res.status(400).json({ error: 'Cannot demote the last remaining Administrator account. Assign another admin first.' });
        return;
      }
    }

    // 4. Validate unique email
    let newEmail = current.email;
    if (email && email.trim().toLowerCase() !== current.email.toLowerCase()) {
      newEmail = email.trim().toLowerCase();
      const duplicateRes = await query('SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2', [newEmail, id]);
      if (duplicateRes.rowCount > 0) {
        res.status(409).json({ error: `The email address '${newEmail}' is already in use by another team member.` });
        return;
      }
    }

    const newName = name ? name.trim() : current.name;
    const newPhone = phone !== undefined ? (phone ? phone.trim() : null) : current.phone;

    // 5. Optional password update
    let passwordHash = current.password_hash;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const updateRes = await query(
      `UPDATE users SET
        name = $1,
        email = $2,
        phone = $3,
        role = $4,
        password_hash = $5,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING id, name, email, role, phone, avatar_url, updated_at`,
      [newName, newEmail, newPhone, newRole, passwordHash, id]
    );

    const updatedUser = updateRes.rows[0];
    const adminUser = req.user?.name || 'Administrator';

    // 6. Audit logging
    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'USER', $3, 'UPDATE_STAFF', $4)`,
      [
        req.user?.id || 1,
        adminUser,
        id,
        `Updated member ${updatedUser.name} (${updatedUser.email}). Role: ${updatedUser.role}${current.role !== updatedUser.role ? ` (Changed from ${current.role})` : ''}`
      ]
    );

    res.json({
      message: `Team member ${updatedUser.name} updated successfully!`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: error?.message || 'Failed to update team member' });
  }
});

// DELETE /api/auth/users/:id - Delete / Deactivate User (Admin Only)
router.delete('/users/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user?.id) {
      res.status(400).json({ error: 'Cannot delete your own active administrator account' });
      return;
    }

    const existingRes = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const current = existingRes.rows[0];
    if (current.role === 'ADMIN') {
      const adminCountRes = await query(`SELECT count(*)::int as admin_count FROM users WHERE role = 'ADMIN' AND id != $1`, [id]);
      if ((adminCountRes.rows[0]?.admin_count || 0) === 0) {
        res.status(400).json({ error: 'Cannot remove the last remaining Administrator account' });
        return;
      }
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    await query(
      `INSERT INTO audit_logs (user_id, user_name, entity_type, entity_id, action, details)
       VALUES ($1, $2, 'USER', $3, 'DELETE_STAFF', $4)`,
      [req.user?.id || 1, req.user?.name || 'Admin', id, `Removed team member ${current.name} (${current.email})`]
    );

    res.json({ message: 'User account removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
