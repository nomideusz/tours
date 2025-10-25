<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import User from 'lucide-svelte/icons/user';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import TourLocationMap from './TourLocationMap.svelte';
	
	interface TourGuide {
		username?: string;
		name?: string;
	}
	
	interface Props {
		tour: Tour;
		tourGuide?: TourGuide | null;
		imageUrl?: string;
		tourCoordinates?: { lat: number; lng: number } | null;
		googleMapsApiKey?: string;
	}
	
	let { 
		tour, 
		tourGuide, 
		imageUrl,
		tourCoordinates = null,
		googleMapsApiKey = ''
	}: Props = $props();
	
	let showMap = $state(false);
	let currentImageIndex = $state(0);
	
	// Build image URLs array
	let imageUrls = $derived.by(() => {
		if (!tour.images || tour.images.length === 0) return [];
		return tour.images.map((img, idx) => `/api/images/${tour.id}/${img}?size=large`);
	});
	
	let hasMultipleImages = $derived(imageUrls.length > 1);
	let currentImage = $derived(imageUrls[currentImageIndex] || imageUrl);
	
	function nextImage() {
		currentImageIndex = (currentImageIndex + 1) % imageUrls.length;
	}
	
	function prevImage() {
		currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
	}
	
	function selectImage(index: number) {
		currentImageIndex = index;
	}
</script>

