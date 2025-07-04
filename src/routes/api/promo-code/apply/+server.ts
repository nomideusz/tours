import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validatePromoCode, applyPromoCodeToUser } from '$lib/utils/promo-codes.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ success: false, error: 'You must be logged in to apply promo codes' }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    
    if (!code) {
      return json({ success: false, error: 'Promo code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    
    // Check if user already has a promo code
    if (locals.user.promoCodeUsed) {
      return json({ 
        success: false, 
        error: 'You have already used a promo code. Each user can only use one promo code.' 
      });
    }

    // Validate the promo code
    const validation = await validatePromoCode(normalizedCode);
    
    if (!validation.valid) {
      return json({ success: false, error: validation.error });
    }

    if (!validation.promoCode) {
      return json({ success: false, error: 'Invalid promo code' });
    }

    // Apply the promo code to the user
    const result = await applyPromoCodeToUser(locals.user.id, validation.promoCode);
    
    if (!result.success) {
      return json({ success: false, error: result.error });
    }

    return json({ 
      success: true, 
      message: 'Promo code applied successfully!',
      code: validation.promoCode.code,
      benefits: {
        discountPercentage: validation.promoCode.discountPercentage || 0,
        freeMonths: validation.promoCode.freeMonths || 0,
        isLifetime: validation.promoCode.isLifetime,
        description: validation.promoCode.description
      }
    });
  } catch (error) {
    console.error('Error applying promo code:', error);
    return json({ success: false, error: 'Failed to apply promo code' }, { status: 500 });
  }
}; 