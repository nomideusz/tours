import { db } from '$lib/db/connection.js';
import { promoCodes, users } from '$lib/db/schema/index.js';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';
import type { PromoCodeBenefits } from './promo-types.js';

export async function validatePromoCode(code: string): Promise<{ 
  valid: boolean; 
  error?: string; 
  promoCode?: typeof promoCodes.$inferSelect;
}> {
  if (!code) {
    return { valid: false, error: 'Promo code is required' };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, normalizedCode))
      .limit(1);

    if (!promoCode) {
      return { valid: false, error: 'Invalid promo code' };
    }

    if (!promoCode.isActive) {
      return { valid: false, error: 'This promo code is no longer active' };
    }

    // Check validity dates
    const now = new Date();
    if (promoCode.validFrom && promoCode.validFrom > now) {
      return { valid: false, error: 'This promo code is not yet valid' };
    }

    if (promoCode.validUntil && promoCode.validUntil < now) {
      return { valid: false, error: 'This promo code has expired' };
    }

    // Check usage limits
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return { valid: false, error: 'This promo code has reached its usage limit' };
    }

    return { valid: true, promoCode };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { valid: false, error: 'Failed to validate promo code' };
  }
}

export function calculatePromoCodeBenefits(promoCode: typeof promoCodes.$inferSelect): PromoCodeBenefits {
  const benefits: PromoCodeBenefits = {
    discountPercentage: 0,
    freeUntilDate: null,
    isLifetime: false,
    description: promoCode.description || ''
  };

  const now = new Date();

  switch (promoCode.type) {
    case 'early_access':
      // Early access codes typically offer free period + lifetime discount
      if (promoCode.freeMonths) {
        benefits.freeUntilDate = new Date(now.getTime());
        benefits.freeUntilDate.setMonth(benefits.freeUntilDate.getMonth() + promoCode.freeMonths);
      }
      benefits.discountPercentage = promoCode.discountPercentage || 0;
      benefits.isLifetime = promoCode.isLifetime;
      break;

    case 'lifetime_discount':
      benefits.discountPercentage = promoCode.discountPercentage || 0;
      benefits.isLifetime = true;
      break;

    case 'free_period':
      if (promoCode.freeMonths) {
        benefits.freeUntilDate = new Date(now.getTime());
        benefits.freeUntilDate.setMonth(benefits.freeUntilDate.getMonth() + promoCode.freeMonths);
      }
      break;

    case 'percentage_discount':
      benefits.discountPercentage = promoCode.discountPercentage || 0;
      benefits.isLifetime = promoCode.isLifetime;
      if (!benefits.isLifetime && promoCode.freeMonths) {
        // Limited time discount (e.g., 50% off for 6 months)
        benefits.discountExpiresAt = new Date(now.getTime());
        benefits.discountExpiresAt.setMonth(benefits.discountExpiresAt.getMonth() + promoCode.freeMonths);
      }
      break;
  }

  return benefits;
}

