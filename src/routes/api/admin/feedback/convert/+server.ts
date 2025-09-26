import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		
		const {
			feedbackId,
			title,
			priority = 'medium',
			category = 'other',
			effort,
			assignedTo,
			userImpact,
			businessValue,
			technicalNotes,
			acceptanceCriteria = [],
			tags = [],
			targetRelease,
			estimatedHours,
			targetDate
		} = data;

		if (!feedbackId || !title) {
			return json({ 
				error: 'Feedback ID and title are required' 
			}, { status: 400 });
		}

		// Get original feedback
		const feedbackResult = await db.execute(sql`
			SELECT 
				fs.*,
				u.name as user_name,
				u.email as user_email
			FROM feedback_submissions fs
			JOIN users u ON fs.user_id = u.id
			WHERE fs.id = ${feedbackId}
		`);

		if (!feedbackResult || feedbackResult.length === 0) {
			return json({ error: 'Feedback not found' }, { status: 404 });
		}

		const feedback = feedbackResult[0];

		// Map feedback type to development type
		let devType = 'improvement';
		if (feedback.type === 'bug') devType = 'bug';
		if (feedback.type === 'feature') devType = 'feature';

		// Calculate user impact and business value from feedback
		const calculatedUserImpact = userImpact || Math.max(feedback.urgency || 3, 3);
		const calculatedBusinessValue = businessValue || feedback.urgency || 3;

		const itemId = createId();

		// Create development item
		await db.execute(sql`
			INSERT INTO development_items (
				id, feedback_id, title, description, type, priority, category, effort,
				assigned_to, reported_by, user_impact, business_value,
				technical_notes, acceptance_criteria, tags, target_release,
				estimated_hours, target_date
			) VALUES (
				${itemId}, ${feedbackId}, ${title}, ${feedback.description}, ${devType}, 
				${priority}, ${category}, ${effort}, ${assignedTo}, ${feedback.user_id},
				${calculatedUserImpact}, ${calculatedBusinessValue}, ${technicalNotes},
				${JSON.stringify(acceptanceCriteria)}, ${JSON.stringify(tags)}, 
				${targetRelease}, ${estimatedHours}, ${targetDate}
			)
		`);

		// Add creation comment with feedback context
		await db.execute(sql`
			INSERT INTO development_comments (
				id, development_item_id, user_id, comment, type, metadata
			) VALUES (
				${createId()}, ${itemId}, ${locals.user.id}, 
				${'Converted from feedback by ' + feedback.user_name + ' (' + feedback.user_email + ')'}, 
				'conversion',
				${JSON.stringify({ 
					originalFeedback: {
						type: feedback.type,
						urgency: feedback.urgency,
						pageUrl: feedback.page_url,
						browserInfo: feedback.browser_info,
						createdAt: feedback.created_at
					}
				})}
			)
		`);

		// Update original feedback status
		await db.execute(sql`
			UPDATE feedback_submissions 
			SET 
				status = 'in_progress',
				admin_notes = COALESCE(admin_notes, '') || '\n\nConverted to development item: ' || ${title} || ' (ID: ' || ${itemId} || ')'
			WHERE id = ${feedbackId}
		`);

		console.log(`Feedback ${feedbackId} converted to development item ${itemId} by ${locals.user.email}`);

		return json({ 
			success: true,
			message: 'Feedback converted to development item successfully',
			itemId,
			developmentItem: {
				id: itemId,
				title,
				type: devType,
				priority,
				category
			}
		});

	} catch (error) {
		console.error('Error converting feedback to development item:', error);
		return json({ 
			error: 'Failed to convert feedback to development item' 
		}, { status: 500 });
	}
};
