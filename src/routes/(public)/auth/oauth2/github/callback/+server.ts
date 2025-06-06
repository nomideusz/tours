import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { github } from '$lib/auth/oauth.js';
import { lucia } from '$lib/auth/lucia.js';
import { db } from '$lib/db/connection.js';
import { users, oauthAccounts } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ url, cookies }) => {
  console.log('🐙 GitHub OAuth callback initiated');
  
  if (!github) {
    console.error('❌ GitHub OAuth2 is not configured');
    throw error(500, 'OAuth2 not configured');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('github_oauth_state');
  const redirectTo = cookies.get('oauth_redirect_to') || '/dashboard';
  const errorParam = url.searchParams.get('error');

  console.log('🔍 GitHub OAuth parameters:', { 
    hasCode: !!code, 
    hasState: !!state, 
    hasStoredState: !!storedState, 
    redirectTo,
    error: errorParam 
  });

  // Clear the state and redirect cookies
  cookies.delete('github_oauth_state', { path: '/' });
  cookies.delete('oauth_redirect_to', { path: '/' });

  // Check for GitHub error response
  if (errorParam) {
    console.error('❌ GitHub OAuth error:', errorParam);
    const errorDescription = url.searchParams.get('error_description');
    throw redirect(302, `/auth/login?error=oauth_github_error&message=${encodeURIComponent(errorDescription || errorParam)}`);
  }

  if (!code || !state || !storedState || state !== storedState) {
    console.error('❌ Invalid OAuth2 state or code:', { 
      code: !!code, 
      state: !!state, 
      storedState: !!storedState, 
      stateMatch: state === storedState 
    });
    throw redirect(302, '/auth/login?error=oauth_invalid_state');
  }

  try {
    console.log('🔄 Exchanging GitHub authorization code for tokens...');
    
    // Exchange authorization code for tokens
    const tokens = await github.validateAuthorizationCode(code);
    console.log('✅ Successfully obtained GitHub tokens');
    
    // Get user info from GitHub
    console.log('👤 Fetching GitHub user info...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        'User-Agent': 'zaur-app',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to fetch user info from GitHub:', userResponse.status, userResponse.statusText);
      const errorBody = await userResponse.text();
      console.error('GitHub API error response:', errorBody);
      throw redirect(302, '/auth/login?error=oauth_user_fetch_failed');
    }

    const githubUser = await userResponse.json();
    console.log('👤 GitHub user info retrieved:', { 
      id: githubUser.id, 
      login: githubUser.login, 
      email: githubUser.email,
      name: githubUser.name 
    });
    
    // Get user's primary email from GitHub if not in profile
    let userEmail = githubUser.email;
    
    if (!userEmail) {
      console.log('📧 No public email, fetching email list from GitHub...');
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          'User-Agent': 'zaur-app',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        console.log('📧 GitHub emails:', emails.map((e: any) => ({ email: e.email, primary: e.primary, verified: e.verified })));
        
        const primaryEmail = emails.find((email: any) => email.primary && email.verified);
        if (primaryEmail) {
          userEmail = primaryEmail.email;
        } else {
          // Fallback to first verified email
          const verifiedEmail = emails.find((email: any) => email.verified);
          userEmail = verifiedEmail?.email || emails[0]?.email;
        }
      } else {
        console.error('❌ Failed to fetch emails from GitHub:', emailResponse.status);
      }
    }

    if (!userEmail) {
      console.error('❌ No email found for GitHub user');
      throw redirect(302, '/auth/login?error=oauth_no_email');
    }

    console.log('✅ GitHub user email determined:', userEmail);

    // Check if user already exists with this GitHub account
    console.log('🔍 Checking for existing GitHub OAuth account...');
    const existingOAuthAccount = await db
      .select()
      .from(oauthAccounts)
      .where(and(
        eq(oauthAccounts.provider, 'github'),
        eq(oauthAccounts.providerUserId, githubUser.id.toString())
      ))
      .leftJoin(users, eq(oauthAccounts.userId, users.id))
      .limit(1);

    let userId: string;

    if (existingOAuthAccount.length > 0 && existingOAuthAccount[0].users) {
      // User already exists with this GitHub account
      userId = existingOAuthAccount[0].users.id;
      console.log('✅ Existing GitHub user logging in:', existingOAuthAccount[0].users.email);
      
      // Update last login
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, userId));
    } else {
      console.log('🔍 Checking for existing user by email...');
      
      // Check if user exists with this email (for account linking)
      const existingUserByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail.toLowerCase()))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        // Link GitHub account to existing user
        userId = existingUserByEmail[0].id;
        
        console.log('🔗 Linking GitHub account to existing user:', userEmail);
        await db.insert(oauthAccounts).values({
          userId,
          provider: 'github',
          providerUserId: githubUser.id.toString()
        });
        
        console.log('✅ GitHub account linked to existing user:', userEmail);
      } else {
        // Create new user
        console.log('👤 Creating new user from GitHub OAuth...');
        const newUserId = createId();
        
        await db.insert(users).values({
          id: newUserId,
          email: userEmail.toLowerCase(),
          name: githubUser.name || githubUser.login || 'GitHub User',
          avatar: githubUser.avatar_url,
          emailVerified: true, // GitHub emails are pre-verified
          hashedPassword: null // No password for OAuth users
        });

        await db.insert(oauthAccounts).values({
          userId: newUserId,
          provider: 'github',
          providerUserId: githubUser.id.toString()
        });

        userId = newUserId;
        console.log('✅ Created new user from GitHub OAuth:', userEmail);
      }
    }

    // Create Lucia session
    console.log('🍪 Creating Lucia session...');
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    console.log('🎉 GitHub OAuth2 login successful, redirecting to:', redirectTo);
    throw redirect(302, redirectTo);

  } catch (err) {
    console.error('❌ GitHub OAuth2 callback error:', err);
    
    // If it's already a redirect, re-throw it
    if (err instanceof Response && err.status >= 300 && err.status < 400) {
      throw err;
    }
    
    // Log the full error for debugging
    if (err instanceof Error) {
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    throw redirect(302, '/auth/login?error=oauth_callback_failed&message=GitHub%20authentication%20failed');
  }
}; 