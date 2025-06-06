import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { lucia, verifyPassword } from '$lib/auth/lucia.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Get the redirect URL if provided, default to dashboard for authenticated users
	const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
	
	// Redirect if already logged in
	if (locals.user) {
		console.log('User already logged in, redirecting to:', redirectTo);
		throw redirect(303, redirectTo);
	}
	
	return {
		redirectTo
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
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
			
			// Find user by email
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.email, email.toLowerCase()))
				.limit(1);
			
			if (existingUser.length === 0) {
				console.log('User not found:', email);
				return fail(400, {
					email,
					redirectTo,
					error: 'Invalid email or password'
				});
			}

			const user = existingUser[0];
			
			// Verify password
			if (!user.hashedPassword) {
				console.log('User has no password (OAuth user):', email);
				return fail(400, {
					email,
					redirectTo,
					error: 'Invalid email or password'
				});
			}
			
			const validPassword = await verifyPassword(user.hashedPassword, password);
			if (!validPassword) {
				console.log('Invalid password for user:', email);
				return fail(400, {
					email,
					redirectTo,
					error: 'Invalid email or password'
				});
			}

			// Create session
			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});

			// Update last login time
			await db
				.update(users)
				.set({ lastLogin: new Date() })
				.where(eq(users.id, user.id));

			console.log('Login successful for user:', email);
			console.log('User data:', { id: user.id, email: user.email, role: user.role });

		} catch (err) {
			console.error('Login error:', err);
			
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