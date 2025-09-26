import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { sql, eq, desc, and, or, count } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// GET - Fetch development items with filtering and stats
export const GET: RequestHandler = async ({ locals, url }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const type = url.searchParams.get('type');
	const status = url.searchParams.get('status');
	const priority = url.searchParams.get('priority');
	const category = url.searchParams.get('category');
	const assignedTo = url.searchParams.get('assignedTo');
	const release = url.searchParams.get('release');

	try {
		// Build dynamic query
		let whereConditions: any[] = [];
		
		if (type && type !== 'all') {
			whereConditions.push(sql`type = ${type}`);
		}
		if (status && status !== 'all') {
			whereConditions.push(sql`status = ${status}`);
		}
		if (priority && priority !== 'all') {
			whereConditions.push(sql`priority = ${priority}`);
		}
		if (category && category !== 'all') {
			whereConditions.push(sql`category = ${category}`);
		}
		if (assignedTo && assignedTo !== 'all') {
			whereConditions.push(sql`assigned_to = ${assignedTo}`);
		}
		if (release && release !== 'all') {
			whereConditions.push(sql`target_release = ${release}`);
		}

		// Combine conditions
		const whereClause = whereConditions.length > 0 
			? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)
			: sql`TRUE`;

		// Get development items with user details
		const items = await db.execute(sql`
			SELECT 
				di.*,
				u_assigned.name as assigned_user_name,
				u_assigned.email as assigned_user_email,
				u_reporter.name as reporter_name,
				u_reporter.email as reporter_email,
				fs.description as original_feedback_description,
				fs.urgency as original_urgency,
				fs.user_id as feedback_user_id,
				u_feedback.name as feedback_user_name
			FROM development_items di
			LEFT JOIN users u_assigned ON di.assigned_to = u_assigned.id
			LEFT JOIN users u_reporter ON di.reported_by = u_reporter.id
			LEFT JOIN feedback_submissions fs ON di.feedback_id = fs.id
			LEFT JOIN users u_feedback ON fs.user_id = u_feedback.id
			WHERE ${whereClause}
			ORDER BY 
				CASE di.priority 
					WHEN 'critical' THEN 1
					WHEN 'high' THEN 2
					WHEN 'medium' THEN 3
					WHEN 'low' THEN 4
					WHEN 'backlog' THEN 5
				END,
				di.created_at DESC
		`);

		// Get summary statistics
		const stats = await db.execute(sql`
			SELECT 
				COUNT(*) as total,
				COUNT(CASE WHEN status = 'backlog' THEN 1 END) as backlog,
				COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned,
				COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
				COUNT(CASE WHEN status = 'testing' THEN 1 END) as testing,
				COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
				COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical,
				COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
				COUNT(CASE WHEN type = 'bug' THEN 1 END) as bugs,
				COUNT(CASE WHEN type = 'feature' THEN 1 END) as features,
				AVG(progress) as avg_progress
			FROM development_items
			WHERE ${whereClause}
		`);

		// Get category breakdown
		const categoryStats = await db.execute(sql`
			SELECT 
				category,
				COUNT(*) as count,
				COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
			FROM development_items
			WHERE ${whereClause}
			GROUP BY category
			ORDER BY count DESC
		`);

		// Get recent activity (last 10 updates)
		const recentActivity = await db.execute(sql`
			SELECT 
				dc.*,
				di.title as item_title,
				u.name as user_name,
				u.email as user_email
			FROM development_comments dc
			JOIN development_items di ON dc.development_item_id = di.id
			JOIN users u ON dc.user_id = u.id
			WHERE di.id IN (
				SELECT id FROM development_items 
				WHERE ${whereClause}
			)
			ORDER BY dc.created_at DESC
			LIMIT 10
		`);

		return json({
			items: items.rows,
			stats: stats.rows[0],
			categoryStats: categoryStats.rows,
			recentActivity: recentActivity.rows
		});

	} catch (error) {
		console.error('Error fetching development items:', error);
		return json({ error: 'Failed to fetch development items' }, { status: 500 });
	}
};

