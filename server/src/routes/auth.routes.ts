import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rks_property_intelligence_super_secret_jwt_key_2026';

// POST /api/auth/login - Sign In
router.post('/login', async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
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

// DELETE /api/auth/users/:id - Delete / Deactivate User (Admin Only)
router.delete('/users/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user?.id) {
      res.status(400).json({ error: 'Cannot delete your own active administrator account' });
      return;
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User account removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
