import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals }: { url: URL; locals: any }) => {
	// Use locals directly since hooks.server.ts already processed auth
	const isAuthenticated = !!locals.user;
	
	// Redirect authenticated users from root path to dashboard
	// Allow them to access marketing pages if they add ?view=home query parameter
	if (isAuthenticated && url.pathname === '/' && !url.searchParams.has('view')) {
		console.log('Marketing layout: Redirecting authenticated user to dashboard', { 
			pathname: url.pathname, 
			searchParams: Object.fromEntries(url.searchParams.entries()) 
		});
		throw redirect(302, '/dashboard');
	}
	
	// Debug log for when users access with view parameter
	if (isAuthenticated && url.pathname === '/' && url.searchParams.has('view')) {
		console.log('Marketing layout: Allowing authenticated user to view marketing page', { 
			pathname: url.pathname, 
			searchParams: Object.fromEntries(url.searchParams.entries()) 
		});
	}
	
	// Generate SEO data based on route
	const pathname = url.pathname;
	let seo = {
		title: 'Zaur - More Bookings, Less Hassle for Independent Tour Guides',
		description: 'The simplest booking system with QR codes, instant reservations, and secure payments. No commission fees, ever.',
		canonical: url.href,
		keywords: 'QR booking, tour guides, instant booking, tourism, travel, independent tour guides, booking system, no commission'
	};

	// Customize SEO for specific routes
	if (pathname === '/') {
		seo = {
			title: 'Zaur - More Bookings, Less Hassle for Independent Tour Guides',
			description: 'The simplest booking system with QR codes, instant reservations, and secure payments. Independent tour guides keep 100% of earnings. No commission fees, ever.',
			canonical: url.href,
			keywords: 'QR booking, tour guides, instant booking, tourism, travel, independent tour guides, booking system, no commission, more bookings'
		};
	} else if (pathname.includes('/auth/login')) {
		seo = {
			title: 'Sign In to Zaur - Tour Guide Dashboard',
			description: 'Access your tour guide dashboard to manage bookings, create QR codes, and grow your business with more bookings and less hassle.',
			canonical: url.href,
			keywords: 'tour guide login, dashboard access, booking management'
		};
	} else if (pathname.includes('/auth/register')) {
		seo = {
			title: 'Join Zaur - Start Your Journey to More Bookings',
			description: 'Create your free tour guide account and start accepting instant bookings with QR codes. The simplest booking system - setup takes less than 5 minutes.',
			canonical: url.href,
			keywords: 'tour guide signup, QR booking registration, tour business, independent tour guides'
		};
	}

	// Map user data to match the AuthUser interface if authenticated
	let user = null;
	if (isAuthenticated && locals.user) {
		const userData = locals.user;
		user = {
			id: userData.id,
			email: userData.email,
			name: userData.name,
			username: userData.username,
			businessName: userData.businessName,
			role: userData.role,
			avatar: userData.avatar,
			phone: userData.phone,
			website: userData.website,
			description: userData.description,
			location: userData.location,
			emailVerified: userData.emailVerified,
			lastLogin: userData.lastLogin,
			// Promo code fields
			promoCodeUsed: userData.promoCodeUsed,
			subscriptionDiscountPercentage: userData.subscriptionDiscountPercentage,
			subscriptionFreeUntil: userData.subscriptionFreeUntil,
			isLifetimeDiscount: userData.isLifetimeDiscount,
			earlyAccessMember: userData.earlyAccessMember
		};
	}

	return {
		user,
		seo
	};
}; 