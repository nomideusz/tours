import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, url, parent }) => {
	const { queryClient } = await parent();
	const bookingId = url.searchParams.get('booking_id');
	
	// Prefetch booking status for faster page load
	if (bookingId) {
		queryClient.prefetchQuery({
			queryKey: ['public', 'booking', 'status', bookingId],
			queryFn: async () => {
				const response = await fetch(`/api/public/booking/${bookingId}/status`);
				if (!response.ok) throw new Error('Failed to prefetch booking status');
				return response.json();
			},
			staleTime: 1000 // 1 second
		});
	}
	
	// Return minimal data - everything else will be fetched client-side
	return {
		bookingId,
		qrCode: params.code
	};
}; 