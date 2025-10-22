import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { processAndSaveImage, initializeImageStorage, isImageStorageAvailable } from '$lib/utils/image-storage.js';
import { generateTourQRCode } from '$lib/utils/qr-generation.js';
import { canUserCreateTour } from '$lib/stripe-subscriptions.server.js';

// Helper function to create schedule slots based on pattern data
async function createScheduleSlots(tourId: string, scheduleData: any, userId: string) {
  if (!scheduleData.selectedPattern) return;

  // Get tour capacity (use maxCapacity for new system, fallback to capacity for legacy)
  const [tour] = await db.select({ 
    capacity: tours.capacity,
    maxCapacity: tours.maxCapacity 
  }).from(tours).where(eq(tours.id, tourId)).limit(1);
  const tourCapacity = tour?.maxCapacity || tour?.capacity || 10;

  const slotsToCreate = [];
  const now = new Date();

  try {
    switch (scheduleData.selectedPattern) {
      case 'daily': {
        const pattern = scheduleData.dailyPattern;
        if (!pattern.startDate || !pattern.times?.length) break;

        const startDate = new Date(pattern.startDate);
        const endDate = calculateEndDate(startDate, pattern.duration, pattern.customEndDate);

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          for (const time of pattern.times) {
            const slotStart = new Date(date);
            const slotEnd = new Date(date);
            setTimeFromString(slotStart, time.startTime);
            setTimeFromString(slotEnd, time.endTime);

            if (slotStart > now) {
              slotsToCreate.push(createSlotObject(tourId, slotStart, slotEnd, tourCapacity));
            }
          }
        }
        break;
      }

      case 'weekend': {
        const pattern = scheduleData.weekendPattern;
        if (!pattern.startDate || !pattern.times?.length) break;

        const startDate = new Date(pattern.startDate);
        const endDate = calculateEndDate(startDate, pattern.duration, pattern.customEndDate);

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
            for (const time of pattern.times) {
              const slotStart = new Date(date);
              const slotEnd = new Date(date);
              setTimeFromString(slotStart, time.startTime);
              setTimeFromString(slotEnd, time.endTime);

              if (slotStart > now) {
                slotsToCreate.push(createSlotObject(tourId, slotStart, slotEnd, tourCapacity));
              }
            }
          }
        }
        break;
      }

      case 'custom': {
        const pattern = scheduleData.customPattern;
        if (!pattern.startDate || !pattern.times?.length || !pattern.selectedDays?.length) break;

        const startDate = new Date(pattern.startDate);
        const endDate = calculateEndDate(startDate, pattern.duration, pattern.customEndDate);
        const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay();
          const dayName = Object.keys(dayMap).find(key => dayMap[key as keyof typeof dayMap] === dayOfWeek);
          
          if (dayName && pattern.selectedDays.includes(dayName)) {
            for (const time of pattern.times) {
              const slotStart = new Date(date);
              const slotEnd = new Date(date);
              setTimeFromString(slotStart, time.startTime);
              setTimeFromString(slotEnd, time.endTime);

              if (slotStart > now) {
                slotsToCreate.push(createSlotObject(tourId, slotStart, slotEnd, tourCapacity));
              }
            }
          }
        }
        break;
      }

      case 'manual': {
        const slots = scheduleData.manualSlots;
        if (!slots?.length) break;

        for (const slot of slots) {
          if (!slot.date || !slot.startTime || !slot.endTime) continue;

          const slotStart = new Date(`${slot.date}T${slot.startTime}`);
          const slotEnd = new Date(`${slot.date}T${slot.endTime}`);

          if (slotStart > now && slotEnd > slotStart) {
            slotsToCreate.push(createSlotObject(tourId, slotStart, slotEnd, tourCapacity));
          }
        }
        break;
      }
    }

    // Insert all slots if any were created
    if (slotsToCreate.length > 0) {
      await db.insert(timeSlots).values(slotsToCreate);
      console.log(`✅ Created ${slotsToCreate.length} time slots for tour ${tourId}`);
    }

  } catch (error) {
    console.error('Error creating schedule slots:', error);
    // Don't throw - we don't want to fail tour creation if schedule creation fails
  }
}

// Helper functions
function calculateEndDate(startDate: Date, duration: string, customEndDate?: string): Date {
  const start = new Date(startDate);
  
  if (duration === 'custom' && customEndDate) {
    return new Date(customEndDate);
  }

  switch (duration) {
    case '1week': return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '2weeks': return new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    case '1month': return new Date(start.setMonth(start.getMonth() + 1));
    case '3months': return new Date(start.setMonth(start.getMonth() + 3));
    case '6months': return new Date(start.setMonth(start.getMonth() + 6));
    default: return new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 1 month
  }
}

