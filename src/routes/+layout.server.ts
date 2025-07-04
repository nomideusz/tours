import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Use locals directly since hooks.server.ts already processed auth
  const isAuthenticated = !!locals.user;
  
  // Generate SEO metadata based on the current route
  const seoData = generateSEOData(url.pathname, url.origin);
  
  // Map user data properly to match AuthUser interface
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
      country: userData.country,
      currency: userData.currency,
      emailVerified: userData.emailVerified,
      lastLogin: userData.lastLogin,
      // Payment fields
      stripeAccountId: userData.stripeAccountId,
      // Subscription fields
      subscriptionPlan: userData.subscriptionPlan,
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionCancelAtPeriodEnd: userData.subscriptionCancelAtPeriodEnd,
      subscriptionCurrentPeriodEnd: userData.subscriptionCurrentPeriodEnd,
      monthlyBookingsUsed: userData.monthlyBookingsUsed,
      monthlyBookingsResetAt: userData.monthlyBookingsResetAt,
      // Promo code fields
      promoCodeUsed: userData.promoCodeUsed,
      subscriptionDiscountPercentage: userData.subscriptionDiscountPercentage,
      subscriptionFreeUntil: userData.subscriptionFreeUntil,
      isLifetimeDiscount: userData.isLifetimeDiscount,
      earlyAccessMember: userData.earlyAccessMember
    };
  }
  
  // Root layout provides base data for all routes
  return {
    isAuthenticated,
    isAdmin: locals.isAdmin,
    user,
    seo: seoData
  };
};

function generateSEOData(pathname: string, origin: string) {
  const baseTitle = 'Zaur - QR Booking for Tour Guides';
  const baseDescription = 'Professional QR code booking system for tour guides. Let tourists book and pay instantly — no apps, no friction.';
  const defaultImage = `${origin}/images/og-default.jpg`;
  
  // Default SEO data
  let seoData = {
    title: baseTitle,
    description: baseDescription,
    canonical: `${origin}${pathname}`,
    openGraph: {
      title: baseTitle,
      description: baseDescription,
      url: `${origin}${pathname}`,
      type: 'website',
      image: defaultImage,
      site_name: 'Zaur'
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: baseDescription,
      image: defaultImage
    },
    keywords: 'QR booking, tour guides, instant booking, tourism, travel, booking system'
  };

  // Route-specific SEO customization
  if (pathname === '/') {
    seoData.title = 'Zaur - Turn Street Traffic into Instant Bookings for Tour Guides';
    seoData.description = 'Professional QR code booking system for tour guides. Let tourists book and pay instantly with no apps required. Setup in 5 minutes.';
    seoData.keywords = 'QR booking, tour guides, instant booking, tourism, travel, booking system, street marketing, tourist attraction';
    seoData.openGraph.title = seoData.title;
    seoData.openGraph.description = seoData.description;
    seoData.twitter.title = seoData.title;
    seoData.twitter.description = seoData.description;
  } else if (pathname.startsWith('/auth/login')) {
    seoData.title = 'Login - Zaur';
    seoData.description = 'Sign in to your Zaur account to manage your tour booking system and QR codes.';
    seoData.openGraph.title = seoData.title;
    seoData.openGraph.description = seoData.description;
    seoData.twitter.title = seoData.title;
    seoData.twitter.description = seoData.description;
  } else if (pathname.startsWith('/auth/register')) {
    seoData.title = 'Create Account - Zaur';
    seoData.description = 'Join Zaur to create QR booking systems for your tours. Setup takes just 5 minutes.';
    seoData.openGraph.title = seoData.title;
    seoData.openGraph.description = seoData.description;
    seoData.twitter.title = seoData.title;
    seoData.twitter.description = seoData.description;
  } else if (pathname.startsWith('/book/')) {
    // Dynamic booking pages will override this in their page load functions
    seoData.title = 'Book Tour - Zaur';
    seoData.description = 'Book your tour instantly with our secure QR booking system.';
  }

  return seoData;
} 