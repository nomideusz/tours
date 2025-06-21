import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { lucia } from '$lib/auth/lucia.js';
import { hash } from '@node-rs/argon2';
import { generateId } from 'lucia';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { createEmailVerificationToken } from '$lib/auth/tokens.js';
import { sendAuthEmail } from '$lib/email.server.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.session) {
		console.log('User already logged in, redirecting to dashboard');
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ locals, request, cookies, url }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();
		const businessName = data.get('businessName')?.toString();
		const location = data.get('location')?.toString();
		// Don't set country/currency during registration - let users confirm later
		// Country can be null, currency will use database default (EUR)
		const country = null;

		// Validation
		if (!username) {
			return fail(400, { username, email, error: 'Username is required' });
		}

		if (!email) {
			return fail(400, { username, email, error: 'Email is required' });
		}

		if (!password) {
			return fail(400, { username, email, error: 'Password is required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { username, email, error: 'Passwords do not match' });
		}

		if (password.length < 8) {
			return fail(400, { username, email, error: 'Password must be at least 8 characters' });
		}

		// Validate username format
		const { validateUsername } = await import('$lib/utils/username.js');
		const validation = validateUsername(username);
		if (!validation.valid) {
			return fail(400, { username, email, error: validation.error });
		}

		try {
			console.log('Attempting registration for:', email, 'with username:', username);
			
			// Check if user already exists
			const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
			if (existingUser.length > 0) {
				return fail(400, {
					username,
					email,
					error: 'Email is already taken'
				});
			}
			
			// Check if username is available
			const { isUsernameAvailable } = await import('$lib/utils/username.js');
			const available = await isUsernameAvailable(username);
			if (!available) {
				return fail(400, { username, email, error: 'Username is already taken' });
			}
			
			// Hash password
			const hashedPassword = await hash(password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			
			// Create user in database
			const userId = generateId(25);
			const userData = {
				id: userId,
				email,
				hashedPassword,
				name: username, // Use username as default name (can be changed in profile)
				username,
				role: 'user' as const, // All new users get 'user' role (tour guides)
				emailVerified: false,
				businessName,
				location,
				country,
				// currency will use database default (EUR) until user confirms their country
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			await db.insert(users).values(userData);
			console.log('User created successfully:', userId, 'with username:', username, 'country:', country);
			
			// Create email verification token and send verification email
			try {
				const verificationToken = await createEmailVerificationToken(userId);
				const verificationUrl = `${url.origin}/auth/verify?token=${verificationToken}`;
				
				const emailResult = await sendAuthEmail('email-verification', {
					email,
					name: username, // Use username as display name in emails
					verificationUrl
				});
				
				if (emailResult.success) {
					console.log(`✅ Verification email sent to ${email}`);
				} else {
					console.warn(`⚠️ Failed to send verification email to ${email}:`, emailResult.error);
					// Don't fail registration if email fails
				}
			} catch (emailError) {
				console.warn('⚠️ Error sending verification email:', emailError);
				// Don't fail registration if email fails
			}
			
			// Create session for auto-login
			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
			
			console.log('Auto-login successful after registration');

		} catch (err) {
			console.error('Registration error:', err);

			// Generic error message for other errors
			return fail(500, {
				username,
				email,
				error: 'Failed to create account. Please try again later.'
			});
		}

		// Do the redirect outside of the try/catch to prevent it from being caught as an error
		// Redirect to dashboard after successful registration
		throw redirect(303, '/dashboard');
	}
}; 