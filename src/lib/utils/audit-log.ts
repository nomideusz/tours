// In-memory audit log for now (in production, this should be stored in database)
// This demonstrates the concept - you'd typically want to store this in a dedicated audit table
const auditLog: Array<{
	id: string;
	timestamp: string;
	adminId: string;
	adminEmail: string;
	action: string;
	resource: string;
	resourceId: string;
	resourceName?: string;
	details: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}> = [];

// Helper function to add audit log entries
export function addAuditLog(entry: {
	adminId: string;
	adminEmail: string;
	action: string;
	resource: string;
	resourceId: string;
	resourceName?: string;
	details: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}) {
	const logEntry = {
		id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		timestamp: new Date().toISOString(),
		...entry
	};

	auditLog.push(logEntry);

	// Keep only last 1000 entries
	if (auditLog.length > 1000) {
		auditLog.splice(0, auditLog.length - 1000);
	}

	console.log(`🔍 AUDIT LOG: ${logEntry.adminEmail} performed ${logEntry.action} on ${logEntry.resource} ${logEntry.resourceId}`, logEntry);
}

// Get all audit logs (for the API endpoint)
export function getAuditLogs() {
	return [...auditLog];
}

// Add audit log entry (for the API endpoint)
export function createAuditLog(entry: {
	adminId: string;
	adminEmail: string;
	action: string;
	resource: string;
	resourceId: string;
	resourceName?: string;
	details: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}) {
	const logEntry = {
		id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		timestamp: new Date().toISOString(),
		...entry
	};

	auditLog.push(logEntry);

	// Keep only last 1000 entries in memory (in production, implement proper retention)
	if (auditLog.length > 1000) {
		auditLog.splice(0, auditLog.length - 1000);
	}

	// Also log to console for server logs
	console.log(`🔍 AUDIT LOG: ${logEntry.adminEmail} performed ${logEntry.action} on ${logEntry.resource} ${logEntry.resourceId}`, logEntry);

	return logEntry;
} 