import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import { db } from '$lib/db/connection.js';
import { tours, qrCodes } from '$lib/db/schema/index.js';
import { createId } from '@paralleldrive/cuid2';
import { processAndSaveImage, initializeUploadDirs, isImageStorageAvailable } from '$lib/utils/image-storage.js';

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

    try {
      // Get form data
      const formData = await request.formData();
      
      // Get included items
      let parsedIncludedItems: string[] = [];
      const includedItems = formData.get('includedItems');
      if (includedItems && typeof includedItems === 'string' && includedItems.trim()) {
        try {
          parsedIncludedItems = JSON.parse(includedItems) || [];
        } catch (e) {
          console.warn('Failed to parse included items, using empty array:', e);
          parsedIncludedItems = [];
        }
      }

      // Get requirements
      let parsedRequirements: string[] = [];
      const requirements = formData.get('requirements');
      if (requirements && typeof requirements === 'string' && requirements.trim()) {
        try {
          parsedRequirements = JSON.parse(requirements) || [];
        } catch (e) {
          console.warn('Failed to parse requirements, using empty array:', e);
          parsedRequirements = [];
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

        // Initialize upload directories
        try {
          await initializeUploadDirs();
        } catch (error) {
          console.error('❌ Failed to initialize upload directories:', error);
          return fail(500, {
            error: 'Image upload setup failed',
            message: 'Unable to prepare image upload directories. Please contact support.'
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

        // Create tour in PostgreSQL
        const newTour = {
          id: finalTourId,
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

        console.log('✅ Tour created successfully:', createdTour.id, 'with', processedImages.length, 'images');

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

        // Redirect to the newly created tour
        throw redirect(303, `/tours/${createdTour.id}`);
      } else {
        // No images to process - create tour without images
        console.log('📸 No valid images to process, creating tour without images');
        
        const tourId = createId();
        
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
          images: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const createdTourResult = await db.insert(tours).values(newTour).returning();
        const createdTour = createdTourResult[0];

        console.log('✅ Tour created successfully without images:', createdTour.id);

        // Redirect to the newly created tour
        throw redirect(303, `/tours/${createdTour.id}`);
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