import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { payments, payouts, payoutItems, users } from '$lib/db/schema/index.js';
import { eq, and, sql, isNull } from 'drizzle-orm';

/**
 * Automated weekly payout processing for cross-border payments
 * 
 * This endpoint should be called by a scheduled job (e.g., cron) every week
 * to process pending platform-collected payments and create payouts to tour guides.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Security check - only allow this to be called from authorized sources
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.PAYOUT_PROCESSING_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = getStripe();
    const results = {
      processedTourGuides: 0,
      totalPayouts: 0,
      totalAmount: 0,
      errors: [] as string[]
    };

    // Get current week boundaries
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Go back to previous Sunday (end of last week)
    const lastWeekEnd = new Date(weekEnd);
    lastWeekEnd.setDate(weekEnd.getDate() - weekEnd.getDay());
    
    // Previous Sunday minus 7 days = start of last week
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    console.log('Processing payouts for period:', {
      start: lastWeekStart.toISOString(),
      end: lastWeekEnd.toISOString()
    });

    // Get all tour guides who have pending platform-collected payments from last week
    const pendingPayments = await db
      .select({
        tourGuideUserId: payments.tourGuideUserId,
        userId: users.id,
        userCountry: users.country,
        userCurrency: users.currency,
        userName: users.name,
        userEmail: users.email,
        totalAmount: sql<string>`SUM(${payments.netAmount})`,
        paymentCount: sql<number>`COUNT(${payments.id})`
      })
      .from(payments)
      .innerJoin(users, eq(payments.tourGuideUserId, users.id))
      .where(
        and(
          eq(payments.paymentType, 'platform_collected'),
          eq(payments.status, 'paid'),
          eq(payments.payoutCompleted, false),
          sql`${payments.createdAt} >= ${lastWeekStart}`,
          sql`${payments.createdAt} <= ${lastWeekEnd}`
        )
      )
      .groupBy(payments.tourGuideUserId, users.id, users.country, users.currency, users.name, users.email)
      .having(sql`SUM(${payments.netAmount}) > 0`);

    console.log(`Found ${pendingPayments.length} tour guides with pending payouts`);

    // Process each tour guide's payout
    for (const tourGuide of pendingPayments) {
      try {
        const totalAmount = parseFloat(tourGuide.totalAmount);
        const payoutCurrency = tourGuide.userCurrency || 'EUR';
        
        // Skip if amount is below minimum payout threshold
        const minimumPayout = getMinimumPayoutAmount(payoutCurrency);
        if (totalAmount < minimumPayout) {
          console.log(`Skipping payout for ${tourGuide.userName} - amount ${totalAmount} ${payoutCurrency} below minimum ${minimumPayout}`);
          continue;
        }

        // Get individual payments for this tour guide from the period
        const tourGuidePayments = await db
          .select({
            id: payments.id,
            amount: payments.netAmount,
            currency: payments.currency
          })
          .from(payments)
          .where(
            and(
              eq(payments.tourGuideUserId, tourGuide.tourGuideUserId!),
              eq(payments.paymentType, 'platform_collected'),
              eq(payments.status, 'paid'),
              eq(payments.payoutCompleted, false),
              sql`${payments.createdAt} >= ${lastWeekStart}`,
              sql`${payments.createdAt} <= ${lastWeekEnd}`
            )
          );

        console.log(`Processing payout for ${tourGuide.userName}: ${totalAmount} ${payoutCurrency} (${tourGuidePayments.length} payments)`);

        // Create cross-border payout using Stripe
        const stripePayout = await stripe.transfers.create({
          amount: Math.round(totalAmount * 100), // Stripe expects amount in cents
          currency: payoutCurrency.toLowerCase(),
          destination: tourGuide.userId, // This would need to be the tour guide's bank details
          description: `Weekly payout for ${tourGuide.userName} (${lastWeekStart.toISOString().split('T')[0]} to ${lastWeekEnd.toISOString().split('T')[0]})`,
          metadata: {
            tourGuideUserId: tourGuide.tourGuideUserId!,
            periodStart: lastWeekStart.toISOString(),
            periodEnd: lastWeekEnd.toISOString(),
            paymentCount: tourGuidePayments.length.toString()
          }
        });

        // Create payout record in database
        const payoutRecord = await db.insert(payouts).values({
          tourGuideUserId: tourGuide.tourGuideUserId!,
          totalAmount: totalAmount.toString(),
          payoutCurrency: payoutCurrency,
          stripePayoutId: stripePayout.id,
          status: 'processing',
          periodStart: lastWeekStart,
          periodEnd: lastWeekEnd,
          processingStartedAt: new Date()
        }).returning();

        const payout = payoutRecord[0];

        // Create payout items for each payment
        const payoutItemsData = tourGuidePayments.map(payment => ({
          payoutId: payout.id,
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency
        }));

        await db.insert(payoutItems).values(payoutItemsData);

        // Mark payments as included in payout
        await db
          .update(payments)
          .set({
            payoutId: payout.id,
            payoutCompleted: true,
            updatedAt: new Date()
          })
          .where(
            sql`${payments.id} IN (${sql.join(tourGuidePayments.map(p => sql`${p.id}`), sql`,`)})`
          );

        results.processedTourGuides++;
        results.totalPayouts++;
        results.totalAmount += totalAmount;

        console.log(`✅ Created payout ${payout.id} for ${tourGuide.userName}: ${totalAmount} ${payoutCurrency}`);

      } catch (error) {
        console.error(`❌ Failed to process payout for tour guide ${tourGuide.tourGuideUserId}:`, error);
        results.errors.push(`${tourGuide.userName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log summary
    console.log('Payout processing completed:', results);

    return json({
      success: true,
      message: `Processed ${results.processedTourGuides} tour guides`,
      ...results
    });

  } catch (error) {
    console.error('Payout processing failed:', error);
    return json({
      error: 'Failed to process payouts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

/**
 * Get minimum payout amount for a currency
 */
function getMinimumPayoutAmount(currency: string): number {
  const minimums: Record<string, number> = {
    'USD': 10,
    'EUR': 10,
    'GBP': 10,
    'CAD': 15,
    'AUD': 15,
    'JPY': 1000,
    'SEK': 100,
    'NOK': 100,
    'DKK': 75,
    'CHF': 10,
    'PLN': 40,
    'CZK': 250,
    'HUF': 3500
  };
  
  return minimums[currency.toUpperCase()] || 10;
}