export const load = async () => {
	// Return empty data - all data loading handled by TanStack Query client-side
	return {};
};

// Disable SSR to prevent 502 errors on refresh
export const ssr = false; 