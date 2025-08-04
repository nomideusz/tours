import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.session) {
		console.log('User already logged in, redirecting to dashboard');
		throw redirect(303, '/dashboard');
	}
	
	// During beta program, redirect registration to beta application
	console.log('Registration disabled during beta program, redirecting to beta application');
	throw redirect(303, '/beta/apply');
};

export const actions: Actions = {
	default: async ({ locals, request, cookies, url }) => {
		// During beta program, registration is disabled - redirect to beta application
		throw redirect(303, '/beta/apply');
	}
}; 