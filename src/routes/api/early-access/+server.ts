import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { sendAuthEmail } from '$lib/email.server.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return json({ 
				success: false, 
				error: 'Email is required' 
			}, { status: 400 });
		}
		
		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ 
				success: false, 
				error: 'Please enter a valid email address' 
			}, { status: 400 });
		}
		
		// Check if email already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase()))
			.limit(1);
			
		if (existingUser.length > 0) {
			// User already exists
			return json({ 
				success: true, 
				message: 'You already have an account! Sign in to access your dashboard.' 
			});
		}
		
		// Send welcome email for early access
		try {
			await sendAuthEmail('early-access', {
				email,
				name: email.split('@')[0], // Use email prefix as temporary name
			});
		} catch (emailError) {
			console.warn('Failed to send early access email:', emailError);
			// Don't fail the request if email fails
		}
		
		// Log the early access request
		console.log(`Early access request from: ${email}`);
		
		return json({ 
			success: true, 
			message: 'Welcome to early access! Check your email for next steps.' 
		});
		
	} catch (error) {
		console.error('Early access error:', error);
		return json({ 
			success: false, 
			error: 'An error occurred. Please try again later.' 
		}, { status: 500 });
	}
}; 