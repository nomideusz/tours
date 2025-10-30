import type { PageServerLoad, Actions } from './$types.js';
import { redirect, error, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import { processAndSaveImage, initializeImageStorage, deleteImage } from '$lib/utils/image-storage.js';
import { 
	loadTourWithOwnership
} from '$lib/utils/tour-helpers-server.js';
import { bookings, timeSlots } from '$lib/db/schema/index.js';

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

    // Check for future bookings (for delete button logic)
    // Include both confirmed AND pending bookings to prevent deletion during payment processing
    const now = new Date();
    const futureBookingsCount = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(bookings)
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .where(and(
        eq(bookings.tourId, params.id),
        sql`${bookings.status} IN ('confirmed', 'pending')`,
        gte(timeSlots.startTime, now)
      ));

    const hasFutureBookings = Number(futureBookingsCount[0]?.count || 0) > 0;
    console.log(`🔍 Server load - Tour ${params.id} future bookings check:`, {
      futureBookingsCount: Number(futureBookingsCount[0]?.count || 0),
      hasFutureBookings,
      now: now.toISOString()
    });

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
        minCapacity: tour.minCapacity,
        maxCapacity: tour.maxCapacity,
        status: tour.status,
        categories: tour.categories || [],
        location: tour.location,
        includedItems: tour.includedItems,
        requirements: tour.requirements,
        cancellationPolicy: tour.cancellationPolicy,
        // Pricing configuration
        pricingModel: tour.pricingModel,
        enablePricingTiers: tour.enablePricingTiers,
        pricingTiers: tour.pricingTiers,
        participantCategories: tour.participantCategories,
        privateTour: tour.privateTour,
        groupPricingTiers: tour.groupPricingTiers,
        groupDiscounts: tour.groupDiscounts,
        optionalAddons: tour.optionalAddons,
        guidePaysStripeFee: tour.guidePaysStripeFee,
        countInfantsTowardCapacity: tour.countInfantsTowardCapacity,
        publicListing: tour.publicListing,
        images: tour.images,
        hasFutureBookings: hasFutureBookings,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt
      }
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
          if (typeof includedItemsJson === 'string' && includedItemsJson !== 'null' && includedItemsJson !== 'undefined' && includedItemsJson !== '') {
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
          if (typeof requirementsJson === 'string' && requirementsJson !== 'null' && requirementsJson !== 'undefined' && requirementsJson !== '') {
            parsedRequirements = JSON.parse(requirementsJson);
          }
        } catch (e) {
          // Use the array version if JSON parsing fails
        }
      }

      // Get pricing tiers
      // Get pricing model and configuration
      const pricingModel = (formData.get('pricingModel') as string) || 'per_person';
      
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
      
      // Get participant categories
      let participantCategories = null;
      const participantCategoriesRaw = formData.get('participantCategories');
      if (participantCategoriesRaw && typeof participantCategoriesRaw === 'string' && participantCategoriesRaw !== 'null' && participantCategoriesRaw !== 'undefined' && participantCategoriesRaw !== '' && !participantCategoriesRaw.startsWith('[object')) {
        try {
          const parsed = JSON.parse(participantCategoriesRaw);
          // Only set if it has categories array with items
          if (parsed && parsed.categories && parsed.categories.length > 0) {
            participantCategories = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse participant categories:', e);
        }
      }
      
      // Get private tour
      let privateTour = null;
      const privateTourRaw = formData.get('privateTour');
      if (privateTourRaw && typeof privateTourRaw === 'string' && privateTourRaw !== 'null' && privateTourRaw !== 'undefined' && privateTourRaw !== '' && !privateTourRaw.startsWith('[object')) {
        try {
          privateTour = JSON.parse(privateTourRaw);
        } catch (e) {
          console.warn('Failed to parse private tour:', e);
        }
      }
      
      // Get group pricing tiers (legacy)
      let groupPricingTiers = null;
      const groupPricingTiersRaw = formData.get('groupPricingTiers');
      if (groupPricingTiersRaw && typeof groupPricingTiersRaw === 'string' && groupPricingTiersRaw !== 'null' && groupPricingTiersRaw !== 'undefined' && groupPricingTiersRaw !== '' && !groupPricingTiersRaw.startsWith('[object')) {
        try {
          groupPricingTiers = JSON.parse(groupPricingTiersRaw);
        } catch (e) {
          console.warn('Failed to parse group pricing tiers:', e);
          // If parsing fails, just leave it as null (won't update this field)
          groupPricingTiers = null;
        }
      }
      
      // Get group discounts
      let groupDiscounts = null;
      const groupDiscountsRaw = formData.get('groupDiscounts');
      if (groupDiscountsRaw && typeof groupDiscountsRaw === 'string' && groupDiscountsRaw !== 'null' && groupDiscountsRaw !== 'undefined' && groupDiscountsRaw !== '' && !groupDiscountsRaw.startsWith('[object')) {
        try {
          groupDiscounts = JSON.parse(groupDiscountsRaw);
        } catch (e) {
          console.warn('Failed to parse group discounts:', e);
        }
      }
      
      // Get optional add-ons
      let optionalAddons = null;
      const optionalAddonsRaw = formData.get('optionalAddons');
      if (optionalAddonsRaw && typeof optionalAddonsRaw === 'string' && optionalAddonsRaw !== 'null' && optionalAddonsRaw !== 'undefined' && optionalAddonsRaw !== '' && !optionalAddonsRaw.startsWith('[object')) {
        try {
          optionalAddons = JSON.parse(optionalAddonsRaw);
        } catch (e) {
          console.warn('Failed to parse optional add-ons:', e);
        }
      }
      
      // Get Stripe fee payment option
      const guidePaysStripeFee = formData.get('guidePaysStripeFee') === 'true' || formData.get('guidePaysStripeFee') === 'on';
      
      // Get infant capacity setting
      const countInfantsTowardCapacity = formData.get('countInfantsTowardCapacity') === 'true' || formData.get('countInfantsTowardCapacity') === 'on';
      
      // Get public listing setting
      const publicListing = formData.get('publicListing') === 'true';
      console.log('📝 Public listing from form:', formData.get('publicListing'), '→', publicListing);
      
      // Debug cancellation policy
      console.log('📝 Cancellation policy from form:', {
        policyId: formData.get('cancellationPolicyId'),
        policyText: formData.get('cancellationPolicy')?.substring(0, 50)
      });

      // Prepare tour data
      console.log('📝 Raw categories from form:', formData.get('categories'));
      const tourData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        duration: formData.get('duration'),
        capacity: formData.get('capacity'),
        status: formData.get('status'),
        categories: (() => {
          const categoriesData = formData.get('categories') as string || '[]';
          // Skip parsing for invalid values
          if (categoriesData === 'undefined' || categoriesData === 'null' || categoriesData === '') {
            return [];
          }
          try {
            return JSON.parse(categoriesData);
          } catch (e) {
            // Handle old comma-separated format or invalid JSON
            return categoriesData.split(',').map(c => c.trim()).filter(Boolean);
          }
        })(),
        location: formData.get('location'),
        includedItems: parsedIncludedItems,
        requirements: parsedRequirements,
        cancellationPolicy: formData.get('cancellationPolicy'),
        cancellationPolicyId: formData.get('cancellationPolicyId') || 'flexible',
        // Pricing configuration
        pricingModel,
        enablePricingTiers,
        pricingTiers,
        participantCategories,
        privateTour,
        groupPricingTiers,
        groupDiscounts,
        optionalAddons,
        guidePaysStripeFee,
        countInfantsTowardCapacity,
        publicListing
      };

      // Sanitize the data
      const sanitizedData = sanitizeTourFormData(tourData);
      console.log('📝 Processed categories:', sanitizedData.categories);

      // Check if trying to activate tour without completing onboarding
      if (sanitizedData.status === 'active') {
        const missingSteps: string[] = [];
        
        // Check email verification
        if (!locals.user.emailVerified) {
          missingSteps.push('Email verification');
        }
        
        // Check location confirmation
        const hasLocationConfirmed = (locals.user.country && locals.user.currency) || locals.user.stripeAccountId;
        if (!hasLocationConfirmed) {
          missingSteps.push('Location confirmation');
        }
        
        // Check payment setup
        if (!locals.user.stripeAccountId) {
          missingSteps.push('Payment setup');
        }
        
        if (missingSteps.length > 0) {
          console.error('❌ Tour activation blocked - missing onboarding steps:', missingSteps);
          return fail(400, {
            error: `Complete onboarding before activating tours: ${missingSteps.join(', ')}`,
            formData: sanitizedData
          });
        }
      }

      // Validate the data
      const validation = validateTourForm(sanitizedData);
      
      if (!validation.isValid) {
        return fail(400, {
          error: 'Validation failed',
          validationErrors: validation.errors,
          formData: sanitizedData
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
      
      // Server-side validation for maximum images
      const MAX_IMAGES = 6; // Maximum 6 images per tour
      const imagesToRemove = formData.getAll('removeImages') as string[];
      const remainingExistingImages = currentImages.filter(img => !imagesToRemove.includes(img));
      const totalImages = remainingExistingImages.length + validImages.length;
      
      if (totalImages > MAX_IMAGES) {
        return fail(400, {
          error: 'Too many images',
          message: `You can have a maximum of ${MAX_IMAGES} images per tour. Current: ${remainingExistingImages.length}, New: ${validImages.length}, Total: ${totalImages}.`,
          formData: sanitizedData
        });
      }
      
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
      // Note: imagesToRemove was already read above for validation
      console.log('🗑️ Server: Images to remove:', imagesToRemove);
      console.log('🗑️ Server: Current images:', currentImages);
      const updatedImages = currentImages.filter(img => !imagesToRemove.includes(img));
      console.log('🗑️ Server: Updated images after removal:', updatedImages);
      
      // Delete removed images from storage
      for (const imageToRemove of imagesToRemove) {
        try {
          console.log('🗑️ Server: Deleting image from storage:', imageToRemove);
          await deleteImage(imageToRemove, params.id);
        } catch (error) {
          console.warn('Failed to delete image:', imageToRemove, error);
          // Continue processing even if image deletion fails
        }
      }

      // Combine existing images (minus removed ones) with new images
      const finalImages = [...updatedImages, ...newImages];
      console.log('🖼️ Server: Final images to save:', finalImages);

      // Calculate base price from pricing model for backward compatibility
      let basePrice = String(sanitizedData.price || '0');
      if (pricingModel === 'private_tour' && privateTour?.flatPrice) {
        basePrice = String(privateTour.flatPrice);
      } else if (pricingModel === 'participant_categories' && participantCategories?.categories?.length) {
        // Use the first (typically adult) category price
        const sortedCategories = [...participantCategories.categories].sort((a, b) => a.sortOrder - b.sortOrder);
        basePrice = String(sortedCategories[0]?.price || 0);
      } else if (pricingModel === 'group_tiers' && groupPricingTiers?.tiers?.length) {
        // Use minimum tier price
        const minPrice = Math.min(...groupPricingTiers.tiers.map((t: any) => t.price));
        basePrice = String(minPrice);
      }
      console.log('💰 Calculated base price for backward compatibility:', basePrice, 'from model:', pricingModel);
      console.log('📝 Final cancellationPolicyId before update:', sanitizedData.cancellationPolicyId);

      // Update tour in database
      const updatedTour = await db
        .update(tours)
        .set({
          name: sanitizedData.name as string,
          description: sanitizedData.description as string,
          price: basePrice,
          duration: parseInt(String(sanitizedData.duration)),
          capacity: parseInt(String(sanitizedData.capacity)),
          status: (sanitizedData.status as 'active' | 'draft') || 'draft',
          categories: sanitizedData.categories as string[] || [],
          location: sanitizedData.location as string || null,
          includedItems: parsedIncludedItems,
          requirements: parsedRequirements,
          cancellationPolicy: sanitizedData.cancellationPolicy as string || null,
          cancellationPolicyId: (sanitizedData.cancellationPolicyId as string) || 'flexible',
          // Pricing configuration
          pricingModel: (pricingModel as 'per_person' | 'group_tiers' | 'participant_categories' | 'private_tour') || 'participant_categories',
          enablePricingTiers: Boolean(sanitizedData.enablePricingTiers),
          pricingTiers: sanitizedData.pricingTiers as { adult: number; child?: number } || null,
          participantCategories: participantCategories || null,
          privateTour: privateTour || null,
          groupPricingTiers: groupPricingTiers || null,
          groupDiscounts: groupDiscounts || null,
          optionalAddons: optionalAddons || null,
          guidePaysStripeFee: guidePaysStripeFee || false,
          minCapacity: parseInt(String(formData.get('minCapacity'))) || 1,
          maxCapacity: parseInt(String(formData.get('maxCapacity'))) || parseInt(String(sanitizedData.capacity)),
          countInfantsTowardCapacity: countInfantsTowardCapacity || false,
          publicListing: publicListing, // Already extracted as boolean above
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

      console.log('✅ Tour updated successfully:', updatedTour[0].id);

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