<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import Shield from 'lucide-svelte/icons/shield';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	
	interface Props {
		tour: Tour;
	}
	
	let { tour }: Props = $props();
	let showCancellationPolicy = $state(false);
</script>

<div class="space-y-6">
	<!-- Description -->
	{#if tour.description}
		<div>
			<h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">About This Tour</h2>
			<div class="space-y-2 text-sm" style="color: var(--text-secondary);">
				{#each tour.description.split('\n').filter((line: string) => line.trim()) as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Quick Tour Info -->
	<div class="flex flex-wrap gap-4 text-sm">
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
	
	<!-- Included & Requirements Grid -->
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
							<Info class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--color-info-600);" />
							<span>{requirement}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
	
	<!-- Cancellation Policy (Collapsible, discreet) -->
	{#if tour.cancellationPolicy}
		<div class="pt-4 border-t" style="border-color: var(--border-primary);">
			<button
				type="button"
				onclick={() => showCancellationPolicy = !showCancellationPolicy}
				class="flex items-center gap-2 text-sm hover:underline w-full"
			>
				<Shield class="w-4 h-4" style="color: var(--text-tertiary);" />
				<span style="color: var(--text-secondary);">Cancellation Policy</span>
				{#if showCancellationPolicy}
					<ChevronDown class="w-3 h-3" style="color: var(--text-tertiary);" />
				{:else}
					<ChevronRight class="w-3 h-3" style="color: var(--text-tertiary);" />
				{/if}
			</button>
			
			{#if showCancellationPolicy}
				<div class="mt-3 p-3 rounded-lg text-sm space-y-1" style="background: var(--bg-secondary); color: var(--text-secondary);">
					{#each tour.cancellationPolicy.split('\n') as line}
						{#if line.trim()}
							<p>{line}</p>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
