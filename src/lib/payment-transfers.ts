/**
 * Payment Transfer System
 * Manages delayed transfers to tour guides after cancellation windows
 */

import { getStripe, formatAmountForStripe } from './stripe.server.js';
import { CANCELLATION_POLICIES } from './utils/cancellation-policies.js';
import type Stripe from 'stripe';

/**
 * Calculate when funds should be transferred to guide
 * Funds are held until the cancellation window passes
 */
export function calculateTransferTime(
  tourStartTime: Date | string,
  policyId: string = 'flexible'
): Date {
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  const now = new Date();
  
  // Non-refundable policy = transfer immediately (no refund risk)
  // Add 2-minute buffer to ensure database write completes and cron can pick it up
  if (policyId === 'nonRefundable') {
    console.log('💸 Non-refundable policy - scheduling immediate transfer (2min delay)');
    const immediateTransfer = new Date(now);
    immediateTransfer.setMinutes(immediateTransfer.getMinutes() + 2);
    return immediateTransfer;
  }
  
  // Parse custom policies (format: "custom_24" for 24 hours)
  let maxRefundHours = 24; // Default to 24 hours (flexible)
  
  if (policyId.startsWith('custom_')) {
    const hours = parseInt(policyId.split('_')[1]);
    if (!isNaN(hours) && hours > 0) {
      maxRefundHours = hours;
    }
  } else if (CANCELLATION_POLICIES[policyId]) {
    const policy = CANCELLATION_POLICIES[policyId];
    maxRefundHours = Math.max(...policy.rules.map(r => r.hoursBeforeTour));
  }
  
  // Transfer funds AFTER the maximum refund window has passed
  // Add 1 hour buffer for safety
  const transferTime = new Date(startTime);
  transferTime.setHours(transferTime.getHours() - maxRefundHours - 1);
  
  // Don't transfer in the past - if calculation puts us in past, transfer soon
  // Add 2-minute buffer to ensure database write completes and cron can pick it up
  if (transferTime < now) {
    const immediateTransfer = new Date(now);
    immediateTransfer.setMinutes(immediateTransfer.getMinutes() + 2);
    return immediateTransfer;
  }
  
  return transferTime;
}

/**
 * Calculate when tour is completed (safe to transfer immediately)
 */
export function calculateTourCompletionTime(
  tourStartTime: Date | string,
  tourDuration: number // in minutes
): Date {
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  const completionTime = new Date(startTime);
  completionTime.setMinutes(completionTime.getMinutes() + tourDuration + 30); // +30min buffer
  return completionTime;
}

/**
 * Determine optimal transfer time
 * Transfers immediately if tour completed, otherwise waits for cancellation window
 */
export function getOptimalTransferTime(
  tourStartTime: Date | string,
  tourDuration: number,
  policyId: string = 'flexible',
  bookingStatus: string = 'confirmed'
): { transferTime: Date; reason: string; immediate: boolean } {
  const now = new Date();
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  const completionTime = calculateTourCompletionTime(startTime, tourDuration);
  
  // Tour already completed - transfer immediately (with 2min buffer)
  if (now >= completionTime && bookingStatus === 'completed') {
    const immediateTransfer = new Date(now);
    immediateTransfer.setMinutes(immediateTransfer.getMinutes() + 2);
    return {
      transferTime: immediateTransfer,
      reason: 'Tour completed',
      immediate: true
    };
  }
  
  // Tour in progress or upcoming - wait for cancellation window
  const cancelWindowTime = calculateTransferTime(startTime, policyId);
  
  return {
    transferTime: cancelWindowTime,
    reason: `Waiting for ${policyId} policy cancellation window`,
    immediate: false
  };
}

/**
 * Create transfer from platform to guide's account
 * Used with Separate Charges & Transfers model
 */
export async function createTransferToGuide(
  amount: number,
  currency: string,
  destinationAccountId: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  
  console.log('💸 Creating transfer to guide:', {
    amount,
    currency,
    destinationAccountId,
    metadata
  });
  
  try {
    const transfer = await stripe.transfers.create({
      amount: formatAmountForStripe(amount, currency),
      currency: currency.toLowerCase(),
      destination: destinationAccountId,
      metadata: {
        ...metadata,
        transferredAt: new Date().toISOString()
      }
    });
    
    console.log('✅ Transfer created successfully:', transfer.id);
    return transfer;
  } catch (error) {
    console.error('❌ Failed to create transfer:', error);
    throw error;
  }
}

/**
 * Create transfer reversal (for refunds on transferred payments)
 * Used when guide has already been paid but refund is needed
 * Note: Transfer reversals are rarely needed since we transfer AFTER cancellation window
 */
export async function createTransferReversal(
  transferId: string,
  amount?: number, // Optional: partial reversal
  metadata: Record<string, string> = {}
): Promise<any> {
  const stripe = getStripe();
  
  console.log('↩️ Creating transfer reversal:', { transferId, amount });
  
  try {
    const reversalParams: any = {
      metadata: {
        ...metadata,
        reversedAt: new Date().toISOString()
      }
    };
    
    // Add amount for partial reversals
    if (amount) {
      reversalParams.amount = amount;
    }
    
    // Using any type since Stripe typing for reversals varies
    const reversal = await (stripe as any).transfers.createReversal(
      transferId,
      reversalParams
    );
    
    console.log('✅ Transfer reversed:', reversal.id);
    return reversal;
  } catch (error) {
    console.error('❌ Failed to reverse transfer:', error);
    throw error;
  }
}

// Re-export client-safe functions from the client module
export { isReadyForTransfer, getTransferStatusMessage } from './payment-transfers-client.js';

