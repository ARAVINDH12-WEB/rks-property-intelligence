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
import offersRoutes from './routes/offers.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import leadsRoutes from './routes/leads.routes.js';
import postersRoutes from './routes/posters.routes.js';
import { createRateLimiter } from './middleware/security.js';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Railway, Vercel, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Headers & Rate Limiting
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "http:"]
    }
  },
  frameguard: { action: 'sameorigin' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  xContentTypeOptions: true
}));
app.use('/api', createRateLimiter(60000, 200, 'Rate limit exceeded. Please slow down your requests.'));

// CORS & Parsing Middleware
const allowedOrigins = [
  'https://rksprime.com',
  'https://www.rksprime.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.railway\.app$/.test(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from ${origin}`));
  },
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
app.use('/api/offers', offersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/posters', postersRoutes);
app.use('/posters', postersRoutes);

// Comprehensive Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbRes = await query('SELECT count(*)::int as count FROM properties');
    const userRes = await query('SELECT count(*)::int as count FROM users');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'RKS Property Intelligence API',
      database: 'PostgreSQL (PGlite)',
      propertiesCount: dbRes.rows[0]?.count || 0,
      usersCount: userRes.rows[0]?.count || 0,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION),
        jwtConfigured: !!(process.env.JWT_SECRET || 'rks_property_intelligence_super_secret_jwt_key_2026'),
      },
    });
  } catch (err: any) {
    console.error('[Health Check Error]:', err?.stack || err);
    res.status(500).json({ status: 'ERROR', error: err?.message || 'Database unavailable' });
  }
});

// XML Sitemap with Bilingual Support & Hreflang Alternates
app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const baseUrl = 'https://rksprime.com';
    const pages = [
      { en: '', ta: '/ta', priority: '1.0' },
      { en: '/properties', ta: '/ta/properties', priority: '0.9' },
      { en: '/plots/chennai', ta: '/ta/plots/chennai', priority: '0.8' },
      { en: '/plots/trichy', ta: '/ta/plots/trichy', priority: '0.8' },
      { en: '/plots/coimbatore', ta: '/ta/plots/coimbatore', priority: '0.8' },
      { en: '/plots/hosur', ta: '/ta/plots/hosur', priority: '0.8' },
      { en: '/plots/bangalore-corridor', ta: '/ta/plots/bangalore-corridor', priority: '0.8' },
      { en: '/about', ta: '/ta/about', priority: '0.7' },
      { en: '/contact', ta: '/ta/contact', priority: '0.7' },
      { en: '/legal', ta: '/ta/legal', priority: '0.5' },
    ];

    const today = new Date().toISOString().split('T')[0];
    const urlEntries: string[] = [];

    for (const page of pages) {
      const enUrl = `${baseUrl}${page.en || '/'}`;
      const taUrl = `${baseUrl}${page.ta}`;

      // English entry
      urlEntries.push(`  <url>
    <loc>${enUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ta" href="${taUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`);

      // Tamil entry
      urlEntries.push(`  <url>
    <loc>${taUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ta" href="${taUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`);
    }

    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>`);
  } catch {
    res.status(500).send('Error generating sitemap');
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
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Global Application Error]:', {
    path: req.path,
    method: req.method,
    message: err?.message,
    stack: err?.stack,
  });

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]', err.stack || err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Boot and seed if required
async function startServer() {
  try {
    console.log('[Server Startup] Verifying environment & database...');
    await getDb();
    const userCheck = await query('SELECT count(*)::int as count FROM users');
    
    if ((userCheck.rows[0]?.count || 0) === 0 || process.env.FORCE_DB_RESET === 'true') {
      console.log('Running database cleanup/seed script...');
      await seedDatabase(true);
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
  } catch (error: any) {
    console.error('Failed to start server:', error?.stack || error);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMainModule && !process.env.VERCEL && !process.env.NOW_REGION) {
  startServer();
}

export default app;

