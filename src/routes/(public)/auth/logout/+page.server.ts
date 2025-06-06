import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { lucia } from '$lib/auth/lucia.js';

export const load: PageServerLoad = async ({ locals }) => {
	// This is a POST-only route, redirect GET requests
	if (!locals.session) {
		throw redirect(303, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		// Invalidate session if it exists
		if (locals.session) {
			await lucia.invalidateSession(locals.session.id);
		}

		// Clear session cookie
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
		
		throw redirect(303, '/auth/login');
	}
}; 