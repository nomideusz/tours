<script lang="ts">
	import Users from 'lucide-svelte/icons/users';
	import CurrencyInput from './CurrencyInput.svelte';
	
	interface Props {
		flatPrice: number;
		minCapacity: number;
		maxCapacity: number;
		currencySymbol: string;
		onUpdate: (flatPrice: number) => void;
		onCapacityUpdate?: (min: number, max: number) => void;
	}
	
	let {
		flatPrice = $bindable(0),
		minCapacity = $bindable(1),
		maxCapacity = $bindable(20),
		currencySymbol,
		onUpdate,
		onCapacityUpdate
	}: Props = $props();
	
	function handlePriceChange() {
		onUpdate(flatPrice);
	}
	
	function handleCapacityChange() {
		if (onCapacityUpdate) {
			onCapacityUpdate(minCapacity, maxCapacity);
		}
	}
</script>

<div class="private-tour-section">
	<!-- Info Header -->
	<div class="info-header">
		<Users class="header-icon" />
		<div class="header-text">
			<h3 class="section-title">Private Tour Configuration</h3>
			<p class="section-desc">Each booking reserves the entire time slot exclusively</p>
		</div>
	</div>
	
	<!-- Configuration Card -->
	<div class="config-card">
		<div class="private-tour-content">
				<!-- Pricing -->
				<div class="pricing-row">
					<div class="price-label">
						<span class="label-text">Flat rate per tour</span>
						<span class="label-hint">Same price regardless of group size</span>
					</div>
					<div class="price-input-wrapper">
						<CurrencyInput
							bind:value={flatPrice}
							{currencySymbol}
							step={5}
							placeholder="0.00"
							class="flat-price-input"
							ariaLabel="Private tour price"
							onInput={handlePriceChange}
						/>
					</div>
				</div>
				
				<!-- Capacity -->
				<div class="capacity-row">
					<div class="capacity-label">
						<span class="label-text">Group size</span>
					</div>
					<div class="capacity-controls">
						<input
							type="number"
							min="1"
							max={maxCapacity}
							bind:value={minCapacity}
							oninput={() => {
								if (minCapacity > maxCapacity) {
									maxCapacity = minCapacity;
								}
								handleCapacityChange();
							}}
							class="capacity-input"
						/>
						<span class="capacity-separator">to</span>
						<input
							type="number"
							min={minCapacity}
							max="200"
							bind:value={maxCapacity}
							oninput={() => {
								if (maxCapacity < minCapacity) {
									minCapacity = maxCapacity;
								}
								handleCapacityChange();
							}}
							class="capacity-input"
						/>
						<span class="capacity-label-text">people</span>
					</div>
				</div>
				
				<!-- Price per person indicator -->
				{#if flatPrice > 0 && maxCapacity > 0}
					<div class="price-breakdown">
						<span class="breakdown-label">Price per person:</span>
						<div class="breakdown-values">
							<span class="breakdown-item">
								Min ({maxCapacity} people): {currencySymbol}{(flatPrice / maxCapacity).toFixed(2)}
							</span>
							<span class="breakdown-divider">•</span>
							<span class="breakdown-item">
								Max ({minCapacity} {minCapacity === 1 ? 'person' : 'people'}): {currencySymbol}{(flatPrice / minCapacity).toFixed(2)}
							</span>
						</div>
					</div>
				{/if}
			</div>
	</div>
</div>

<style>
	.private-tour-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	/* Info Header */
	.info-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.75rem;
	}
	
	:global(.header-icon) {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-primary-600);
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	
	.header-text {
		flex: 1;
	}
	
	.section-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.section-desc {
		margin: 0.25rem 0 0 0;
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}
	
	/* Configuration Card */
	.config-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.config-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	/* Content */
	.private-tour-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.pricing-row,
	.capacity-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
	}
	
	.price-label,
	.capacity-label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}
	
	.label-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.label-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.price-input-wrapper {
		width: 8rem;
		flex-shrink: 0;
	}
	
	:global(.flat-price-input) {
		width: 100%;
		font-size: 1.25rem;
		font-weight: 600;
		text-align: right;
		padding: 0.5rem 0.75rem;
	}
	
	.capacity-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	
	.capacity-input {
		width: 3.5rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.capacity-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.capacity-separator {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	.capacity-label-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.price-breakdown {
		padding: 0.75rem;
		background: var(--bg-tertiary);
		border-radius: 0.5rem;
		font-size: 0.8125rem;
	}
	
	.breakdown-label {
		display: block;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 0.375rem;
	}
	
	.breakdown-values {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		color: var(--text-primary);
	}
	
	.breakdown-item {
		font-family: monospace;
	}
	
	.breakdown-divider {
		color: var(--text-tertiary);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.pricing-row,
		.capacity-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		
		.price-input-wrapper {
			width: 100%;
		}
		
		.capacity-controls {
			width: 100%;
			justify-content: center;
		}
		
		.breakdown-values {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
		
		.breakdown-divider {
			display: none;
		}
	}
</style>
