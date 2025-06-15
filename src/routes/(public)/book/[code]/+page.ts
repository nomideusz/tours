import type { PageLoad } from './$types.js';
import { prefetchPublicTourData } from '$lib/queries/public-queries.js';

export const load: PageLoad = async ({ params, parent }) => {
	const { queryClient } = await parent();
	
	// Prefetch tour data for faster page load
	if (params.code) {
		await prefetchPublicTourData(queryClient, params.code);
	}
	
	// Return minimal data - everything else will be fetched client-side
	return {
		qrCode: params.code
	};
}; 