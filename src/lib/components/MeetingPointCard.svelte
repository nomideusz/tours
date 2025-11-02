<script lang="ts">
	/**
	 * Meeting Point Card with Place Photos
	 * 
	 * Displays meeting point information with photos from Places API
	 * Helps customers easily identify where to meet the tour guide
	 */
	import { onMount } from 'svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Image from 'lucide-svelte/icons/image';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import type { LocationCoordinates } from '$lib/utils/map-integration.js';
	import { getCachedPhotos, cachePhotos, cleanPhotoCache } from '$lib/utils/place-photo-cache.js';
	
	interface Props {
		locationName: string;
		locationAddress?: string;
		placeId?: string | null;
		coordinates?: LocationCoordinates;
		showPhotos?: boolean;
		photoCount?: number;
	}
	
	let {
		locationName,
		locationAddress = '',
		placeId = null,
		coordinates,
		showPhotos = true,
		photoCount = 3
	}: Props = $props();
	
	let photos = $state<string[]>([]);
	let loadingPhotos = $state(false);
	let photoError = $state(false);
	
	// Fetch place photos when component mounts
	onMount(async () => {
		if (showPhotos && placeId && placeId.trim()) {
			// Clean expired cache entries periodically
			cleanPhotoCache();
			await fetchPlacePhotos();
		} else {
			console.log('📸 Skipping photo fetch:', { showPhotos, placeId: placeId || 'null' });
		}
	});
	
	async function fetchPlacePhotos() {
		if (!placeId) {
			console.log('📸 No placeId provided, skipping photo fetch');
			return;
		}
		
		// Check cache first
		const cached = getCachedPhotos(placeId);
		if (cached && cached.length > 0) {
			photos = cached;
			console.log(`✅ Loaded ${photos.length} photos from cache (no API call!)`);
			return;
		}
		
		console.log('📸 Fetching photos for place ID:', placeId);
		loadingPhotos = true;
		photoError = false;
		
		try {
			// Fetch place details including photos
			console.log('📸 Calling /api/places/details...');
			const response = await fetch('/api/places/details', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					placeId,
					fields: ['photos'] // Only request photos to minimize cost
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('❌ Place Details failed:', response.status, errorData);
				throw new Error(`Failed to fetch place photos: ${response.status}`);
			}
			
			const details = await response.json();
			console.log('📸 Place details received:', details);
			
			if (details.photos && details.photos.length > 0) {
				console.log(`📸 Found ${details.photos.length} photos, fetching URLs...`);
				// Get photo URLs (limit to photoCount)
				const photoUrls = await Promise.all(
					details.photos.slice(0, photoCount).map((photo: any) => 
						getPlacePhotoUrl(photo.name, 400) // 400px width
					)
				);
				photos = photoUrls.filter(url => url !== null) as string[];
				console.log(`✅ Loaded ${photos.length} photo URLs from API`);
				
				// Cache the results for future use
				if (photos.length > 0) {
					cachePhotos(placeId, photos);
				}
			} else {
				console.log('ℹ️ No photos available for this place');
			}
		} catch (error) {
			console.error('❌ Error fetching place photos:', error);
			photoError = true;
		} finally {
			loadingPhotos = false;
		}
	}
	
	async function getPlacePhotoUrl(photoName: string, maxWidth: number = 400): Promise<string | null> {
		try {
			const response = await fetch('/api/places/photo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ photoName, maxWidth })
			});
			
			if (!response.ok) return null;
			
			const data = await response.json();
			return data.photoUrl;
		} catch (error) {
			console.error('Error getting photo URL:', error);
			return null;
		}
	}
	
	function getGoogleMapsUrl(): string {
		if (coordinates) {
			return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
		}
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
	}
</script>

<div class="meeting-point-card">
	<!-- Header -->
	<div class="meeting-point-header">
		<div class="flex items-center gap-2">
			<MapPin class="w-5 h-5" style="color: var(--color-primary-600);" />
			<h3 class="meeting-point-title">Meeting Point</h3>
		</div>
	</div>
	
	<!-- Location Info -->
	<div class="meeting-point-info">
		<p class="location-name">{locationName}</p>
		{#if locationAddress}
			<p class="location-address">{locationAddress}</p>
		{/if}
	</div>
	
	<!-- Photos Grid -->
	{#if showPhotos && placeId}
		<div class="photos-section">
			{#if loadingPhotos}
				<div class="photos-loading">
					<div class="loading-spinner"></div>
					<p class="loading-text">Loading location photos...</p>
				</div>
			{:else if photos.length > 0}
				<div class="photos-grid" class:single-photo={photos.length === 1}>
					{#each photos as photo, index}
						<div class="photo-item">
							<img 
								src={photo} 
								alt="{locationName} - Photo {index + 1}"
								class="photo-image"
								loading="lazy"
							/>
						</div>
					{/each}
				</div>
				<p class="photos-caption">
					<Image class="w-3 h-3" />
					Photos from Google Places
				</p>
			{:else if photoError}
				<div class="no-photos">
					<Image class="w-5 h-5" style="color: var(--text-tertiary);" />
					<p class="no-photos-text">Photos not available</p>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- View on Google Maps -->
	<button 
		onclick={() => {
			window.open(getGoogleMapsUrl(), '_blank');
		}}
		class="button-accent button-gap"
	>
		<MapPin class="w-4 h-4" />
		View on Google Maps
	</button>
</div>
<style>
	.meeting-point-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.meeting-point-header {
		border-bottom: 1px solid var(--border-primary);
		padding-bottom: 0.75rem;
	}
	
	.meeting-point-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.meeting-point-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.location-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.location-address {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Photos Section */
	.photos-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.photos-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 0.75rem;
	}
	
	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid var(--border-primary);
		border-top-color: var(--color-primary-600);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.loading-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.photos-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.photos-grid.single-photo {
		grid-template-columns: 1fr;
	}
	
	.photo-item {
		aspect-ratio: 4/3;
		overflow: hidden;
		border-radius: 0.5rem;
		background: var(--bg-secondary);
	}
	
	.photo-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}
	
	.photo-item:hover .photo-image {
		transform: scale(1.05);
	}
	
	.photos-caption {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.no-photos {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 0.5rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}
	
	.no-photos-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Maps Link */
	.maps-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		text-decoration: none;
		transition: all 0.2s ease;
	}
	
	.maps-link:hover {
		background: var(--color-primary-100);
		transform: translateY(-1px);
	}
	
	/* Mobile Optimizations */
	@media (max-width: 640px) {
		.meeting-point-card {
			padding: 0.75rem;
		}
		
		.photos-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>

