/**
 * Booking Status Utilities V2
 * Simplified status display logic with feature flag support
 * 
 * This version uses new enum columns when available,
 * falls back to old VARCHAR columns for backward compatibility
 */

import type { Booking } from '$lib/types.js';

// Feature flag - can be toggled in environment
const USE_NEW_STATUS_SYSTEM = typeof process !== 'undefined' 
  ? process.env.PUBLIC_USE_NEW_BOOKING_STATUS === 'true'
  : false;

export interface StatusDisplay {
  label: string;
  color: string;
  icon: string;
  description?: string;
}

/**
 * Get unified booking status display
 * Combines booking status, payment status, and transfer status
 */
export function getBookingStatusDisplay(booking: any): StatusDisplay {
  const { status, paymentStatus, transferId } = booking;
  
  // Use new enum columns if feature flag enabled, otherwise use old VARCHAR
  const refundStatus = USE_NEW_STATUS_SYSTEM 
    ? (booking.refundStatusNew || booking.refundStatus)
    : booking.refundStatus;
    
  const transferStatus = USE_NEW_STATUS_SYSTEM
    ? (booking.transferStatusNew || booking.transferStatus)
    : booking.transferStatus;
  
  // ============================================================
  // Cancelled Bookings (Most specific first)
  // ============================================================
  
  if (status === 'cancelled') {
    // Check refund status for detailed label
    if (refundStatus === 'succeeded') {
      return {
        label: 'Cancelled • Refunded',
        color: 'status-cancelled',
        icon: 'x-circle',
        description: 'Booking cancelled and refund processed'
      };
    }
    
    if (refundStatus === 'pending') {
      return {
        label: 'Cancelled • Refund Pending',
        color: 'status-cancelled',
        icon: 'clock',
        description: 'Booking cancelled, refund being processed'
      };
    }
    
    if (refundStatus === 'failed') {
      return {
        label: 'Cancelled • Refund Failed',
        color: 'status-cancelled',
        icon: 'alert-circle',
        description: 'Booking cancelled but refund failed - manual intervention needed'
      };
    }
    
    // No refund info available
    return {
      label: 'Cancelled',
      color: 'status-cancelled',
      icon: 'x-circle',
      description: 'Booking cancelled'
    };
  }
  
  // ============================================================
  // Payment States (Before Confirmation)
  // ============================================================
  
  if (paymentStatus === 'pending' || paymentStatus === 'processing') {
    return {
      label: 'Awaiting Payment',
      color: 'payment-pending',
      icon: 'alert-triangle',
      description: 'Waiting for customer payment to complete'
    };
  }
  
  if (paymentStatus === 'failed') {
    return {
      label: 'Payment Failed',
      color: 'payment-failed',
      icon: 'x-circle',
      description: 'Payment attempt failed'
    };
  }
  
  // ============================================================
  // Active Bookings (Confirmed/Completed)
  // ============================================================
  
  if (status === 'confirmed') {
    // Check if transfer completed for more specific label
    if (transferId && (transferStatus === 'completed' || transferStatus === 'succeeded')) {
      return {
        label: 'Confirmed • Transferred',
        color: 'status-confirmed',
        icon: 'check-circle',
        description: 'Booking confirmed, payment transferred to your account'
      };
    }
    
    return {
      label: 'Confirmed • Paid',
      color: 'status-confirmed',
      icon: 'check-circle',
      description: 'Booking confirmed, payment received'
    };
  }
  
  if (status === 'completed') {
    return {
      label: 'Completed',
      color: 'status-completed',
      icon: 'check-circle',
      description: 'Tour completed successfully'
    };
  }
  
  // ============================================================
  // Special States
  // ============================================================
  
  if (status === 'no_show') {
    return {
      label: 'No Show',
      color: 'status-default',
      icon: 'user-x',
      description: 'Customer did not arrive for tour'
    };
  }
  
  if (status === 'pending') {
    return {
      label: 'Pending',
      color: 'status-pending',
      icon: 'clock',
      description: 'Booking pending confirmation'
    };
  }
  
  // ============================================================
  // Default/Unknown
  // ============================================================
  
  return {
    label: status || 'Unknown',
    color: 'status-default',
    icon: 'help-circle',
    description: 'Unknown booking status'
  };
}

/**
 * Get payment status display (separate from booking status)
 */
