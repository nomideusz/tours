import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
		meta: {
			title: 'Contact Us - Zaur',
			description: 'Get in touch with Zaur - Support for tour guides using our QR booking system. Email support, early access inquiries, and help getting started.',
			keywords: 'zaur contact, tour guide support, booking system help, early access, customer support',
			robots: 'index, follow'
		}
	};
}; 