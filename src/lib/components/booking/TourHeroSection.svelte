<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import User from 'lucide-svelte/icons/user';
	import { formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	
	interface TourGuide {
		username?: string;
		name?: string;
	}
	
	interface Props {
		tour: Tour;
		tourGuide?: TourGuide | null;
		imageUrl?: string;
	}
	
	let { tour, tourGuide, imageUrl }: Props = $props();
</script>

<!-- Hero Image -->
{#if imageUrl}
	<div class="hero-image -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
		<img 
			src={imageUrl} 
			alt={tour.name}
			class="w-full h-full object-cover"
			loading="eager"
		/>
	</div>
{/if}

<!-- Tour Guide Info -->
{#if tourGuide?.username}
	<div class="mb-4">
		<a 
			href="/{tourGuide.username}" 
			class="guide-link inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
			style="background: var(--bg-secondary); color: var(--text-secondary);"
		>
			<User class="w-4 h-4" />
			<span>Hosted by <span class="font-medium" style="color: var(--text-primary);">{tourGuide.name || tourGuide.username}</span></span>
		</a>
	</div>
{/if}

<!-- Tour Header -->
<div class="mb-6">
	<h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary);">{tour.name}</h1>
	
	<!-- Quick Info Bar -->
	{#if tour.location}
		<div class="flex items-center gap-2 mb-4 text-sm">
			<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
			<span style="color: var(--text-secondary);">{tour.location}</span>
		</div>
	{/if}
	
	<!-- Categories -->
	{#if tour.categories && tour.categories.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each tour.categories as category}
				<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
					style="
						background: var(--bg-secondary);
						color: var(--text-secondary);
					"
				>
					{formatCategoryName(category)}
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.hero-image {
		height: 300px;
		position: relative;
		overflow: hidden;
	}
	
	@media (min-width: 768px) {
		.hero-image {
			height: 400px;
		}
	}
	
	.guide-link {
		text-decoration: none;
	}
	
	.guide-link:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
</style>

