import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { toursApi } from '$lib/pocketbase.js';
import { validateTourForm, sanitizeTourFormData } from '$lib/validation.js';
import type { QRCode } from '$lib/types.js';

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

      // Automatically create a default QR code for the tour
      try {
        // Generate a unique code for the QR
        const generateUniqueCode = () => {
          const tourPrefix = createdTour.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'TUR';
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          return `${tourPrefix}-${randomSuffix}`;
        };

        const qrData = {
          tour: createdTour.id,
          user: locals.user.id,
          name: `${createdTour.name} - Main QR Code`,
          category: 'digital', // Default to digital/social category
          code: generateUniqueCode(),
          scans: 0,
          conversions: 0,
          isActive: true,
          customization: JSON.stringify({
            color: '#000000',
            backgroundColor: '#FFFFFF',
            style: 'square'
          })
        };
        
        await locals.pb.collection('qr_codes').create(qrData);
        console.log('Default QR code created successfully for tour:', createdTour.id);
      } catch (qrError) {
        // Log error but don't fail the tour creation
        console.error('Failed to create default QR code:', qrError);
        // Optionally, you could store a flag to remind the user to create a QR code later
      }

      // Redirect to schedule setup for the new tour
      throw redirect(303, `/tours/${createdTour.id}/schedule?new=true`);

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