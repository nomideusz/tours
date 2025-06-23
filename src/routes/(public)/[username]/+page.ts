import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, parent }) => {
	const { queryClient } = await parent();
	const { username } = params;
	
	// Prefetch profile data for faster page load
	if (username) {
		queryClient.prefetchQuery({
			queryKey: ['public', 'profile', username],
			queryFn: async () => {
				const response = await fetch(`/api/public/profile/${username}`);
				if (!response.ok) throw new Error('Failed to prefetch profile');
				return response.json();
			},
			staleTime: 30000
		});
	}
	
	// Return minimal data - everything else will be fetched client-side
	return {
		username
	};
}; 

// Disable SSR to avoid fetch issues
export const ssr = false; 