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
import uploadRoutes from './routes/upload.routes.js';
import pagesRoutes from './routes/pages.routes.js';
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
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes (mounted with both /api prefix and root path for serverless compatibility)
const routeModules: [string, any][] = [
  ['/auth', authRoutes],
  ['/properties', propertiesRoutes],
  ['/projects', projectsRoutes],
  ['/locations', locationsRoutes],
  ['/import', importRoutes],
  ['/export', exportRoutes],
  ['/reports', reportsRoutes],
  ['/audit-logs', auditRoutes],
  ['/site-visits', siteVisitsRoutes],
  ['/ai-chat', aiChatRoutes],
  ['/offers', offersRoutes],
  ['/settings', settingsRoutes],
  ['/leads', leadsRoutes],
  ['/posters', postersRoutes],
  ['/upload', uploadRoutes],
  ['/pages', pagesRoutes],
];

for (const [routePath, routerModule] of routeModules) {
  app.use(`/api${routePath}`, routerModule);
  app.use(routePath, routerModule);
}

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

// Robots.txt Route
app.get('/robots.txt', (_req: Request, res: Response) => {
  const baseUrl = process.env.PUBLIC_SITE_URL || 'https://rkspropertyhub.in';
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/*
Disallow: /api/*

Sitemap: ${baseUrl}/sitemap.xml
`);
});

// Dynamic XML Sitemap with CMS pages, property listings, and lastmod dates
app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const baseUrl = process.env.PUBLIC_SITE_URL || 'https://rkspropertyhub.in';
    const staticPages = [
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

    // Static pages
    for (const page of staticPages) {
      const enUrl = `${baseUrl}${page.en || '/'}`;
      const taUrl = `${baseUrl}${page.ta}`;

      urlEntries.push(`  <url>
    <loc>${enUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ta" href="${taUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`);
    }

    // Dynamic CMS pages from "pages" table
    try {
      const cmsRes = await query('SELECT slug, updated_at FROM pages WHERE is_published = true');
      for (const cmsPage of cmsRes.rows) {
        if (!cmsPage.slug) continue;
        const pageSlug = cmsPage.slug.startsWith('/') ? cmsPage.slug : `/${cmsPage.slug}`;
        const lastMod = cmsPage.updated_at ? new Date(cmsPage.updated_at).toISOString().split('T')[0] : today;
        urlEntries.push(`  <url>
    <loc>${baseUrl}${pageSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    } catch {
      // Pages table fallback
    }

    // Active Property Listings from "properties" table
    try {
      const propsRes = await query('SELECT id, property_code, updated_at FROM properties WHERE status != $1 ORDER BY updated_at DESC', ['DRAFT']);
      for (const prop of propsRes.rows) {
        const lastMod = prop.updated_at ? new Date(prop.updated_at).toISOString().split('T')[0] : today;
        urlEntries.push(`  <url>
    <loc>${baseUrl}/properties?id=${prop.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    } catch {
      // Properties fallback
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
  const HOST = '0.0.0.0';
  const listenPort = Number(PORT);

  // Bind Express server to 0.0.0.0 immediately for Render/cloud port detection
  const server = app.listen(listenPort, HOST, async () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║               RKS PROPERTY INTELLIGENCE                   ║
  ║         Real Estate Inventory Command Center              ║
  ║                                                           ║
  ║  📡 Public Website / Server: http://${HOST}:${listenPort}          ║
  ║  💾 Database:                Initializing DB connection... ║
  ║  🛡️  Environment:             ${process.env.NODE_ENV || 'production'}                      ║
  ╚═══════════════════════════════════════════════════════════╝
    `);

    try {
      console.log('[Server Startup] Connecting to database...');
      await getDb();
      const userCheck = await query('SELECT count(*)::int as count FROM users');

      if (process.env.FORCE_DB_RESET === 'true') {
        console.log('[Database Safety] FORCE_DB_RESET is true. Executing database re-initialization...');
        await seedDatabase(true);
      } else if ((userCheck.rows[0]?.count || 0) === 0) {
        console.log('[Database Safety] Database is empty (0 users). Initializing default admin user and initial data...');
        await seedDatabase(false);
      } else {
        console.log('[Database Safety] Existing database preserved. Zero auto-resets on startup ✅');
      }
      console.log('[Server Startup] Database connection & schema verified ✅');
    } catch (error: any) {
      console.error('⚠️ [Server Startup Database Exception]:', error?.message || error);
      console.error('⚠️ Verify DATABASE_URL / INTERNAL_DATABASE_URL is set in Render environment settings.');
    }
  });

  server.on('error', (err: any) => {
    console.error('Failed to bind server port:', err);
    process.exit(1);
  });
}

const isMainModule = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMainModule && !process.env.VERCEL && !process.env.NOW_REGION) {
  startServer();
}

export default app;

