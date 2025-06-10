import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Authentication is handled by the parent layout, but double-check
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name || locals.user.username || 'Scanner User'
		},
		scannerConfig: {
			highlightScanRegion: true,
			highlightCodeOutline: true
		}
	};
}; 