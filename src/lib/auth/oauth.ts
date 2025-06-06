import { Google, GitHub } from 'arctic';
import { dev } from '$app/environment';

// Environment variables
const GOOGLE_CLIENT_ID = dev ? process.env.GOOGLE_CLIENT_ID_DEV : process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = dev ? process.env.GOOGLE_CLIENT_SECRET_DEV : process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = dev ? process.env.GITHUB_CLIENT_ID_DEV : process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = dev ? process.env.GITHUB_CLIENT_SECRET_DEV : process.env.GITHUB_CLIENT_SECRET;

// Base URL for redirects
const BASE_URL = dev ? 'http://localhost:5173' : 'https://zaur.app';

// Debug OAuth configuration
console.log('🔧 OAuth Configuration:', {
  environment: dev ? 'development' : 'production',
  baseUrl: BASE_URL,
  googleConfigured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
  githubConfigured: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
  googleClientIdSet: !!GOOGLE_CLIENT_ID,
  githubClientIdSet: !!GITHUB_CLIENT_ID
});

// Initialize OAuth2 providers
export const google = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? new Google(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BASE_URL}/auth/oauth2/google/callback`
) : null;

export const github = GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET ? new GitHub(
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  `${BASE_URL}/auth/oauth2/github/callback`
) : null;

if (google) {
  console.log('✅ Google OAuth initialized successfully');
} else {
  console.log('❌ Google OAuth not initialized - missing credentials');
}

if (github) {
  console.log('✅ GitHub OAuth initialized successfully');
} else {
  console.log('❌ GitHub OAuth not initialized - missing credentials');
}

// OAuth2 provider configuration
export const oauth2Providers = {
  google: {
    name: 'Google',
    icon: '🔍',
    color: 'bg-red-500 hover:bg-red-600',
    client: google
  },
  github: {
    name: 'GitHub', 
    icon: '🐙',
    color: 'bg-gray-800 hover:bg-gray-900',
    client: github
  }
} as const;

export type OAuth2Provider = keyof typeof oauth2Providers;

// Get available providers (only those with valid credentials)
export function getAvailableProviders(): OAuth2Provider[] {
  const providers = Object.entries(oauth2Providers)
    .filter(([_, config]) => config.client !== null)
    .map(([provider]) => provider as OAuth2Provider);
  
  console.log('📋 Available OAuth providers:', providers);
  return providers;
} 