<!-- Hero Image Gallery -->
{#if currentImage || imageUrl}
	<div class="hero-gallery mb-6">
		<!-- Main Image -->
		<div class="main-image-container">
			<img 
				src={currentImage || imageUrl} 
				alt={tour.name}
				class="main-image"
				loading="eager"
			/>
			
			<!-- Navigation Arrows (only if multiple images) -->
			{#if hasMultipleImages}
				<button
					type="button"
					class="nav-arrow nav-arrow-left"
					onclick={prevImage}
					aria-label="Previous image"
				>
					<ChevronLeft class="w-6 h-6" />
				</button>
				<button
					type="button"
					class="nav-arrow nav-arrow-right"
					onclick={nextImage}
					aria-label="Next image"
				>
					<ChevronRight class="w-6 h-6" />
				</button>
				
				<!-- Image Counter -->
				<div class="image-counter">
					{currentImageIndex + 1} / {imageUrls.length}
				</div>
			{/if}
		</div>
		
		<!-- Thumbnails (only if multiple images) -->
		{#if hasMultipleImages && imageUrls.length > 1}
			<div class="thumbnails-container">
				{#each imageUrls as imgUrl, index}
					<button
						type="button"
						class="thumbnail"
						class:active={index === currentImageIndex}
						onclick={() => selectImage(index)}
						aria-label="View image {index + 1}"
					>
						<img 
							src={imgUrl.replace('size=large', 'size=small')} 
							alt="{tour.name} - Photo {index + 1}"
							class="thumbnail-image"
						/>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Tour Guide Info -->
{#if tourGuide?.username}
	<div class="guide-info-wrapper">
		<a 
			href="/{tourGuide.username}" 
			class="guide-badge no-underline"
		>
			<div class="guide-avatar">
				<User class="w-4 h-4" />
			</div>
			<div class="guide-details">
				<span class="guide-label">Hosted by</span>
				<span class="guide-name">{tourGuide.name || tourGuide.username}</span>
			</div>
		</a>
	</div>
{/if}

<!-- Tour Header -->
<div class="mb-6">
	<h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary);">{tour.name}</h1>
	
	<!-- Quick Info Bar -->
	{#if tour.location}
		<div class="mb-4">
			<button
				type="button"
				onclick={() => showMap = !showMap}
				class="flex items-center gap-2 text-sm hover:underline"
			>
				<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
				<span style="color: var(--text-secondary);">{tour.location}</span>
				{#if tourCoordinates && googleMapsApiKey}
					{#if showMap}
						<ChevronDown class="w-3 h-3" style="color: var(--text-tertiary);" />
					{:else}
						<ChevronRight class="w-3 h-3" style="color: var(--text-tertiary);" />
					{/if}
				{/if}
			</button>
			
			<!-- Compact Map (Collapsible) -->
			{#if showMap && tourCoordinates && googleMapsApiKey}
				<div class="mt-3">
					<TourLocationMap
						coordinates={tourCoordinates}
						locationName={tour.location}
						googleMapsApiKey={googleMapsApiKey}
					/>
				</div>
			{/if}
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
	.hero-gallery {
		position: relative;
	}
	
	.main-image-container {
		position: relative;
		width: 100%;
		height: 400px;
		overflow: hidden;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
	}
	
	@media (min-width: 768px) {
		.main-image-container {
			height: 500px;
		}
	}
	
	@media (min-width: 1024px) {
		.main-image-container {
			height: 600px;
		}
	}
	
	.main-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}
	
	/* Navigation Arrows */
	.nav-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 10;
		backdrop-filter: blur(4px);
	}
	
	.nav-arrow:hover {
		background: rgba(0, 0, 0, 0.8);
		transform: translateY(-50%) scale(1.1);
	}
	
	.nav-arrow-left {
		left: 1rem;
	}
	
	.nav-arrow-right {
		right: 1rem;
	}
	
	/* Image Counter */
	.image-counter {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.375rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		backdrop-filter: blur(4px);
		z-index: 10;
	}
	
	/* Thumbnails */
	.thumbnails-container {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		overflow-x: auto;
		padding: 0.25rem;
		scrollbar-width: thin;
		scrollbar-color: var(--border-secondary) transparent;
	}
	
	.thumbnails-container::-webkit-scrollbar {
		height: 0.375rem;
	}
	
	.thumbnails-container::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.thumbnails-container::-webkit-scrollbar-thumb {
		background: var(--border-secondary);
		border-radius: 0.25rem;
	}
	
	.thumbnail {
		flex-shrink: 0;
		width: 90px;
		height: 70px;
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
		position: relative;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.thumbnail:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.thumbnail.active {
		box-shadow: 0 0 0 3px var(--color-primary-600);
	}
	
	.thumbnail.active::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-primary-600);
		opacity: 0.2;
		pointer-events: none;
	}
	
	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.guide-info-wrapper {
		margin-bottom: 1.5rem;
	}
	
	.guide-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		text-decoration: none !important;
		transition: all 0.2s ease;
	}
	
	.guide-badge:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		text-decoration: none !important;
	}
	
	.guide-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
	}
	
	.guide-details {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
	}
	
	.guide-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.guide-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.main-image-container {
			height: 300px;
			border-radius: 0;
			margin: 0 -1rem;
			width: calc(100% + 2rem);
		}
		
		.nav-arrow {
			width: 2rem;
			height: 2rem;
		}
		
		.nav-arrow-left {
			left: 0.5rem;
		}
		
		.nav-arrow-right {
			right: 0.5rem;
		}
		
		.image-counter {
			bottom: 0.5rem;
			right: 0.5rem;
			font-size: 0.625rem;
			padding: 0.25rem 0.5rem;
		}
		
		.thumbnails-container {
			padding: 0.25rem 1rem;
			margin: 0.5rem -1rem 0;
			width: calc(100% + 2rem);
		}
		
		.thumbnail {
			width: 60px;
			height: 45px;
			border-radius: 0.375rem;
		}
		
		.guide-info-wrapper {
			margin: 1rem 0;
		}
		
		.guide-badge {
			padding: 0.375rem 0.75rem;
			gap: 0.5rem;
		}
		
		.guide-avatar {
			width: 2rem;
			height: 2rem;
		}
		
		.guide-label {
			font-size: 0.625rem;
		}
		
		.guide-name {
			font-size: 0.75rem;
		}
	}
</style>

