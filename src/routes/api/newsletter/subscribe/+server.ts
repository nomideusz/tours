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
				// First, check if the contact already exists
				// Resend doesn't prevent duplicates, so we need to check manually
				const normalizedEmail = email.toLowerCase();
				
				// Try to list contacts and check if email exists
				try {
					const { data: contacts } = await resend.contacts.list({
						audienceId: env.RESEND_AUDIENCE_ID
					});
					
					const existingContact = contacts?.data?.find((contact: any) => 
						contact.email?.toLowerCase() === normalizedEmail
					);
					
					if (existingContact) {
						console.log(`ℹ️ ${email} already in audience - skipping`);
						return json({ 
							success: true, 
							message: 'You\'re already subscribed! Thanks for your interest.' 
						});
					}
				} catch (listError) {
					console.warn('Could not check existing contacts, proceeding with creation:', listError);
					// Continue to create if we can't check
				}
				
				// Email doesn't exist, create it
				await resend.contacts.create({
					email: normalizedEmail,
					audienceId: env.RESEND_AUDIENCE_ID,
					unsubscribed: false,
					firstName: email.split('@')[0] // Use email prefix as name
				});
				
				console.log(`✅ Added ${email} to newsletter audience`);
			} catch (resendError: any) {
				console.warn('⚠️ Failed to add to Resend audience:', resendError);
				// Don't fail the request if Resend fails - continue to success
			}
		} else {
			console.warn('⚠️ Resend not configured - skipping audience addition');
		}
		
		return json({ 
			success: true, 
			message: 'Thanks for subscribing! Check your inbox for updates.' 
		});
		
	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return json({ 
			success: false, 
			message: 'An error occurred. Please try again later.' 
		}, { status: 500 });
	}
};
