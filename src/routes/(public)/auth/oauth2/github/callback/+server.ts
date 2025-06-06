import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { github } from '$lib/auth/oauth.js';
import { lucia } from '$lib/auth/lucia.js';
import { db } from '$lib/db/connection.js';
import { users, oauthAccounts } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!github) {
    console.error('GitHub OAuth2 is not configured');
    throw error(500, 'OAuth2 not configured');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('github_oauth_state');
  const redirectTo = cookies.get('oauth_redirect_to') || '/dashboard';

  // Clear the state and redirect cookies
  cookies.delete('github_oauth_state', { path: '/' });
  cookies.delete('oauth_redirect_to', { path: '/' });

  if (!code || !state || !storedState || state !== storedState) {
    console.error('Invalid OAuth2 state or code');
    throw redirect(302, '/auth/login?error=oauth_invalid_state');
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await github.validateAuthorizationCode(code);
    
    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        'User-Agent': 'zaur-app'
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info from GitHub');
      throw redirect(302, '/auth/login?error=oauth_user_fetch_failed');
    }

    const githubUser = await userResponse.json();
    
    // Get user's primary email from GitHub
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        'User-Agent': 'zaur-app'
      }
    });

    let userEmail = githubUser.email;
    if (!userEmail && emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary && email.verified);
      userEmail = primaryEmail?.email || emails[0]?.email;
    }

    if (!userEmail) {
      console.error('No email found for GitHub user');
      throw redirect(302, '/auth/login?error=oauth_no_email');
    }

    console.log('GitHub user info:', { id: githubUser.id, email: userEmail, name: githubUser.name });

    // Check if user already exists with this GitHub account
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
      console.log('Existing GitHub user logging in:', existingOAuthAccount[0].users.email);
      
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
        .where(eq(users.email, userEmail.toLowerCase()))
        .limit(1);

      if (existingUserByEmail.length > 0) {
        // Link GitHub account to existing user
        userId = existingUserByEmail[0].id;
        
        await db.insert(oauthAccounts).values({
          userId,
          provider: 'github',
          providerUserId: githubUser.id.toString()
        });
        
        console.log('Linked GitHub account to existing user:', userEmail);
      } else {
        // Create new user
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
        console.log('Created new user from GitHub OAuth:', userEmail);
      }
    }

    // Create Lucia session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    console.log('GitHub OAuth2 login successful, redirecting to:', redirectTo);
    throw redirect(302, redirectTo);

  } catch (err) {
    console.error('GitHub OAuth2 callback error:', err);
    throw redirect(302, '/auth/login?error=oauth_callback_failed');
  }
}; 