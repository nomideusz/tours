import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validatePromoCode, calculatePromoCodeBenefits, formatPromoCodeBenefit } from '$lib/utils/promo-codes.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code } = await request.json();
		
		if (!code) {
			return json({ valid: false, error: 'Promo code is required' });
		}
		
		const validation = await validatePromoCode(code);
		
		if (!validation.valid) {
			return json({ valid: false, error: validation.error });
		}
		
		if (!validation.promoCode) {
			return json({ valid: false, error: 'Invalid promo code' });
		}
		
		const benefits = calculatePromoCodeBenefits(validation.promoCode);
		const benefitText = formatPromoCodeBenefit(benefits);
		
		return json({
			valid: true,
			code: validation.promoCode.code,
			type: validation.promoCode.type,
			benefitText,
			benefits: {
				discountPercentage: benefits.discountPercentage,
				freeMonths: validation.promoCode.freeMonths || 0,
				isLifetime: benefits.isLifetime,
				description: validation.promoCode.description
			}
		});
	} catch (error) {
		console.error('Error validating promo code:', error);
		return json({ valid: false, error: 'Failed to validate promo code' });
	}
}; 