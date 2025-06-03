import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
	const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /(app)/
Disallow: /auth/logout
Disallow: /auth/reset-password
Disallow: /checkin/
Disallow: /ticket/
Disallow: /book/*/payment
Disallow: /book/*/success

# Sitemap
Sitemap: https://zaur.app/sitemap.xml

# Crawl delay
Crawl-delay: 1`;

	return new Response(robots, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'max-age=86400' // Cache for 24 hours
		}
	});
}; 