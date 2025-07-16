import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

export const ssr = false;

// Store the queryClient instance for marketing pages
let marketingQueryClient: QueryClient | undefined;

export const load = async () => {
	// Only create QueryClient in the browser
	if (browser) {
		if (!marketingQueryClient) {
			// Create a new QueryClient for marketing pages
			marketingQueryClient = new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30 * 1000, // 30 seconds
						gcTime: 5 * 60 * 1000, // 5 minutes
						refetchOnWindowFocus: false,
						retry: 1,
						networkMode: 'online',
					},
				},
			});
		}

		return {
			queryClient: marketingQueryClient
		};
	}

	return {};
};