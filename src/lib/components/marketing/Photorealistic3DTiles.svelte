<script lang="ts">
	/**
	 * 3D Maps Showcase
	 * 
	 * Displays stunning 3D maps of tour destinations
	 * Perfect for marketing pages to impress visitors
	 * 
	 * Uses Google Maps Platform 3D Maps (EEA-compatible alternative to Photorealistic 3D Tiles)
	 * Free tier: 28,000 Dynamic Map loads/month
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import RotateCw from 'lucide-svelte/icons/rotate-cw';
	
	interface Location {
		name: string;
		description: string;
		coordinates: { lat: number; lng: number; altitude?: number };
		heading: number;
		tilt: number;
		zoom: number;
	}
	
	interface Props {
		googleMapsApiKey: string;
		height?: string;
		showcaseLocations?: Location[];
		autoRotate?: boolean;
		rotateInterval?: number;
	}
	
	let {
		googleMapsApiKey,
		height = '600px',
		showcaseLocations = [
			{
				name: 'Acropolis, Athens',
				description: 'Ancient Greek citadel',
				coordinates: { lat: 37.9715, lng: 23.7257 },
				heading: 120, // Better angle to see the Parthenon
				tilt: 60, // Less steep angle
				zoom: 18
			},
			{
				name: 'Colosseum, Rome',
				description: 'Iconic ancient amphitheater',
				coordinates: { lat: 41.8902, lng: 12.4922 },
				heading: 90,
				tilt: 67.5,
				zoom: 18
			},
			{
				name: 'Sagrada Familia, Barcelona',
				description: 'Gaudí\'s masterpiece basilica',
				coordinates: { lat: 41.4036, lng: 2.1744 },
				heading: 135,
				tilt: 67.5,
				zoom: 18
			},
			{
				name: 'Eiffel Tower, Paris',
				description: 'Iconic iron lattice tower',
				coordinates: { lat: 48.8584, lng: 2.2945 },
				heading: 180,
				tilt: 67.5,
				zoom: 18
			}
		],
		autoRotate = false, // Disabled by default - let users explore manually
		rotateInterval = 15000
	}: Props = $props();
	
	let mapContainer = $state<HTMLElement>();
	let map3DElement = $state<any>(null);
	let isLoaded = $state(false);
	let isLoading = $state(true);
	let currentLocationIndex = $state(0);
	let rotateTimer = $state<ReturnType<typeof setInterval> | null>(null);
	
	// Clicked place details
	let clickedPlace = $state<any>(null);
	let showPlaceDetails = $state(false);
	
	let currentLocation = $derived(showcaseLocations[currentLocationIndex]);
	
	// Load Google Maps 3D and create viewer
	async function load3DMap() {
		if (!browser || !googleMapsApiKey || !mapContainer) return;
		
		try {
			// Load Google Maps JavaScript API
			if (!window.google?.maps) {
				console.log('📦 Loading Google Maps 3D...');
				const script = document.createElement('script');
				script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&v=beta&libraries=maps3d&loading=async`;
				script.async = true;
				
				await new Promise<void>((resolve, reject) => {
					script.onload = () => {
						console.log('✅ Google Maps loaded');
						setTimeout(resolve, 200);
					};
					script.onerror = () => reject(new Error('Failed to load Google Maps'));
					document.head.appendChild(script);
				});
			}
			
			if (!window.google?.maps) {
				throw new Error('Google Maps not available');
			}
			
			console.log('🌍 Creating 3D Map...');
			
			// Import the 3D library
			const { Map3DElement } = await google.maps.importLibrary("maps3d") as google.maps.Maps3DLibrary;
			
			// Create 3D map element with proper configuration
			map3DElement = new Map3DElement({
				center: {
					lat: currentLocation.coordinates.lat,
					lng: currentLocation.coordinates.lng,
					altitude: 200 // Lower altitude for better centering
				},
				tilt: currentLocation.tilt,
				heading: currentLocation.heading,
				range: 600 // Closer zoom for better view
			});
			
			// Append to DOM
			mapContainer.appendChild(map3DElement);
			
			// Set mode as property (not in constructor options)
			(map3DElement as any).mode = 'HYBRID'; // Shows satellite imagery + 3D buildings
			
			// Add click listener for interactive places
			map3DElement.addEventListener('gmp-click', async (event: any) => {
				event.preventDefault();
				
				if (event.placeId) {
					console.log('🏛️ Place clicked:', event.placeId);
					
					try {
						// Fetch place details
						const place = await event.fetchPlace();
						await place.fetchFields({ fields: ['displayName', 'types', 'formattedAddress', 'rating'] });
						
						// Show place details
						clickedPlace = {
							name: place.displayName || 'Unknown Place',
							id: place.id,
							types: place.types || [],
							address: place.formattedAddress || '',
							rating: place.rating
						};
						showPlaceDetails = true;
						
						console.log('✅ Place details loaded:', clickedPlace.name);
					} catch (error) {
						console.error('Failed to fetch place details:', error);
					}
				}
			});
			
			console.log('✅ 3D Map created with vector buildings and click handlers');
			
			// Wait for element to initialize (3D maps can take a few seconds to render)
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Update state - show controls
			isLoading = false;
			isLoaded = true;
			
			console.log('✅ 3D Map ready');
			
			// Start auto-rotation if enabled (off by default)
			if (autoRotate) {
				setTimeout(() => startAutoRotate(), 3000);
			}
			
		} catch (error: any) {
			console.error('❌ Failed to load 3D Map:', error);
			
			// Check if it's a 403 error (permission denied)
			if (error?.statusCode === 403 || error?.response?.includes('PERMISSION_DENIED')) {
				console.error('🚫 Map Tiles API Permission Denied - Check:');
				console.error('   1. Map Tiles API enabled in Google Cloud Console?');
				console.error('   2. Billing enabled on your Google Cloud project?');
				console.error('   3. API key has Map Tiles API permissions?');
				console.error('   4. API key restrictions allow localhost?');
				console.error('   📖 See ENABLE_MAP_TILES_API.md for detailed instructions');
			}
			
			isLoading = false;
			isLoaded = false;
		}
	}
	
	function startAutoRotate() {
		if (rotateTimer) return;
		
		rotateTimer = setInterval(() => {
			nextLocation();
		}, rotateInterval);
	}
	
	function stopAutoRotate() {
		if (rotateTimer) {
			clearInterval(rotateTimer);
			rotateTimer = null;
		}
	}
	
	function nextLocation() {
		currentLocationIndex = (currentLocationIndex + 1) % showcaseLocations.length;
		flyToLocation(currentLocation);
	}
	
	function selectLocation(index: number) {
		stopAutoRotate(); // Stop auto-rotation when user manually selects
		currentLocationIndex = index;
		flyToLocation(currentLocation);
	}
	
	async function flyToLocation(location: Location, immediate = false) {
		if (!map3DElement) return;
		
		const newCamera = {
			center: {
				lat: location.coordinates.lat,
				lng: location.coordinates.lng,
				altitude: 200 // Better centering
			},
			range: 600, // Closer for better view
			heading: location.heading,
			tilt: location.tilt
		};
		
		if (immediate) {
			// Set immediately (for initial load)
			map3DElement.center = newCamera.center;
			map3DElement.range = newCamera.range;
			map3DElement.heading = newCamera.heading;
			map3DElement.tilt = newCamera.tilt;
		} else {
			// Animate to new position with longer duration for smooth tile loading
			try {
				await map3DElement.flyCameraTo({
					endCamera: newCamera,
					durationMillis: 5000 // 5-second smooth animation
				});
			} catch (error) {
				// Fallback to immediate if animation fails
				map3DElement.center = newCamera.center;
				map3DElement.range = newCamera.range;
				map3DElement.heading = newCamera.heading;
				map3DElement.tilt = newCamera.tilt;
			}
		}
	}
	
	onMount(() => {
		load3DMap();
	});
	
	onDestroy(() => {
		stopAutoRotate();
		// Map3DElement cleanup happens automatically
	});
</script>

<div class="tiles-3d-showcase">
	<div class="showcase-header">
		<h2 class="showcase-title">Experience Tour Destinations in 3D</h2>
		<p class="showcase-subtitle">Explore iconic landmarks with photorealistic 3D maps</p>
	</div>
	
	<div class="tiles-container" style="height: {height};">
		<!-- 3D Map Container - always present -->
		<div 
			bind:this={mapContainer} 
			class="map-3d-container"
		></div>
		
		<!-- Loading State Overlay - only show when NOT loaded -->
		<div class="tiles-loading-overlay" class:hidden={isLoaded}>
			<div class="loading-spinner"></div>
			<p class="loading-text">Loading 3D Map...</p>
		</div>
		
		<!-- Controls - only show when loaded -->
		{#if isLoaded}
			<!-- Location Info Overlay -->
			<div class="location-overlay">
				<div class="location-info">
					<MapPin class="w-5 h-5" style="color: var(--color-primary-600);" />
					<div>
						<h3 class="location-name">{currentLocation.name}</h3>
						<p class="location-description">{currentLocation.description}</p>
					</div>
				</div>
			</div>
			
			<!-- Location Selector -->
			<div class="location-selector">
				{#each showcaseLocations as location, index}
					<button
						type="button"
						class="location-btn"
						class:active={index === currentLocationIndex}
						onclick={() => selectLocation(index)}
						title={location.name}
					>
						{location.name.split(',')[0]}
					</button>
				{/each}
			</div>
			
			<!-- Auto-rotate toggle -->
			<button
				type="button"
				class="rotate-toggle"
				class:active={!!rotateTimer}
				onclick={() => {
					if (rotateTimer) {
						stopAutoRotate();
					} else {
						startAutoRotate();
					}
				}}
				title={rotateTimer ? 'Stop auto-rotation' : 'Start auto-rotation'}
			>
				<RotateCw class="w-4 h-4 {rotateTimer ? 'spinning' : ''}" />
			</button>
			
			<!-- Clicked Place Details Popup -->
			{#if showPlaceDetails && clickedPlace}
				<div class="place-details-popup">
					<button
						type="button"
						class="place-details-close"
						onclick={() => showPlaceDetails = false}
					>
						×
					</button>
					<h4 class="place-name">{clickedPlace.name}</h4>
					{#if clickedPlace.rating}
						<div class="place-rating">
							⭐ {clickedPlace.rating.toFixed(1)}
						</div>
					{/if}
					{#if clickedPlace.address}
						<p class="place-address">{clickedPlace.address}</p>
					{/if}
					{#if clickedPlace.types.length > 0}
						<div class="place-types">
							{#each clickedPlace.types.slice(0, 3) as type}
								<span class="place-type-chip">{type.replace(/_/g, ' ')}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.tiles-3d-showcase {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.showcase-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.showcase-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.showcase-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}
	
	.tiles-container {
		position: relative;
		width: 100%;
		border-radius: 1rem;
		overflow: hidden;
		background: var(--bg-secondary);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}
	
	.map-3d-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	
	/* Ensure 3D map element fills container */
	.map-3d-container :global(gmp-map-3d) {
		width: 100% !important;
		height: 100% !important;
		display: block !important;
	}
	
	/* Loading State Overlay */
	.tiles-loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background: var(--bg-secondary);
		z-index: 50;
		transition: opacity 0.3s ease;
	}
	
	.tiles-loading-overlay.hidden {
		opacity: 0;
		pointer-events: none;
		visibility: hidden;
	}
	
	.loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 4px solid var(--border-primary);
		border-top-color: var(--color-primary-600);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.loading-text {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	/* Location Overlay */
	.location-overlay {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		padding: 1rem 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 40;
	}
	
	.location-info {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}
	
	.location-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.location-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Location Selector */
	.location-selector {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		padding: 0.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 40;
	}
	
	.location-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: white;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	
	.location-btn:hover {
		background: var(--bg-secondary);
		border-color: var(--color-primary-400);
		color: var(--text-primary);
	}
	
	.location-btn.active {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		color: white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}
	
	/* Rotate Toggle */
	.rotate-toggle {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 40;
	}
	
	.rotate-toggle:hover {
		background: var(--bg-secondary);
		transform: scale(1.05);
	}
	
	.rotate-toggle.active {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		color: white;
	}
	
	:global(.spinning) {
		animation: spin 2s linear infinite;
	}
	
	/* Place Details Popup */
	.place-details-popup {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem; /* Move to right side to avoid overlap */
		max-width: 300px;
		background: rgba(0, 0, 0, 0.85); /* Dark background for better contrast */
		backdrop-filter: blur(10px);
		padding: 1.25rem;
		border-radius: 0.75rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		z-index: 45;
		animation: slideIn 0.3s ease;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.place-details-close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.7);
		font-size: 1.5rem;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		transition: color 0.2s ease;
	}
	
	.place-details-close:hover {
		color: white;
	}
	
	.place-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
		margin-bottom: 0.5rem;
		padding-right: 1.5rem;
	}
	
	.place-rating {
		font-size: 0.875rem;
		color: #fbbf24;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}
	
	.place-address {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}
	
	.place-types {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	
	.place-type-chip {
		font-size: 0.625rem;
		padding: 0.25rem 0.5rem;
		background: rgba(59, 130, 246, 0.3);
		color: #93c5fd;
		border: 1px solid rgba(59, 130, 246, 0.5);
		border-radius: 0.25rem;
		text-transform: capitalize;
	}
	
	/* Dark mode adjustments */
	:root[data-theme='dark'] .location-overlay,
	:root[data-theme='dark'] .location-selector,
	:root[data-theme='dark'] .rotate-toggle {
		background: rgba(0, 0, 0, 0.8);
	}
	
	:root[data-theme='dark'] .location-btn {
		background: rgba(0, 0, 0, 0.6);
	}
	
	/* Mobile optimizations */
	@media (max-width: 768px) {
		.showcase-title {
			font-size: 1.875rem;
		}
		
		.showcase-subtitle {
			font-size: 1rem;
		}
		
		.location-overlay {
			top: 1rem;
			left: 1rem;
			right: 1rem;
			padding: 0.75rem 1rem;
		}
		
		.location-name {
			font-size: 1rem;
		}
		
		.location-description {
			font-size: 0.75rem;
		}
		
		.location-selector {
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			transform: none;
			flex-wrap: wrap;
			justify-content: center;
		}
		
		.location-btn {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}
		
		.rotate-toggle {
			bottom: auto;
			top: 1rem;
			right: 1rem;
			padding: 0.5rem;
		}
	}
</style>

