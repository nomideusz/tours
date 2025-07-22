import { browser } from '$app/environment';
import type { PageLoad } from './$types.js';

export const ssr = false;

export const load: PageLoad = async () => {
	if (!browser) {
		return {};
	}

	return {};
}; 