export function getPaymentStatusDisplay(paymentStatus: string, booking?: any): StatusDisplay {
  const transferId = booking?.transferId;
  const transferStatus = USE_NEW_STATUS_SYSTEM
    ? (booking?.transferStatusNew || booking?.transferStatus)
    : booking?.transferStatus;
  
  switch (paymentStatus) {
    case 'paid':
    case 'succeeded':
      // Show transfer info if available
      if (transferId && transferStatus === 'completed') {
        return {
          label: 'Transferred',
          color: 'payment-paid',
          icon: 'circle-dollar-sign',
          description: 'Payment transferred to your account'
        };
      }
      return {
        label: 'Paid',
        color: 'payment-paid',
        icon: 'circle-dollar-sign',
        description: 'Payment received'
      };
      
    case 'pending':
    case 'processing':
      return {
        label: 'Awaiting Payment',
        color: 'payment-pending',
        icon: 'alert-triangle',
        description: 'Payment processing'
      };
      
    case 'failed':
      return {
        label: 'Failed',
        color: 'payment-failed',
        icon: 'x-circle',
        description: 'Payment failed'
      };
      
    case 'refunded':
      return {
        label: 'Refunded',
        color: 'payment-refunded',
        icon: 'receipt-text',
        description: 'Payment refunded to customer'
      };
      
    default:
      return {
        label: 'Unknown',
        color: 'payment-pending',
        icon: 'help-circle',
        description: 'Unknown payment status'
      };
  }
}

/**
 * Get transfer status display
 */
export function getTransferStatusDisplay(booking: any): StatusDisplay | null {
  const transferStatus = USE_NEW_STATUS_SYSTEM
    ? (booking.transferStatusNew || booking.transferStatus)
    : booking.transferStatus;
  
  const transferId = booking.transferId;
  const transferScheduledFor = booking.transferScheduledFor;
  
  // No transfer info
  if (!transferScheduledFor && !transferId) {
    return null;
  }
  
  // Transfer completed
  if (transferId && transferStatus === 'completed') {
    return {
      label: 'Transferred to Your Account',
      color: 'status-confirmed',
      icon: 'check-circle',
      description: `Transfer ID: ${transferId}`
    };
  }
  
  // Transfer failed
  if (transferStatus === 'failed') {
    return {
      label: 'Transfer Failed',
      color: 'status-cancelled',
      icon: 'alert-circle',
      description: 'Transfer failed - contact support'
    };
  }
  
  // Transfer reversed (for refunds)
  if (transferStatus === 'reversed') {
    return {
      label: 'Transfer Reversed',
      color: 'status-default',
      icon: 'arrow-left',
      description: 'Transfer was reversed for refund'
    };
  }
  
  // Transfer pending
  if (transferScheduledFor) {
    const scheduledDate = new Date(transferScheduledFor);
    const now = new Date();
    
    if (scheduledDate > now) {
      const hoursUntil = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (hoursUntil > 24) {
        const days = Math.ceil(hoursUntil / 24);
        return {
          label: `Transfer in ${days} day${days !== 1 ? 's' : ''}`,
          color: 'status-pending',
          icon: 'clock',
          description: `Scheduled for ${scheduledDate.toLocaleDateString()}`
        };
      }
      
      return {
        label: `Transfer in ${hoursUntil}h`,
        color: 'status-pending',
        icon: 'clock',
        description: `Scheduled for ${scheduledDate.toLocaleString()}`
      };
    }
    
    // Scheduled time passed but not yet transferred
    return {
      label: 'Processing Transfer',
      color: 'status-pending',
      icon: 'loader',
      description: 'Transfer processing in progress'
    };
  }
  
  return null;
}

/**
 * Get refund status display
 */
export function getRefundStatusDisplay(booking: any): StatusDisplay | null {
  const refundStatus = USE_NEW_STATUS_SYSTEM
    ? (booking.refundStatusNew || booking.refundStatus)
    : booking.refundStatus;
  
  const refundId = booking.refundId;
  const refundAmount = booking.refundAmount;
  
  // No refund info
  if (!refundStatus || refundStatus === 'not_required') {
    return null;
  }
  
  // Refund succeeded
  if (refundStatus === 'succeeded') {
    return {
      label: 'Refunded',
      color: 'status-confirmed',
      icon: 'check-circle',
      description: refundAmount 
        ? `${refundAmount} refunded to customer`
        : 'Refund processed'
    };
  }
  
  // Refund pending
  if (refundStatus === 'pending') {
    return {
      label: 'Refund Pending',
      color: 'status-pending',
      icon: 'clock',
      description: 'Refund is being processed'
    };
  }
  
  // Refund failed
  if (refundStatus === 'failed') {
    return {
      label: 'Refund Failed',
      color: 'status-cancelled',
      icon: 'alert-circle',
      description: 'Refund failed - manual intervention needed'
    };
  }
  
  return null;
}

/**
 * Check if booking can be cancelled
 */
