<script lang="ts">
	/**
	 * Street View Panorama Component
	 * 
	 * Displays a 360° Street View of the meeting point location
	 * Helps customers see exactly where they'll meet the guide
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { LocationCoordinates } from '$lib/utils/map-integration.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	
	interface Props {
		coordinates: LocationCoordinates;
		locationName: string;
		googleMapsApiKey: string;
		height?: string;
	}
	
	let {
		coordinates,
		locationName,
		googleMapsApiKey,
		height = '300px'
	}: Props = $props();
	
	let panoramaContainer = $state<HTMLElement>();
	let containerElement = $state<HTMLElement>();
	let panorama = $state<google.maps.StreetViewPanorama | null>(null);
	let isLoaded = $state(false);
	let isAvailable = $state(true);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let hasBeenVisible = $state(false);
	
	// Intersection Observer for lazy loading
	let observer: IntersectionObserver | null = null;
	
	// Load Google Maps and initialize Street View
	async function loadStreetView() {
		if (!browser || !googleMapsApiKey || !panoramaContainer) {
			return;
		}
		
		console.log('🔄 Loading Street View:', locationName, 'at', $state.snapshot(coordinates));
		
		try {
			// Check if Google Maps is loaded
			if (!window.google?.maps) {
				const script = document.createElement('script');
				script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=streetView&loading=async&v=weekly`;
				script.async = true;
				
				await new Promise<void>((resolve, reject) => {
					script.onload = () => {
						setTimeout(resolve, 100);
					};
					script.onerror = () => {
						reject(new Error('Failed to load Google Maps'));
					};
					document.head.appendChild(script);
				});
			}
			
			if (!window.google?.maps) {
				throw new Error('Google Maps not available');
			}
			
			// Check if Street View is available at this location
			const streetViewService = new google.maps.StreetViewService();
			const SEARCH_RADIUS = 50; // 50 meters
			
			streetViewService.getPanorama(
				{
					location: coordinates,
					radius: SEARCH_RADIUS,
					source: google.maps.StreetViewSource.OUTDOOR
				},
				(data, status) => {
					if (status === google.maps.StreetViewStatus.OK && data) {
					// Street View is available - create panorama
					panorama = new google.maps.StreetViewPanorama(panoramaContainer!, {
						position: data.location?.latLng || coordinates,
						pov: {
							heading: 0,
							pitch: 0
						},
						zoom: 1,
						addressControl: false,
						linksControl: true,
						panControl: true,
						enableCloseButton: false,
						fullscreenControl: false,
						motionTracking: false,
						motionTrackingControl: false,
						clickToGo: true, // Allow navigation by clicking
						scrollwheel: true, // Enable zoom with scroll
						disableDefaultUI: false, // Keep basic controls
						zoomControl: true // Show zoom controls
					});
						
						isLoaded = true;
						isAvailable = true;
						isLoading = false;
						console.log('✅ Street View loaded for:', locationName);
					} else {
						// Street View not available at this location
						console.log('⚠️ Street View not available for:', locationName, 'Status:', status);
						isAvailable = false;
						isLoading = false;
						error = 'Street View not available for this location';
					}
				}
			);
			
		} catch (err) {
			console.error('Failed to load Street View:', err);
			isAvailable = false;
			isLoading = false;
			error = 'Failed to load Street View';
		}
	}
	
	// Open full-screen Street View in Google Maps
	function openFullScreen() {
		const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.lat},${coordinates.lng}`;
		window.open(url, '_blank');
	}
	
	onMount(() => {
		// Setup Intersection Observer for lazy loading
		if (browser && containerElement) {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !hasBeenVisible) {
							hasBeenVisible = true;
							console.log('👁️ Street View now visible, will load when container ready...');
						}
					});
				},
				{
					rootMargin: '50px' // Load slightly before it comes into view
				}
			);
			
			observer.observe(containerElement);
		}
	});
	
	// Load Street View when both visible and panoramaContainer is ready
	$effect(() => {
		if (hasBeenVisible && panoramaContainer && browser && googleMapsApiKey) {
			console.log('📍 Container ready, loading Street View for:', $state.snapshot(coordinates));
			loadStreetView();
		}
	});
	
	onDestroy(() => {
		// Cleanup panorama
		if (panorama) {
			panorama.setVisible(false);
		}
		
		// Cleanup observer
		if (observer && containerElement) {
			observer.unobserve(containerElement);
			observer.disconnect();
		}
	});
</script>

<div 
	bind:this={containerElement}
	class="street-view-container" 
	style="height: {height};"
>
	<!-- Panorama container - always in DOM for binding -->
	<div 
		bind:this={panoramaContainer} 
		class="panorama-container"
		class:hidden={!isLoaded}
		style="height: 100%;"
	></div>
	
	<!-- Loading State Overlay -->
	{#if !hasBeenVisible || isLoading}
		<div class="street-view-overlay">
			<div class="loading-spinner"></div>
			<p class="loading-text">{!hasBeenVisible ? 'Street View' : 'Loading Street View...'}</p>
		</div>
	{/if}
	
	<!-- Error State Overlay -->
	{#if !isAvailable && !isLoading}
		<div class="street-view-overlay unavailable">
			<AlertCircle class="w-8 h-8" style="color: var(--text-tertiary);" />
			<p class="unavailable-text">Street View not available</p>
			<p class="unavailable-subtext">This location doesn't have street-level imagery</p>
		</div>
	{/if}
	
	<!-- Fullscreen Button -->
	{#if isLoaded}
		<button
			type="button"
			onclick={openFullScreen}
			class="fullscreen-btn"
			aria-label="Open in Google Maps"
			title="Open in Google Maps Street View"
		>
			<Maximize2 class="w-4 h-4" />
		</button>
	{/if}
</div>

<style>
	.street-view-container {
		position: relative;
		width: 100%;
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--bg-secondary);
	}
	
	.panorama-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 0.5rem;
	}
	
	.panorama-container.hidden {
		opacity: 0;
		pointer-events: none;
	}
	
	/* Overlays */
	.street-view-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		background: var(--bg-secondary);
		z-index: 10;
	}
	
	.street-view-overlay.unavailable {
		background: var(--bg-primary);
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
	
	.unavailable-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-align: center;
	}
	
	.unavailable-subtext {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
	}
	
	/* Fullscreen Button */
	.fullscreen-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.5rem;
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}
	
	.fullscreen-btn:hover {
		background: var(--bg-secondary);
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
	
	.fullscreen-btn:active {
		transform: scale(0.95);
	}
	
	/* Dark mode adjustments */
	:root[data-theme='dark'] .fullscreen-btn {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}
	
	:root[data-theme='dark'] .fullscreen-btn:hover {
		background: var(--bg-tertiary);
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.fullscreen-btn {
			top: 0.5rem;
			right: 0.5rem;
			padding: 0.375rem;
		}
	}
</style>

