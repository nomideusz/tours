import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const body = await request.json();
	
	try {
		// Attempt authentication
		const { email, password } = body;
		
		if (!email || !password) {
			return json({ success: false, message: 'Email and password are required' }, { status: 400 });
		}
		
		const authData = await locals.pb.collection('users').authWithPassword(email, password);
		
		// Store the auth token in cookies
		if (authData.token) {
			cookies.set('pb_auth', authData.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});
		}
		
		return json({ success: true, user: authData.record });
	} catch (err) {
		console.error('API login error:', err);
		return json(
			{ 
				success: false, 
				message: 'Invalid email or password'
			}, 
			{ status: 401 }
		);
	}
}; 