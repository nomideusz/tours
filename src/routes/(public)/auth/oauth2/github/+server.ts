import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { github } from '$lib/auth/oauth.js';
import { generateState } from 'arctic';

export const GET: RequestHandler = async ({ cookies, url }) => {
  console.log('🐙 GitHub OAuth initialization requested');
  
  if (!github) {
    console.error('❌ GitHub OAuth2 is not configured');
    console.error('💡 Make sure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are set');
    throw redirect(302, '/auth/login?error=oauth_not_configured&provider=github');
  }

  const state = generateState();
  const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
  
  console.log('🔄 Setting up GitHub OAuth flow:', { redirectTo, state: state.substring(0, 8) + '...' });
  
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

  // Create authorization URL and redirect
  const url_obj = github.createAuthorizationURL(state, ['user:email']);
  const authUrl = url_obj.toString();
  
  console.log('🚀 Redirecting to GitHub OAuth2:', authUrl);
  throw redirect(302, authUrl);
}; 