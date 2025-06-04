import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const delay = parseInt(url.searchParams.get('delay') || '5');
	const maxDelay = 120; // Cap at 2 minutes
	const actualDelay = Math.min(delay, maxDelay);
	
	console.log(`Timeout test: Starting ${actualDelay} second delay`);
	const startTime = Date.now();
	
	// Wait for the specified time
	await new Promise(resolve => setTimeout(resolve, actualDelay * 1000));
	
	const endTime = Date.now();
	const duration = endTime - startTime;
	
	console.log(`Timeout test: Completed after ${duration}ms`);
	
	return json({
		requested_delay: delay,
		actual_delay: actualDelay,
		duration_ms: duration,
		success: true,
		message: `Successfully waited ${actualDelay} seconds`,
		test_urls: [
			'/api/timeout-test?delay=5',
			'/api/timeout-test?delay=30',
			'/api/timeout-test?delay=65',
			'/api/timeout-test?delay=90'
		]
	});
}; 