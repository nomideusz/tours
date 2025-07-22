import type { PageLoad } from './$types.js';

export const load = (async () => {
	return {
		title: 'Social Media Graphics Generator'
	};
}) satisfies PageLoad; 