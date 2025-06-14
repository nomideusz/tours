import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
    // Check if user is authenticated
    if (!locals.user) {
        throw redirect(303, '/auth/login?redirectTo=/profile');
    }

    // Return empty data - all data loading handled by TanStack Query client-side
    return {};
}; 