<script lang="ts">
	import Crown from 'lucide-svelte/icons/crown';
	import Users from 'lucide-svelte/icons/users';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Info from 'lucide-svelte/icons/info';
	
	interface Props {
		flatPrice: number;
		minCapacity: number;
		maxCapacity: number;
		currencySymbol: string;
		selected: boolean;
		onSelect: () => void;
	}
	
	let { 
		flatPrice,
		minCapacity,
		maxCapacity,
		currencySymbol,
		selected = $bindable(false),
		onSelect
	}: Props = $props();
	
	// Calculate per-person estimate (using average of min/max)
	let avgPricePerPerson = $derived(() => {
		const avgCapacity = (minCapacity + maxCapacity) / 2;
		return flatPrice / avgCapacity;
	});
	
	function handleClick() {
		selected = true;
		onSelect();
	}
</script>

<div class="private-tour-section">
	<button
		type="button"
		class="private-tour-card"
		class:selected
		onclick={handleClick}
	>
		<div class="card-header">
			<div class="flex items-center gap-2">
				<div class="icon-badge" class:selected>
					{#if selected}
						<CheckCircle class="w-5 h-5" />
					{:else}
						<Crown class="w-5 h-5" />
					{/if}
				</div>
				<div>
					<div class="tour-type">Private Tour</div>
					<div class="tour-subtitle">Exclusive experience for your group</div>
				</div>
			</div>
			<div class="price-display">
				<div class="flat-price">{currencySymbol}{flatPrice.toFixed(2)}</div>
				<div class="price-note">Total for group</div>
			</div>
		</div>
		
		<div class="card-details">
			<div class="detail-item">
				<Users class="w-4 h-4" style="color: var(--text-secondary);" />
				<span>{minCapacity}-{maxCapacity} participants</span>
			</div>
			<div class="detail-item estimate">
				<span>~{currencySymbol}{avgPricePerPerson().toFixed(0)} per person</span>
			</div>
		</div>
	</button>
	
	<div class="info-box">
		<Info class="w-4 h-4 flex-shrink-0" style="color: var(--color-primary-600);" />
		<div class="text-xs" style="color: var(--text-secondary);">
			<strong>Private Tour Benefits:</strong> Personalized attention, flexible pace, 
			customize the experience to your group's interests and needs.
		</div>
	</div>
</div>

<style>
	.private-tour-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.private-tour-card {
		width: 100%;
		padding: 1.25rem;
		border-radius: 0.875rem;
		border: 2px solid var(--border-primary);
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}
	
	.private-tour-card:hover {
		border-color: var(--color-primary-500);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
	
	.private-tour-card.selected {
		border-color: var(--color-primary-600);
		background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%);
		box-shadow: 0 4px 16px rgba(79, 70, 229, 0.15);
	}
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.icon-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.625rem;
		background: var(--bg-secondary);
		color: var(--color-warning-600);
		flex-shrink: 0;
		transition: all 0.2s ease;
	}
	
	.icon-badge.selected {
		background: var(--color-primary-600);
		color: white;
	}
	
	.tour-type {
		font-weight: 700;
		font-size: 1.0625rem;
		color: var(--text-primary);
		margin-bottom: 0.125rem;
	}
	
	.tour-subtitle {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.price-display {
		text-align: right;
	}
	
	.flat-price {
		font-weight: 800;
		font-size: 1.5rem;
		color: var(--color-primary-700);
		line-height: 1;
		margin-bottom: 0.25rem;
	}
	
	.price-note {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}
	
	.card-details {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}
	
	.detail-item.estimate {
		margin-left: auto;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.info-box {
		display: flex;
		align-items: start;
		gap: 0.625rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.card-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.price-display {
			text-align: left;
			padding-top: 0.5rem;
		}
		
		.detail-item.estimate {
			margin-left: 0;
		}
	}
</style>

