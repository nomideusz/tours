import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend
let resend: Resend | null = null;

function getResend(): Resend {
	if (!resend) {
		if (!env.RESEND_API_KEY) {
			throw new Error('RESEND_API_KEY environment variable is required');
		}
		resend = new Resend(env.RESEND_API_KEY);
	}
	return resend;
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email } = await request.json();
		
		// Comprehensive email validation
		if (!email) {
			return json(
				{ message: 'Please enter your email address' },
				{ status: 400 }
			);
		}

		if (!EMAIL_REGEX.test(email)) {
			return json(
				{ message: 'Please enter a valid email address' },
				{ status: 400 }
			);
		}

		const normalizedEmail = email.toLowerCase().trim();
		
		// Add to Resend Audience for newsletter
		if (env.RESEND_AUDIENCE_ID) {
			try {
				const resendClient = getResend();

				// Check if contact already exists
				try {
					const existingContact = await resendClient.contacts.get({
						email: normalizedEmail,
						audienceId: env.RESEND_AUDIENCE_ID
					});

					if (existingContact.data) {
						// If unsubscribed, resubscribe them
						if (existingContact.data.unsubscribed) {
							await resendClient.contacts.update({
								email: normalizedEmail,
								audienceId: env.RESEND_AUDIENCE_ID,
								unsubscribed: false
							});
							console.log(`🔄 Resubscribed ${normalizedEmail} to newsletter`);
						}
						
						return json({ 
							success: false,
							message: 'This email is already subscribed to our newsletter.' 
						});
					}
				} catch (error) {
					// Contact not found error is expected
					if (!(error as any)?.message?.includes('Contact not found')) {
						throw error;
					}
				}

				// Determine source from the referrer or page
				const source = url.pathname.includes('blog') ? 'blog' : 'marketing';
				
				// Add new contact
				await resendClient.contacts.create({
					email: normalizedEmail,
					audienceId: env.RESEND_AUDIENCE_ID,
					unsubscribed: false,
					firstName: normalizedEmail.split('@')[0], // Use email prefix as name
					// Track source in firstName since Resend doesn't support custom fields
					lastName: `(${source})`
				});
				
				console.log(`✅ Added ${normalizedEmail} to newsletter audience (source: ${source})`);
				
				return json({ 
					success: true,
					message: 'Thanks for subscribing!' 
				});
				
			} catch (resendError) {
				console.error('Failed to add to Resend audience:', resendError);
				// Return generic error to user
				return json(
					{ message: 'Failed to subscribe. Please try again.' },
					{ status: 500 }
				);
			}
		} else {
			console.warn('⚠️ RESEND_AUDIENCE_ID not configured');
			// Still return success to user
			return json({ 
				success: true,
				message: 'Thanks for subscribing!' 
			});
		}
		
	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return json(
			{ message: 'Failed to subscribe. Please try again.' },
			{ status: 500 }
		);
	}
};