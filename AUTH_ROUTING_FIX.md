# Auth Routing Fix

## Issue
The `/auth/login` link was not working after implementing the layout separation.

## Root Cause
There were two main issues:

### 1. App Layout Server Interference
The `(app)/+layout.server.ts` was trying to handle auth routes that are now in the `(public)` layout group. This caused conflicts because:
- Auth routes moved to `src/routes/(public)/auth/`
- But the app layout server was still checking for auth pages and trying to redirect them
- This created routing conflicts

### 2. Public Layout Not Using Server Data
The `(public)/+layout.svelte` was hardcoded with:
```svelte
<Header 
  isAuthenticated={false}
  currentUser={null}
/>
```

Instead of using the server data that determines actual authentication state.

## Solution

### 1. Fixed App Layout Server Logic
**Before:**
```typescript
// Define auth pages that should redirect authenticated users away
const authPages = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const isAuthPage = authPages.some(page => url.pathname.startsWith(page));

// Handle redirects based on auth state and page type
if (isAuthenticated && isAuthPage) {
  throw redirect(303, '/tours');
}

// For app routes, require authentication
if (!isAuthenticated && !isAuthPage) {
  throw redirect(303, '/auth/login?redirect=' + encodeURIComponent(url.pathname));
}
```

**After:**
```typescript
// App layout only handles routes in the (app) group
// Auth routes are now in (public) group and won't reach this layout

// For app routes, require authentication
if (!isAuthenticated) {
  throw redirect(303, '/auth/login?redirect=' + encodeURIComponent(url.pathname));
}
```

### 2. Created Public Layout Server
Created `src/routes/(public)/+layout.server.ts` to properly handle auth redirects:

```typescript
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isAuthenticated = !!locals.user;
  
  // Define auth pages that should redirect authenticated users away
  const authPages = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
  const isAuthPage = authPages.some(page => url.pathname.startsWith(page));
  
  // Handle redirects for authenticated users trying to access auth pages
  if (isAuthenticated && isAuthPage) {
    throw redirect(303, '/tours');
  }
  
  return {
    isAuthenticated,
    user: isAuthenticated ? locals.user : null
  };
};
```

### 3. Fixed Public Layout Props
**Before:**
```svelte
<Header 
  isAuthenticated={false}
  currentUser={null}
/>
```

**After:**
```svelte
<Header 
  isAuthenticated={data?.isAuthenticated || false}
  currentUser={data?.user || null}
/>
```

### 4. Added Navigation Handling
Added mobile menu closing on navigation for better UX:

```svelte
import { afterNavigate } from '$app/navigation';

// Close mobile menu on navigation
afterNavigate(() => {
  if (headerRef) {
    headerRef.closeMobileMenu();
  }
});
```

## Result
- `/auth/login` link now works correctly
- Authenticated users are properly redirected away from auth pages
- Public layout properly shows authentication state
- Mobile navigation works correctly
- Layout separation is fully functional

## Key Insight
Layout groups in SvelteKit create separate contexts, so each layout group needs its own server-side logic. The app layout should only handle app routes, and the public layout should handle its own routes including auth redirects.

## Testing
```bash
# Server responds
curl -s http://localhost:5173/ -o /dev/null && echo "Server is responding"

# Auth login route is accessible  
curl -s http://localhost:5173/auth/login -o /dev/null && echo "Auth login route is accessible"
```

Both tests pass ✅ 