import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { betaApplications } from '$lib/db/schema/index.js';
import { sql, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all beta applications ordered by creation date (newest first)
		const applications = await db
			.select()
			.from(betaApplications)
			.orderBy(sql`${betaApplications.createdAt} DESC`);

		return json(applications);
	} catch (error) {
		console.error('Error fetching beta applications:', error);
		return json({ error: 'Failed to fetch beta applications' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { applicationId, status, reviewerNotes } = await request.json();

		if (!applicationId || !status) {
			return json({ error: 'Application ID and status are required' }, { status: 400 });
		}

		// Validate status
		const validStatuses = ['pending', 'accepted', 'rejected', 'waitlisted'];
		if (!validStatuses.includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		// Update the application
		const [updatedApplication] = await db
			.update(betaApplications)
			.set({
				status,
				reviewerNotes: reviewerNotes || null,
				reviewedAt: new Date(),
				reviewedBy: locals.user.id,
				updatedAt: new Date()
			})
			.where(eq(betaApplications.id, applicationId))
			.returning();

		if (!updatedApplication) {
			return json({ error: 'Application not found' }, { status: 404 });
		}

		console.log(`✅ Beta application ${applicationId} updated to ${status} by admin ${locals.user.email}`);

		return json({
			success: true,
			message: `Application ${status} successfully`,
			application: updatedApplication
		});

	} catch (error) {
		console.error('Error updating beta application:', error);
		return json({ error: 'Failed to update application' }, { status: 500 });
	}
};