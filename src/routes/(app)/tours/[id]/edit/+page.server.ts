import type { PageServerLoad, Actions } from './$types.js';
import { redirect, error, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import { processAndSaveImage, initializeImageStorage, deleteImage } from '$lib/utils/image-storage.js';
import { 
	loadTourWithOwnership, 
		getBookingConstraints,
	validateCapacityChange,
	updateTimeSlotsCapacity
} from '$lib/utils/tour-helpers-server.js';

export const load: PageServerLoad = async ({ locals, url, params }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.log('Tour edit page: User not authenticated, redirecting to login');
    // Store the current URL to redirect back after login
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  // Validate that tour ID is provided
  if (!params.id) {
    throw error(400, 'Tour ID is required');
  }

  try {
    // Load tour and verify ownership
    const tour = await loadTourWithOwnership(params.id, locals.user.id);

    // Get booking constraints
    const bookingConstraints = await getBookingConstraints(params.id, tour.capacity);

    // User is authenticated, return user data, tour ID, and tour data
    return {
      user: locals.user,
      isAuthenticated: true,
      tourId: params.id,
      tour: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        price: parseFloat(tour.price),
        duration: tour.duration,
        capacity: tour.capacity,
        status: tour.status,
        category: tour.category,
        location: tour.location,
        includedItems: tour.includedItems,
        requirements: tour.requirements,
        cancellationPolicy: tour.cancellationPolicy,
        enablePricingTiers: tour.enablePricingTiers,
        pricingTiers: tour.pricingTiers,
        images: tour.images,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt
      },
      bookingConstraints
    };
  } catch (err) {
    console.error('Error loading tour:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load tour');
  }
};

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    // Check authentication
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    if (!params.id) {
      return fail(400, { error: 'Tour ID is required' });
    }

    try {
      const formData = await request.formData();
      
      // Handle included items and requirements from FormData
      const includedItems: string[] = [];
      const requirements: string[] = [];
      
      // Extract multiple values with the same field name from FormData (how TourForm submits them)
      const allIncludedItems = formData.getAll('includedItems');
      const allRequirements = formData.getAll('requirements');
      
      // Process included items
      for (const item of allIncludedItems) {
        if (typeof item === 'string' && item.trim()) {
          includedItems.push(item.trim());
        }
      }
      
      // Process requirements  
      for (const req of allRequirements) {
        if (typeof req === 'string' && req.trim()) {
          requirements.push(req.trim());
        }
      }

      // Use the processed arrays
      let parsedIncludedItems = includedItems;
      let parsedRequirements = requirements;
      
      // Fallback: try the old approach for backward compatibility
      if (parsedIncludedItems.length === 0) {
        // Extract array values from FormData (old approach with indexed keys)
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('includedItems.')) {
            const index = parseInt(key.split('.')[1]);
            if (!isNaN(index) && typeof value === 'string' && value.trim()) {
              includedItems[index] = value.trim();
            }
          }
        }
        parsedIncludedItems = includedItems.filter(Boolean);
        
        // Also try JSON parsing if still empty
        try {
          const includedItemsJson = formData.get('includedItems');
          if (typeof includedItemsJson === 'string') {
            parsedIncludedItems = JSON.parse(includedItemsJson);
          }
        } catch (e) {
          // Use the array version if JSON parsing fails
        }
      }

      if (parsedRequirements.length === 0) {
        // Extract array values from FormData (old approach with indexed keys)  
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('requirements.')) {
            const index = parseInt(key.split('.')[1]);
            if (!isNaN(index) && typeof value === 'string' && value.trim()) {
              requirements[index] = value.trim();
            }
          }
        }
        parsedRequirements = requirements.filter(Boolean);
        
        // Also try JSON parsing if still empty
        try {
          const requirementsJson = formData.get('requirements');
          if (typeof requirementsJson === 'string') {
            parsedRequirements = JSON.parse(requirementsJson);
          }
        } catch (e) {
          // Use the array version if JSON parsing fails
        }
      }

      // Get pricing tiers
      const enablePricingTiers = formData.get('enablePricingTiers') === 'on' || formData.get('enablePricingTiers') === 'true';
      let pricingTiers = null;
      
      if (enablePricingTiers) {
        const adultPrice = formData.get('pricingTiers.adult');
        const childPrice = formData.get('pricingTiers.child');
        
        pricingTiers = {
          adult: adultPrice ? parseFloat(String(adultPrice)) : 0,
          child: childPrice ? parseFloat(String(childPrice)) : 0
        };
      }

      // Prepare tour data
      const tourData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        duration: formData.get('duration'),
        capacity: formData.get('capacity'),
        status: formData.get('status'),
        category: formData.get('category'),
        location: formData.get('location'),
        includedItems: parsedIncludedItems,
        requirements: parsedRequirements,
        cancellationPolicy: formData.get('cancellationPolicy'),
        enablePricingTiers,
        pricingTiers
      };

      // Sanitize the data
      const sanitizedData = sanitizeTourFormData(tourData);

      // Validate the data
      const validation = validateTourForm(sanitizedData);
      
      if (!validation.isValid) {
        return fail(400, {
          error: 'Validation failed',
          validationErrors: validation.errors,
          formData: sanitizedData
        });
      }

      // Additional capacity validation - check if we can reduce capacity
      const newCapacity = parseInt(String(sanitizedData.capacity));
      const bookingConstraints = await getBookingConstraints(params.id, newCapacity);
      const capacityValidation = validateCapacityChange(newCapacity, bookingConstraints.maxBookedSpots);
      
      if (!capacityValidation.isValid) {
        return fail(400, {
          error: 'Capacity validation failed',
          message: capacityValidation.error,
          formData: sanitizedData,
          capacityError: capacityValidation.capacityError
        });
      }

      // Check if tour exists and belongs to user
      const existingTourResults = await db
        .select()
        .from(tours)
        .where(and(
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ))
        .limit(1);

      if (existingTourResults.length === 0) {
        return fail(404, { error: 'Tour not found' });
      }

      const existingTour = existingTourResults[0];
      const currentImages = existingTour.images || [];

      // Handle image uploads
      await initializeImageStorage();
      
      const imageFiles = formData.getAll('images') as File[];
      console.log('📱 Server received image files:', imageFiles.length);
      imageFiles.forEach((img, index) => {
        if (img instanceof File) {
          console.log(`📱 Image ${index}:`, img.name, img.size, img.type);
        } else {
          console.log(`📱 Image ${index} is not a File:`, typeof img, img);
        }
      });
      
      const validImages = imageFiles.filter(img => img instanceof File && img.size > 0);
      console.log('📱 Valid images after filtering:', validImages.length);
      const newImages: string[] = [];
      
      // Process new images
      if (validImages.length > 0) {
        for (const imageFile of validImages) {
          try {
            const processed = await processAndSaveImage(imageFile, params.id);
            newImages.push(processed.filename);
          } catch (error) {
            console.error('Image processing failed:', error);
            return fail(400, {
              error: 'Image upload failed',
              message: `Failed to process image: ${imageFile.name}`
            });
          }
        }
      }

      // Handle image removals
      const imagesToRemove = formData.getAll('removeImages') as string[];
      const updatedImages = currentImages.filter(img => !imagesToRemove.includes(img));
      
      // Delete removed images from storage
      for (const imageToRemove of imagesToRemove) {
        try {
          await deleteImage(imageToRemove, params.id);
        } catch (error) {
          console.warn('Failed to delete image:', imageToRemove, error);
          // Continue processing even if image deletion fails
        }
      }

      // Combine existing images (minus removed ones) with new images
      const finalImages = [...updatedImages, ...newImages];

      // Update tour in database
      const updatedTour = await db
        .update(tours)
        .set({
          name: sanitizedData.name as string,
          description: sanitizedData.description as string,
          price: String(sanitizedData.price),
          duration: parseInt(String(sanitizedData.duration)),
          capacity: parseInt(String(sanitizedData.capacity)),
          status: (sanitizedData.status as 'active' | 'draft') || 'draft',
          category: sanitizedData.category as string || null,
          location: sanitizedData.location as string || null,
          includedItems: parsedIncludedItems,
          requirements: parsedRequirements,
          cancellationPolicy: sanitizedData.cancellationPolicy as string || null,
          enablePricingTiers: Boolean(sanitizedData.enablePricingTiers),
          pricingTiers: sanitizedData.pricingTiers as { adult: number; child?: number } || null,
          images: finalImages,
          updatedAt: new Date()
        })
        .where(and(
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ))
        .returning();

      if (updatedTour.length === 0) {
        return fail(500, { error: 'Failed to update tour' });
      }

      // Update existing time slots to match new tour capacity
      // This ensures all time slots reflect the updated capacity
      await updateTimeSlotsCapacity(params.id, newCapacity);

      console.log('✅ Tour updated successfully:', updatedTour[0].id);
      console.log('✅ Time slots updated to new capacity:', newCapacity);

      // Redirect to tour detail page with success flag
      throw redirect(303, `/tours/${params.id}?edited=true`);

    } catch (error) {
      // If it's a redirect, don't catch it - just re-throw
      if (error instanceof Response && error.status >= 300 && error.status < 400) {
        throw error;
      }
      
      // Check if it's a SvelteKit redirect object
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      
      console.error('Tour update error:', error);
      
      return fail(500, {
        error: 'Server error',
        message: 'An unexpected error occurred while updating the tour. Please try again.'
      });
    }
  }
}; 