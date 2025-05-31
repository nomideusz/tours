import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { updateAuthState } from '$lib/auth.js';

export const load: PageServerLoad = async ({ locals }) => {
	// This is a POST-only route, redirect GET requests
	if (!locals.pb?.authStore?.isValid) {
		throw redirect(303, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		// Logout the user
		if (locals.pb) {
			locals.pb.authStore.clear();
			updateAuthState(null);
		}

		// Clear auth cookie and redirect to login
		cookies.delete('pb_auth', { path: '/' });
		throw redirect(303, '/auth/login');
	}
}; 