import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

export const load = async () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 60 * 1000, // 1 minute
				gcTime: 5 * 60 * 1000, // 5 minutes
			},
		},
	});

	return { queryClient };
};

// App layout configuration - CSR for authenticated pages
export const ssr = false; 