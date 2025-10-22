/**
 * Cancellation and Refund Policy Utilities
 * Handles time-based refund calculations for tour bookings
 */

export interface CancellationPolicyConfig {
  id: string;
  name: string;
  description: string;
  rules: CancellationRule[];
}

export interface CancellationRule {
  hoursBeforeTour: number; // Hours before tour start
  refundPercentage: number; // 0-100
  description: string;
}

export interface RefundCalculation {
  isRefundable: boolean;
  refundPercentage: number;
  refundAmount: number;
  rule: string;
  timeUntilTour: number; // hours
  canCancel: boolean; // Whether cancellation is allowed at all
}

/**
 * Predefined cancellation policies
 */
export const CANCELLATION_POLICIES: Record<string, CancellationPolicyConfig> = {
  flexible: {
    id: 'flexible',
    name: 'Flexible',
    description: 'Full refund up to 24 hours before the tour',
    rules: [
      {
        hoursBeforeTour: 24,
        refundPercentage: 100,
        description: 'Full refund if cancelled 24+ hours before tour'
      },
      {
        hoursBeforeTour: 12,
        refundPercentage: 50,
        description: '50% refund if cancelled 12-24 hours before tour'
      },
      {
        hoursBeforeTour: 0,
        refundPercentage: 0,
        description: 'No refund if cancelled less than 12 hours before tour'
      }
    ]
  },
  
  moderate: {
    id: 'moderate',
    name: 'Moderate',
    description: 'Full refund up to 48 hours before the tour',
    rules: [
      {
        hoursBeforeTour: 48,
        refundPercentage: 100,
        description: 'Full refund if cancelled 48+ hours before tour'
      },
      {
        hoursBeforeTour: 24,
        refundPercentage: 50,
        description: '50% refund if cancelled 24-48 hours before tour'
      },
      {
        hoursBeforeTour: 0,
        refundPercentage: 0,
        description: 'No refund if cancelled less than 24 hours before tour'
      }
    ]
  },
  
  strict: {
    id: 'strict',
    name: 'Strict',
    description: 'Full refund up to 7 days before the tour',
    rules: [
      {
        hoursBeforeTour: 168, // 7 days
        refundPercentage: 100,
        description: 'Full refund if cancelled 7+ days before tour'
      },
      {
        hoursBeforeTour: 72, // 3 days
        refundPercentage: 50,
        description: '50% refund if cancelled 3-7 days before tour'
      },
      {
        hoursBeforeTour: 24,
        refundPercentage: 25,
        description: '25% refund if cancelled 1-3 days before tour'
      },
      {
        hoursBeforeTour: 0,
        refundPercentage: 0,
        description: 'No refund if cancelled less than 24 hours before tour'
      }
    ]
  },
  
  nonRefundable: {
    id: 'nonRefundable',
    name: 'Non-Refundable',
    description: 'No refunds allowed',
    rules: [
      {
        hoursBeforeTour: 0,
        refundPercentage: 0,
        description: 'No refunds - all sales are final'
      }
    ]
  },
  
  veryFlexible: {
    id: 'veryFlexible',
    name: 'Very Flexible',
    description: 'Full refund up to 2 hours before the tour',
    rules: [
      {
        hoursBeforeTour: 2,
        refundPercentage: 100,
        description: 'Full refund if cancelled 2+ hours before tour'
      },
      {
        hoursBeforeTour: 0,
        refundPercentage: 0,
        description: 'No refund if cancelled less than 2 hours before tour'
      }
    ]
  }
};

/**
 * Calculate refund amount based on cancellation policy and timing
 */
export function calculateRefund(
  bookingAmount: number,
  tourStartTime: string | Date,
  policyId: string = 'flexible',
  cancelledBy: 'customer' | 'guide' = 'customer'
): RefundCalculation {
  // Parse custom policies (format: "custom_24" for 24 hours)
  let policy = CANCELLATION_POLICIES[policyId];
  
  if (!policy && policyId.startsWith('custom_')) {
    // Extract hours from custom policy ID
    const hours = parseInt(policyId.split('_')[1]);
    if (!isNaN(hours) && hours > 0) {
      // Create dynamic policy from hours
      const halfHours = Math.floor(hours / 2);
      policy = {
        id: policyId,
        name: `Custom (${hours}h)`,
        description: `Custom ${hours}-hour cancellation window`,
        rules: [
          {
            hoursBeforeTour: hours,
            refundPercentage: 100,
            description: `100% refund if cancelled ${hours}+ hours before tour`
          },
          {
            hoursBeforeTour: halfHours,
            refundPercentage: 50,
            description: `50% refund if cancelled ${halfHours}-${hours} hours before tour`
          },
          {
            hoursBeforeTour: 0,
            refundPercentage: 0,
            description: `No refund if cancelled less than ${halfHours} hours before tour`
          }
        ]
      };
    } else {
      // Invalid custom policy, use flexible
      policy = CANCELLATION_POLICIES.flexible;
    }
  } else if (!policy) {
    // Unknown policy, use flexible
    policy = CANCELLATION_POLICIES.flexible;
  }
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  const now = new Date();
  
  // Calculate hours until tour
  const msUntilTour = startTime.getTime() - now.getTime();
  const hoursUntilTour = msUntilTour / (1000 * 60 * 60);
  
  // Tour already started/passed - no cancellation allowed
  if (hoursUntilTour < 0) {
    return {
      isRefundable: false,
      refundPercentage: 0,
      refundAmount: 0,
      rule: 'Tour has already started',
      timeUntilTour: hoursUntilTour,
      canCancel: false
    };
  }
  
  // If tour guide cancels, ALWAYS give full refund (100%)
  // This protects customers and incentivizes guides to honor commitments
  if (cancelledBy === 'guide') {
    return {
      isRefundable: true,
      refundPercentage: 100,
      refundAmount: bookingAmount,
      rule: 'Tour guide cancelled - full refund guaranteed',
      timeUntilTour: hoursUntilTour,
      canCancel: true
    };
  }
  
  // Find applicable rule (customer cancellation)
  // Rules are sorted by hoursBeforeTour descending
  const sortedRules = [...policy.rules].sort((a, b) => b.hoursBeforeTour - a.hoursBeforeTour);
  
  let applicableRule = sortedRules[sortedRules.length - 1]; // Default to least generous
  
  for (const rule of sortedRules) {
    if (hoursUntilTour >= rule.hoursBeforeTour) {
      applicableRule = rule;
      break;
    }
  }
  
  const refundAmount = (bookingAmount * applicableRule.refundPercentage) / 100;
  
  return {
    isRefundable: applicableRule.refundPercentage > 0,
    refundPercentage: applicableRule.refundPercentage,
    refundAmount,
    rule: applicableRule.description,
    timeUntilTour: hoursUntilTour,
    canCancel: true // Can always cancel, but may not get refund
  };
}

