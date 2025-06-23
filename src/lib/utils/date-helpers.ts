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
			return 'status-confirmed';
		case 'pending':
			return 'status-pending';
		case 'cancelled':
			return 'status-cancelled';
		case 'completed':
			return 'status-completed';
		default:
			return 'status-default';
	}
}

/**
 * Payment status color mapping
 */
export function getPaymentStatusColor(paymentStatus: string): string {
	switch (paymentStatus) {
		case 'paid':
			return 'payment-paid';
		case 'pending':
			return 'payment-pending';
		case 'failed':
			return 'payment-failed';
		case 'refunded':
			return 'payment-refunded';
		default:
			return 'payment-pending';
	}
} 