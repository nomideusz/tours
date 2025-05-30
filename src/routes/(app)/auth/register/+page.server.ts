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
	default: async ({ locals, request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		// Validation
		if (!name) {
			return fail(400, { name, email, error: 'Name is required' });
		}

		if (!email) {
			return fail(400, { name, email, error: 'Email is required' });
		}

		if (!password) {
			return fail(400, { name, email, error: 'Password is required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { name, email, error: 'Passwords do not match' });
		}

		if (password.length < 8) {
			return fail(400, { name, email, error: 'Password must be at least 8 characters' });
		}

		try {
			console.log('Attempting registration for:', email);
			
			// Create user in PocketBase
			const userData = {
				email,
				password,
				passwordConfirm: password,
				name
			};
			
			const user = await locals.pb.collection('users').create(userData);
			console.log('User created successfully:', user.id);
			
			// Automatically log in the user after registration
			const authData = await locals.pb
				.collection('users')
				.authWithPassword(email, password);
			
			console.log('Auto-login successful after registration');

			// Set auth state to logged in
			updateAuthState({ exists: true });

			console.log('Registration and auto-login successful, redirecting to app home');
		} catch (err) {
			console.error('Registration error:', err);

			// Check for specific error types
			if ((err as any).status === 400) {
				const errorData = (err as any).data;
				
				// Handle validation errors
				if (errorData?.data?.email) {
					return fail(400, {
						name,
						email,
						error: 'Email is already taken'
					});
				}
				
				// Handle other validation errors
				if (errorData?.message) {
					return fail(400, {
						name,
						email,
						error: errorData.message
					});
				}
			}

			// Generic error message for other errors
			return fail(500, {
				name,
				email,
				error: 'Failed to create account. Please try again later.'
			});
		}
		
		// Do the redirect outside of the try/catch to prevent it from being caught as an error
		throw redirect(303, '/');
	}
}; 