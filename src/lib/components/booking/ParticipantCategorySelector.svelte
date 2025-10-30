<script lang="ts">
	import { getCategoryDisplayLabel } from '$lib/utils/category-age-ranges.js';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import Info from 'lucide-svelte/icons/info';
	
	interface ParticipantCategory {
		id: string;
		label: string;
		price: number;
		ageRange?: string;
		description?: string;
		sortOrder: number;
		minAge?: number;
		maxAge?: number;
		countsTowardCapacity?: boolean;
	}
	
	interface Props {
		categories: ParticipantCategory[];
		participantCounts: Record<string, number>;
		availableSpots: number;
		currencySymbol: string;
		onCountsChange: (counts: Record<string, number>) => void;
	}
	
	let { 
		categories,
		participantCounts = $bindable({}),
		availableSpots,
		currencySymbol,
		onCountsChange
	}: Props = $props();
	
	// Sort categories by sort order (lowest first)
	let sortedCategories = $derived(
		[...categories].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
	);
	
	// Calculate total participants (only counting those that count toward capacity)
	let totalParticipants = $derived.by(() => {
		return Object.entries(participantCounts).reduce((sum, [catId, count]) => {
			const category = categories.find(c => c.id === catId);
			if (category && category.countsTowardCapacity !== false) {
				return sum + count;
			}
			return sum;
		}, 0);
	});
	
	// Check if can add more participants
	function canAddMore(categoryId: string): boolean {
		const category = categories.find(c => c.id === categoryId);
		if (!category) return false;
		
		// If this category doesn't count toward capacity, can always add
		if (category.countsTowardCapacity === false) return true;
		
		// Otherwise check against available spots
		return totalParticipants < availableSpots;
	}
	
	// Update participant count
	function updateCount(categoryId: string, delta: number) {
		const current = participantCounts[categoryId] || 0;
		const newCount = Math.max(0, current + delta);
		
		// Check capacity constraint
		if (delta > 0 && !canAddMore(categoryId)) {
			return;
		}
		
		participantCounts = {
			...participantCounts,
			[categoryId]: newCount
		};
		
		onCountsChange(participantCounts);
	}
	
	// Format age range display
	function formatAgeRange(category: ParticipantCategory): string {
		if (category.ageRange) return category.ageRange;
		if (category.minAge !== undefined && category.maxAge !== undefined) {
			return `${category.minAge}-${category.maxAge} years`;
		}
		if (category.minAge !== undefined) {
			return `${category.minAge}+ years`;
		}
		if (category.maxAge !== undefined) {
			return `0-${category.maxAge} years`;
		}
		return '';
	}
	
	// Check if at least one participant is selected
	let hasParticipants = $derived(totalParticipants > 0);
</script>

<div class="participant-selector">
	<div class="selector-header">
		<span class="spots-indicator" class:warning={totalParticipants >= availableSpots * 0.8}>
			{totalParticipants} / {availableSpots} spots
		</span>
	</div>
	
	<div class="categories-list">
		{#each sortedCategories as category}
			{@const count = participantCounts[category.id] || 0}
			{@const countsTowardCap = category.countsTowardCapacity !== false}
			{@const intelligentLabel = getCategoryDisplayLabel(category, categories)}
			
			<div class="category-card" class:selected={count > 0}>
				<div class="category-header">
					<div class="category-name">
						{intelligentLabel}
						{#if !countsTowardCap}
							<span class="free-badge">Free</span>
						{/if}
					</div>
					<div class="category-right">
						<div class="category-price">
							{#if countsTowardCap}
								{currencySymbol}{category.price.toFixed(2)}
							{:else}
								<span class="text-sm" style="color: var(--text-tertiary);">Free</span>
							{/if}
						</div>
						<div class="counter-controls">
							<button
								type="button"
								class="counter-btn"
								onclick={() => updateCount(category.id, -1)}
								disabled={count === 0}
								aria-label="Decrease {intelligentLabel} count"
							>
								<Minus class="w-4 h-4" />
							</button>
							
							<div class="counter-value">
								{count}
							</div>
							
							<button
								type="button"
								class="counter-btn"
								onclick={() => updateCount(category.id, 1)}
								disabled={!canAddMore(category.id) && countsTowardCap}
								aria-label="Increase {intelligentLabel} count"
							>
								<Plus class="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
				
				{#if category.description}
					<div class="category-details">
						<span class="description">{category.description}</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
	
	{#if !hasParticipants}
		<div class="alert-info">
			<Info class="w-4 h-4 flex-shrink-0" />
			<p>Please select at least one participant to continue</p>
		</div>
	{/if}
	
	<!-- Hidden input for form submission -->
	<input type="hidden" name="participantsByCategory" value={JSON.stringify(participantCounts)} />
	<input type="hidden" name="totalParticipants" value={totalParticipants} />
</div>

<style>
	.participant-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.selector-header {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}
	
	.spots-indicator {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
	}
	
	.spots-indicator.warning {
		color: var(--color-warning-700);
		background: var(--color-warning-50);
		border-color: var(--color-warning-300);
	}
	
	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.category-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 2px solid var(--border-primary);
		background: var(--bg-primary);
		transition: all 0.2s ease;
	}
	
	.category-card:hover {
		border-color: var(--border-secondary);
		background: var(--bg-secondary);
	}
	
	.category-card.selected {
		border-color: var(--color-accent-600);
		background: var(--color-accent-50);
	}
	
	.category-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	
	.category-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	
	.category-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	
	.free-badge {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: var(--color-success-100);
		color: var(--color-success-700);
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}
	
	.category-price {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
		white-space: nowrap;
	}
	
	.category-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.description {
		font-style: italic;
	}
	
	.counter-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	
	.counter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-secondary);
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.counter-btn:hover:not(:disabled) {
		background: var(--color-accent-100);
		border-color: var(--color-accent-500);
		color: var(--color-accent-700);
		transform: scale(1.05);
	}
	
	.counter-btn:active:not(:disabled) {
		transform: scale(0.95);
	}
	
	.counter-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	.counter-value {
		min-width: 2rem;
		text-align: center;
		font-weight: 700;
		font-size: 1.125rem;
		color: var(--text-primary);
	}
	
	.info-box {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-info-50);
		border: 1px solid var(--color-info-200);
	}
	
	.info-box.warning {
		background: var(--color-warning-50);
		border-color: var(--color-warning-200);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.category-header {
			flex-wrap: wrap;
		}
		
		.category-name {
			flex-basis: 100%;
		}
		
		.category-right {
			width: 100%;
			justify-content: space-between;
		}
	}

	/* Extra small mobile (<450px) - more compact layout */
	@media (max-width: 450px) {
		.category-card {
			padding: 0.75rem;
			margin-bottom: 0.5rem;
		}

		.category-header {
			gap: 0.5rem;
		}

		.category-name {
			font-size: 0.875rem;
		}

		.category-right {
			gap: 0.5rem;
		}

		.category-price {
			font-size: 0.875rem;
		}

		.free-badge {
			font-size: 0.5625rem;
			padding: 0.0625rem 0.25rem;
		}

		.category-details {
			font-size: 0.6875rem;
		}

		.counter-btn {
			width: 1.75rem;
			height: 1.75rem;
		}

		.counter-value {
			font-size: 1rem;
			min-width: 1.5rem;
		}

		.counter-controls {
			gap: 0.5rem;
		}

		.info-box {
			padding: 0.5rem;
			font-size: 0.75rem;
			gap: 0.5rem;
		}
	}
</style>

