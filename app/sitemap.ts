import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rkspropertyhub.in';

  // Static CMS and main portal routes
  const staticRoutes = [
    '',
    '/properties',
    '/plots/chennai',
    '/plots/trichy',
    '/plots/coimbatore',
    '/plots/hosur',
    '/plots/bangalore-corridor',
    '/about',
    '/contact',
    '/legal',
    '/ta',
    '/ta/properties',
    '/ta/plots/chennai',
    '/ta/plots/trichy',
    '/ta/plots/coimbatore',
    '/ta/plots/hosur',
    '/ta/plots/bangalore-corridor',
    '/ta/about',
    '/ta/contact',
    '/ta/legal',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return staticEntries;
}
