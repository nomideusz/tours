import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

// Store the queryClient instance outside of load to persist it
let queryClient: QueryClient | undefined;

export const load = async ({ data }) => {
	// Only create/use QueryClient in the browser
	if (browser) {
		// Check if we need a fresh QueryClient (user changed or first load)
		const currentUserId = data?.user?.id;
		const needsFreshClient = !queryClient || 
			(queryClient as any).__userId !== currentUserId;

		if (needsFreshClient) {
			// Create a new QueryClient for this user
			queryClient = new QueryClient({
				defaultOptions: {
					queries: {
						enabled: browser,
						staleTime: 30 * 1000, // 30 seconds - shorter to prevent stale data
						gcTime: 5 * 60 * 1000, // 5 minutes
						refetchOnWindowFocus: false, // Disable to prevent excessive refetching
						refetchOnMount: false, // Disable to prevent double fetching
					},
				},
			});
			
			// Tag the client with the user ID for tracking
			(queryClient as any).__userId = currentUserId;
		}
	}

	return { 
		queryClient,
		...data 
	};
};

// App layout configuration - CSR for authenticated pages
export const ssr = false; 