import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Create feedback_submissions table if it doesn't exist
// This would normally be in a migration file
const createTableQuery = `
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  urgency INTEGER CHECK (urgency >= 1 AND urgency <= 5),
  page_url TEXT,
  browser_info TEXT,
  status VARCHAR(50) DEFAULT 'new',
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
`;

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { type, description, urgency, pageUrl, browserInfo } = await request.json();

		// Validation
		if (!type || !description) {
			return json({ 
				error: 'Type and description are required' 
			}, { status: 400 });
		}

		if (!['bug', 'feature', 'general', 'praise'].includes(type)) {
			return json({ 
				error: 'Invalid feedback type' 
			}, { status: 400 });
		}

		if (urgency && (urgency < 1 || urgency > 5)) {
			return json({ 
				error: 'Urgency must be between 1 and 5' 
			}, { status: 400 });
		}

		// Insert feedback into database
		const feedbackId = createId();
		
		// Using raw SQL since we don't have the table in our schema yet
		await db.execute(sql`
			INSERT INTO feedback_submissions (
				id, 
				user_id, 
				type, 
				description, 
				urgency, 
				page_url, 
				browser_info, 
				status, 
				created_at
			) VALUES (
				${feedbackId}, 
				${locals.user.id}, 
				${type}, 
				${description}, 
				${urgency || 3}, 
				${pageUrl || null}, 
				${browserInfo || null}, 
				'new', 
				NOW()
			)
		`);

		// Send notification to admin (optional - implement based on your notification system)
		// await sendAdminNotification({
		//   type: 'new_feedback',
		//   feedbackType: type,
		//   userId: locals.user.id,
		//   userName: locals.user.name,
		//   description: description.substring(0, 100) + '...'
		// });

		// Log for monitoring
		console.log(`New ${type} feedback from user ${locals.user.email}: ${description.substring(0, 50)}...`);

		return json({ 
			success: true,
			message: 'Thank you for your feedback!',
			feedbackId
		});

	} catch (error) {
		console.error('Error submitting feedback:', error);
		return json({ 
			error: 'Failed to submit feedback' 
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals, url }) => {
	// Admin endpoint to retrieve feedback
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const status = url.searchParams.get('status') || 'all';
		const type = url.searchParams.get('type') || 'all';
		
		let query = `
			SELECT 
				f.*,
				u.name as user_name,
				u.email as user_email,
				u.business_name
			FROM feedback_submissions f
			JOIN users u ON f.user_id = u.id
			WHERE 1=1
		`;
		
		const params: any[] = [];
		
		if (status !== 'all') {
			query += ` AND f.status = $${params.length + 1}`;
			params.push(status);
		}
		
		if (type !== 'all') {
			query += ` AND f.type = $${params.length + 1}`;
			params.push(type);
		}
		
		query += ` ORDER BY f.created_at DESC LIMIT 100`;
		
		const result = await db.execute(sql.raw(query));
		
		return json(result);
		
	} catch (error) {
		console.error('Error fetching feedback:', error);
		return json({ 
			error: 'Failed to fetch feedback' 
		}, { status: 500 });
	}
};
