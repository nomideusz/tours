<!--
Pricing Validation Messages Component
Shows warnings, errors, and suggestions for tour pricing
Helps prevent the #1 problem: underpricing by 40-60%
-->

<script lang="ts">
	import { validatePricing, type PricingValidation } from '$lib/utils/pricing-calculations.js';
	
	interface Props {
		basePrice: number;
		currency?: string;
		duration: number; // minutes
		participantCategories?: Array<{ label: string; price: number }>;
		showSuccessMessages?: boolean;
		compact?: boolean;
	}
	
	let { 
		basePrice,
		currency = 'EUR',
		duration,
		participantCategories,
		showSuccessMessages = true,
		compact = false
	}: Props = $props();
	
	// Get validation results
	let validation = $derived(() => {
		if (!basePrice || basePrice <= 0) {
			return { errors: [], warnings: [], suggestions: [] };
		}
		return validatePricing(basePrice, currency, duration, participantCategories);
	});
	
	// Check if we have any messages
	let hasMessages = $derived(
		validation().errors.length > 0 || 
		validation().warnings.length > 0 || 
		(showSuccessMessages && validation().suggestions.length > 0)
	);
</script>

{#if hasMessages}
	<div class="validation-messages {compact ? 'compact' : ''}">
		<!-- Errors -->
		{#each validation().errors as error}
			<div class="message error">
				<span class="prefix">[!]</span>
				<p>{error}</p>
			</div>
		{/each}
		
		<!-- Warnings -->
		{#each validation().warnings as warning}
			<div class="message warning">
				<span class="prefix">[?]</span>
				<p>{warning}</p>
			</div>
		{/each}
		
		<!-- Suggestions (only show if enabled) -->
		{#if showSuccessMessages}
			{#each validation().suggestions as suggestion}
				<div class="message suggestion">
					<span class="prefix">[i]</span>
					<p>{@html suggestion}</p>
				</div>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.validation-messages {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 1rem 0;
	}
	
	.validation-messages.compact {
		gap: 0.5rem;
		margin: 0.5rem 0;
	}
	
	.message {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	
	.compact .message {
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
	}
	
	.message p {
		margin: 0;
		flex: 1;
	}
	
	.prefix {
		font-family: monospace;
		font-weight: 600;
		flex-shrink: 0;
	}
	
	/* Error messages */
	.message.error {
		background: var(--bg-secondary);
		border-left: 3px solid var(--color-error-500);
		color: var(--text-primary);
	}
	
	.message.error .prefix {
		color: var(--color-error-600);
	}
	
	/* Warning messages */
	.message.warning {
		background: var(--bg-secondary);
		border-left: 3px solid var(--color-warning-500);
		color: var(--text-primary);
	}
	
	.message.warning .prefix {
		color: var(--color-warning-600);
	}
	
	/* Suggestion messages */
	.message.suggestion {
		background: var(--bg-secondary);
		border-left: 3px solid var(--border-secondary);
		color: var(--text-secondary);
	}
	
	.message.suggestion .prefix {
		color: var(--text-tertiary);
	}
	
	/* Strong text styling */
	.message :global(strong) {
		font-weight: 600;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.message {
			gap: 0.5rem;
			padding: 0.75rem;
		}
		
		.compact .message {
			padding: 0.5rem 0.625rem;
		}
	}
</style>
