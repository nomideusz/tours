// Shared date formatting utilities for client-side

/**
 * Safely formats a date string with fallback handling
 */
export function formatDate(dateString: string): string {
	try {
		// Handle null, undefined, or empty strings
		if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
			console.warn('Empty or null date string:', dateString);
			return 'No date';
		}
		
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			console.warn('Invalid date string:', dateString);
			return 'No date';
		}
		
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	} catch (error) {
		console.error('Error formatting date:', error, 'Date string:', dateString);
		return 'No date';
	}
}

/**
 * Safely formats a date for mobile display
 */
export function formatDateMobile(dateString: string): string {
	try {
		if (!dateString) return 'No date';
		const date = new Date(dateString);
		return isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	} catch {
		return 'No date';
	}
}

/**
 * Time formatting (e.g., "14:30")
 */
export function formatTime(dateString: string | Date): string {
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(date);
}

/**
 * Date and time formatting (e.g., "Jan 15, 2024 at 14:30")
 */
export function formatDateTime(dateString: string | Date): string {
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).format(date);
}

/**
 * Standard status color mapping
 */
export function getStatusColor(status: string): string {
	switch (status) {
		case 'confirmed':
			return 'bg-green-50 text-green-700';
		case 'pending':
			return 'bg-yellow-50 text-yellow-700';
		case 'cancelled':
			return 'bg-red-50 text-red-700';
		case 'completed':
			return 'bg-blue-50 text-blue-700';
		default:
			return 'bg-gray-50 text-gray-700';
	}
}

/**
 * Payment status color mapping
 */
export function getPaymentStatusColor(paymentStatus: string): string {
	switch (paymentStatus) {
		case 'paid':
			return 'bg-green-50 text-green-700';
		case 'pending':
			return 'bg-purple-50 text-purple-700';
		case 'failed':
			return 'bg-red-50 text-red-700';
		case 'refunded':
			return 'bg-gray-50 text-gray-700';
		default:
			return 'bg-purple-50 text-purple-700';
	}
} 