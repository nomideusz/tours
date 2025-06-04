import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const debug = {
		environment: {
			NODE_ENV: process.env.NODE_ENV,
			POCKETBASE_URL: process.env.POCKETBASE_URL || 'not set',
			DISABLE_AUTH_REFRESH: process.env.DISABLE_AUTH_REFRESH || 'not set'
		},
		runtime: {
			nodeVersion: process.version,
			platform: process.platform,
			memory: process.memoryUsage(),
			uptime: process.uptime()
		},
		suggestions: [
			'Check reverse proxy timeout (nginx, cloudflare)',
			'Check container/platform timeout settings',
			'Verify PocketBase is accessible from production',
			'Check for rate limiting or connection limits',
			'Monitor server logs during 502 errors'
		]
	};
	
	return json(debug);
}; 