import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return json({ 
				success: false, 
				message: 'Email is required' 
			}, { status: 400 });
		}
		
		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ 
				success: false, 
				message: 'Please enter a valid email address' 
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
		
		// Log the early access request
		console.log(`Early access request from: ${email} at ${new Date().toISOString()}`);
		
		// Add to Resend Audience for email campaigns
		if (resend && env.RESEND_AUDIENCE_ID) {
			try {
				// Determine source from the referrer or page
				const source = url.pathname.includes('early-access') ? 'early-access-page' : 'hero-section';
				
				await resend.contacts.create({
					email: email.toLowerCase(),
					audienceId: env.RESEND_AUDIENCE_ID,
					unsubscribed: false,
					firstName: email.split('@')[0] // Use email prefix as name
				});
				
				console.log(`✅ Added ${email} to Resend audience (source: ${source})`);
			} catch (resendError: any) {
				// Check if email already exists in audience
				if (resendError?.message?.includes('already exists') || resendError?.message?.includes('Contact already')) {
					console.log(`ℹ️ ${email} already in audience`);
					return json({ 
						success: true, 
						message: 'You\'re already on our waitlist! We\'ll notify you when we launch in Q1 2026.' 
					});
				}
				
				console.warn('Failed to add to Resend audience:', resendError);
				// Don't fail the request if Resend fails
			}
		} else {
			console.warn('⚠️ Resend not configured - skipping audience addition');
		}
		
		// No welcome email sent - this is just a code request
		// Users will get their access code through a separate campaign from Resend Audience
		
		return json({ 
			success: true, 
			message: 'You\'re on the waitlist! We\'ll notify you when we launch in Q1 2026.' 
		});
		
	} catch (error) {
		console.error('Early access error:', error);
		return json({ 
			success: false, 
			message: 'An error occurred. Please try again later.' 
		}, { status: 500 });
	}
}; 