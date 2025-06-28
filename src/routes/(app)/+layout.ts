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
			// Clean up the old QueryClient if it exists - more aggressive cleanup
			if (queryClient) {
				console.log('🧹 Aggressively cleaning up old QueryClient for user:', currentUserId);
				
				// Cancel all queries and clear cache
				await queryClient.cancelQueries();
				queryClient.clear();
				
				// Destroy all queries and mutations
				queryClient.getQueryCache().clear();
				queryClient.getMutationCache().clear();
				
				// Unmount the client
				queryClient.unmount();
			}

			// Create a new QueryClient with more robust settings
			console.log('✨ Creating fresh QueryClient for user:', newUserId);
			queryClient = new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30 * 1000, // 30 seconds stale time
						gcTime: 2 * 60 * 1000, // 2 minutes garbage collection (reduced from 5min)
						refetchOnWindowFocus: false, // Disable window focus refetching
						refetchOnMount: true, // Always refetch on mount for fresh data
						retry: 1, // Reduce retries to prevent cascading issues
						retryDelay: 1000, // Simple 1 second retry delay
						networkMode: 'online', // Only run when online
					},
					mutations: {
						retry: 1,
						retryDelay: 1000,
						networkMode: 'online',
					},
				},
			});

			currentUserId = newUserId;
		}

		return {
			queryClient
		};
	}

	// SSR fallback
	return {
		queryClient: undefined
	};
};

// App layout configuration - CSR for authenticated pages
export const ssr = false; 