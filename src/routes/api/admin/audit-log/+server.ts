import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAuditLogs, createAuditLog } from '$lib/utils/audit-log.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse query parameters
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const action = url.searchParams.get('action') || '';
	const resource = url.searchParams.get('resource') || '';
	const adminId = url.searchParams.get('adminId') || '';

	try {
		// Get all logs from utility
		const allLogs = getAuditLogs();
		
		// Filter logs
		let filteredLogs = [...allLogs];

		if (action) {
			filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
		}

		if (resource) {
			filteredLogs = filteredLogs.filter(log => log.resource.toLowerCase().includes(resource.toLowerCase()));
		}

		if (adminId) {
			filteredLogs = filteredLogs.filter(log => log.adminId === adminId);
		}

		// Sort by timestamp (newest first)
		filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

		// Paginate
		const offset = (page - 1) * limit;
		const paginatedLogs = filteredLogs.slice(offset, offset + limit);

		const totalCount = filteredLogs.length;
		const totalPages = Math.ceil(totalCount / limit);

		return json({
			logs: paginatedLogs,
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages
			},
			filters: {
				actions: [...new Set(allLogs.map(log => log.action))],
				resources: [...new Set(allLogs.map(log => log.resource))],
				admins: [...new Set(allLogs.map(log => ({ id: log.adminId, email: log.adminEmail })))]
			}
		});

	} catch (error) {
		console.error('Audit log fetch error:', error);
		return json({ error: 'Failed to fetch audit log' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action, resource, resourceId, resourceName, details } = body;

		// Create audit log entry using utility function
		const logEntry = createAuditLog({
			adminId: locals.user.id,
			adminEmail: locals.user.email,
			action,
			resource,
			resourceId,
			resourceName,
			details,
			ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
			userAgent: request.headers.get('user-agent') || 'unknown'
		});

		return json({ success: true, logEntry });

	} catch (error) {
		console.error('Audit log creation error:', error);
		return json({ error: 'Failed to create audit log entry' }, { status: 500 });
	}
}; 