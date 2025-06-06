import { goto, invalidateAll } from '$app/navigation';
import { auth } from '$lib/stores/auth.js';

/**
 * Client-side logout function
 * Navigates to logout page which handles the logout action
 */
export async function logout(redirectTo: string = '/auth/login') {
	try {
		// Set loading state
		auth.setLoading(true);
		
		// Navigate to logout page which will handle the server action
		await goto('/auth/logout', { replaceState: true });
		
	} catch (error) {
		console.error('Logout error:', error);
		// Fallback: clear auth store and redirect manually
		auth.clear();
		await invalidateAll();
		await goto(redirectTo, { replaceState: true });
	}
}

/**
 * Client-side login redirect helper
 */
export function redirectToLogin(currentPath?: string) {
	const redirectTo = currentPath || window.location.pathname + window.location.search;
	const encodedRedirect = encodeURIComponent(redirectTo);
	goto(`/auth/login?redirectTo=${encodedRedirect}`);
}

/**
 * Check if current user has required role
 * Note: For reactive role checking, use the hasRole() function from auth store instead
 */
export function checkRole(requiredRole: string): boolean {
	// This is a placeholder - use the derived stores for reactive checking
	// For example: const userHasRole = hasRole('admin');
	return false;
}

/**
 * Refresh authentication state by invalidating all data
 * Useful after profile updates, etc.
 */
export async function refreshAuth() {
	auth.setLoading(true);
	try {
		await invalidateAll();
	} finally {
		auth.setLoading(false);
	}
} 