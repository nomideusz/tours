import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { toursApi } from '$lib/pocketbase.js';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';

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
      const images = formData.getAll('images') as File[];
      const validImages = images.filter(img => img instanceof File && img.size > 0);

      let createdTour;
      if (validImages.length > 0) {
        // Create tour with images
        const tourFormData = new FormData();
        
        // Add tour data to FormData
        Object.entries(sanitizedData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            if (key === 'includedItems' || key === 'requirements') {
              tourFormData.append(key, JSON.stringify(value));
            } else {
              value.forEach(item => tourFormData.append(key, String(item)));
            }
          } else {
            tourFormData.append(key, String(value));
          }
        });

        // Add images
        validImages.forEach(image => {
          tourFormData.append('images', image);
        });

        createdTour = await toursApi.createWithImages(tourFormData);
      } else {
        // Create tour without images
        createdTour = await toursApi.create(sanitizedData);
      }

      // Redirect to the tours list on success
      throw redirect(303, '/tours');

    } catch (error) {
      console.error('Error creating tour:', error);
      
      // Handle specific API errors
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 400) {
          return fail(400, {
            error: 'Invalid tour data provided',
            message: 'Please check your input and try again.'
          });
        } else if (error.status === 413) {
          return fail(413, {
            error: 'File too large',
            message: 'One or more images are too large. Please use smaller images.'
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