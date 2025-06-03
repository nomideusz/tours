import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Get the redirect URL if provided, default to dashboard for authenticated users
	const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
	
	// Redirect if already logged in
	if (locals.pb?.authStore?.isValid) {
		console.log('User already logged in, redirecting to:', redirectTo);
		throw redirect(303, redirectTo);
	}
	
	return {
		redirectTo
	};
};

export const actions: Actions = {
	default: async ({ locals, request, cookies, fetch, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const redirectTo = data.get('redirectTo')?.toString() || '/dashboard';

		if (!email) {
			return fail(400, { email, redirectTo, error: 'Email is required' });
		}

		if (!password) {
			return fail(400, { email, redirectTo, error: 'Password is required' });
		}

		try {
			console.log('Attempting login for:', email);
			const authData = await locals.pb
				.collection('users')
				.authWithPassword(email, password);
			
			console.log('Login successful, auth state valid:', locals.pb.authStore.isValid);
			console.log('User data:', authData.record);

			// Return success response first
			console.log('Authentication successful, redirecting to app home');
		} catch (err) {
			console.error('Login error:', err);

			// Check for invalid credentials error
			if ((err as any).status === 400) {
				return fail(400, {
					email,
					redirectTo,
					error: 'Invalid email or password'
				});
			}

			// Generic error message for other errors
			return fail(500, {
				email,
				redirectTo,
				error: 'Failed to log in. Please try again later.'
			});
		}
		
		// Do the redirect outside of the try/catch to prevent it from being caught as an error
		console.log('Login successful, redirecting to:', redirectTo);
		throw redirect(303, redirectTo);
	}
}; 