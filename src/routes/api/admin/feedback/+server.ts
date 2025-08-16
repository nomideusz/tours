import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { sql } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { feedbackId, status, adminNotes } = await request.json();

		// Validation
		if (!feedbackId || !status) {
			return json({ 
				error: 'Feedback ID and status are required' 
			}, { status: 400 });
		}

		const validStatuses = ['new', 'acknowledged', 'in_progress', 'resolved', 'wont_fix'];
		if (!validStatuses.includes(status)) {
			return json({ 
				error: 'Invalid status' 
			}, { status: 400 });
		}

		// Update feedback
		const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
		
		await db.execute(sql`
			UPDATE feedback_submissions 
			SET 
				status = ${status},
				admin_notes = ${adminNotes || null},
				resolved_at = ${resolvedAt},
				resolved_by = ${status === 'resolved' ? locals.user.email : null}
			WHERE id = ${feedbackId}
		`);

		// Log for monitoring
		console.log(`Feedback ${feedbackId} updated to ${status} by ${locals.user.email}`);

		return json({ 
			success: true,
			message: 'Feedback updated successfully'
		});

	} catch (error) {
		console.error('Error updating feedback:', error);
		return json({ 
			error: 'Failed to update feedback' 
		}, { status: 500 });
	}
};
