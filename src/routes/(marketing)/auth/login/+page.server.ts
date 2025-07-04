import { redirect, type Actions, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { lucia, verifyPassword } from '$lib/auth/lucia.js';
import { users } from '$lib/db/schema/index.js';
import { db } from '$lib/db/connection.js';
import { eq } from 'drizzle-orm';
export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	const redirectTo = url.searchParams.get('redirectTo');
	const error = url.searchParams.get('error');
	const message = url.searchParams.get('message');
	const type = url.searchParams.get('type');
	const provider = url.searchParams.get('provider');

	// Handle OAuth-specific errors
	let errorMessage = '';
	if (error) {
		switch (error) {
			case 'oauth_not_configured':
				errorMessage = provider 
					? `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not properly configured. Please contact support.`
					: 'OAuth login is not properly configured. Please contact support.';
				break;
			case 'oauth_invalid_state':
				errorMessage = 'OAuth login failed due to invalid state. Please try again.';
				break;
			case 'oauth_user_fetch_failed':
				errorMessage = 'Failed to get user information from OAuth provider. Please try again.';
				break;
			case 'oauth_no_email':
				errorMessage = 'No email address found in your OAuth account. Please ensure your email is public or try a different login method.';
				break;
			case 'oauth_callback_failed':
				errorMessage = message ? decodeURIComponent(message) : 'OAuth login failed. Please try again.';
				break;
			case 'oauth_github_error':
				errorMessage = message ? decodeURIComponent(message) : 'GitHub login failed. Please try again.';
				break;
			case 'oauth_setup_failed':
				errorMessage = provider 
					? `Failed to set up ${provider} login. Please try again.`
					: 'Failed to set up OAuth login. Please try again.';
				break;
			default:
				errorMessage = message ? decodeURIComponent(message) : 'An error occurred during login. Please try again.';
		}
	}

	return {
		redirectTo,
		error: errorMessage || null,
		message: message || null,
		type: type || null
	};
};

export const actions: Actions = {
	resendVerification: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const email = data.get('email')?.toString();

		if (!userId || !email) {
			return fail(400, { error: 'Missing required information' });
		}

		try {
			// Find user to verify they exist and aren't verified
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (existingUser.length === 0 || existingUser[0].emailVerified) {
				return fail(400, { error: 'Invalid request' });
			}

			// Send verification email
			const response = await fetch('/api/send-auth-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email,
					type: 'verification',
					userId: userId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to send verification email');
			}

			return {
				success: true,
				message: 'Verification email sent! Please check your inbox.'
			};
		} catch (error) {
			console.error('Error sending verification email:', error);
			return fail(500, { 
				error: 'Failed to send verification email. Please try again.' 
			});
		}
	},

	login: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const redirectTo = data.get('redirectTo')?.toString();

		if (!email) {
			return fail(400, { email, redirectTo, error: 'Email is required' });
		}

		if (!password) {
			return fail(400, { email, redirectTo, error: 'Password is required' });
		}

				let user: any = null;
		
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

			user = existingUser[0];
			
			// Check if account is deleted
			if (user.deletedAt) {
				console.log('Deleted user attempting login:', email);
				return fail(400, {
					email,
					redirectTo,
					error: 'Invalid email or password'
				});
			}
			
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

			// Check if email is verified
			if (!user.emailVerified) {
				console.log('Unverified user attempting login:', email);
				return fail(400, {
					email,
					redirectTo,
					error: 'Please verify your email address before signing in.',
					needsVerification: true,
					userId: user.id
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

		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				email,
				redirectTo,
				error: 'An unexpected error occurred. Please try again.'
			});
		}

		// Redirect outside of try/catch to avoid catching redirect errors
		const finalRedirectTo = redirectTo || '/dashboard';
		throw redirect(302, finalRedirectTo);
	}
}; 