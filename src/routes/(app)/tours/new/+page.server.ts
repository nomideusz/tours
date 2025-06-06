import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import { db } from '$lib/db/connection.js';
import { tours, qrCodes } from '$lib/db/schema/index.js';
import { createId } from '@paralleldrive/cuid2';
import { processAndSaveImage, initializeUploadDirs } from '$lib/utils/image-storage.js';

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
    // Check authentication
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      
      // Handle included items and requirements from FormData
      const includedItems: string[] = [];
      const requirements: string[] = [];
      
      // Extract array values from FormData
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('includedItems.')) {
          const index = parseInt(key.split('.')[1]);
          if (!isNaN(index) && typeof value === 'string' && value.trim()) {
            includedItems[index] = value.trim();
          }
        } else if (key.startsWith('requirements.')) {
          const index = parseInt(key.split('.')[1]);
          if (!isNaN(index) && typeof value === 'string' && value.trim()) {
            requirements[index] = value.trim();
          }
        }
      }

      // Parse JSON fields if they exist (for API submissions)
      let parsedIncludedItems = includedItems.filter(Boolean);
      let parsedRequirements = requirements.filter(Boolean);
      
      try {
        const includedItemsJson = formData.get('includedItems');
        if (typeof includedItemsJson === 'string') {
          parsedIncludedItems = JSON.parse(includedItemsJson);
        }
      } catch (e) {
        // Use the array version if JSON parsing fails
      }

      try {
        const requirementsJson = formData.get('requirements');
        if (typeof requirementsJson === 'string') {
          parsedRequirements = JSON.parse(requirementsJson);
        }
      } catch (e) {
        // Use the array version if JSON parsing fails
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
        cancellationPolicy: formData.get('cancellationPolicy')
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

      // Handle image uploads
      const imageFiles = formData.getAll('images') as File[];
      console.log('📸 Raw image files:', imageFiles.length);
      console.log('📸 Image files details:', imageFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const validImages = imageFiles.filter(img => img instanceof File && img.size > 0);
      console.log('📸 Valid images after filtering:', validImages.length);
      
      // Initialize upload directories
      await initializeUploadDirs();
      
      // Create tour ID and process images
      const tourId = createId();
      const processedImages: string[] = [];
      
      // Process and save images
      if (validImages.length > 0) {
        console.log('📸 Processing', validImages.length, 'images for tour:', tourId);
        for (const imageFile of validImages) {
          try {
            console.log('📸 Processing image:', imageFile.name, 'size:', imageFile.size);
            const processed = await processAndSaveImage(imageFile, tourId);
            processedImages.push(processed.filename);
            console.log('📸 Successfully processed image:', processed.filename);
          } catch (error) {
            console.error('📸 Image processing failed:', error);
            return fail(400, {
              error: 'Image upload failed',
              message: `Failed to process image: ${imageFile.name}`
            });
          }
        }
      } else {
        console.log('📸 No valid images to process');
      }

      // Create tour in PostgreSQL
      const newTour = {
        id: tourId,
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
        userId: locals.user.id,
        images: processedImages,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdTourResult = await db.insert(tours).values(newTour).returning();
      const createdTour = createdTourResult[0];

      // Automatically create a default QR code for the tour
      try {
        // Generate a unique code for the QR
        const generateUniqueCode = () => {
          const tourPrefix = createdTour.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'TUR';
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          return `${tourPrefix}-${randomSuffix}`;
        };

        const qrData = {
          id: createId(),
          tourId: createdTour.id,
          userId: locals.user.id,
          name: `${createdTour.name} - Main QR Code`,
          category: 'digital' as const, // Default to digital/social category
          code: generateUniqueCode(),
          scans: 0,
          conversions: 0,
          isActive: true,
          customization: {
            color: '#000000',
            backgroundColor: '#FFFFFF',
            style: 'square' as const
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.insert(qrCodes).values(qrData);
        console.log('Default QR code created successfully for tour:', createdTour.id);
      } catch (qrError) {
        // Log error but don't fail the tour creation
        console.error('Failed to create default QR code:', qrError);
        // Optionally, you could store a flag to remind the user to create a QR code later
      }

      // Redirect to schedule setup for the new tour
      throw redirect(303, `/tours/${createdTour.id}/schedule?new=true`);

    } catch (error) {
      // Don't log redirects as errors
      if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
        throw error; // Re-throw redirects
      }
      
      console.error('Error creating tour:', error);
      
      // Handle specific database errors
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '23505') { // Unique constraint violation
          return fail(400, {
            error: 'Tour with this name already exists',
            message: 'Please choose a different tour name.'
          });
        }
      }

      return fail(500, {
        error: 'Failed to create tour',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  }
}; 