/**
 * Get human-readable cancellation policy text
 */
export function getCancellationPolicyText(policyId: string = 'flexible'): string {
  // Handle custom policies (format: "custom_24" for 24 hours)
  if (policyId.startsWith('custom_')) {
    const hours = parseInt(policyId.split('_')[1]);
    if (!isNaN(hours) && hours > 0) {
      const halfHours = Math.floor(hours / 2);
      return `Custom Policy (${hours}-hour window)\n` +
        `• 100% refund if cancelled ${hours}+ hours before tour\n` +
        `• 50% refund if cancelled ${halfHours}-${hours} hours before tour\n` +
        `• No refund if cancelled less than ${halfHours} hours before tour\n\n` +
        `Note: Tour guide cancellations always receive 100% refund regardless of timing.`;
    }
  }
  
  const policy = CANCELLATION_POLICIES[policyId] || CANCELLATION_POLICIES.flexible;
  
  const rulesText = policy.rules
    .sort((a, b) => b.hoursBeforeTour - a.hoursBeforeTour)
    .map(rule => {
      if (rule.hoursBeforeTour === 0) {
        return `• ${rule.description}`;
      }
      
      const hours = rule.hoursBeforeTour;
      const timeText = hours >= 168 
        ? `${Math.floor(hours / 168)} week${Math.floor(hours / 168) > 1 ? 's' : ''}` 
        : hours >= 24 
          ? `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''}`
          : `${hours} hour${hours > 1 ? 's' : ''}`;
      
      return `• ${rule.refundPercentage}% refund if cancelled ${timeText}+ before tour`;
    })
    .join('\n');
  
  return `${policy.name} Policy\n${rulesText}\n\nNote: Tour guide cancellations always receive 100% refund regardless of timing.`;
}

/**
 * Get policy display name for UI
 */
export function getPolicyDisplayName(policyId: string = 'flexible'): string {
  if (policyId.startsWith('custom_')) {
    const hours = parseInt(policyId.split('_')[1]);
    if (!isNaN(hours) && hours > 0) {
      return `Custom (${hours}h window)`;
    }
    return 'Custom';
  }
  const policy = CANCELLATION_POLICIES[policyId];
  return policy ? policy.name : 'Flexible';
}

/**
 * Validate if a cancellation is allowed
 */
export function canCancelBooking(
  tourStartTime: string | Date,
  currentStatus: string,
  paymentStatus: string
): { allowed: boolean; reason?: string } {
  // Already cancelled
  if (currentStatus === 'cancelled') {
    return { allowed: false, reason: 'Booking is already cancelled' };
  }
  
  // Already completed
  if (currentStatus === 'completed') {
    return { allowed: false, reason: 'Tour has already been completed' };
  }
  
  // Tour already started
  const startTime = typeof tourStartTime === 'string' ? new Date(tourStartTime) : tourStartTime;
  if (startTime < new Date()) {
    return { allowed: false, reason: 'Tour has already started' };
  }
  
  // Payment never went through
  if (paymentStatus === 'failed') {
    return { allowed: true, reason: 'Can cancel failed payment booking' };
  }
  
  return { allowed: true };
}

/**
 * Format refund amount with Stripe fee consideration
 * Note: Stripe refunds the processing fee for full refunds, but not for partial refunds
 */
export function getActualRefundAmount(
  originalAmount: number,
  refundPercentage: number,
  stripeFee: number
): {
  refundToCustomer: number;
  stripeFeeRefunded: boolean;
  guideKeeps: number;
} {
  const baseRefund = (originalAmount * refundPercentage) / 100;
  
  // Full refund - Stripe refunds the processing fee too
  if (refundPercentage === 100) {
    return {
      refundToCustomer: originalAmount, // Customer gets everything back
      stripeFeeRefunded: true, // Stripe refunds their fee
      guideKeeps: 0 // Guide keeps nothing
    };
  }
  
  // Partial refund - Stripe keeps their processing fee
  // The guide must pay the refund from their received amount
  return {
    refundToCustomer: baseRefund, // Customer gets partial refund
    stripeFeeRefunded: false, // Stripe keeps their fee
    guideKeeps: originalAmount - baseRefund - stripeFee // What guide keeps after refund
  };
}

