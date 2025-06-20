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
			// Create a new QueryClient for this user with reactive-friendly defaults
			queryClient = new QueryClient({
				defaultOptions: {
					queries: {
						enabled: browser,
						staleTime: 0, // Always consider data potentially stale for immediate updates
						gcTime: 5 * 60 * 1000, // 5 minutes
						refetchOnWindowFocus: true, // Refetch when switching tabs
						refetchOnMount: true, // Refetch when components mount
						refetchOnReconnect: true, // Refetch when reconnecting
						retry: 1, // Reduce retries for faster feedback
						retryDelay: 1000, // 1 second retry delay
					},
				},
			});
			
			// Tag the client with the user ID for tracking
			(queryClient as any).__userId = currentUserId;
			console.log('Created fresh QueryClient for user:', currentUserId);
		}
	}

	return { 
		queryClient,
		...data 
	};
};

// App layout configuration - CSR for authenticated pages
export const ssr = false; 