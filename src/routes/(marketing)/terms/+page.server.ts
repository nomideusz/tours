import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	return {
		seo: {
			title: 'Terms of Service - Zaur',
			description: 'Terms of Service for Zaur - QR booking system for tour guides. Legal terms and conditions for using our platform.',
			canonical: url.href,
			keywords: 'terms of service, legal, terms and conditions, Zaur, tour guides'
		}
	};
}; 