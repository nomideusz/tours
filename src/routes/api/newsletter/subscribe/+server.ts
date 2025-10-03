import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
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
		
		// Log the newsletter subscription
		console.log(`Newsletter subscription from: ${email} at ${new Date().toISOString()}`);
		
		// Add to Resend Audience for email campaigns
		if (resend && env.RESEND_AUDIENCE_ID) {
			try {
				await resend.contacts.create({
					email: email.toLowerCase(),
					audienceId: env.RESEND_AUDIENCE_ID,
					unsubscribed: false,
					firstName: email.split('@')[0] // Use email prefix as name
				});
				
				console.log(`✅ Added ${email} to newsletter audience`);
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
		
		return json({ 
			success: true, 
			message: 'You\'re on the waitlist! We\'ll notify you when we launch in Q1 2026.' 
		});
		
	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return json({ 
			success: false, 
			message: 'An error occurred. Please try again later.' 
		}, { status: 500 });
	}
};
