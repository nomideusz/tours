import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
		meta: {
			title: 'About Us - Zaur',
			description: 'Learn about Zaur - The simplest booking system for independent tour guides. Our mission, values, and commitment to helping tour guides succeed.',
			keywords: 'zaur about, tour guide booking system, mission values, early access program, independent tour guides',
			robots: 'index, follow'
		}
	};
}; 