/**
 * Payment Transfer Utilities - CLIENT-SAFE
 * Functions that can be used in browser/components
 */

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

