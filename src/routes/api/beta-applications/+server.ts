import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { betaApplications } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
// import { sendAuthEmail } from '$lib/email.server.js'; // TODO: Uncomment when email templates are ready

export const POST: RequestHandler = async ({ request }) => {
	// Beta applications are now closed
	return json({
		success: false,
		error: 'Beta applications are now closed. We have selected 50 tour guides and are working closely with them. Please join our early access waitlist to be notified when we launch publicly.'
	}, { status: 403 });
	
	/* Keeping original code for reference - can be re-enabled if needed
	try {
		const data = await request.json();
		
		// Ensure interestedFeatures is an array for PostgreSQL array type
		if (!Array.isArray(data.interestedFeatures)) {
			data.interestedFeatures = [];
		}
		
		// Validate required fields
		const requiredFields = ['name', 'email', 'location', 'country', 'tourTypes', 
			'tourFrequency', 'currentBookingMethod', 'biggestChallenge', 'betaContribution'];
		
		for (const field of requiredFields) {
			if (!data[field]) {
				return json({ 
					success: false, 
					error: `Missing required field: ${field}` 
				}, { status: 400 });
			}
		}
		
		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			return json({ 
				success: false, 
				error: 'Invalid email address' 
			}, { status: 400 });
		}
		
		// Check if email already exists
		const existingApplication = await db
			.select()
			.from(betaApplications)
			.where(eq(betaApplications.email, data.email.toLowerCase()))
			.limit(1);
			
		if (existingApplication.length > 0) {
			return json({ 
				success: false, 
				error: 'An application with this email already exists' 
			}, { status: 400 });
		}
		
		// Debug log the data being inserted
		console.log('📝 Inserting beta application:', {
			email: data.email,
			interestedFeatures: data.interestedFeatures,
			interestedFeaturesType: typeof data.interestedFeatures,
			interestedFeaturesLength: Array.isArray(data.interestedFeatures) ? data.interestedFeatures.length : 'not array'
		});
		
		// Create the application
		const [application] = await db
			.insert(betaApplications)
			.values({
				name: data.name,
				email: data.email.toLowerCase(),
				phone: data.phone || null,
				website: data.website || null,
				businessName: data.businessName || null,
				location: data.location,
				country: data.country.toUpperCase(),
				tourTypes: data.tourTypes,
				tourFrequency: data.tourFrequency,
				currentBookingMethod: data.currentBookingMethod,
				biggestChallenge: data.biggestChallenge,
				betaContribution: data.betaContribution,
				yearsExperience: data.yearsExperience || 1,
				teamSize: data.teamSize || 1,
				interestedFeatures: data.interestedFeatures || [],
				availabilityForFeedback: data.availabilityForFeedback ?? true,
				referralSource: data.referralSource || null
			})
			.returning();
			
		console.log(`✅ Beta application submitted: ${data.email} from ${data.location}, ${data.country}`);
		
		// TODO: Send confirmation email once email templates are set up
		// try {
		// 	await sendAuthEmail('beta-application-confirmation', {
		// 		email: data.email,
		// 		name: data.name
		// 	});
		// 	console.log(`✅ Confirmation email sent to ${data.email}`);
		// } catch (emailError) {
		// 	console.error('Failed to send confirmation email:', emailError);
		// 	// Don't fail the application if email fails
		// }
		
		// TODO: Send notification to admin once email templates are set up
		// try {
		// 	await sendAuthEmail('admin-beta-application', {
		// 		applicantName: data.name,
		// 		applicantEmail: data.email,
		// 		location: `${data.location}, ${data.country}`,
		// 		tourTypes: data.tourTypes,
		// 		frequency: data.tourFrequency
		// 	});
		// } catch (adminEmailError) {
		// 	console.error('Failed to send admin notification:', adminEmailError);
		// 	// Don't fail the application if admin email fails
		// }
		
		return json({
			success: true,
			message: 'Application submitted successfully',
			applicationId: application.id
		});
		
	} catch (error) {
		console.error('Error submitting beta application:', error);
		return json({ 
			success: false,
			error: 'Failed to submit application. Please try again.' 
		}, { status: 500 });
	}
	*/
};