import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { palette, timestamp, userAgent } = data;
		
		// Create logs directory if it doesn't exist
		const logsDir = join(process.cwd(), 'logs');
		if (!existsSync(logsDir)) {
			mkdirSync(logsDir, { recursive: true });
		}
		
		// Append vote to log file
		const logFile = join(logsDir, 'palette-votes.jsonl');
		const logEntry = JSON.stringify({
			palette,
			timestamp,
			userAgent: userAgent?.substring(0, 100), // Truncate for privacy
			ip: request.headers.get('x-forwarded-for') || 'unknown'
		}) + '\n';
		
		appendFileSync(logFile, logEntry);
		
		return json({ success: true });
	} catch (error) {
		console.error('Failed to log palette feedback:', error);
		return json({ success: false, error: 'Failed to log vote' }, { status: 500 });
	}
};

