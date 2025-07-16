import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ parent }) => {
	const { user, isAuthenticated } = await parent();

	// Redirect non-admin users
	if (!isAuthenticated || user?.role !== 'admin') {
		throw new Error('Admin access required');
	}

	return {
		user,
		isAuthenticated
	};
}; 