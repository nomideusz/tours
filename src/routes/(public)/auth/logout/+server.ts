import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	locals.pb?.authStore.clear();
	cookies.delete('pb_auth', { path: '/' });
	throw redirect(303, '/auth/login');
}; 