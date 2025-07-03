/**
 * Reusable table sorting utility
 * Provides sorting state management and data sorting functionality
 */

export interface SortConfig<T = string> {
	sortBy: T;
	sortOrder: 'asc' | 'desc';
}

export interface SortableField<T = any> {
	key: string;
	getValue: (item: T) => any;
	type?: 'string' | 'number' | 'date';
}

/**
 * Creates a reactive sorting state and functions
 */
export function createTableSort<T extends string>(
	initialSortBy: T, 
	initialSortOrder: 'asc' | 'desc' = 'desc'
) {
	let sortBy = $state(initialSortBy);
	let sortOrder = $state<'asc' | 'desc'>(initialSortOrder);

	function setSortBy(field: T) {
		if (sortBy === field) {
			// Toggle sort order if same field is selected
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			// Set new field with default desc order
			sortBy = field;
			sortOrder = 'desc';
		}
	}

	function setSortOrder(order: 'asc' | 'desc') {
		sortOrder = order;
	}

	function getSortConfig(): SortConfig<T> {
		return { sortBy, sortOrder };
	}

	return {
		get sortBy() { return sortBy; },
		get sortOrder() { return sortOrder; },
		setSortBy,
		setSortOrder,
		getSortConfig
	};
}

/**
 * Sorts an array of items based on sort configuration and field definitions
 */
export function sortData<T>(
	data: T[],
	sortConfig: SortConfig,
	sortableFields: Record<string, SortableField<T>>
): T[] {
	const { sortBy, sortOrder } = sortConfig;
	const field = sortableFields[sortBy];
	
	if (!field) {
		console.warn(`Sort field "${sortBy}" not found in sortable fields`);
		return data;
	}

	return [...data].sort((a, b) => {
		const aValue = field.getValue(a);
		const bValue = field.getValue(b);

		// Handle null/undefined values
		if (aValue == null && bValue == null) return 0;
		if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
		if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

		// Sort based on field type
		let comparison = 0;
		
		switch (field.type) {
			case 'number':
				comparison = Number(aValue) - Number(bValue);
				break;
			case 'date':
				const aDate = aValue instanceof Date ? aValue : new Date(aValue);
				const bDate = bValue instanceof Date ? bValue : new Date(bValue);
				comparison = aDate.getTime() - bDate.getTime();
				break;
			case 'string':
			default:
				const aStr = String(aValue).toLowerCase();
				const bStr = String(bValue).toLowerCase();
				comparison = aStr.localeCompare(bStr);
				break;
		}

		return sortOrder === 'asc' ? comparison : -comparison;
	});
}

/**
 * Helper to create sortable field configurations
 */
export function createSortableFields<T>(
	fields: Record<string, Omit<SortableField<T>, 'key'>>
): Record<string, SortableField<T>> {
	const result: Record<string, SortableField<T>> = {};
	
	for (const [key, config] of Object.entries(fields)) {
		result[key] = {
			key,
			...config
		};
	}
	
	return result;
} 