function setTimeFromString(date: Date, timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
}

function createSlotObject(tourId: string, startTime: Date, endTime: Date, capacity: number) {
  return {
    id: createId(),
    tourId,
    startTime,
    endTime,
    availableSpots: capacity,
    bookedSpots: 0,
    status: 'available' as const,
    isRecurring: false,
    recurringPattern: null,
    recurringEnd: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.log('New tour page: User not authenticated, redirecting to login');
    // Store the current URL to redirect back after login
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  // User is authenticated, return user data
  return {
    user: locals.user,
    isAuthenticated: true
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // Ensure user is authenticated
    if (!locals.user) {
      throw redirect(303, '/auth/login');
    }

    // Check if user can create more tours based on their subscription
    const tourLimitCheck = await canUserCreateTour(locals.user.id);
    if (!tourLimitCheck.allowed) {
      return fail(403, {
        error: 'Tour limit reached',
        message: tourLimitCheck.reason || 'You have reached your tour limit. Please upgrade your subscription to create more tours.',
        showUpgradeButton: true,
        currentCount: tourLimitCheck.currentCount,
        limit: tourLimitCheck.limit
      });
    }

    try {
      // Get form data
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
      
      // Fallback: try JSON parsing if arrays are empty (for backward compatibility)
      if (parsedIncludedItems.length === 0) {
        const includedItemsJson = formData.get('includedItems');
        if (includedItemsJson && typeof includedItemsJson === 'string' && includedItemsJson.trim()) {
          try {
            parsedIncludedItems = JSON.parse(includedItemsJson) || [];
          } catch (e) {
            console.warn('Failed to parse included items JSON, using empty array:', e);
            parsedIncludedItems = [];
          }
        }
      }

      if (parsedRequirements.length === 0) {
        const requirementsJson = formData.get('requirements');
        if (requirementsJson && typeof requirementsJson === 'string' && requirementsJson.trim()) {
          try {
            parsedRequirements = JSON.parse(requirementsJson) || [];
          } catch (e) {
            console.warn('Failed to parse requirements JSON, using empty array:', e);
            parsedRequirements = [];
          }
        }
      }

      // Get pricing model and configuration
      const pricingModel = (formData.get('pricingModel') as string) || 'per_person';
      
      // Get pricing tiers (adult/child)
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
      if (groupPricingTiersRaw && typeof groupPricingTiersRaw === 'string' && groupPricingTiersRaw !== 'null') {
        try {
          groupPricingTiers = JSON.parse(groupPricingTiersRaw);
        } catch (e) {
          console.warn('Failed to parse group pricing tiers:', e);
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
      if (optionalAddonsRaw && typeof optionalAddonsRaw === 'string' && optionalAddonsRaw !== 'null') {
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

      // Get schedule data
      let scheduleData = null;
      const enableScheduling = formData.get('enableScheduling') === 'true';
      if (enableScheduling) {
        const scheduleDataRaw = formData.get('scheduleData');
        if (scheduleDataRaw && typeof scheduleDataRaw === 'string') {
          try {
            scheduleData = JSON.parse(scheduleDataRaw);
          } catch (e) {
            console.warn('Failed to parse schedule data:', e);
          }
        }
      }

      // Prepare tour data
      const tourData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        duration: formData.get('duration'),
        capacity: formData.get('capacity'),
        status: formData.get('status'),
        categories: (() => {
          const categoriesData = formData.get('categories') as string || '[]';
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
        countInfantsTowardCapacity
      };

      // Sanitize the data
      const sanitizedData = sanitizeTourFormData(tourData);

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

      // Handle image uploads
      const imageFiles = formData.getAll('images') as File[];
      console.log('📸 Raw image files:', imageFiles.length);
      console.log('📸 Image files details:', imageFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const validImages = imageFiles.filter(img => img instanceof File && img.size > 0);
      console.log('📸 Valid images after filtering:', validImages.length);
      
      // Server-side validation for maximum images
      const MAX_IMAGES = 6; // Maximum 6 images per tour
      if (validImages.length > MAX_IMAGES) {
        return fail(400, {
          error: 'Too many images',
          message: `You can upload a maximum of ${MAX_IMAGES} images per tour. You tried to upload ${validImages.length} images.`,
          formData: sanitizedData
        });
      }
      
      // Process images with proper error handling
      const processedImages: string[] = [];
      
      if (validImages.length > 0) {
        // Check if image storage is available
        const storageAvailable = await isImageStorageAvailable();
        
        if (!storageAvailable) {
          console.error('❌ Image storage not available - permission issue');
          return fail(500, {
            error: 'Image upload unavailable',
            message: 'Unable to upload images due to server configuration. Please contact support or try again later.'
          });
        }

        // Initialize MinIO storage
        try {
          await initializeImageStorage();
        } catch (error) {
          console.error('❌ Failed to initialize MinIO storage:', error);
          return fail(500, {
            error: 'Image upload setup failed',
            message: 'Unable to prepare image upload storage. Please contact support.'
          });
        }
        
        // Create tour ID and process images
        const tourId = createId();
        
        console.log('📸 Processing', validImages.length, 'images for tour:', tourId);
        for (const imageFile of validImages) {
          try {
            console.log('📸 Processing image:', imageFile.name, 'size:', imageFile.size);
            const processed = await processAndSaveImage(imageFile, tourId);
            processedImages.push(processed.filename);
            console.log('📸 Successfully processed image:', processed.filename);
          } catch (error) {
            console.error('📸 Image processing failed:', error);
            
            // Provide helpful error message based on error type
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Permission denied') || errorMessage.includes('EACCES')) {
              return fail(500, {
                error: 'Permission denied',
                message: 'Unable to save images due to server permissions. Please contact support.'
              });
            }
            
            return fail(400, {
              error: 'Image upload failed',
              message: `Failed to process image: ${imageFile.name}. ${errorMessage}`
            });
          }
        }

        // Update tourId for the new tour
        const finalTourId = tourId;

        // Generate QR code for the tour
        const qrCode = generateTourQRCode(sanitizedData.name as string);

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
        console.log('💰 Calculated base price for new tour:', basePrice, 'from model:', pricingModel);

        // Create tour in PostgreSQL
        const newTour = {
          id: finalTourId,
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
          minCapacity: 1,
          maxCapacity: parseInt(String(sanitizedData.capacity)),
          countInfantsTowardCapacity: countInfantsTowardCapacity || false,
          userId: locals.user.id,
          images: processedImages,
          qrCode: qrCode,
          qrScans: 0,
          qrConversions: 0,
          publicListing: sanitizedData.publicListing === 'false' ? false : true, // Default to true
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const createdTourResult = await db.insert(tours).values(newTour).returning();
        const createdTour = createdTourResult[0];

        console.log('✅ Tour created successfully:', createdTour.id, 'with', processedImages.length, 'images', 'and QR code:', qrCode);

        // Create schedule if provided
        if (scheduleData) {
          await createScheduleSlots(createdTour.id, scheduleData, locals.user.id);
        }

        // Redirect to tour details page with welcome prompt for time slot creation
        const redirectUrl = scheduleData 
          ? `/tours/${createdTour.id}?created=true&scheduled=true`
          : `/tours/${createdTour.id}?created=true`;
        throw redirect(303, redirectUrl);
      } else {
        // No images to process - create tour without images
        console.log('📸 No valid images to process, creating tour without images');
        
        const tourId = createId();
        
        // Generate QR code for the tour
        const qrCode = generateTourQRCode(sanitizedData.name as string);
        
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
        console.log('💰 Calculated base price for new tour (no images):', basePrice, 'from model:', pricingModel);
        
        const newTour = {
          id: tourId,
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
          minCapacity: 1,
          maxCapacity: parseInt(String(sanitizedData.capacity)),
          countInfantsTowardCapacity: countInfantsTowardCapacity || false,
          userId: locals.user.id,
          images: [],
          qrCode: qrCode,
          qrScans: 0,
          qrConversions: 0,
          publicListing: sanitizedData.publicListing === 'false' ? false : true, // Default to true
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const createdTourResult = await db.insert(tours).values(newTour).returning();
        const createdTour = createdTourResult[0];

        console.log('✅ Tour created successfully without images:', createdTour.id, 'with QR code:', qrCode);

        // Create schedule if provided
        if (scheduleData) {
          await createScheduleSlots(createdTour.id, scheduleData, locals.user.id);
        }

        // Redirect to tour details page with welcome prompt for time slot creation
        const redirectUrl = scheduleData 
          ? `/tours/${createdTour.id}?created=true&scheduled=true`
          : `/tours/${createdTour.id}?created=true`;
        throw redirect(303, redirectUrl);
      }

    } catch (error) {
      // If it's a redirect, don't catch it - just re-throw
      if (error instanceof Response && error.status >= 300 && error.status < 400) {
        throw error;
      }
      
      // Check if it's a SvelteKit redirect object
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      
      console.error('Tour creation error:', error);
      
      return fail(500, {
        error: 'Server error',
        message: 'An unexpected error occurred while creating the tour. Please try again.'
      });
    }
  }
}; 