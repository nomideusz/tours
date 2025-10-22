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
  
  // Don't transfer in the past - if calculation puts us in past, transfer now
  const now = new Date();
  if (transferTime < now) {
    return now;
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
  
  // Tour already completed - transfer immediately
  if (now >= completionTime && bookingStatus === 'completed') {
    return {
      transferTime: now,
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

/**
 * Check if a booking is ready for transfer
 */
export function isReadyForTransfer(
  booking: {
    paymentStatus: string;
    status: string;
    transferId?: string | null;
    transferScheduledFor?: Date | string | null;
  }
): boolean {
  // Already transferred
  if (booking.transferId) {
    return false;
  }
  
  // Must be paid
  if (booking.paymentStatus !== 'paid') {
    return false;
  }
  
  // Must be confirmed or completed (not cancelled or pending)
  if (booking.status !== 'confirmed' && booking.status !== 'completed') {
    return false;
  }
  
  // Transfer time must have passed
  if (!booking.transferScheduledFor) {
    return false; // No transfer scheduled yet
  }
  
  const scheduledTime = typeof booking.transferScheduledFor === 'string' 
    ? new Date(booking.transferScheduledFor) 
    : booking.transferScheduledFor;
  
  return scheduledTime <= new Date();
}

/**
 * Get user-friendly transfer status message
 */
export function getTransferStatusMessage(
  booking: {
    transferId?: string | null;
    transferStatus?: string | null;
    transferScheduledFor?: Date | string | null;
    status: string;
  }
): { text: string; color: string; icon: string } {
  // Already transferred
  if (booking.transferId && booking.transferStatus === 'completed') {
    return {
      text: 'Transferred to your account',
      color: 'success',
      icon: '✅'
    };
  }
  
  // Transfer failed
  if (booking.transferStatus === 'failed') {
    return {
      text: 'Transfer failed - contact support',
      color: 'error',
      icon: '❌'
    };
  }
  
  // Scheduled for future
  if (booking.transferScheduledFor && !booking.transferId) {
    const scheduledTime = typeof booking.transferScheduledFor === 'string'
      ? new Date(booking.transferScheduledFor)
      : booking.transferScheduledFor;
    
    const now = new Date();
    const hoursUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil > 24) {
      const days = Math.ceil(hoursUntil / 24);
      return {
        text: `Transfer in ${days} day${days !== 1 ? 's' : ''}`,
        color: 'warning',
        icon: '⏳'
      };
    } else if (hoursUntil > 0) {
      const hours = Math.ceil(hoursUntil);
      return {
        text: `Transfer in ${hours} hour${hours !== 1 ? 's' : ''}`,
        color: 'warning',
        icon: '⏳'
      };
    } else {
      return {
        text: 'Processing transfer...',
        color: 'info',
        icon: '⌛'
      };
    }
  }
  
  // Cancelled booking
  if (booking.status === 'cancelled') {
    return {
      text: 'Booking cancelled',
      color: 'secondary',
      icon: '🚫'
    };
  }
  
  // Default
  return {
    text: 'Payment received',
    color: 'info',
    icon: 'ℹ️'
  };
}

