import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

// Store the queryClient instance outside of load to persist it
let queryClient: QueryClient | undefined;
let currentUserId: string | undefined;

export const load = async ({ data }) => {
	// Only create/use QueryClient in the browser
	if (browser) {
		// Check if we need a fresh QueryClient (user changed or first load)
		const newUserId = data?.user?.id;
		const needsFreshClient = !queryClient || currentUserId !== newUserId;

		if (needsFreshClient) {
			// Clean up the old QueryClient if it exists
			if (queryClient) {
				console.log('🧹 Cleaning up old QueryClient for user:', currentUserId);
				// Clear all queries and cancel any in-flight requests
				queryClient.cancelQueries();
				queryClient.clear();
				// Remove all observers to prevent memory leaks
				queryClient.getQueryCache().getAll().forEach(query => {
					query.destroy();
				});
				queryClient.getMutationCache().getAll().forEach(mutation => {
					mutation.destroy();
				});
				// Unmount the query client
				queryClient.unmount();
			}
			
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
			
			// Update the current user ID
			currentUserId = newUserId;
			console.log('✨ Created fresh QueryClient for user:', currentUserId);
		}
	}

	return { 
		queryClient,
		...data 
	};
};

// App layout configuration - CSR for authenticated pages
export const ssr = false; 