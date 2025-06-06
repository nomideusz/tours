import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { github } from '$lib/auth/oauth.js';
import { generateState } from 'arctic';

export const GET: RequestHandler = async ({ cookies, url }) => {
  if (!github) {
    console.error('GitHub OAuth2 is not configured');
    throw redirect(302, '/auth/login?error=oauth_not_configured');
  }

  const state = generateState();
  const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
  
  // Store state and redirect URL in cookies for validation
  cookies.set('github_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax'
  });
  
  cookies.set('oauth_redirect_to', redirectTo, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax'
  });

  const url_obj = github.createAuthorizationURL(state, ['user:email']);

  console.log('Redirecting to GitHub OAuth2:', url_obj.toString());
  throw redirect(302, url_obj.toString());
}; 