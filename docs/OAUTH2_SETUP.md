# OAuth2 Setup with Lucia

This guide explains how to set up OAuth2 authentication with Google and GitHub using the new Lucia-based authentication system.

## Environment Variables

Add these environment variables to your `.env` file:

### Development
```env
# Google OAuth2 (Development)
GOOGLE_CLIENT_ID_DEV=your_google_client_id_dev
GOOGLE_CLIENT_SECRET_DEV=your_google_client_secret_dev

# GitHub OAuth2 (Development)
GITHUB_CLIENT_ID_DEV=your_github_client_id_dev
GITHUB_CLIENT_SECRET_DEV=your_github_client_secret_dev
```

### Production
```env
# Google OAuth2 (Production)
GOOGLE_CLIENT_ID=your_google_client_id_prod
GOOGLE_CLIENT_SECRET=your_google_client_secret_prod

# GitHub OAuth2 (Production)
GITHUB_CLIENT_ID=your_github_client_id_prod
GITHUB_CLIENT_SECRET=your_github_client_secret_prod
```

## Provider Setup

### Google OAuth2

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URIs:
   - Development: `http://localhost:5173/auth/oauth2/google/callback`
   - Production: `https://zaur.app/auth/oauth2/google/callback`

### GitHub OAuth2

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set the authorization callback URL:
   - Development: `http://localhost:5173/auth/oauth2/github/callback`
   - Production: `https://zaur.app/auth/oauth2/github/callback`

## Database Schema

The OAuth2 system uses an additional `oauth_accounts` table to link external provider accounts to users. The `users.hashed_password` field is now nullable to support OAuth-only users.

## How It Works

1. **Authorization**: User clicks OAuth2 button → redirected to provider's authorization server
2. **Callback**: Provider redirects back with authorization code
3. **Token Exchange**: Server exchanges code for access token and fetches user info
4. **Account Linking**: Links OAuth account to existing user or creates new user
5. **Session Creation**: Create Lucia session and redirect to dashboard

## Usage

```svelte
<OAuth2Button provider="google" redirectTo="/dashboard" />
<OAuth2Button provider="github" variant="outline" />
``` 