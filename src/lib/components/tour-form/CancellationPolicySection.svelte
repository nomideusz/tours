<!--
================================================================================
CANCELLATION POLICY SECTION COMPONENT
================================================================================

Handles cancellation policy selection and configuration:
- Predefined policy templates (Very Flexible, Flexible, Moderate, Strict, Non-Refundable)
- Custom policy with configurable refund window
- Collapsible section
- Form submission inputs

Extracted from TourForm.svelte to improve maintainability.
================================================================================
-->

<script lang="ts">
	import { getCancellationPolicyText } from '$lib/utils/cancellation-policies.js';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Edit from 'lucide-svelte/icons/edit';

	interface Props {
		formData: {
			cancellationPolicy: string;
			cancellationPolicyId?: string;
		};
	}

	let { formData = $bindable() }: Props = $props();

	// Collapsible section state
	let showCancellationPolicy = $state(false);

	// Policy selection state
	let selectedPolicyTemplate = $state('flexible'); // Default to flexible
	let showCustomPolicy = $state(false);
	let customPolicyHours = $state(24); // Default 24 hours for custom policy
	let customPolicyNotes = $state('');

	// Convert structured policies to template format for the UI
	const policyTemplates = [
		{
			id: 'veryFlexible',
			name: 'Very Flexible',
			description: '100% refund up to 2 hours before',
			policy: getCancellationPolicyText('veryFlexible'),
			color: 'success',
			recommended: false
		},
		{
			id: 'flexible',
			name: 'Flexible ⭐',
			description: '100% refund up to 24 hours before',
			policy: getCancellationPolicyText('flexible'),
			color: 'success',
			recommended: true
		},
		{
			id: 'moderate',
			name: 'Moderate',
			description: '100% refund up to 48 hours before',
			policy: getCancellationPolicyText('moderate'),
			color: 'warning',
			recommended: false
		},
		{
			id: 'strict',
			name: 'Strict',
			description: '100% refund up to 7 days before',
			policy: getCancellationPolicyText('strict'),
			color: 'warning',
			recommended: false
		},
		{
			id: 'nonRefundable',
			name: 'Non-Refundable',
			description: 'No refunds • Immediate payout',
			policy: getCancellationPolicyText('nonRefundable'),
			color: 'error',
			recommended: false
		}
	];

	/**
	 * Select a predefined policy template
	 */
	function selectPolicyTemplate(templateId: string) {
		const template = policyTemplates.find(t => t.id === templateId);
		if (template) {
			selectedPolicyTemplate = templateId;
			// Store both the ID (for structured queries) and text (for backward compatibility)
			formData.cancellationPolicyId = templateId;
			formData.cancellationPolicy = template.policy;
			showCustomPolicy = false;
		}
	}

	/**
	 * Enable custom policy mode
	 */
	function enableCustomPolicy() {
		selectedPolicyTemplate = '';
		showCustomPolicy = true;

		// Set cancellationPolicyId to the hours value (e.g., "custom_24" for 24 hours)
		updateCustomPolicyId();
	}

	/**
	 * Validate and constrain custom policy hours
	 */
	function validateCustomHours(hours: number): number {
		// Constrain to reasonable bounds
		if (hours < 1) return 1;
		if (hours > 168) return 168; // Max 7 days (1 week)
		return Math.floor(hours); // Ensure integer
	}

	/**
	 * Update policy ID and text when custom hours change
	 */
	function updateCustomPolicyId() {
		// Validate hours before using
		customPolicyHours = validateCustomHours(customPolicyHours);

		formData.cancellationPolicyId = `custom_${customPolicyHours}`;

		// Generate policy text from the hours value (binary: full refund or no refund)
		let policyText = `• Full refund if cancelled ${customPolicyHours}+ hours before tour\n` +
			`• No refund if cancelled less than ${customPolicyHours} hours before tour`;

		// Add custom notes if provided
		if (customPolicyNotes.trim()) {
			policyText += `\n\nAdditional Information:\n${customPolicyNotes.trim()}`;
		}

		formData.cancellationPolicy = policyText;
	}

	// Watch for changes to custom hours or notes
	$effect(() => {
		if (showCustomPolicy && customPolicyHours) {
			updateCustomPolicyId();
		}
	});

	$effect(() => {
		if (showCustomPolicy) {
			updateCustomPolicyId();
		}
	});

	// Initialize policy template selection based on existing policy
	// Watch cancellationPolicyId to update when tour data loads
	$effect(() => {
		// Check if it's a custom policy (format: "custom_24")
		if (formData.cancellationPolicyId?.startsWith('custom_')) {
			const hours = parseInt(formData.cancellationPolicyId.split('_')[1]);
			if (!isNaN(hours) && hours > 0) {
				selectedPolicyTemplate = ''; // Clear any template selection
				showCustomPolicy = true;
				customPolicyHours = hours;

				// Extract custom notes if they exist in the policy text
				if (formData.cancellationPolicy?.includes('Additional Information:')) {
					const parts = formData.cancellationPolicy.split('Additional Information:');
					if (parts[1]) {
						customPolicyNotes = parts[1].trim();
					}
				}
				return;
			}
		}

		// If we have a predefined policyId, use that
		if (formData.cancellationPolicyId && !formData.cancellationPolicyId.startsWith('custom_')) {
			const matchingTemplate = policyTemplates.find(t => t.id === formData.cancellationPolicyId);
			if (matchingTemplate) {
				selectedPolicyTemplate = formData.cancellationPolicyId;
				showCustomPolicy = false;
				return;
			}
		}

		// Set default if no policy set (new tour)
		if (!formData.cancellationPolicyId && !formData.cancellationPolicy) {
			selectedPolicyTemplate = 'flexible';
			showCustomPolicy = false;
			// Initialize the form data with the default flexible policy
			selectPolicyTemplate('flexible');
		}
	});
