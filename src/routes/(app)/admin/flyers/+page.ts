import type { PageLoad } from './$types.js';

export const load = (async () => {
	return {
		title: 'Flyers Generator'
	};
}) satisfies PageLoad; 