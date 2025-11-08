/**
 * Composable for tour form validation
 * Handles client-side validation with error tracking
 */

import type { ValidationError, TourFormData } from '$lib/validation.js';
import { validateTourForm } from '$lib/validation.js';
import { browser } from '$app/environment';

export function useTourValidation() {
	let validationErrors = $state<ValidationError[]>([]);
	let error = $state<string | null>(null);
	let triggerValidation = $state(false);
	let errorElement = $state<HTMLElement>();

	/**
	 * Validate tour form data
	 */
	function validate(formData: Partial<TourFormData>): { isValid: boolean; errors: ValidationError[] } {
		const validation = validateTourForm(formData);

		// Only update errors if validation failed
		if (!validation.isValid && validation.errors.length > 0) {
			validationErrors = validation.errors;
			error = validation.errors[0].message;
		} else {
			// Clear errors on successful validation
			validationErrors = [];
			error = null;
		}

		return validation;
	}

	/**
	 * Clear all validation errors
	 */
	function clearErrors() {
		validationErrors = [];
		error = null;
		triggerValidation = false;
	}

	/**
	 * Set a general error message
	 */
	function setError(message: string | null) {
		error = message;
	}

	/**
	 * Scroll to the first error element
	 */
	function scrollToFirstError() {
		if (!browser) return;

		// First check for specific field errors based on current error message
		if (error?.includes('name')) {
			const nameInput = document.querySelector('input[name="name"], #name') as HTMLElement;
			if (nameInput) {
				nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => nameInput.focus(), 300);
				return;
			}
		}

		if (error?.includes('description')) {
			const descInput = document.querySelector('textarea[name="description"], #description') as HTMLElement;
			if (descInput) {
				descInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => descInput.focus(), 300);
				return;
			}
		}

		if (error?.includes('price') || error?.includes('Price')) {
			const priceInput = document.querySelector('input[name="price"], #price') as HTMLElement;
			if (priceInput) {
				priceInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => priceInput.focus(), 300);
				return;
			}
		}

		// Fallback: try to find any visible error message
		const errorEl = document.querySelector('.error-message, [data-error="true"]');
		if (errorEl) {
			errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

			// Try to focus the associated input
			const input = errorEl.closest('.form-group')?.querySelector('input, textarea, select') as HTMLElement;
			if (input) {
				setTimeout(() => input.focus(), 300);
			}
			return;
		}

		// If no error element found, scroll to the general error banner or errorElement
		if (errorElement) {
			errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
		} else {
			const errorBanner = document.querySelector('[style*="--color-danger"]');
			if (errorBanner) {
				errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	}

	/**
	 * Effect to scroll to error when error appears
	 */
	$effect(() => {
		if (error && errorElement && browser) {
			// Small delay to ensure the error element is rendered
			setTimeout(() => {
				errorElement?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}, 100);
		}
	});

	return {
		// State
		get validationErrors() { return validationErrors },
		set validationErrors(value: ValidationError[]) { validationErrors = value },
		get error() { return error },
		set error(value: string | null) { error = value },
		get triggerValidation() { return triggerValidation },
		set triggerValidation(value: boolean) { triggerValidation = value },
		get errorElement() { return errorElement },
		set errorElement(value: HTMLElement | undefined) { errorElement = value },

		// Methods
		validate,
		clearErrors,
		setError,
		scrollToFirstError
	};
}