</script>

<div class="rounded-xl form-section-card" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<button
		type="button"
		onclick={() => showCancellationPolicy = !showCancellationPolicy}
		class="flex items-center justify-between w-full px-4 py-4 sm:p-4 transition-colors hover:bg-opacity-80 {showCancellationPolicy ? 'border-b' : ''}"
		style="{showCancellationPolicy ? 'border-color: var(--border-primary);' : ''}"
	>
		<div class="flex items-center gap-2">
			{#if showCancellationPolicy}
				<ChevronDown class="w-4 h-4" />
			{:else}
				<ChevronRight class="w-4 h-4" />
			{/if}
			<h2 class="font-semibold" style="color: var(--text-primary);">Cancellation Policy</h2>
			{#if formData.cancellationPolicy?.trim() || selectedPolicyTemplate}
				<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-accent-100); color: var(--color-accent-700);">
					{selectedPolicyTemplate === 'veryFlexible' ? 'Very Flexible' :
					 selectedPolicyTemplate === 'flexible' ? 'Flexible' :
					 selectedPolicyTemplate === 'moderate' ? 'Moderate' :
					 selectedPolicyTemplate === 'strict' ? 'Strict' :
					 selectedPolicyTemplate === 'nonRefundable' ? 'Non-Refundable' :
					 'Custom'}
				</span>
			{/if}
		</div>
	</button>

	{#if showCancellationPolicy}
		<div class="px-4 py-3 sm:p-5">
			<div class="space-y-3">
				<!-- Template Options -->
				{#each policyTemplates as template}
					<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
						style="
							background: {selectedPolicyTemplate === template.id ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
							border-color: {selectedPolicyTemplate === template.id ? 'var(--color-primary-300)' : 'var(--border-primary)'};
						"
					>
						<input
							type="radio"
							name="policyTemplate"
							value={template.id}
							checked={selectedPolicyTemplate === template.id}
							onchange={() => selectPolicyTemplate(template.id)}
							class="form-radio mt-0.5"
						/>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<div class="w-2 h-2 rounded-full"
									style="background: var(--color-{template.color}-500);"
								></div>
								<div class="font-medium text-sm" style="color: var(--text-primary);">
									{template.name}
								</div>
							</div>
							<p class="text-xs" style="color: var(--text-secondary);">{template.description}</p>
						</div>
					</label>
				{/each}

				<!-- Custom Policy Option -->
				<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
					style="
						background: {showCustomPolicy ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
						border-color: {showCustomPolicy ? 'var(--color-primary-300)' : 'var(--border-primary)'};
					"
				>
					<input
						type="radio"
						name="policyTemplate"
						checked={showCustomPolicy}
						onchange={enableCustomPolicy}
						class="form-radio mt-0.5"
					/>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<Edit class="w-3 h-3" style="color: var(--text-secondary);" />
							<div class="font-medium text-sm" style="color: var(--text-primary);">
								Custom Policy
							</div>
						</div>
						<p class="text-xs" style="color: var(--text-secondary);">Write your own cancellation terms</p>
					</div>
				</label>
			</div>

			{#if showCustomPolicy}
				<div class="mt-4 space-y-4">
					<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<h4 class="text-sm font-semibold mb-3" style="color: var(--text-primary);">Custom Refund Rules</h4>

						<div class="space-y-3">
							<!-- Full Refund Window -->
							<div>
								<label for="customPolicyHours" class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
									Full Refund Window (100%)
								</label>
								<div class="flex items-center gap-2">
									<input
										id="customPolicyHours"
										type="number"
										bind:value={customPolicyHours}
										min="1"
										max="168"
										step="1"
										class="form-input"
										style="max-width: 100px;"
										onfocus={(e) => e.currentTarget.select()}
										onblur={() => { customPolicyHours = validateCustomHours(customPolicyHours); }}
									/>
									<span class="text-sm" style="color: var(--text-secondary);">hours before tour</span>
								</div>
								<p class="text-xs mt-1" style="color: var(--text-tertiary);">
									Range: 1-168 hours (1 hour to 7 days)
								</p>
								<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">
									Common: 2h, 12h, 24h, 48h, 72h, 168h
								</p>
							</div>

							<!-- Preview -->
							<div class="p-3 rounded-lg" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
								<p class="text-xs font-medium mb-1" style="color: var(--color-primary-900);">Your Policy:</p>
								<p class="text-xs" style="color: var(--color-primary-800);">
									• Full refund if cancelled {customPolicyHours}+ hours before tour<br/>
									• No refund if cancelled less than {customPolicyHours} hours before
								</p>
							</div>

							<!-- Optional custom notes -->
							<div>
								<label for="customPolicyNotes" class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
									Additional Notes (Optional)
								</label>
								<textarea
									id="customPolicyNotes"
									bind:value={customPolicyNotes}
									rows="2"
									placeholder="e.g., 'Contact us for special circumstances' or 'Emergency cancellations always considered'"
									class="form-textarea text-sm"
								></textarea>
								<p class="text-xs mt-1" style="color: var(--text-tertiary);">
									Extra information for customers - doesn't affect automatic refund calculations
								</p>
							</div>
						</div>
					</div>

					<div class="p-3 rounded-lg" style="background: var(--color-info-50); border: 1px solid var(--color-info-200);">
						<p class="text-xs" style="color: var(--color-info-800);">
							<strong>💸 Payment Schedule:</strong> Funds will be held on the platform for <strong>{customPolicyHours + 1} hours</strong> after booking, then automatically transferred to your account {customPolicyHours + 1} hours before the tour starts.
						</p>
					</div>
					<div class="p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
						<p class="text-xs" style="color: var(--color-warning-800);">
							<strong>⚠️ Remember:</strong> More flexible policies = happier customers and higher bookings, but funds are held longer to ensure refunds are always available.
						</p>
					</div>
				</div>
			{/if}

			<!-- Hidden inputs for form submission -->
			<input type="hidden" name="cancellationPolicy" bind:value={formData.cancellationPolicy} />
			<input type="hidden" name="cancellationPolicyId" bind:value={formData.cancellationPolicyId} />
		</div>
	{/if}
</div>

<style>
	.form-section-card {
		transition: all 0.2s ease-in-out;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
	}

	.form-section-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}
</style>
