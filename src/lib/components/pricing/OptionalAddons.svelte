<script lang="ts">
	import type { OptionalAddon } from '$lib/types.js';
	import { createId } from '@paralleldrive/cuid2';
	import CurrencyInput from './CurrencyInput.svelte';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';

	interface Props {
		addons: OptionalAddon[];
		currencySymbol: string;
		onUpdate: (addons: OptionalAddon[]) => void;
	}

	let { addons = $bindable([]), currencySymbol, onUpdate }: Props = $props();
	
	// Quick templates for common add-ons
	const templates = [
		{ name: 'Transport', price: 20 },
		{ name: 'Lunch', price: 15 },
		{ name: 'Photos', price: 25 },
		{ name: 'Entry Fees', price: 10 }
	];
	
	const customTemplate = { name: 'Custom', price: 0 };

	function addFromTemplate(template: { name: string; price: number }) {
		const newAddon: OptionalAddon = {
			id: createId(),
			name: template.name === 'Custom' ? '' : template.name,
			description: '',
			price: template.price,
			required: false
		};
		addons = [...addons, newAddon];
		onUpdate(addons);
	}

	function removeAddon(id: string) {
		addons = addons.filter(a => a.id !== id);
		onUpdate(addons);
	}

	function updateAddon(id: string, updates: Partial<OptionalAddon>) {
		addons = addons.map(a => a.id === id ? { ...a, ...updates } : a);
		onUpdate(addons);
	}
</script>

<div class="addons-section">
	<!-- Add-ons list -->
	{#if addons.length > 0}
		<div class="addons-list">
			{#each addons as addon (addon.id)}
				<div class="addon-card">
					<!-- Header with name and remove -->
					<div class="card-header">
						<div class="header-left">
							<ShoppingBag class="addon-icon" />
							<input
								type="text"
								bind:value={addon.name}
								oninput={() => updateAddon(addon.id, { name: addon.name })}
								placeholder="Item name (e.g., Transport, Lunch)"
								class="addon-name-input"
							/>
						</div>
						
						<button
							type="button"
							onclick={() => removeAddon(addon.id)}
							class="remove-btn"
							aria-label="Remove add-on"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
					
					<!-- Price section with required checkbox and price -->
					<div class="price-section">
						<div class="price-row">
							<label class="required-checkbox">
								<input
									type="checkbox"
									bind:checked={addon.required}
									onchange={() => updateAddon(addon.id, { required: addon.required })}
								/>
								<span class="checkbox-label">Required</span>
							</label>
							
							<div class="price-input-wrapper">
								<CurrencyInput
									bind:value={addon.price}
									{currencySymbol}
									min={0}
									max={50000}
									step={0.5}
									placeholder="0.00"
									class="addon-price-input"
									ariaLabel="Add-on price"
									onInput={() => updateAddon(addon.id, { price: addon.price })}
								/>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
	
	<!-- Quick add section -->
	<div class="quick-add-section">
		<div class="quick-add-header">
			<div class="header-with-icon">
				<ShoppingBag class="add-icon" />
				<span class="add-label">Add extra items</span>
			</div>
			<div class="quick-add-buttons-wrapper">
				<div class="quick-add-buttons">
					{#each templates as template}
						<button
							type="button"
							onclick={() => addFromTemplate(template)}
							class="quick-add-btn"
							title="Add {template.name}"
						>
							{template.name}
						</button>
					{/each}
				</div>
				<button
					type="button"
					onclick={() => addFromTemplate(customTemplate)}
					class="quick-add-btn custom-btn"
					title="Add custom item"
				>
					Custom
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.addons-section {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.addons-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	/* Animation for new items */
	.addons-list > :global(*) {
		animation: fadeSlideIn 0.3s ease-out;
	}
	
	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Addon card - matching category card style */
	.addon-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.addon-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	
	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	
	:global(.addon-icon) {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	
	.addon-name-input {
		flex: 1;
		font-size: 0.9375rem;
		font-weight: 600;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.addon-name-input:focus {
		outline: none;
		border-color: var(--color-accent-500);
		box-shadow: 0 0 0 3px var(--color-accent-100);
	}
	
	.addon-name-input::placeholder {
		color: var(--text-tertiary);
	}
	
	.remove-btn {
		padding: 0.375rem;
		color: var(--color-error-600);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}
	
	.remove-btn:hover {
		background: var(--color-error-50);
		color: var(--color-error-700);
	}
	
	/* Price section - matching category card style */
	.price-section {
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
	}
	
	.price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	
	.required-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		flex: 1;
	}
	
	.required-checkbox input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary-600);
	}
	
	.checkbox-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.price-input-wrapper {
		width: 7rem;
		flex-shrink: 0;
	}
	
	:global(.addon-price-input) {
		width: 100%;
		font-size: 1.125rem;
		font-weight: 600;
		text-align: right;
		padding: 0.375rem 0.5rem;
	}
	
	/* Quick add section - matching Additional categories design */
	.quick-add-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.quick-add-section:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.quick-add-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	
	.header-with-icon {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	:global(.add-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	
	.add-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.quick-add-buttons-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	
	.quick-add-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.quick-add-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.quick-add-btn:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.custom-btn {
		border-style: dashed;
		opacity: 0.85;
	}
	
	.custom-btn:hover {
		opacity: 1;
		border-style: solid;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.quick-add-header {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		
		.header-with-icon {
			justify-content: center;
		}
		
		.quick-add-buttons-wrapper {
			flex-direction: column;
			width: 100%;
			align-items: stretch;
			gap: 0.5rem;
		}
		
		.quick-add-buttons {
			width: 100%;
			justify-content: center;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 0.375rem;
		}
		
		.quick-add-btn {
			padding: 0.5rem 0.5rem;
			font-size: 0.75rem;
		}
		
		.custom-btn {
			width: 100%;
		}
		
		.card-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
		
		.header-left {
			flex: 1;
			justify-content: flex-start;
		}
		
		.addon-name-input {
			text-align: left;
		}
		
		.addon-name-input::placeholder {
			text-align: left;
		}
		
		.price-row {
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
		}
		
		.price-input-wrapper {
			width: 100%;
		}
		
		.required-checkbox {
			justify-content: center;
		}
	}
</style>