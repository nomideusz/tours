// Query configuration for optimal PocketBase performance

export interface QueryConfig {
	maxPageSize: number;
	maxTotalRecords: number;
	maxExpandDepth: number;
	enableFullExpand: boolean;
	batchSize: number;
	timeoutMs: number;
}

// Get environment-specific query configuration
export function getQueryConfig(): QueryConfig {
	// Check for environment variable overrides
	if (typeof process !== 'undefined' && process.env) {
		// Allow complete override via environment variables
		if (process.env.POCKETBASE_MAX_PAGE_SIZE) {
			return {
				maxPageSize: parseInt(process.env.POCKETBASE_MAX_PAGE_SIZE) || 25,
				maxTotalRecords: parseInt(process.env.POCKETBASE_MAX_TOTAL_RECORDS || '100'),
				maxExpandDepth: parseInt(process.env.POCKETBASE_MAX_EXPAND_DEPTH || '1'),
				enableFullExpand: process.env.POCKETBASE_ENABLE_FULL_EXPAND !== 'false',
				batchSize: parseInt(process.env.POCKETBASE_BATCH_SIZE || '3'),
				timeoutMs: parseInt(process.env.POCKETBASE_TIMEOUT_MS || '5000')
			};
		}
	}
	
	// Check if we're in production
	const isProduction = process?.env?.NODE_ENV === 'production' || 
		(typeof window !== 'undefined' && window.location.hostname !== 'localhost');
	
	if (isProduction) {
		// Conservative settings for production
		return {
			maxPageSize: 25,        // Very small pages
			maxTotalRecords: 100,   // Limit total records
			maxExpandDepth: 1,      // Single level expand
			enableFullExpand: false, // Disable complex expands
			batchSize: 3,           // Very small batches
			timeoutMs: 5000         // 5 second timeout
		};
	}
	
	// More relaxed settings for development
	return {
		maxPageSize: 100,
		maxTotalRecords: 500,
		maxExpandDepth: 2,
		enableFullExpand: true,
		batchSize: 10,
		timeoutMs: 15000
	};
}

// Helper to create paginated query options
export function createPaginatedQuery(options: {
	page: number;
	filter?: string;
	sort?: string;
	expand?: string;
	fields?: string;
}) {
	const config = getQueryConfig();
	
	return {
		page: options.page,
		perPage: config.maxPageSize,
		filter: options.filter,
		sort: options.sort,
		expand: config.enableFullExpand ? options.expand : undefined,
		fields: options.fields,
		skipTotal: true // Always skip total count for performance
	};
} 