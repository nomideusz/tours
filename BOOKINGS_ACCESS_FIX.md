# Bookings Access Fix

## Issue
Logged-in users were getting a 403 error when trying to access `/bookings`:
```
403
Access Forbidden
Only tour guides can access this page
```

## Root Cause
The bookings page had inconsistent access control compared to other dashboard pages:

1. **Tours page**: Only checks authentication (`if (!locals.user)`)
2. **Bookings page**: Checks authentication AND role (`role !== 'guide' && role !== 'admin'`)

This created an inconsistency where users could:
- ✅ Access `/tours` and create tours
- ❌ Access `/bookings` to view bookings for their tours

## Analysis
Looking at the user registration system:
- Users can register as either `'user'` or `'guide'`
- The registration process sets `role: intendedRole || 'user'`
- Many users might register as `'user'` but still want to create tours and view bookings

The business logic suggests that if someone can create tours, they should be able to view bookings for those tours, regardless of their role label.

## Solution
Made the bookings page access control consistent with the tours page by removing the role check:

**Before:**
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.pb?.authStore?.isValid || !locals.user) {
    throw redirect(302, '/auth/login');
  }
  
  // Check if user is a guide - THIS WAS TOO RESTRICTIVE
  if (locals.user.role !== 'guide' && locals.user.role !== 'admin') {
    throw error(403, 'Only tour guides can access this page');
  }
  
  // ... rest of the logic
};
```

**After:**
```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.log('Bookings page: User not authenticated, redirecting to login');
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  
  // No role check - any authenticated user can view their bookings
  // Data is already filtered by user's tours, so security is maintained
  
  // ... rest of the logic
};
```

## Security Considerations
This change is secure because:

1. **Authentication is still required**: Only logged-in users can access bookings
2. **Data is filtered by user**: The query filters tours by `user = "${locals.user.id}"`
3. **No cross-user access**: Users can only see bookings for their own tours
4. **Consistent with tours page**: Same access pattern as the tours management page

## Business Logic
This change aligns with the intended user flow:
1. User registers (as 'user' or 'guide')
2. User creates tours (no role restriction)
3. Customers book tours
4. User views bookings for their tours (now no role restriction)

## Result
- ✅ All authenticated users can now access `/bookings`
- ✅ Consistent access control across dashboard pages
- ✅ Users can view bookings for tours they've created
- ✅ Security is maintained through data filtering
- ✅ No more 403 errors for legitimate users

## Alternative Approaches Considered
1. **Auto-promote users to 'guide'**: When they create their first tour
2. **Role-based UI**: Hide bookings link for non-guides
3. **Keep role check but expand it**: Allow 'user' role as well

**Chosen approach**: Remove role check entirely because the data filtering provides adequate security and the role system seems to be more of a label than a functional restriction in this context.

## Testing
1. Register as a regular user (not guide)
2. Create a tour
3. Access `/bookings` page
4. Should see bookings (if any) for your tours
5. Should not see bookings from other users 