export function canCancelBooking(booking: any): { allowed: boolean; reason?: string } {
  // Can't cancel already cancelled bookings
  if (booking.status === 'cancelled') {
    return { allowed: false, reason: 'Booking is already cancelled' };
  }
  
  // Can't cancel completed bookings
  if (booking.status === 'completed') {
    return { allowed: false, reason: 'Cannot cancel completed bookings' };
  }
  
  // Can't cancel no-shows
  if (booking.status === 'no_show') {
    return { allowed: false, reason: 'Cannot cancel no-show bookings' };
  }
  
  // Check if tour is in the past
  if (booking.expand?.timeSlot?.startTime) {
    const tourTime = new Date(booking.expand.timeSlot.startTime);
    if (tourTime < new Date()) {
      return { allowed: false, reason: 'Cannot cancel past tours' };
    }
  }
  
  return { allowed: true };
}

/**
 * Check if booking can be marked as completed
 */
export function canMarkCompleted(booking: any): { allowed: boolean; reason?: string } {
  // Must be confirmed
  if (booking.status !== 'confirmed') {
    return { allowed: false, reason: 'Only confirmed bookings can be completed' };
  }
  
  // Payment must be received
  if (booking.paymentStatus !== 'paid') {
    return { allowed: false, reason: 'Payment must be received first' };
  }
  
  return { allowed: true };
}

/**
 * Check if booking can be marked as no-show
 */
export function canMarkNoShow(booking: any): { allowed: boolean; reason?: string } {
  // Must be confirmed
  if (booking.status !== 'confirmed') {
    return { allowed: false, reason: 'Only confirmed bookings can be marked no-show' };
  }
  
  // Tour must be in the past
  if (booking.expand?.timeSlot?.startTime) {
    const tourTime = new Date(booking.expand.timeSlot.startTime);
    if (tourTime > new Date()) {
      return { allowed: false, reason: 'Cannot mark future tours as no-show' };
    }
  }
  
  return { allowed: true };
}

/**
 * Get detailed booking state (for debugging/admin)
 */
export function getBookingStateDetails(booking: any) {
  const refundStatus = USE_NEW_STATUS_SYSTEM 
    ? (booking.refundStatusNew || booking.refundStatus)
    : booking.refundStatus;
    
  const transferStatus = USE_NEW_STATUS_SYSTEM 
    ? (booking.transferStatusNew || booking.transferStatus)
    : booking.transferStatus;
  
  return {
    lifecycle: booking.status,
    payment: booking.paymentStatus,
    refund: refundStatus,
    transfer: transferStatus,
    hasRefundId: !!booking.refundId,
    hasTransferId: !!booking.transferId,
    usingNewSystem: USE_NEW_STATUS_SYSTEM,
    
    // Derived states
    isCancelled: booking.status === 'cancelled',
    isRefunded: booking.paymentStatus === 'refunded' || refundStatus === 'succeeded',
    isTransferred: !!booking.transferId && transferStatus === 'completed',
    isPaid: booking.paymentStatus === 'paid',
    isCompleted: booking.status === 'completed'
  };
}

/**
 * Validate status transition
 * Returns true if the transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
  paymentStatus: string
): { valid: boolean; reason?: string } {
  // Can't transition from cancelled
  if (currentStatus === 'cancelled' && newStatus !== 'cancelled') {
    return { valid: false, reason: 'Cannot change status of cancelled bookings' };
  }
  
  // Can't transition from completed
  if (currentStatus === 'completed' && newStatus !== 'completed') {
    return { valid: false, reason: 'Cannot change status of completed bookings' };
  }
  
  // Can't confirm without payment
  if (newStatus === 'confirmed' && paymentStatus !== 'paid') {
    return { valid: false, reason: 'Cannot confirm booking without payment' };
  }
  
  // Can't complete if not confirmed
  if (newStatus === 'completed' && currentStatus !== 'confirmed') {
    return { valid: false, reason: 'Can only complete confirmed bookings' };
  }
  
  return { valid: true };
}

/**
 * Backward compatibility: Get status display using old logic
 */
export function getCombinedStatusBadgeCompat(booking: any): { label: string; color: string } {
  const paymentStatusValue = booking.paymentStatus || 'pending';
  
  if (booking.status === 'cancelled') {
    return { label: 'Cancelled', color: 'status-cancelled' };
  }
  
  if (paymentStatusValue === 'pending') {
    return { label: 'Awaiting Payment', color: 'payment-pending' };
  }
  
  if (booking.transferId) {
    return { label: 'Confirmed • Transferred', color: 'status-confirmed' };
  }
  
  if (booking.status === 'confirmed') {
    return { label: 'Confirmed • Paid', color: 'status-confirmed' };
  }
  
  if (booking.status === 'completed') {
    return { label: 'Completed', color: 'status-completed' };
  }
  
  return { label: booking.status || 'Unknown', color: 'status-default' };
}

