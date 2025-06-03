import type { RequestHandler } from './$types.js';

const baseUrl = 'https://zaur.app';

export const GET: RequestHandler = async () => {
	// Static pages
	const staticPages = [
		{ url: '', priority: '1.0', changefreq: 'weekly' },
		{ url: '/auth/login', priority: '0.8', changefreq: 'monthly' },
		{ url: '/auth/register', priority: '0.8', changefreq: 'monthly' },
		{ url: '/auth/forgot-password', priority: '0.5', changefreq: 'monthly' },
		{ url: '/pricing', priority: '0.9', changefreq: 'monthly' },
		{ url: '/features', priority: '0.8', changefreq: 'monthly' },
		{ url: '/contact', priority: '0.7', changefreq: 'monthly' },
		{ url: '/privacy', priority: '0.6', changefreq: 'yearly' },
		{ url: '/terms', priority: '0.6', changefreq: 'yearly' }
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600' // Cache for 1 hour
		}
	});
}; 