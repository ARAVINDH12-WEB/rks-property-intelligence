import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { getDb, query } from './db/index.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/auth.routes.js';
import propertiesRoutes from './routes/properties.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import importRoutes from './routes/import.routes.js';
import exportRoutes from './routes/export.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import auditRoutes from './routes/audit.routes.js';
import siteVisitsRoutes from './routes/site-visits.routes.js';
import aiChatRoutes from './routes/ai-chat.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/site-visits', siteVisitsRoutes);
app.use('/api/ai-chat', aiChatRoutes);

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbRes = await query('SELECT count(*)::int as count FROM properties');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'RKS Property Intelligence API',
      database: 'PostgreSQL (PGlite)',
      propertiesCount: dbRes.rows[0]?.count || 0,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// Serve frontend static build in production
const clientDistPath = path.join(process.cwd(), '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Boot and seed if required
async function startServer() {
  try {
    await getDb();
    const countCheck = await query('SELECT count(*)::int as count FROM properties');
    if (countCheck.rows[0]?.count === 0) {
      console.log('Database empty, automatically seeding initial RKS property inventory...');
      await seedDatabase();
    }

    const HOST = '0.0.0.0';
    app.listen(Number(PORT), HOST, () => {
      console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║               RKS PROPERTY INTELLIGENCE                   ║
  ║         Real Estate Inventory Command Center              ║
  ║                                                           ║
  ║  📡 Public Website / Server: http://${HOST}:${PORT}          ║
  ║  💾 Database:                PostgreSQL Engine Ready      ║
  ║  🛡️  Environment:             ${process.env.NODE_ENV || 'production'}                      ║
  ╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  startServer();
}

export default app;
export { app };
