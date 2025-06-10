import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getUserByUsername } from '$lib/utils/username.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, desc, and, gte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  const { username } = params;
  
  // Get the user by username
  const profileUser = await getUserByUsername(username);
  
  if (!profileUser) {
    throw error(404, 'User not found');
  }
  
  try {
    console.log('Public profile page: Loading public profile for:', username);
    
    // Get user's active tours
    const userTours = await db
      .select({
        id: tours.id,
        name: tours.name,
        description: tours.description,
        location: tours.location,
        price: tours.price,
        duration: tours.duration,
        capacity: tours.capacity,
        images: tours.images,
        qrCode: tours.qrCode,
        createdAt: tours.createdAt
      })
      .from(tours)
      .where(and(
        eq(tours.userId, profileUser.id),
        eq(tours.status, 'active')
      ))
      .orderBy(desc(tours.createdAt));
    
    // Get available time slots for the next 30 days for all tours
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const availableTimeSlots = await db
      .select({
        id: timeSlots.id,
        tourId: timeSlots.tourId,
        startTime: timeSlots.startTime,
        endTime: timeSlots.endTime,
        availableSpots: timeSlots.availableSpots,
        bookedSpots: timeSlots.bookedSpots,
        tourName: tours.name
      })
      .from(timeSlots)
      .innerJoin(tours, eq(timeSlots.tourId, tours.id))
      .where(and(
        eq(tours.userId, profileUser.id),
        eq(tours.status, 'active'),
        gte(timeSlots.startTime, new Date()),
        eq(timeSlots.status, 'available')
      ))
      .orderBy(timeSlots.startTime)
      .limit(50);
    
    // Group time slots by tour
    const tourTimeSlots = availableTimeSlots.reduce((acc, slot) => {
      if (!acc[slot.tourId]) {
        acc[slot.tourId] = [];
      }
      acc[slot.tourId].push({
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        availableSpots: slot.availableSpots,
        bookedSpots: slot.bookedSpots || 0
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    // Return customer-focused profile data
    return {
      profile: {
        id: profileUser.id,
        name: profileUser.name,
        username: profileUser.username,
        businessName: profileUser.businessName,
        avatar: profileUser.avatar,
        description: profileUser.description,
        location: profileUser.location,
        website: profileUser.website,
      },
      tours: userTours.map(tour => ({
        ...tour,
        images: tour.images || [],
        timeSlots: tourTimeSlots[tour.id] || [],
        createdAt: tour.createdAt.toISOString()
      })),
      totalTours: userTours.length
    };
    
  } catch (err) {
    console.error('Error loading public profile:', err);
    throw error(500, 'Failed to load profile');
  }
}; 