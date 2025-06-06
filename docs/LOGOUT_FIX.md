# Logout Fix

## Issue
Users could not logout from the dashboard. The error showed:
```
Server hooks - URL: /auth/logout Auth valid: true
Root layout server load - minimal processing for: /login
SvelteKitError: Not found: /login
```

## Root Cause
Two issues were causing the logout to fail:

### 1. Incorrect Redirect Path in Server
The logout server endpoint was redirecting to `/login` instead of `/auth/login`:

**File:** `src/routes/(public)/auth/logout/+server.ts`
```typescript
// WRONG
throw redirect(303, '/login');

// CORRECT  
throw redirect(303, '/auth/login');
```

### 2. Client-Side Redirect Override
The dashboard layout was using `fetch()` to call the logout endpoint, then manually redirecting with `goto('/')`, which prevented the server redirect from working properly.

**File:** `src/routes/(app)/+layout.svelte`
```typescript
// WRONG - Uses fetch and manual redirect
const response = await fetch('/auth/logout', { method: 'POST' });
if (response.ok) {
  goto('/');
}

// CORRECT - Uses form submission to allow server redirect
const form = document.createElement('form');
form.method = 'POST';
form.action = '/auth/logout';
form.submit();
```

## Solution

### 1. Fixed Server Redirect Path
Changed the logout server endpoint to redirect to the correct auth login path:

```typescript
export const POST: RequestHandler = async ({ locals, cookies }) => {
  locals.pb?.authStore.clear();
  cookies.delete('pb_auth', { path: '/' });
  throw redirect(303, '/auth/login'); // Fixed path
};
```

### 2. Fixed Client-Side Logout Logic
Changed the dashboard logout function to use form submission instead of fetch, allowing the server redirect to work:

```typescript
async function handleLogout(event: Event) {
  event.preventDefault();
  
  if (isLoggingOut) return;
  
  isLoggingOut = true;
  authFSM.send('logout');
  
  try {
    // Use form submission to allow server redirect
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/auth/logout';
    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    console.error('Error during logout:', error);
    isLoggingOut = false;
  }
}
```

## Result
- ✅ Logout now works correctly from the dashboard
- ✅ Users are redirected to `/auth/login` after logout
- ✅ Auth state is properly cleared
- ✅ No more 404 errors on logout

## Key Insight
When using SvelteKit redirects from server endpoints, avoid using `fetch()` on the client side as it prevents the redirect from working. Use form submission or direct navigation instead to allow server redirects to function properly.

## Testing
1. Login to the dashboard
2. Click the logout button in the sidebar
3. Should be redirected to `/auth/login` page
4. No errors should appear in console 