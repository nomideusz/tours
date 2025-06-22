import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { google } from '$lib/auth/oauth.js';
import { lucia } from '$lib/auth/lucia.js';
import { db } from '$lib/db/connection.js';
import { users, oauthAccounts } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ url, cookies, request }) => {
  if (!google) {
    console.error('Google OAuth2 is not configured');
    throw error(500, 'OAuth2 not configured');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state');
  const codeVerifier = cookies.get('google_oauth_code_verifier');
  const redirectTo = cookies.get('oauth_redirect_to');

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
      const existingUser = existingOAuthAccount[0].users;
      
      // Check if account is deleted
      if (existingUser.deletedAt) {
        console.log('Deleted user attempting Google OAuth login:', existingUser.email);
        throw redirect(302, '/auth/login?error=oauth_callback_failed&message=' + encodeURIComponent('This account has been deleted'));
      }
      
      userId = existingUser.id;
      console.log('Existing Google user logging in:', existingUser.email);
      
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
        // Check if account is deleted
        if (existingUserByEmail[0].deletedAt) {
          console.log('Deleted user attempting Google OAuth link:', existingUserByEmail[0].email);
          throw redirect(302, '/auth/login?error=oauth_callback_failed&message=' + encodeURIComponent('This account has been deleted'));
        }
        
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
        const userName = googleUser.name || 'Google User';
        
        // Generate unique username
        const { generateUniqueUsername } = await import('$lib/utils/username.js');
        const username = await generateUniqueUsername(userName);
        
        // Don't auto-detect country for OAuth users - let them set it up later
        console.log('🌍 OAuth user will configure country/currency during onboarding');
        
        await db.insert(users).values({
          id: newUserId,
          email: googleUser.email.toLowerCase(),
          name: userName,
          username,
          avatar: googleUser.picture,
          emailVerified: true, // Google emails are pre-verified
          hashedPassword: null, // No password for OAuth users
          country: null, // Let user set this during onboarding
          // currency will use database default (EUR) until user confirms
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

    // Get the user to determine redirect destination
    const finalRedirectTo = redirectTo || '/dashboard';
    
    console.log('Google OAuth2 login successful, redirecting to:', finalRedirectTo);
    throw redirect(302, finalRedirectTo);

  } catch (err) {
    console.error('Google OAuth2 callback error:', err);
    throw redirect(302, '/auth/login?error=oauth_callback_failed');
  }
}; 