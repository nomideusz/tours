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
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();
		const intendedRole = data.get('intendedRole')?.toString() as 'user' | 'guide';
		const businessName = data.get('businessName')?.toString();
		const location = data.get('location')?.toString();

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

		// Guide-specific validation
		if (intendedRole === 'guide') {
			if (!businessName) {
				return fail(400, { name, email, error: 'Business name is required for guides' });
			}
			if (!location) {
				return fail(400, { name, email, error: 'Location is required for guides' });
			}
		}

		try {
			console.log('Attempting registration for:', email, 'as', intendedRole);
			
			// Check if user already exists
			const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
			if (existingUser.length > 0) {
				return fail(400, {
					name,
					email,
					error: 'Email is already taken'
				});
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
				name,
				role: intendedRole || 'user',
				intendedRole,
				emailVerified: false, // Set to false initially
				...(intendedRole === 'guide' && {
					businessName,
					location
				}),
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			await db.insert(users).values(userData);
			console.log('User created successfully:', userId, 'with role:', intendedRole);
			
			// Create email verification token and send verification email
			try {
				const verificationToken = await createEmailVerificationToken(userId);
				const verificationUrl = `${url.origin}/auth/verify?token=${verificationToken}`;
				
				const emailResult = await sendAuthEmail('email-verification', {
					email,
					name,
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
				name,
				email,
				error: 'Failed to create account. Please try again later.'
			});
		}
		
		// Do the redirect outside of the try/catch to prevent it from being caught as an error
		throw redirect(303, '/dashboard');
	}
}; 