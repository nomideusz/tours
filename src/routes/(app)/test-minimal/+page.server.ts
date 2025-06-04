import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('Test minimal page - start');
	const startTime = Date.now();
	
	// Return immediately with minimal data
	const result = {
		timestamp: new Date().toISOString(),
		loadTime: Date.now() - startTime,
		hasAuth: !!locals.user,
		environment: process.env.NODE_ENV
	};
	
	console.log('Test minimal page - end:', result);
	return result;
}; 