// POST - Create new development item
export const POST: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		
		const {
			title,
			description,
			type,
			priority = 'medium',
			category = 'other',
			effort,
			assignedTo,
			userImpact = 3,
			businessValue = 3,
			technicalNotes,
			acceptanceCriteria = [],
			tags = [],
			targetRelease,
			estimatedHours,
			targetDate,
			feedbackId // Optional: link to existing feedback
		} = data;

		// Validation
		if (!title || !description || !type) {
			return json({ 
				error: 'Title, description, and type are required' 
			}, { status: 400 });
		}

		const validTypes = ['bug', 'feature', 'improvement', 'technical_debt'];
		if (!validTypes.includes(type)) {
			return json({ 
				error: 'Invalid type. Must be: bug, feature, improvement, technical_debt' 
			}, { status: 400 });
		}

		const itemId = createId();

		// Insert development item
		await db.execute(sql`
			INSERT INTO development_items (
				id, title, description, type, priority, category, effort,
				assigned_to, reported_by, user_impact, business_value,
				technical_notes, acceptance_criteria, tags, target_release,
				estimated_hours, target_date, feedback_id
			) VALUES (
				${itemId}, ${title}, ${description}, ${type}, ${priority}, ${category}, ${effort},
				${assignedTo}, ${locals.user.id}, ${userImpact}, ${businessValue},
				${technicalNotes}, ${JSON.stringify(acceptanceCriteria)}, ${JSON.stringify(tags)}, 
				${targetRelease}, ${estimatedHours}, ${targetDate}, ${feedbackId}
			)
		`);

		// Add creation comment
		await db.execute(sql`
			INSERT INTO development_comments (
				id, development_item_id, user_id, comment, type, metadata
			) VALUES (
				${createId()}, ${itemId}, ${locals.user.id}, 
				'Development item created', 'creation',
				${JSON.stringify({ priority, category, type })}
			)
		`);

		// If linked to feedback, update feedback status
		if (feedbackId) {
			await db.execute(sql`
				UPDATE feedback_submissions 
				SET 
					status = 'acknowledged',
					admin_notes = COALESCE(admin_notes, '') || '\n\nLinked to development item: ' || ${title}
				WHERE id = ${feedbackId}
			`);
		}

		console.log(`Development item created: ${title} by ${locals.user.email}`);

		return json({ 
			success: true,
			message: 'Development item created successfully',
			itemId
		});

	} catch (error) {
		console.error('Error creating development item:', error);
		return json({ 
			error: 'Failed to create development item' 
		}, { status: 500 });
	}
};

// PATCH - Update development item
export const PATCH: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { itemId, ...updates } = data;

		if (!itemId) {
			return json({ error: 'Item ID is required' }, { status: 400 });
		}

		// Build update query dynamically
		const updateFields: string[] = [];
		const values: any[] = [];

		// Handle each possible update field
		const allowedFields = [
			'title', 'description', 'type', 'priority', 'category', 'effort',
			'status', 'progress', 'assigned_to', 'user_impact', 'business_value',
			'technical_notes', 'acceptance_criteria', 'tags', 'target_release',
			'estimated_hours', 'actual_hours', 'target_date'
		];

		for (const [key, value] of Object.entries(updates)) {
			if (allowedFields.includes(key) && value !== undefined) {
				updateFields.push(`${key} = $${values.length + 2}`); // +2 because itemId is $1
				
				// Handle JSON fields
				if (['acceptance_criteria', 'tags'].includes(key)) {
					values.push(JSON.stringify(value));
				} else {
					values.push(value);
				}
			}
		}

		if (updateFields.length === 0) {
			return json({ error: 'No valid fields to update' }, { status: 400 });
		}

		// Add updated_at
		updateFields.push(`updated_at = NOW()`);

		// Handle status changes
		if (updates.status) {
			if (updates.status === 'in_progress' && !updates.started_at) {
				updateFields.push(`started_at = NOW()`);
			}
			if (updates.status === 'completed' && !updates.completed_at) {
				updateFields.push(`completed_at = NOW()`);
				updateFields.push(`progress = 100`);
			}
		}

		// Execute update
		const query = `
			UPDATE development_items 
			SET ${updateFields.join(', ')} 
			WHERE id = $1
		`;

		await db.execute(sql.raw(query, [itemId, ...values]));

		// Add update comment
		const changeDescription = Object.keys(updates).join(', ');
		await db.execute(sql`
			INSERT INTO development_comments (
				id, development_item_id, user_id, comment, type, metadata
			) VALUES (
				${createId()}, ${itemId}, ${locals.user.id}, 
				${'Updated: ' + changeDescription}, 'update',
				${JSON.stringify(updates)}
			)
		`);

		console.log(`Development item ${itemId} updated by ${locals.user.email}`);

		return json({ 
			success: true,
			message: 'Development item updated successfully'
		});

	} catch (error) {
		console.error('Error updating development item:', error);
		return json({ 
			error: 'Failed to update development item' 
		}, { status: 500 });
	}
};
