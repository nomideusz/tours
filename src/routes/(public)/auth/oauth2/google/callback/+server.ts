import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { google } from '$lib/auth/oauth.js';
import { lucia } from '$lib/auth/lucia.js';
import { db } from '$lib/db/connection.js';
import { users, oauthAccounts } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!google) {
    console.error('Google OAuth2 is not configured');
    throw error(500, 'OAuth2 not configured');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state');
  const codeVerifier = cookies.get('google_oauth_code_verifier');
  const redirectTo = cookies.get('oauth_redirect_to') || '/dashboard';

  // Clear the state, code verifier, and redirect cookies
  cookies.delete('google_oauth_state', { path: '/' });
  cookies.delete('google_oauth_code_verifier', { path: '/' });
  cookies.delete('oauth_redirect_to', { path: '/' });

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    console.error('Invalid OAuth2 state, code, or missing code verifier');
    throw redirect(302, '/auth/login?error=oauth_invalid_state');
  }

  try {
    // Exchange authorization code for tokens using PKCE
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info from Google');
      throw redirect(302, '/auth/login?error=oauth_user_fetch_failed');
    }

    const googleUser = await userResponse.json();
    console.log('Google user info:', { id: googleUser.id, email: googleUser.email, name: googleUser.name });

    // Check if user already exists with this Google account
    const existingOAuthAccount = await db
      .select()
      .from(oauthAccounts)
      .where(and(
        eq(oauthAccounts.provider, 'google'),
        eq(oauthAccounts.providerUserId, googleUser.id)
      ))
      .leftJoin(users, eq(oauthAccounts.userId, users.id))
      .limit(1);

    let userId: string;

    if (existingOAuthAccount.length > 0 && existingOAuthAccount[0].users) {
      // User already exists with this Google account
      userId = existingOAuthAccount[0].users.id;
      console.log('Existing Google user logging in:', existingOAuthAccount[0].users.email);
      
      // Update last login
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, userId));
    } else {
      // Check if user exists with this email (for account linking)
      const existingUserByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email.toLowerCase()))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        // Link Google account to existing user
        userId = existingUserByEmail[0].id;
        
        await db.insert(oauthAccounts).values({
          userId,
          provider: 'google',
          providerUserId: googleUser.id
        });
        
        console.log('Linked Google account to existing user:', googleUser.email);
      } else {
        // Create new user
        const newUserId = createId();
        
        await db.insert(users).values({
          id: newUserId,
          email: googleUser.email.toLowerCase(),
          name: googleUser.name || 'Google User',
          avatar: googleUser.picture,
          emailVerified: true, // Google emails are pre-verified
          hashedPassword: null // No password for OAuth users
        });

        await db.insert(oauthAccounts).values({
          userId: newUserId,
          provider: 'google',
          providerUserId: googleUser.id
        });

        userId = newUserId;
        console.log('Created new user from Google OAuth:', googleUser.email);
      }
    }

    // Create Lucia session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    console.log('Google OAuth2 login successful, redirecting to:', redirectTo);
    throw redirect(302, redirectTo);

  } catch (err) {
    console.error('Google OAuth2 callback error:', err);
    throw redirect(302, '/auth/login?error=oauth_callback_failed');
  }
}; 