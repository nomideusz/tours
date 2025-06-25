// Common subscription error messages
export const SUBSCRIPTION_ERRORS = {
  // User-related errors
  USER_NOT_FOUND: 'Unable to find your account. Please try logging out and back in.',
  
  // Subscription status errors
  NO_ACTIVE_SUBSCRIPTION: 'You don\'t have an active subscription to cancel. If you believe this is an error, please contact support.',
  ALREADY_ON_FREE_PLAN: 'The free plan doesn\'t require payment. You\'re already on the free plan!',
  
  // Configuration errors
  PLAN_NOT_AVAILABLE: 'This plan is not available yet. Please try another plan or contact support.',
  
  // Generic errors
  CHECKOUT_FAILED: 'We couldn\'t create your checkout session. Please try again later or contact support.',
  PORTAL_FAILED: 'We couldn\'t open the billing portal right now. Please try again later or contact support.',
  UPDATE_FAILED: 'We couldn\'t update your subscription right now. Please try again later or contact support if the issue persists.',
  
  // Network errors
  NETWORK_ERROR: 'Unable to connect to our servers. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request took too long. Please try again.',
};

// Helper function to get user-friendly error message based on technical error
export function getSubscriptionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Match specific error patterns
    if (message.includes('no active subscription')) {
      return SUBSCRIPTION_ERRORS.NO_ACTIVE_SUBSCRIPTION;
    }
    
    if (message.includes('user not found')) {
      return SUBSCRIPTION_ERRORS.USER_NOT_FOUND;
    }
    
    if (message.includes('cannot create checkout for free plan')) {
      return SUBSCRIPTION_ERRORS.ALREADY_ON_FREE_PLAN;
    }
    
    if (message.includes('price id not configured')) {
      return SUBSCRIPTION_ERRORS.PLAN_NOT_AVAILABLE;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return SUBSCRIPTION_ERRORS.NETWORK_ERROR;
    }
    
    if (message.includes('timeout')) {
      return SUBSCRIPTION_ERRORS.TIMEOUT_ERROR;
    }
  }
  
  // Default to generic error
  return SUBSCRIPTION_ERRORS.UPDATE_FAILED;
}

// Helper to determine error severity
export function getErrorSeverity(error: unknown): 'error' | 'warning' | 'info' {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Info level - user just needs to know something
    if (message.includes('already on free plan')) {
      return 'info';
    }
    
    // Warning level - user action needed
    if (message.includes('no active subscription') || message.includes('not available')) {
      return 'warning';
    }
  }
  
  // Error level - something went wrong
  return 'error';
} 