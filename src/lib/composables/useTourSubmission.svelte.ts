/**
 * Composable for standardized tour form submission
 * Handles both create and update operations with consistent error handling
 */

import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { trackTourEvent } from '$lib/utils/umami-tracking.js';
import { queryKeys } from '$lib/queries/shared-stats.js';

interface SubmissionOptions {
	isEdit: boolean;
	tourId?: string;
	onSuccess?: (tourId: string) => void;
	onError?: (error: string) => void;
	queryClient?: any; // TanStack Query client
}

export function useTourSubmission(options: SubmissionOptions) {
	const { isEdit, tourId, queryClient } = options;
	let isSubmitting = $state(false);

	/**
	 * Prepare form data for submission
	 */
	function prepareFormData(
		formData: any,
		uploadedImages: File[],
		imagesToRemove: string[] = [],
		scheduleData?: any
	): FormData {
		const formDataToSubmit = new FormData();

		// Add all form fields
		Object.entries(formData).forEach(([key, value]) => {
			if (key === 'includedItems' || key === 'requirements') {
				// Add arrays as multiple values
				(value as string[]).forEach(item => {
					if (item.trim()) {
						formDataToSubmit.append(key, item.trim());
					}
				});
			} else if (key === 'categories' || key === 'languages') {
				// JSON.stringify arrays for categories and languages
				formDataToSubmit.append(key, JSON.stringify(value));
			} else if (key === 'pricingTiers') {
				if (formData.enablePricingTiers && value) {
					formDataToSubmit.append('pricingTiers.adult', String((value as any).adult));
					formDataToSubmit.append('pricingTiers.child', String((value as any).child));
				}
			} else if (key === 'participantCategories' || key === 'privateTour' || key === 'groupDiscounts' || key === 'optionalAddons' || key === 'groupPricingTiers') {
				// JSON.stringify objects for pricing features
				formDataToSubmit.append(key, JSON.stringify(value));
			} else if (key === 'guidePaysStripeFee' || key === 'countInfantsTowardCapacity' || key === 'enablePricingTiers' || key === 'publicListing') {
				// Boolean fields
				formDataToSubmit.append(key, value ? 'true' : 'false');
			} else if (key === 'locationPlaceId') {
				// Only append if not null/undefined
				if (value !== null && value !== undefined && value !== '') {
					console.log('📍 Client: Adding locationPlaceId to form:', value);
					formDataToSubmit.append(key, String(value));
				}
			} else {
				formDataToSubmit.append(key, String(value));
			}
		});

		// Add capacity fields from participantCategories or privateTour or defaults
		const minCap = (formData.participantCategories?.minCapacity) || ((formData.privateTour as any)?.minCapacity) || 1;
		const maxCap = (formData.participantCategories?.maxCapacity) || ((formData.privateTour as any)?.maxCapacity) || formData.capacity;
		formDataToSubmit.append('minCapacity', String(minCap));
		formDataToSubmit.append('maxCapacity', String(maxCap));

		// Add images to remove (edit mode only)
		if (isEdit) {
			imagesToRemove.forEach(imageUrl => {
				formDataToSubmit.append('removeImages', imageUrl);
			});
		}

		// Add new images
		uploadedImages.forEach(image => {
			formDataToSubmit.append('images', image);
		});

		// Add schedule data if provided (new tour only)
		if (!isEdit && scheduleData) {
			formDataToSubmit.append('enableScheduling', 'true');
			formDataToSubmit.append('scheduleData', JSON.stringify(scheduleData));
		}

		return formDataToSubmit;
	}

	/**
	 * Submit the tour form
	 */
	async function submit(
		formData: any,
		uploadedImages: File[],
		imagesToRemove: string[] = [],
		scheduleData?: any
	): Promise<{ success: boolean; tourId?: string; error?: string }> {
		if (isSubmitting) {
			return { success: false, error: 'Submission already in progress' };
		}

		try {
			isSubmitting = true;

			// Prepare form data
			const formDataToSubmit = prepareFormData(formData, uploadedImages, imagesToRemove, scheduleData);

			// Submit via fetch
			const url = isEdit ? `/tours/${tourId}/edit` : '/tours/new';
			const response = await fetch(url, {
				method: 'POST',
				body: formDataToSubmit
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to save tour' }));
				throw new Error(error.error || error.message || 'Failed to save tour');
			}

			// Handle redirect response
			let result: any;
			let extractedTourId: string | undefined;

			if (response.redirected) {
				const redirectUrl = new URL(response.url);
				// Extract tour ID from URL path like /tours/abc123?created=true
				const pathParts = redirectUrl.pathname.split('/').filter(Boolean);
				extractedTourId = pathParts[pathParts.length - 1];
				console.log('🔍 Redirect detected:', {
					fullUrl: response.url,
					pathname: redirectUrl.pathname,
					pathParts,
					extractedTourId
				});
				result = { success: true, redirected: true, tourId: extractedTourId };
			} else {
				// Try to parse JSON response
				const text = await response.text();
				console.log('📄 Response text:', text.substring(0, 200));
				try {
					result = JSON.parse(text);
				} catch (e) {
					console.error('Failed to parse JSON:', e);
					result = { success: true };
				}
			}

			console.log('✅ Tour submitted successfully:', result);

			// Determine final tour ID
			const finalTourId = isEdit ? tourId! : (result.tourId || result.id || extractedTourId);

			console.log('🎯 Final tour ID:', finalTourId, {
				isEdit,
				resultTourId: result.tourId,
				resultId: result.id,
				extractedTourId
			});

			// Invalidate caches if queryClient is available
			if (queryClient) {
				console.log('🔄 Invalidating caches...');
				queryClient.removeQueries({ queryKey: queryKeys.userTours });
				queryClient.removeQueries({ queryKey: queryKeys.toursStats });

				await queryClient.refetchQueries({
					queryKey: queryKeys.userTours,
					type: 'active'
				});
				await queryClient.refetchQueries({
					queryKey: queryKeys.toursStats,
					type: 'active'
				});

				if (isEdit && tourId) {
					await queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) });
				}

				queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
			}

			// Track event
			if (isEdit && tourId) {
				trackTourEvent('update', tourId, {
					status: formData.status,
					pricing_model: formData.pricingModel
				});
			} else if (finalTourId) {
				trackTourEvent('create', finalTourId, {
					status: formData.status,
					has_schedule: !!scheduleData,
					pricing_model: formData.pricingModel
				});
			}

			// Mark recent tour activity for cache invalidation
			if (browser) {
				sessionStorage.setItem('recentTourActivity', Date.now().toString());
			}

			// Call success callback
			if (options.onSuccess) {
				options.onSuccess(finalTourId);
			}

			return { success: true, tourId: finalTourId };

		} catch (err) {
			console.error('❌ Tour submission failed:', err);
			const errorMessage = err instanceof Error ? err.message : 'Failed to save changes. Please try again.';

			// Call error callback
			if (options.onError) {
				options.onError(errorMessage);
			}

			return { success: false, error: errorMessage };
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * Submit and navigate to tour detail page
	 */
	async function submitAndNavigate(
		formData: any,
		uploadedImages: File[],
		imagesToRemove: string[] = [],
		scheduleData?: any
	): Promise<void> {
		const result = await submit(formData, uploadedImages, imagesToRemove, scheduleData);

		console.log('🚀 submitAndNavigate result:', result);

		if (result.success && result.tourId) {
			// Navigate to tour detail page
			const targetUrl = isEdit
				? `/tours/${result.tourId}?edited=true`
				: scheduleData
					? `/tours/${result.tourId}?created=true&scheduled=true`
					: `/tours/${result.tourId}?created=true`;

			console.log('🧭 Navigating to:', targetUrl);
			goto(targetUrl);
		} else {
			console.warn('⚠️ Navigation skipped:', { success: result.success, tourId: result.tourId });
		}
	}

	return {
		get isSubmitting() { return isSubmitting },
		submit,
		submitAndNavigate
	};
}