export async function applyPromoCodeToUser(
  userId: string, 
  promoCode: typeof promoCodes.$inferSelect
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already has a beta cohort assigned
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existingUser.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    // Prevent changing cohort once set (protect existing users)
    if (existingUser[0].betaGroup) {
      console.warn(`User ${userId} already has betaGroup: ${existingUser[0].betaGroup}. Skipping promo code application.`);
      return { success: false, error: 'User already has a pricing cohort assigned' };
    }
    
    const benefits = calculatePromoCodeBenefits(promoCode);
    
    // Determine beta cohort based on promo code
    let betaGroup: 'beta_1' | 'beta_2' | null = null;
    
    // Beta 1: Promo codes like BETA_APPRECIATION, EARLY_ACCESS (30% lifetime discount)
    if (promoCode.code === 'BETA_APPRECIATION' || 
        promoCode.type === 'early_access' || 
        (benefits.discountPercentage === 30 && benefits.isLifetime)) {
      betaGroup = 'beta_1';
    }
    // Beta 2: Promo codes like BETA2, BETA2_GUIDE (20% lifetime discount)
    else if (promoCode.code.startsWith('BETA2') || 
             (benefits.discountPercentage === 20 && benefits.isLifetime)) {
      betaGroup = 'beta_2';
    }
    
    // Determine if user should be upgraded to a higher plan
    let subscriptionPlan: 'professional' | undefined;
    if (benefits.discountPercentage === 100 && benefits.isLifetime) {
      // 100% lifetime discount users get professional plan
      subscriptionPlan = 'professional';
    }
    
    // Update user with promo code benefits and cohort
    await db
      .update(users)
      .set({
        promoCodeUsed: promoCode.code,
        subscriptionDiscountPercentage: benefits.discountPercentage,
        subscriptionFreeUntil: benefits.freeUntilDate,
        isLifetimeDiscount: benefits.isLifetime,
        earlyAccessMember: promoCode.type === 'early_access',
        betaGroup: betaGroup, // Assign cohort
        ...(subscriptionPlan && { 
          subscriptionPlan,
          subscriptionStatus: 'active' 
        }),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Increment promo code usage
    await db
      .update(promoCodes)
      .set({
        currentUses: promoCode.currentUses + 1,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, promoCode.id));

    console.log(`Applied promo code ${promoCode.code} to user ${userId}, assigned cohort: ${betaGroup || 'none'}`);

    return { success: true };
  } catch (error) {
    console.error('Error applying promo code to user:', error);
    return { success: false, error: 'Failed to apply promo code' };
  }
}

export function formatPromoCodeBenefit(benefits: PromoCodeBenefits): string {
  const parts: string[] = [];

  if (benefits.freeUntilDate) {
    const freeMonths = Math.round(
      (benefits.freeUntilDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (freeMonths > 0) {
      parts.push(`${freeMonths} month${freeMonths > 1 ? 's' : ''} free`);
    }
  }

  if (benefits.discountPercentage > 0) {
    if (benefits.discountPercentage === 100) {
      parts.push('Free forever');
    } else {
      const discountText = `${benefits.discountPercentage}% off`;
      if (benefits.isLifetime) {
        parts.push(`${discountText} forever`);
      } else if (benefits.discountExpiresAt) {
        const discountMonths = Math.round(
          (benefits.discountExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        parts.push(`${discountText} for ${discountMonths} month${discountMonths > 1 ? 's' : ''}`);
      } else {
        parts.push(discountText);
      }
    }
  }

  return parts.join(' + ') || 'No special benefits';
}

// Check if user has an active promo benefit
export function hasActivePromoDiscount(user: typeof users.$inferSelect): boolean {
  const now = new Date();
  
  // Check if in free period
  if (user.subscriptionFreeUntil && user.subscriptionFreeUntil > now) {
    return true;
  }
  
  // Check if has lifetime discount
  if (user.isLifetimeDiscount && user.subscriptionDiscountPercentage > 0) {
    return true;
  }
  
  return false;
}

// Calculate the actual price after promo discounts
export function calculateDiscountedPrice(
  basePrice: number, 
  user: typeof users.$inferSelect
): { 
  finalPrice: number; 
  discountAmount: number; 
  discountReason?: string;
} {
  const now = new Date();
  
  // Check if in free period
  if (user.subscriptionFreeUntil && user.subscriptionFreeUntil > now) {
    return {
      finalPrice: 0,
      discountAmount: basePrice,
      discountReason: 'Free trial period'
    };
  }
  
  // Apply percentage discount
  if (user.subscriptionDiscountPercentage > 0) {
    const discountAmount = (basePrice * user.subscriptionDiscountPercentage) / 100;
    return {
      finalPrice: basePrice - discountAmount,
      discountAmount,
      discountReason: `${user.subscriptionDiscountPercentage}% ${user.isLifetimeDiscount ? 'lifetime' : ''} discount`
    };
  }
  
  return {
    finalPrice: basePrice,
    discountAmount: 0
  };
} 