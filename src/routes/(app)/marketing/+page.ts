import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ parent }) => {
	const { queryClient } = await parent();
	
	// Prefetch profile data for marketing materials
	if (queryClient) {
		queryClient.prefetchQuery({
			queryKey: ['profile'],
			queryFn: async () => {
				const response = await fetch('/api/profile');
				if (!response.ok) throw new Error('Failed to fetch profile');
				return response.json();
			},
			staleTime: 30000
		});
	}

	return {};
};

// Enable client-side rendering for real-time data
export const ssr = false; 