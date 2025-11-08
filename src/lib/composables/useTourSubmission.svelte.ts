/**
 * Composable for standardized tour form submission
 * Handles both create and update operations with consistent error handling
 */

import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { useQueryClient, createMutation } from '@tanstack/svelte-query';
import { trackTourEvent } from '$lib/utils/umami-tracking.js';
import { queryKeys } from '$lib/queries/shared-stats.js';

interface SubmissionOptions {
	isEdit: boolean;
	tourId?: string;
	onSuccess?: (tourId: string) => void;
	onError?: (error: string) => void;
}

export function useTourSubmission(options: SubmissionOptions) {
	const { isEdit, tourId } = options;
	let isSubmitting = $state(false);

	const queryClient = useQueryClient();

	// Create mutation directly in the composable for proper Svelte context
	const mutation = createMutation({
		mutationFn: async (formData: FormData) => {
			const url = isEdit ? `/tours/${tourId}/edit` : '/tours/new';
			const response = await fetch(url, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to save tour' }));
				throw new Error(error.error || error.message || 'Failed to save tour');
			}

			// Handle redirect response
			if (response.redirected) {
				const redirectUrl = new URL(response.url);
				const extractedTourId = redirectUrl.pathname.split('/').pop()?.split('?')[0];
				return { success: true, redirected: true, tourId: extractedTourId, url: response.url };
			}

			const data = await response.json();
			return data;
		},
		onSuccess: async (data) => {
			console.log(isEdit ? '✅ Tour updated successfully:' : '✅ Tour created successfully:', data);

			// Force remove and refetch for immediate sync
			queryClient.removeQueries({ queryKey: queryKeys.userTours });
			queryClient.removeQueries({ queryKey: queryKeys.toursStats });

			// Refetch immediately
			await queryClient.refetchQueries({
				queryKey: queryKeys.userTours,
				type: 'active'
			});
			await queryClient.refetchQueries({
				queryKey: queryKeys.toursStats,
				type: 'active'
			});

			// Invalidate tour details if editing
			if (isEdit && tourId) {
				await queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) });
			}

			// Invalidate usage query to update tour count display
			queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });

			console.log('✅ Cache synced with server');
		}
	});

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

			// Submit using mutation
			const result = await $mutation.mutateAsync(formDataToSubmit);

			console.log('✅ Tour submitted successfully:', result);

			// Track event
			if (isEdit && tourId) {
				trackTourEvent('update', tourId, {
					status: formData.status,
					pricing_model: formData.pricingModel
				});
			} else {
				trackTourEvent('create', result.tourId || result.id, {
					status: formData.status,
					has_schedule: !!scheduleData,
					pricing_model: formData.pricingModel
				});
			}

			// Mark recent tour activity for cache invalidation
			if (browser) {
				sessionStorage.setItem('recentTourActivity', Date.now().toString());
			}

			// Invalidate queries
			console.log('🔄 Invalidating caches...');
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });

			const finalTourId = isEdit ? tourId! : (result.tourId || result.id);

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

		if (result.success && result.tourId) {
			// Navigate to tour detail page
			if (isEdit) {
				goto(`/tours/${result.tourId}?edited=true`);
			} else {
				const redirectUrl = scheduleData
					? `/tours/${result.tourId}?created=true&scheduled=true`
					: `/tours/${result.tourId}?created=true`;
				goto(redirectUrl);
			}
		}
	}

	return {
		get isSubmitting() { return isSubmitting },
		submit,
		submitAndNavigate
	};
}
