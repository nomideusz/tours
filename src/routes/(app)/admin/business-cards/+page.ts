import type { PageLoad } from './$types.js';

export const load = (async () => {
	return {
		title: 'Business Cards Generator'
	};
}) satisfies PageLoad; 