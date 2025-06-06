import { goto, invalidateAll } from '$app/navigation';
import { auth } from '$lib/stores/auth.js';

/**
 * Client-side logout function
 * Handles form submission to logout endpoint and updates auth store
 */
export async function logout(redirectTo: string = '/auth/login') {
	try {
		// Set loading state
		auth.setLoading(true);
		
		// Submit logout form to server
		const response = await fetch('/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		});
		
		// Clear auth store immediately
		auth.clear();
		
		// Invalidate all data and redirect
		await invalidateAll();
		await goto(redirectTo, { replaceState: true });
		
	} catch (error) {
		console.error('Logout error:', error);
		// Still clear auth store and redirect on error
		auth.clear();
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