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
			try {
				await lucia.invalidateSession(locals.session.id);
				console.log('Session invalidated successfully:', locals.session.id);
			} catch (error) {
				console.error('Error invalidating session:', error);
			}
		}

		// Clear session cookie
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: "/",
			...sessionCookie.attributes
		});
		
		// Also clear locals immediately
		locals.user = null;
		locals.session = null;
		locals.isAdmin = false;
		
		console.log('Logout completed, redirecting to login');
		throw redirect(303, '/auth/login');
	}
}; 