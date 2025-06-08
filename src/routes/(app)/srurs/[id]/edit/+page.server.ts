import type { PageServerLoad, Actions } from './$types.js';
import { redirect, error, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import { processAndSaveImage, initializeUploadDirs, deleteImage } from '$lib/utils/image-storage.js';

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
    // Load tour data from Drizzle
    const tourResults = await db
      .select()
      .from(tours)
      .where(and(
        eq(tours.id, params.id),
        eq(tours.userId, locals.user.id)
      ))
      .limit(1);

    if (tourResults.length === 0) {
      throw error(404, 'Tour not found');
    }

    const tour = tourResults[0];

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
        images: tour.images,
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

      // Parse JSON fields if they exist
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
      await initializeUploadDirs();
      
      const imageFiles = formData.getAll('images') as File[];
      const validImages = imageFiles.filter(img => img instanceof File && img.size > 0);
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
          await deleteImage(params.id, imageToRemove);
        } catch (error) {
          console.error('Failed to delete image:', error);
        }
      }

      // Combine existing and new images
      const finalImages = [...updatedImages, ...newImages];

      // Update tour in PostgreSQL
      const updateData = {
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
        images: finalImages,
        updatedAt: new Date()
      };

      await db
        .update(tours)
        .set(updateData)
        .where(and(
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ));

      // Redirect to tour details page
      throw redirect(303, `/tours/${params.id}`);

    } catch (error) {
      // Don't log redirects as errors
      if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
        throw error; // Re-throw redirects
      }
      
      console.error('Error updating tour:', error);
      
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
        error: 'Failed to update tour',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  }
}; 