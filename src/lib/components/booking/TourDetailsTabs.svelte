<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import Info from 'lucide-svelte/icons/info';
	import Shield from 'lucide-svelte/icons/shield';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	
	interface Props {
		tour: Tour;
	}
	
	let { tour }: Props = $props();
	let activeTab = $state('details');
</script>

<div class="mb-8">
	<!-- Description -->
	{#if tour.description}
		<div class="mb-8">
			<h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">About This Tour</h2>
			<div class="space-y-2" style="color: var(--text-secondary);">
				{#each tour.description.split('\n').filter((line: string) => line.trim()) as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Tabs -->
	<div class="tab-nav">
		<button 
			class="tab-button" 
			class:active={activeTab === 'details'}
			onclick={() => activeTab = 'details'}
		>
			Details
		</button>
		<button 
			class="tab-button" 
			class:active={activeTab === 'policies'}
			onclick={() => activeTab = 'policies'}
		>
			Policies
		</button>
	</div>
	
	<!-- Tab Content -->
	<div class="mt-6">
		{#if activeTab === 'details'}
			<!-- Compact Tour Info -->
			<div class="flex flex-wrap gap-4 mb-6 text-sm">
				<div class="flex items-center gap-2">
					<Clock class="w-4 h-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-secondary);">
						{tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : 'Duration TBD'}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Users class="w-4 h-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-secondary);">
						{#if tour.pricingModel === 'private_tour'}
							{tour.privateTour?.minCapacity || tour.minCapacity || 4}-{tour.privateTour?.maxCapacity || tour.maxCapacity || 12} people
						{:else}
							Up to {tour.maxCapacity || tour.capacity || 20} people
						{/if}
					</span>
				</div>
			</div>
			
			<div class="grid gap-6 sm:grid-cols-2">
				<!-- What's Included -->
				{#if tour.includedItems && tour.includedItems.length > 0}
					<div>
						<h3 class="font-medium mb-3 flex items-center gap-2" style="color: var(--text-primary);">
							<Check class="w-5 h-5" style="color: var(--color-success-600);" />
							Included
						</h3>
						<ul class="space-y-2">
							{#each tour.includedItems as item}
								<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
									<Check class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--color-success-600);" />
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				<!-- Requirements -->
				{#if tour.requirements && tour.requirements.length > 0}
					<div>
						<h3 class="font-medium mb-3 flex items-center gap-2" style="color: var(--text-primary);">
							<Info class="w-5 h-5" style="color: var(--text-tertiary);" />
							Requirements
						</h3>
						<ul class="space-y-2">
							{#each tour.requirements as requirement}
								<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
									<X class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--color-error-600);" />
									<span>{requirement}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'policies'}
			<div class="grid gap-6 sm:grid-cols-2">
				<!-- Cancellation Policy -->
				<div>
					<h3 class="font-medium mb-3 flex items-center gap-2" style="color: var(--text-primary);">
						<Shield class="w-5 h-5" style="color: var(--text-tertiary);" />
						Cancellation Policy
					</h3>
					{#if tour.cancellationPolicy}
						<div class="text-sm space-y-1" style="color: var(--text-secondary);">
							{#each tour.cancellationPolicy.split('\n') as line}
								{#if line.trim()}
									<p>{line}</p>
								{/if}
							{/each}
						</div>
					{:else}
						<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
							<li>• Free cancellation up to 24 hours before</li>
							<li>• 50% refund within 24 hours</li>
							<li>• No refund for no-shows</li>
						</ul>
					{/if}
				</div>
				
				<!-- Important Information -->
				<div>
					<h3 class="font-medium mb-3 flex items-center gap-2" style="color: var(--text-primary);">
						<Info class="w-5 h-5" style="color: var(--text-tertiary);" />
						Before You Go
					</h3>
					<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
						<li>• Meet at: {tour.location || 'Location provided after booking'}</li>
						<li>• Arrive 10-15 minutes early</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Tab navigation */
	.tab-nav {
		display: flex;
		gap: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
		margin-bottom: 1.5rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}
	
	.tab-nav::-webkit-scrollbar {
		display: none;
	}
	
	.tab-button {
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	
	.tab-button:hover {
		color: var(--text-primary);
	}
	
	.tab-button.active {
		color: var(--color-primary-600);
		border-bottom-color: var(--color-primary-600);
	}
</style>

