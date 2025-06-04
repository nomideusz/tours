import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.log('Tours page: User not authenticated, redirecting to login');
    // Store the current URL to redirect back after login
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  try {
    // EMERGENCY FIX: Use pagination instead of getFullList to prevent timeouts
    // Load first 100 tours (should be enough for most users)
    const toursResult = await locals.pb.collection('tours').getList(1, 100, {
      filter: `user = "${locals.user.id}"`,
      sort: '-updated'
    });
    const tours = toursResult.items;
    
    // Skip loading all bookings - too expensive for users with many tours
    // Instead, just get recent bookings for basic stats
    let allBookings: any[] = [];
    try {
      // Only fetch recent bookings (last 50) for stats calculation
      const bookingsResult = await locals.pb.collection('bookings').getList(1, 50, {
        filter: `tour.user = "${locals.user.id}"`,
        expand: 'tour,timeSlot',
        sort: '-created'
      });
      allBookings = bookingsResult.items;
    } catch (bookingsErr) {
      console.warn('Failed to load bookings for stats, continuing with empty array:', bookingsErr);
      allBookings = [];
    }

    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Filter confirmed/paid bookings for revenue calculation
    const confirmedBookings = allBookings.filter((b: any) => 
      b.status === 'confirmed' && b.paymentStatus === 'paid'
    );

    // Today's bookings
    const todayBookings = allBookings.filter((b: any) => {
      const bookingDate = new Date(b.created);
      return bookingDate >= today && 
             (b.status === 'confirmed' || b.status === 'pending');
    });

    // This week's bookings
    const weekBookings = allBookings.filter((b: any) => {
      const bookingDate = new Date(b.created);
      return bookingDate >= oneWeekAgo && 
             (b.status === 'confirmed' || b.status === 'pending');
    });

    // This month's revenue (from confirmed/paid bookings)
    const monthRevenue = confirmedBookings
      .filter((b: any) => {
        const bookingDate = new Date(b.created);
        return bookingDate >= oneMonthAgo;
      })
      .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

    // Calculate overall statistics
    const stats = {
      total: tours.length,
      active: tours.filter((t: any) => t.status === 'active').length,
      draft: tours.filter((t: any) => t.status === 'draft').length,
      totalRevenue: confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0),
      todayBookings: todayBookings.length,
      weekBookings: weekBookings.length,
      monthRevenue: monthRevenue,
      totalBookings: allBookings.length,
      confirmedBookings: confirmedBookings.length,
      totalParticipants: confirmedBookings.reduce((sum: number, b: any) => sum + (b.participants || 0), 0)
    };

    return {
      user: locals.user,
      isAuthenticated: true,
      tours,
      stats
    };
  } catch (err) {
    console.error('Error loading tours data:', err);
    
    // Return basic data if there's an error
    return {
      user: locals.user,
      isAuthenticated: true,
      tours: [],
      stats: {
        total: 0,
        active: 0,
        draft: 0,
        totalRevenue: 0,
        todayBookings: 0,
        weekBookings: 0,
        monthRevenue: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        totalParticipants: 0
      }
    };
  }
}; 