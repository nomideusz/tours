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
        const userName = googleUser.name || 'Google User';
        
        // Generate unique username
        const { generateUniqueUsername } = await import('$lib/utils/username.js');
        const username = await generateUniqueUsername(userName);
        
        // Detect country from request headers (Accept-Language or default)
        const acceptLanguage = request.headers.get('accept-language') || '';
        let detectedCountry = 'DE'; // Default to Germany
        let detectedCurrency = 'EUR';
        
        // Simple country detection from Accept-Language header
        const languageCountryMap: Record<string, string> = {
          'en-US': 'US', 'en-GB': 'GB', 'de': 'DE', 'fr': 'FR', 'es': 'ES',
          'it': 'IT', 'pl': 'PL', 'nl': 'NL', 'pt': 'PT', 'sv': 'SE',
          'no': 'NO', 'da': 'DK', 'fi': 'FI', 'cs': 'CZ', 'ja': 'JP'
        };
        
        const countryCurrencyMap: Record<string, string> = {
          'US': 'USD', 'GB': 'GBP', 'JP': 'JPY', 'CA': 'CAD', 'AU': 'AUD',
          'CH': 'CHF', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'PL': 'PLN',
          'CZ': 'CZK', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
          'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR'
        };
        
        // Parse Accept-Language header
        const primaryLang = acceptLanguage.split(',')[0]?.split(';')[0]?.trim().toLowerCase();
        if (primaryLang) {
          for (const [lang, country] of Object.entries(languageCountryMap)) {
            if (primaryLang.startsWith(lang)) {
              detectedCountry = country;
              detectedCurrency = countryCurrencyMap[country] || 'EUR';
              break;
            }
          }
        }
        
        console.log(`🌍 OAuth user country detection: ${detectedCountry}, currency: ${detectedCurrency}`);
        
        await db.insert(users).values({
          id: newUserId,
          email: googleUser.email.toLowerCase(),
          name: userName,
          username,
          avatar: googleUser.picture,
          emailVerified: true, // Google emails are pre-verified
          hashedPassword: null, // No password for OAuth users
          country: detectedCountry,
          currency: detectedCurrency
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