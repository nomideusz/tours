<script lang="ts">
	import type { PricingModel } from '$lib/types.js';
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	
	interface Props {
		selectedModel: PricingModel;
		onModelChange: (model: PricingModel) => void;
	}
	
	let { selectedModel = $bindable('participant_categories'), onModelChange }: Props = $props();
	
	// Ensure selectedModel has a default value
	$effect(() => {
		if (!selectedModel) {
			selectedModel = 'participant_categories';
		}
	});
</script>

<div class="pricing-model-selector">
	<div class="model-options">
		<label class="model-option {selectedModel === 'participant_categories' ? 'selected' : ''}">
			<input
				type="radio"
				name="pricingModel"
				value="participant_categories"
				checked={selectedModel === 'participant_categories'}
				onchange={() => {
					selectedModel = 'participant_categories';
					onModelChange('participant_categories');
				}}
			/>
			<div class="option-content"><User class="option-icon" /><span class="option-title">Per Person</span></div>
		</label>

		<label class="model-option {selectedModel === 'private_tour' ? 'selected' : ''}">
			<input
				type="radio"
				name="pricingModel"
				value="private_tour"
				checked={selectedModel === 'private_tour'}
				onchange={() => {
					selectedModel = 'private_tour';
					onModelChange('private_tour');
				}}
			/>
			<div class="option-content"><Lock class="option-icon" /><span class="option-title">Private Tour</span></div>
		</label>
	</div>
</div>

<style>
	.pricing-model-selector {
		margin-bottom: 1.5rem;
	}

	.model-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.model-option {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1.125rem 1.25rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-secondary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 100%;
	}

	.model-option:hover {
		border-color: var(--color-accent-400);
		background: var(--bg-primary);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
	}

	.model-option.selected {
		border-color: var(--color-accent-500);
		background: var(--bg-primary);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.model-option input[type='radio'] {
		margin-top: 0;
		flex-shrink: 0;
	}

	.option-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: nowrap;
	}
	
	:global(.option-icon) {
		width: 1.375rem;
		height: 1.375rem;
		color: var(--text-secondary);
		flex-shrink: 0;
		display: inline-block;
		vertical-align: middle;
	}

	.model-option.selected :global(.option-icon) {
		color: var(--color-accent-600);
	}

	.option-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		display: inline-block;
		vertical-align: middle;
	}

	/* Mobile: Stack vertically */
	@media (max-width: 768px) {
		.model-options {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		
		.model-option {
			padding: 1rem;
		}
		
		.option-title {
			font-size: 0.9375rem;
		}
	}
</style>
