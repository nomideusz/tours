import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ parent }) => {
	const data = await parent();
	
	return {
		...data
	};
};
