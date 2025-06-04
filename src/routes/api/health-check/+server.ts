import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	const startTime = Date.now();
	const results: any = {
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV,
		url: url.pathname,
		checks: {}
	};
	
	// Check 1: Basic response
	results.checks.basic = {
		status: 'ok',
		duration: Date.now() - startTime
	};
	
	// Check 2: Auth status (no DB call)
	const authCheckStart = Date.now();
	results.checks.auth = {
		isValid: locals.pb?.authStore?.isValid || false,
		hasUser: !!locals.user,
		duration: Date.now() - authCheckStart
	};
	
	// Check 3: Database connectivity (lightweight query)
	if (locals.pb && locals.user) {
		const dbCheckStart = Date.now();
		try {
			// Just check if we can query the user - single record
			const user = await locals.pb.collection('users').getOne(locals.user.id, {
				fields: 'id'
			});
			results.checks.database = {
				status: 'ok',
				duration: Date.now() - dbCheckStart
			};
		} catch (err) {
			results.checks.database = {
				status: 'error',
				error: err instanceof Error ? err.message : 'Unknown error',
				duration: Date.now() - dbCheckStart
			};
		}
	}
	
	// Check 4: Count tours (using totalItems, not fetching data)
	if (locals.pb && locals.user) {
		const countCheckStart = Date.now();
		try {
			const toursResult = await locals.pb.collection('tours').getList(1, 1, {
				filter: `user = "${locals.user.id}"`,
				fields: 'id'
			});
			results.checks.tourCount = {
				status: 'ok',
				count: toursResult.totalItems,
				duration: Date.now() - countCheckStart
			};
		} catch (err) {
			results.checks.tourCount = {
				status: 'error',
				error: err instanceof Error ? err.message : 'Unknown error',
				duration: Date.now() - countCheckStart
			};
		}
	}
	
	// Total duration
	results.totalDuration = Date.now() - startTime;
	
	// If total duration is over 5 seconds, we have a problem
	if (results.totalDuration > 5000) {
		results.warning = 'Response time exceeds 5 seconds!';
	}
	
	return json(results);
}; 