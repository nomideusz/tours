import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { updateAuthState } from '$lib/auth.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.pb?.authStore?.isValid) {
		console.log('User already logged in, redirecting to /');
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ locals, request, cookies, fetch }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email) {
			return fail(400, { email, error: 'Email is required' });
		}

		if (!password) {
			return fail(400, { email, error: 'Password is required' });
		}

		try {
			console.log('Attempting login for:', email);
			const authData = await locals.pb
				.collection('users')
				.authWithPassword(email, password);
			
			console.log('Login successful, auth state valid:', locals.pb.authStore.isValid);
			console.log('User data:', authData.record);

			// Set auth state to logged in
			updateAuthState({ exists: true });

			// Return success response first
			console.log('Authentication successful, redirecting to app home');
		} catch (err) {
			console.error('Login error:', err);

			// Check for invalid credentials error
			if ((err as any).status === 400) {
				return fail(400, {
					email,
					error: 'Invalid email or password'
				});
			}

			// Generic error message for other errors
			return fail(500, {
				email,
				error: 'Failed to log in. Please try again later.'
			});
		}
		
		// Do the redirect outside of the try/catch to prevent it from being caught as an error
		throw redirect(303, '/');
	}
}; 