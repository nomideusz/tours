import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	return {
		seo: {
			title: 'Privacy Policy - Zaur',
			description: 'Privacy Policy for Zaur - How we collect, use, and protect your personal data. GDPR compliant data protection information.',
			canonical: url.href,
			keywords: 'privacy policy, data protection, GDPR, privacy, Zaur, tour guides'
		}
	};
}; 