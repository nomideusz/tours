import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { payments, payouts, payoutItems, users } from '$lib/db/schema/index.js';
import { eq, and, sql, desc, gte } from 'drizzle-orm';

/**
 * Get payout status and history for a tour guide
 * Used by the dashboard to show payout information
 */
export const GET: RequestHandler = async ({ request, url, locals }) => {
  try {
    // Get user from session
    const user = locals.user;
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;

    // Get pending earnings (platform-collected payments not yet paid out)
    const pendingEarnings = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(${payments.netAmount}), '0')`,
        paymentCount: sql<number>`COUNT(${payments.id})`,
        currency: payments.currency
      })
      .from(payments)
      .where(
        and(
          eq(payments.tourGuideUserId, userId),
          eq(payments.paymentType, 'platform_collected'),
          eq(payments.status, 'paid'),
          eq(payments.payoutCompleted, false)
        )
      )
      .groupBy(payments.currency);

    // Get recent payouts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentPayouts = await db
      .select({
        id: payouts.id,
        totalAmount: payouts.totalAmount,
        payoutCurrency: payouts.payoutCurrency,
        status: payouts.status,
        periodStart: payouts.periodStart,
        periodEnd: payouts.periodEnd,
        processingStartedAt: payouts.processingStartedAt,
        completedAt: payouts.completedAt,
        failureReason: payouts.failureReason,
        createdAt: payouts.createdAt
      })
      .from(payouts)
      .where(
        and(
          eq(payouts.tourGuideUserId, userId),
          gte(payouts.createdAt, sixMonthsAgo)
        )
      )
      .orderBy(desc(payouts.createdAt))
      .limit(20);

    // Get total lifetime earnings from platform-collected payments
    const lifetimeStats = await db
      .select({
        totalEarnings: sql<string>`COALESCE(SUM(${payments.netAmount}), '0')`,
        totalPayments: sql<number>`COUNT(${payments.id})`,
        currency: payments.currency
      })
      .from(payments)
      .where(
        and(
          eq(payments.tourGuideUserId, userId),
          eq(payments.paymentType, 'platform_collected'),
          eq(payments.status, 'paid')
        )
      )
      .groupBy(payments.currency);

    // Check if user is in a cross-border country
    const userRecord = await db
      .select({
        country: users.country,
        currency: users.currency
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userCountry = userRecord[0]?.country;
    const userCurrency = userRecord[0]?.currency || 'EUR';

    // Determine payout method
    let payoutMethod = 'direct';
    if (userCountry) {
      // Import the country utilities
      const { getPaymentMethod } = await import('$lib/utils/countries.js');
      const method = getPaymentMethod(userCountry);
      payoutMethod = method === 'crossborder' ? 'weekly_payout' : 'direct';
    }

    return json({
      payoutMethod,
      userCountry,
      userCurrency,
      pendingEarnings: pendingEarnings.map(earning => ({
        amount: parseFloat(earning.totalAmount),
        currency: earning.currency,
        paymentCount: earning.paymentCount
      })),
      recentPayouts: recentPayouts.map(payout => ({
        id: payout.id,
        amount: parseFloat(payout.totalAmount),
        currency: payout.payoutCurrency,
        status: payout.status,
        periodStart: payout.periodStart?.toISOString(),
        periodEnd: payout.periodEnd?.toISOString(),
        processingStartedAt: payout.processingStartedAt?.toISOString(),
        completedAt: payout.completedAt?.toISOString(),
        failureReason: payout.failureReason,
        createdAt: payout.createdAt.toISOString()
      })),
      lifetimeStats: lifetimeStats.map(stat => ({
        totalEarnings: parseFloat(stat.totalEarnings),
        totalPayments: stat.totalPayments,
        currency: stat.currency
      })),
      nextPayoutDate: getNextPayoutDate()
    });

  } catch (error) {
    console.error('Error fetching payout status:', error);
    return json({
      error: 'Failed to fetch payout status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

/**
 * Calculate next payout date (next Wednesday)
 */
function getNextPayoutDate(): string {
  const now = new Date();
  const nextWednesday = new Date(now);
  
  // Get days until next Wednesday (3 = Wednesday)
  const daysUntilWednesday = (3 - now.getDay() + 7) % 7;
  
  // If today is Wednesday and it's before noon, next payout is today
  if (now.getDay() === 3 && now.getHours() < 12) {
    // Today is payout day
  } else if (daysUntilWednesday === 0) {
    // Today is Wednesday but after payout time, next Wednesday
    nextWednesday.setDate(now.getDate() + 7);
  } else {
    // Add days to get to next Wednesday
    nextWednesday.setDate(now.getDate() + daysUntilWednesday);
  }
  
  nextWednesday.setHours(12, 0, 0, 0); // Payouts at noon
  return nextWednesday.toISOString();
}