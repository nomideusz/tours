// Utility to determine if we should skip heavy operations in production SSR
export function shouldSkipInSSR(request: Request): boolean {
	const isProduction = process.env.NODE_ENV === 'production';
	const isSSR = !request.headers.get('x-sveltekit-action');
	
	if (isProduction && isSSR) {
		console.log('SSR Skip Check: Skipping operations in production SSR');
		return true;
	}
	
	return false;
}

// Default empty data for SSR skip scenarios
export const EMPTY_PAGE_DATA = {
	tours: [],
	bookings: [],
	stats: {
		total: 0,
		active: 0,
		draft: 0,
		totalRevenue: 0,
		todayBookings: 0,
		weekBookings: 0,
		monthRevenue: 0,
		totalBookings: 0,
		confirmedBookings: 0,
		totalParticipants: 0
	},
	isSSRSkipped: true
}; 