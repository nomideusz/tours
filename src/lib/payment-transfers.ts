/**
 * Payment Transfer System
 * Manages delayed transfers to tour guides after cancellation windows
 */

import { getStripe, formatAmountForStripe } from './stripe.server.js';
import type Stripe from 'stripe';

/**
 * Calculate when funds should be transferred to guide
 * SIMPLE APPROACH: Hold funds until tour actually starts
 * This eliminates refund risk - guides can't cancel after getting paid
 */
export function calculateTransferTime(
  tourStartTime: Date | string,
): Date {
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  const now = new Date();
  
  // Transfer funds AFTER tour starts
  // This way, guide can't cancel and keep the money
  // Customer is always protected until service is delivered
  const transferTime = new Date(startTime);
  
  // Wait 1 hour after tour starts before transferring
  // This ensures tour actually began
  transferTime.setHours(transferTime.getHours() + 1);
  
  // If tour already started, transfer soon (5min buffer for cron)
  if (transferTime < now) {
    const immediateTransfer = new Date(now);
    immediateTransfer.setMinutes(immediateTransfer.getMinutes() + 5);
    return immediateTransfer;
  }
  
  console.log(`💰 Transfer scheduled for 1 hour after tour starts: ${transferTime.toISOString()}`);
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
 * Simple approach: Always wait until tour starts + 1 hour
 */
export function getOptimalTransferTime(
  tourStartTime: Date | string,
  tourDuration: number,
  bookingStatus: string = 'confirmed'
): { transferTime: Date; reason: string; immediate: boolean } {
  const now = new Date();
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  const completionTime = calculateTourCompletionTime(startTime, tourDuration);
  
  // Tour already completed - transfer immediately (with 5min buffer)
  if (now >= completionTime && bookingStatus === 'completed') {
    const immediateTransfer = new Date(now);
    immediateTransfer.setMinutes(immediateTransfer.getMinutes() + 5);
    return {
      transferTime: immediateTransfer,
      reason: 'Tour completed - service delivered',
      immediate: true
    };
  }
  
  // Tour hasn't started yet - use standard calculation (1 hour after start)
  const transferTime = calculateTransferTime(startTime);
  
  return {
    transferTime,
    reason: 'Waiting for tour to start',
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
): Promise<Record<string, unknown>> {
  const stripe = getStripe();
  
  console.log('↩️ Creating transfer reversal:', { transferId, amount });
  
  try {
    const reversalParams: Record<string, unknown> = {
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
    const reversal = await (stripe as unknown as Stripe).transfers.createReversal(
        transferId,
        reversalParams
      ) as Stripe.TransferReversal;
    
    console.log('✅ Transfer reversed:', reversal.id);
    return reversal as unknown as Record<string, unknown>;
  } catch (error) {
    console.error('❌ Failed to reverse transfer:', error);
    throw error;
  }
}

// Re-export client-safe functions from the client module
export { isReadyForTransfer, getTransferStatusMessage } from './payment-transfers-client.js';

