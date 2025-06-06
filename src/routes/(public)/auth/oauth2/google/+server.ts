import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { google } from '$lib/auth/oauth.js';
import { generateState, generateCodeVerifier } from 'arctic';

export const GET: RequestHandler = async ({ cookies, url }) => {
  if (!google) {
    console.error('Google OAuth2 is not configured');
    throw redirect(302, '/auth/login?error=oauth_not_configured');
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
  
  // Store state, code verifier, and redirect URL in cookies for validation
  cookies.set('google_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax'
  });
  
  cookies.set('google_oauth_code_verifier', codeVerifier, {
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

  // Use PKCE flow with code verifier
  const scopes = ['openid', 'email', 'profile'];
  const url_obj = google.createAuthorizationURL(state, codeVerifier, scopes);

  console.log('Redirecting to Google OAuth2:', url_obj.toString());
  throw redirect(302, url_obj.toString());
}; 