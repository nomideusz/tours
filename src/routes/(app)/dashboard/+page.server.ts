import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

// Redirect from old dashboard route to new calendar route
export const load: PageServerLoad = async () => {
	// Permanent redirect to the new calendar page
	throw redirect(301, '/calendar');
};
