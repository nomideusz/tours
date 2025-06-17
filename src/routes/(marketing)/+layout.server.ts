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
		title: 'Zaur - QR Booking for Tour Guides',
		description: 'Professional QR code booking system for tour guides. Let tourists book and pay instantly — no apps, no friction.',
		canonical: url.href,
		keywords: 'QR booking, tour guides, instant booking, tourism, travel'
	};

	// Customize SEO for specific routes
	if (pathname === '/') {
		seo = {
			title: 'Zaur - QR Booking for Tour Guides | Instant Tourist Bookings',
			description: 'Transform how tourists book your tours with QR codes. No apps needed - instant booking and payment. Join tour guides worldwide using Zaur.',
			canonical: url.href,
			keywords: 'QR booking, tour guides, instant booking, tourism, travel, tourist attractions, tour booking system'
		};
	} else if (pathname.includes('/auth/login')) {
		seo = {
			title: 'Sign In to Zaur - Tour Guide Dashboard',
			description: 'Access your tour guide dashboard to manage bookings, create QR codes, and grow your business.',
			canonical: url.href,
			keywords: 'tour guide login, dashboard access, booking management'
		};
	} else if (pathname.includes('/auth/register')) {
		seo = {
			title: 'Join Zaur - Start Your QR Booking Journey',
			description: 'Create your free tour guide account and start accepting instant bookings with QR codes. Setup takes less than 5 minutes.',
			canonical: url.href,
			keywords: 'tour guide signup, QR booking registration, tour business'
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
			lastLogin: userData.lastLogin
		};
	}

	return {
		user,
		seo
	};
}; 