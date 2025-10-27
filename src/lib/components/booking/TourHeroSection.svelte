<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import User from 'lucide-svelte/icons/user';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import { formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import { formatShortAddress } from '$lib/utils/location.js';
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
		showMap?: boolean;
	}
	
	let { 
		tour, 
		tourGuide, 
		imageUrl,
		tourCoordinates = null,
		googleMapsApiKey = '',
		showMap = $bindable(false)
	}: Props = $props();
	let currentImageIndex = $state(0);
	
	// Build image URLs array
	let imageUrls = $derived.by(() => {
		if (!tour.images || tour.images.length === 0) return [];
		return tour.images.map((img, idx) => `/api/images/${tour.id}/${img}?size=large`);
	});
	
	// Format location for display (shortened version)
	let displayLocation = $derived(tour.location ? formatShortAddress(tour.location) : '');
	
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
	<div class="hero-gallery hero-gallery-spacing">
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

<!-- Compact Tour Header -->
<div class="tour-header-compact">
	<!-- Guide Badge + Title Row (Mobile Compact) -->
	<div class="header-top">
		{#if tourGuide?.username}
			<a 
				href="/{tourGuide.username}" 
				class="guide-badge-compact no-underline"
			>
				<User class="w-3 h-3" />
				<span>{tourGuide.name || tourGuide.username}</span>
			</a>
		{/if}
	</div>
	
	<h1 class="tour-title">{tour.name}</h1>
	
	<!-- Compact Meta Row: Duration + Group + Location -->
	<div class="meta-row">
		{#if tour.duration}
			<span class="meta-item">
				<Clock class="w-4 h-4" />
				{Math.floor(tour.duration / 60)}h {tour.duration % 60 > 0 ? `${tour.duration % 60}m` : ''}
			</span>
		{/if}
		
		<span class="meta-item">
			<Users class="w-4 h-4" />
			{#if tour.pricingModel === 'private_tour' && tour.privateTour}
				{tour.privateTour.minCapacity ?? tour.minCapacity ?? 4}-{tour.privateTour.maxCapacity ?? tour.maxCapacity ?? 12}
			{:else}
				Up to {tour.maxCapacity || tour.capacity || 20}
			{/if}
		</span>
		
		{#if tour.location}
			<button
				type="button"
				onclick={() => showMap = !showMap}
				class="meta-item meta-item-link"
				title={tour.location}
			>
				<MapPin class="w-4 h-4" />
				<span>{displayLocation}</span>
				{#if tourCoordinates && googleMapsApiKey}
					{#if showMap}
						<ChevronDown class="w-3 h-3" />
					{:else}
						<ChevronRight class="w-3 h-3" />
					{/if}
				{/if}
			</button>
		{/if}
	</div>
	
	<!-- Compact Map (Collapsible) -->
	{#if showMap && tourCoordinates && googleMapsApiKey && tour.location}
		<div class="map-container">
			<TourLocationMap
				coordinates={tourCoordinates}
				locationName={tour.location}
				googleMapsApiKey={googleMapsApiKey}
			/>
		</div>
	{/if}
	
	<!-- Compact Categories -->
	{#if tour.categories && tour.categories.length > 0}
		<div class="categories-compact">
			{#each tour.categories as category}
				<span class="category-tag">
					{formatCategoryName(category)}
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Compact Tour Header - Space Efficient */
	.tour-header-compact {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	@media (min-width: 640px) {
		.tour-header-compact {
			gap: 0.75rem;
			margin-bottom: 1.5rem;
		}
	}
	
	.header-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.guide-badge-compact {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		transition: all var(--transition-base);
	}
	
	.guide-badge-compact:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	.tour-title {
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--text-primary);
		margin: 0;
	}
	
	@media (min-width: 640px) {
		.tour-title {
			font-size: 2rem;
		}
	}
	
	@media (min-width: 1024px) {
		.tour-title {
			font-size: 2.25rem;
		}
	}
	
	/* Compact Meta Row - Horizontal on Desktop, Wraps on Mobile */
	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}
	
	.meta-item {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.meta-item-link {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color var(--transition-base);
	}
	
	.meta-item-link:hover {
		color: var(--text-primary);
		text-decoration: underline;
	}
	
	.map-container {
		margin-top: 0.75rem;
	}
	
	/* Compact Categories */
	.categories-compact {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.category-tag {
		display: inline-flex;
		padding: 0.25rem 0.625rem;
		font-size: 0.6875rem;
		font-weight: 500;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border-radius: var(--radius-full);
	}
	
	.hero-gallery {
		position: relative;
	}
	
	.hero-gallery-spacing {
		margin-bottom: 0.75rem;
	}
	
	@media (min-width: 640px) {
		.hero-gallery-spacing {
			margin-bottom: 1.5rem;
		}
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
		box-shadow: 0 0 0 3px var(--color-accent-600);
	}
	
	.thumbnail.active::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-accent-600);
		opacity: 0.2;
		pointer-events: none;
	}
	
	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
		
	}
</style>

