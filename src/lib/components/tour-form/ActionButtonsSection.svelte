<!--
================================================================================
ACTION BUTTONS SECTION COMPONENT
================================================================================

Handles form action buttons:
- Dual mode: Publish/Save as Draft buttons (when onPublish and onSaveAsDraft provided)
- Single mode: Single submit button (fallback for old usage)
- Cancel button
- Onboarding restriction notice
- Button state management (disabled, loading)

Extracted from TourForm.svelte to improve maintainability.
================================================================================
-->

<script lang="ts">
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Save from 'lucide-svelte/icons/save';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import FileText from 'lucide-svelte/icons/file-text';

	interface Props {
		// Form state
		isSubmitting: boolean;
		isEdit: boolean;
		formStatus: 'active' | 'draft';
		initialStatus: 'active' | 'draft';
		submitButtonText?: string;

		// Validation state
		canActivate: boolean;
		missingSteps: string[];
		onboardingMessage: string;
		hasErrors: boolean;
		hasMinimumRequiredFields: boolean;

		// Callbacks
		onPublish?: () => void;
		onSaveAsDraft?: () => void;
		onSubmit?: () => void;
		onCancel: () => void;
		handleSubmit?: () => void;
	}

	let {
		isSubmitting,
		isEdit,
		formStatus,
		initialStatus,
		submitButtonText = '',
		canActivate,
		missingSteps,
		onboardingMessage,
		hasErrors,
		hasMinimumRequiredFields,
		onPublish,
		onSaveAsDraft,
		onSubmit,
		onCancel,
		handleSubmit
	}: Props = $props();
</script>

<div class="rounded-xl action-buttons-section" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="px-4 py-4 sm:p-4">
		<div class="space-y-3">
			{#if onPublish && onSaveAsDraft}
				<!-- Dual Action Buttons for Draft/Publish -->

				<!-- Onboarding Restriction Notice -->
				{#if !canActivate && missingSteps.length > 0}
					<div class="mb-2 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
						<div class="flex items-start gap-2">
							<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
							<div class="flex-1">
								<p class="text-xs font-medium" style="color: var(--color-warning-700);">
									Complete setup to activate
								</p>
								<p class="text-xs mt-1" style="color: var(--color-warning-600);">
									{onboardingMessage}
								</p>
							</div>
						</div>
					</div>
				{/if}

				<button
					type="button"
					onclick={onPublish}
					disabled={isSubmitting || !canActivate || hasErrors || !hasMinimumRequiredFields}
					class="button-primary button--full-width button-gap"
					title={!canActivate ? 'Complete required setup steps to activate' : hasErrors ? 'Fix validation errors to activate' : !hasMinimumRequiredFields ? 'Fill in all required fields' : ''}
				>
					{#if isSubmitting && formStatus === 'active'}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						Saving...
					{:else}
						{#if isEdit && initialStatus === 'active'}
							<Save class="w-4 h-4" />
							Save Changes
						{:else}
							<CheckCircle class="w-4 h-4" />
							{isEdit ? 'Save & Activate' : 'Activate Tour'}
						{/if}
					{/if}
				</button>

				<button
					type="button"
					onclick={onSaveAsDraft}
					disabled={isSubmitting || hasErrors || !hasMinimumRequiredFields}
					class="button-secondary button--full-width button-gap"
					title={hasErrors ? 'Fix validation errors to save' : !hasMinimumRequiredFields ? 'Fill in all required fields' : ''}
				>
					{#if isSubmitting && formStatus === 'draft'}
						<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
						Saving...
					{:else}
						<FileText class="w-4 h-4" />
						{isEdit ? 'Save as Draft' : 'Save as Draft'}
					{/if}
				</button>
			{:else}
				<!-- Single Action Button (fallback for old usage) -->

				<button
					type={onSubmit ? "button" : "submit"}
					onclick={onSubmit || handleSubmit}
					disabled={isSubmitting || hasErrors || !hasMinimumRequiredFields}
					class="button-primary button--full-width button-gap"
					title={hasErrors ? 'Fix validation errors to save' : !hasMinimumRequiredFields ? 'Fill in all required fields' : ''}
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						Saving...
					{:else}
						<Save class="w-4 h-4" />
						{submitButtonText || (isEdit ? 'Save Changes' : 'Save Tour')}
					{/if}
				</button>
			{/if}

			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="button-secondary button--full-width"
			>
				Cancel
			</button>
		</div>
	</div>
</div>

<style>
	/* Desktop: Remove border from action buttons section */
	@media (min-width: 640px) {
		.action-buttons-section {
			border: none !important;
			background: transparent !important;
		}
	}

	/* Mobile: Better spacing and styling */
	@media (max-width: 640px) {
		.action-buttons-section {
			border: none !important;
			box-shadow: none !important;
			background: transparent !important;
		}
	}
</style>
