/**
 * Smart Refund Handler
 * Determines correct refund method based on transfer status
 */

import { getStripe, formatAmountForStripe } from '$lib/stripe.server.js';
import { createTransferReversal } from '$lib/payment-transfers.js';

interface RefundOptions {
  paymentIntentId: string;
  connectedAccountId: string;
  amount: number; // in dollars
  currency: string;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata: Record<string, string>;
  // Transfer info
  transferId?: string | null;
  transferStatus?: string | null;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  transferReversalId?: string;
  method: 'direct_refund' | 'transfer_reversal_then_refund' | 'platform_refund';
  error?: string;
}

/**
 * Process refund intelligently based on whether funds were transferred
 * SIMPLIFIED: With our "hold until tour starts" approach, refunds are much simpler
 */
export async function processSmartRefund(options: RefundOptions): Promise<RefundResult> {
  const {
    paymentIntentId,
    amount,
    currency,
    reason,
    metadata,
    transferId,
    transferStatus
  } = options;

  console.log('🔄 Smart refund processing:', {
    paymentIntentId,
    transferId,
    transferStatus,
    amount: `${currency.toUpperCase()} ${amount}`
  });

  // Case 1: Funds NOT yet transferred (MOST COMMON with our approach)
  // Since we hold funds until tour starts, most cancellations happen before transfer
  if (!transferId || transferStatus !== 'completed') {
    console.log('💡 Funds not transferred yet - refunding from platform account (simple)');
    
    try {
      const stripe = getStripe();
      const amountCents = formatAmountForStripe(amount, currency);
      
      // Refund from platform account (where payment was originally held)
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountCents,
        reason,
        metadata: {
          ...metadata,
          refundMethod: 'platform_account',
          refundedAt: new Date().toISOString()
        }
        // No stripeAccount parameter - refunds from platform
      });

      console.log('✅ Platform refund successful:', refund.id);
      
      return {
        success: true,
        refundId: refund.id,
        method: 'platform_refund'
      };
    } catch (error) {
      console.error('❌ Platform refund failed:', error);
      return {
        success: false,
        method: 'platform_refund',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Case 2: Funds ALREADY transferred (RARE - only if cancellation AFTER tour started)
  // This only happens if guide cancels while tour is in progress or customer requests refund after
  console.log('💡 Funds already transferred to guide - reversing transfer');
  
  try {
    // Step 1: Reverse the transfer (brings money back to platform)
    console.log(`   ↩️ Reversing transfer ${transferId}...`);
    const amountCents: number = formatAmountForStripe(amount, currency);
    
    const reversal = await createTransferReversal(
      transferId,
      amountCents,
      {
        ...metadata,
        reason: 'refund_required',
        reversedAt: new Date().toISOString()
      }
    );

    console.log(`   ✅ Transfer reversed:`, reversal.id);

    // Step 2: Now refund to customer from platform account
    console.log('   💳 Refunding customer from platform account...');
    const stripe = getStripe();
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountCents,
      reason,
      metadata: {
        ...metadata,
        refundMethod: 'transfer_reversal',
        transferReversalId: typeof reversal.id === 'string' ? reversal.id : String(reversal.id),
        refundedAt: new Date().toISOString()
      }
    });

    console.log('   ✅ Customer refund successful:', refund.id);

    return {
      success: true,
      refundId: refund.id,
      transferReversalId: typeof reversal.id === 'string' ? reversal.id : String(reversal.id),
      method: 'transfer_reversal_then_refund'
    };

  } catch (error) {
    console.error('❌ Transfer reversal failed:', error);
    
    return {
      success: false,
      method: 'transfer_reversal_then_refund',
      error: error instanceof Error ? error.message : 'Transfer reversal failed - manual intervention required'
    };
  }
}

/**
 * Check if a booking can be refunded based on transfer status
 */
export function canProcessRefund(
  transferId: string | null | undefined,
  transferStatus: string | null | undefined
): { possible: boolean; method: string; warning?: string } {
  // No transfer yet - always possible from platform
  if (!transferId || transferStatus !== 'completed') {
    return {
      possible: true,
      method: 'platform_refund'
    };
  }

  // Transfer completed - need reversal
  return {
    possible: true,
    method: 'transfer_reversal',
    warning: 'Funds will be reversed from guide account then refunded to customer'
  };
}

