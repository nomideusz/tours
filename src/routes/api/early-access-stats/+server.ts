import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { count, eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Get total user count and early access member count
		const [totalUsersResult, earlyAccessUsersResult] = await Promise.all([
			db.select({ count: count() }).from(users),
			db.select({ count: count() }).from(users).where(eq(users.earlyAccessMember, true))
		]);

		const totalUsers = totalUsersResult[0]?.count || 0;
		const earlyAccessUsers = earlyAccessUsersResult[0]?.count || 0;
		
		// Calculate stats for marketing - use early access users for the program
		const spotsTotal = 100;
		const spotsRemaining = Math.max(0, spotsTotal - earlyAccessUsers);
		
		// Calculate countries represented (approximate based on different country codes)
		const countriesResult = await db
			.selectDistinct({ country: users.country })
			.from(users)
			.where(eq(users.earlyAccessMember, true));
		
		const countriesCount = countriesResult.filter(c => c.country && c.country.length > 0).length;

		return json({
			success: true,
			stats: {
				totalUsers,
				earlyAccessUsers,
				spotsTotal,
				spotsRemaining,
				progressPercentage: Math.min(100, Math.round((earlyAccessUsers / spotsTotal) * 100)),
				countriesRepresented: Math.max(1, countriesCount), // At least 1 to avoid showing 0
				avgSetupTime: 4.5 // This can remain static as it's based on UX research
			}
		});
	} catch (error) {
		console.error('Error fetching early access stats:', error);
		return json({ error: 'Failed to fetch stats' }, { status: 500 });
	}
}; 