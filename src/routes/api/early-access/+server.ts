import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

// Get environment variables at runtime
const resendApiKey = env.RESEND_API_KEY;
const resendAudienceId = env.RESEND_AUDIENCE_ID;

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check if environment variables are available
		if (!resendApiKey || !resendAudienceId) {
			console.error('RESEND_API_KEY and RESEND_AUDIENCE_ID environment variables are required');
			return json(
				{ success: false, error: 'Service configuration error' },
				{ status: 500 }
			);
		}

		const resend = new Resend(resendApiKey);
		const { email }: { email: string } = await request.json();

		// Validate email
		if (!email || !email.includes('@')) {
			return json(
				{ success: false, error: 'Valid email is required' },
				{ status: 400 }
			);
		}

		// Check if contact already exists
		try {
			const existingContact = await resend.contacts.get({
				email: email,
				audienceId: resendAudienceId
			});

			if (existingContact.data) {
				// Contact already exists
				if (existingContact.data.unsubscribed) {
					// Resubscribe the contact
					await resend.contacts.update({
						email: email,
						audienceId: resendAudienceId,
						unsubscribed: false
					});
					return json({ 
						success: true, 
						message: 'Welcome back! You\'ve been resubscribed to early access updates.' 
					});
				} else {
					// Already subscribed
					return json({ 
						success: true, 
						message: 'You\'re already signed up for early access! We\'ll keep you updated.' 
					});
				}
			}
		} catch (checkError) {
			// Contact doesn't exist (this is expected for new contacts)
			// Continue with creating new contact
		}

		// Add new contact to Resend audience
		const result = await resend.contacts.create({
			email: email,
			unsubscribed: false,
			audienceId: resendAudienceId
		});

		if (result.error) {
			console.error('Resend error:', result.error);
			
			// Handle specific error cases
			if (result.error.message?.includes('already exists') || result.error.message?.includes('duplicate')) {
				return json({ 
					success: true, 
					message: 'You\'re already signed up for early access! We\'ll keep you updated.' 
				});
			}
			
			return json(
				{ success: false, error: 'Failed to subscribe. Please try again later.' },
				{ status: 500 }
			);
		}

		// Optional: Send welcome email
		// await resend.emails.send({
		//   from: 'welcome@yourdomain.com',
		//   to: email,
		//   subject: 'Welcome to Zaur Early Access!',
		//   text: 'Thank you for signing up for early access to Zaur. We'll keep you updated on our progress!'
		// });

		return json({ success: true, message: 'Successfully subscribed to early access!' });
	} catch (error) {
		console.error('API error:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
}; 