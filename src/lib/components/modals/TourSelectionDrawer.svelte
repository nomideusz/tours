<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatDuration, getImageUrl } from '$lib/utils/tour-helpers-client.js';
	import Drawer from '$lib/components/modals/Drawer.svelte';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Search from 'lucide-svelte/icons/search';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CircleDot from 'lucide-svelte/icons/circle-dot';

	interface Props {
		isOpen: boolean;
		selectedDate?: string;
		onClose: () => void;
		onTourSelected: (tourId: string) => void;
	}

	let {
		isOpen = $bindable(false),
		selectedDate,
		onClose,
		onTourSelected
	}: Props = $props();

	// Fetch user tours
	const toursQuery = $derived(createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 5 * 60 * 1000,
		enabled: isOpen
	}));

	const tours = $derived(($toursQuery.data as any[]) || []);
	
	// Search state
	let searchQuery = $state('');

	// Filter tours
	let filteredTours = $derived.by(() => {
		let filtered = tours.filter(tour => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					tour.name.toLowerCase().includes(query) ||
					tour.location?.toLowerCase().includes(query)
				);
			}
			return true;
		});
		
		// Active tours first
		filtered.sort((a, b) => {
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;
			return a.name.localeCompare(b.name);
		});
		
		return filtered;
	});

	// Format date for display
	const displayDate = $derived.by(() => {
		if (!selectedDate) return '';
		const date = new Date(selectedDate);
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			month: 'long', 
			day: 'numeric',
			year: 'numeric'
		});
	});

	// Handle tour selection
	function selectTour(tourId: string) {
		onTourSelected(tourId);
	}

	// Reset search when closing
	$effect(() => {
		if (!isOpen) {
			searchQuery = '';
		}
	});
</script>

<Drawer
	bind:isOpen
	title="Select Tour to Schedule"
	subtitle={displayDate}
	onClose={onClose}
	class="tour-selection-drawer"
>
	<!-- Search -->
	<div class="mb-4">
		<div class="relative">
			<Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style="color: var(--text-tertiary);" />
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search tours..."
				class="form-input pl-12 pr-4 py-3 w-full"
				style="font-size: 1rem;"
			/>
		</div>
	</div>

	<!-- Tours List -->
	{#if $toursQuery.isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
		</div>
	{:else if filteredTours.length === 0}
		<div class="text-center py-12">
			<p class="text-lg" style="color: var(--text-secondary);">
				{searchQuery ? 'No tours found matching your search' : 'No tours available'}
			</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each filteredTours as tour (tour.id)}
				<button
					onclick={() => selectTour(tour.id)}
					class="tour-card"
					type="button"
				>
					<div class="tour-image-wrapper">
						{#if tour.images && tour.images[0]}
							<img 
								src={getImageUrl(tour, tour.images[0])} 
								alt={tour.name} 
								class="tour-image"
								loading="lazy"
							/>
						{:else}
							<div class="tour-image-placeholder">
								<MapPin class="h-10 w-10" style="color: var(--text-tertiary);" />
							</div>
						{/if}
						<span class="status-badge {tour.status === 'active' ? 'active' : 'draft'}">
							<CircleDot class="h-3.5 w-3.5" />
							{tour.status === 'active' ? 'Active' : 'Draft'}
						</span>
					</div>
					
					<div class="tour-info">
						<h3 class="tour-name">{tour.name}</h3>
						<div class="tour-meta">
							<div class="meta-item">
								<MapPin class="h-4 w-4" />
								<span>{tour.location || 'Location not set'}</span>
							</div>
							<div class="meta-item">
								<Clock class="h-4 w-4" />
								<span>{formatDuration(tour.duration)}</span>
							</div>
						</div>
					</div>
					
					<ArrowRight class="h-6 w-6 flex-shrink-0" style="color: var(--text-tertiary);" />
				</button>
			{/each}
		</div>
	{/if}
</Drawer>

<style>
	.tour-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
		position: relative;
		overflow: hidden;
	}

	.tour-card:hover {
		border-color: var(--color-primary-300);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tour-image-wrapper {
		position: relative;
		width: 4.5rem;
		height: 4.5rem;
		flex-shrink: 0;
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.tour-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.tour-image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
	}

	.status-badge {
		position: absolute;
		bottom: 0.25rem;
		left: 0.25rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		border-radius: 9999px;
		transition: all 0.2s;
	}

	.status-badge.active {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}

	.status-badge.draft {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}

	.tour-info {
		flex: 1;
		min-width: 0;
	}

	.tour-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		line-height: 1.25;
	}

	.tour-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.meta-item :global(svg) {
		flex-shrink: 0;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.tour-card {
			padding: 0.75rem;
		}

		.tour-image-wrapper {
			width: 3.5rem;
			height: 3.5rem;
		}

		.tour-name {
			font-size: 0.875rem;
		}

		.meta-item {
			font-size: 0.75rem;
		}
	}

	/* Desktop: Narrower modal */
	@media (min-width: 768px) {
		:global(.tour-selection-drawer) {
			max-width: 42rem !important; /* 672px (3xl) */
		}
	}
</style>

