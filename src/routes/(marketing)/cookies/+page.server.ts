import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	return {
		seo: {
			title: 'Cookie Policy - Zaur',
			description: 'Cookie Policy for Zaur - How we use cookies to improve your browsing experience and website functionality.',
			canonical: url.href,
			keywords: 'cookie policy, cookies, website tracking, privacy, Zaur'
		}
	};
}; 