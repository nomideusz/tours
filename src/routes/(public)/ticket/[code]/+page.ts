import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, parent }) => {
	const { queryClient } = await parent();
	const { code } = params;
	
	// Prefetch ticket data for faster page load
	if (code) {
		queryClient.prefetchQuery({
			queryKey: ['public', 'ticket', code],
			queryFn: async () => {
				const response = await fetch(`/api/public/ticket/${code}`);
				if (!response.ok) throw new Error('Failed to prefetch ticket');
				return response.json();
			},
			staleTime: 5000
		});
	}
	
	// Return minimal data - everything else will be fetched client-side
	return {
		ticketCode: code
	};
}; 

// Disable SSR to avoid fetch issues
export const ssr = false; 