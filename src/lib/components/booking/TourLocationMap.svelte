<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { LocationCoordinates } from '$lib/utils/map-integration.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Navigation from 'lucide-svelte/icons/navigation';
	
	interface Props {
		coordinates: LocationCoordinates;
		locationName: string;
		googleMapsApiKey: string;
	}
	
	let {
		coordinates,
		locationName,
		googleMapsApiKey
	}: Props = $props();
	
	let mapContainer = $state<HTMLElement>();
	let map = $state<google.maps.Map | null>(null);
	let marker = $state<google.maps.Marker | null>(null);
	let isLoaded = $state(false);
	
	// Load Google Maps
	async function loadMap() {
		if (!browser || !googleMapsApiKey || !mapContainer) return;
		
		// Check if Google Maps is loaded
		if (!window.google?.maps) {
			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&loading=async`;
			script.async = true;
			
			await new Promise<void>((resolve) => {
				script.onload = () => {
					setTimeout(resolve, 100);
				};
				document.head.appendChild(script);
			});
		}
		
		if (!window.google?.maps) return;
		
		// Create map
		map = new google.maps.Map(mapContainer, {
			center: coordinates,
			zoom: 15,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: false,
			zoomControl: true
		});
		
		// Add marker
		// Note: Using standard Marker API which is still fully supported by Google
		// AdvancedMarkerElement is recommended but requires additional setup with marker library
		// Standard Marker will continue to receive bug fixes and work indefinitely
		marker = new google.maps.Marker({
			position: coordinates,
			map: map,
			title: locationName
		});
		
		isLoaded = true;
	}
	
	onMount(() => {
		loadMap();
	});
	
	onDestroy(() => {
		if (marker) {
			marker.setMap(null);
		}
	});
	
	// Get directions URL
	function getDirectionsUrl(): string {
		return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
	}
</script>

<div>
		<!-- Map Container -->
		{#if googleMapsApiKey}
			<div 
				bind:this={mapContainer}
				class="map-container"
			>
				{#if !isLoaded}
					<div class="w-full h-full flex items-center justify-center">
						<div class="text-center">
							<div class="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" style="color: var(--text-secondary);"></div>
							<p class="text-xs" style="color: var(--text-secondary);">Loading map...</p>
						</div>
					</div>
				{/if}
			</div>
			
		{:else}
			<!-- No API key -->
			<div class="text-center p-6 rounded-lg" style="background: var(--bg-secondary);">
				<MapPin class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Map unavailable</p>
			</div>
		{/if}
		
		<!-- Get Directions Button -->
		<div class="mt-3">
			<button 
				onclick={() => window.open(getDirectionsUrl(), '_blank')}
				type="button"
				class="button-accent button--full-width button-gap"
			>
				<Navigation class="w-4 h-4" />
				Get Directions
			</button>
		</div>
</div>

<style>
	.map-container {
		width: 100%;
		height: 350px;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	@media (min-width: 768px) {
		.map-container {
			height: 400px;
		}
	}
	
	@media (min-width: 1024px) {
		.map-container {
			height: 450px;
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>

