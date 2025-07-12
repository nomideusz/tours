<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Modal from './Modal.svelte';
	import { defaultMapService } from '$lib/utils/map-integration.js';
	import type { LocationCoordinates } from '$lib/utils/map-integration.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Search from 'lucide-svelte/icons/search';
	import Navigation from 'lucide-svelte/icons/navigation';
	import Check from 'lucide-svelte/icons/check';
	
	interface Props {
		isOpen: boolean;
		initialLocation?: string;
		initialCoordinates?: LocationCoordinates;
		onLocationSelect: (location: string, coordinates: LocationCoordinates) => void;
		onClose: () => void;
	}
	
	let {
		isOpen = $bindable(),
		initialLocation = '',
		initialCoordinates,
		onLocationSelect,
		onClose
	}: Props = $props();
	
	let mapContainer: HTMLElement;
	let map = $state<any>(null);
	let currentMarker = $state<any>(null);
	let searchInput = $state('');
	let selectedLocation = $state('');
	let selectedCoordinates = $state<LocationCoordinates | null>(null);
	let isSearching = $state(false);
	let searchResults = $state<any[]>([]);
	let isGettingLocation = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Default coordinates (Berlin, Germany - central Europe)
	const defaultCoords = { lat: 52.5200, lng: 13.4050 };
	
	// Load Leaflet dynamically
	async function loadLeaflet() {
		if (typeof window === 'undefined') return null;
		
		// Load Leaflet CSS
		if (!document.querySelector('link[href*="leaflet"]')) {
			const css = document.createElement('link');
			css.rel = 'stylesheet';
			css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
			css.crossOrigin = '';
			document.head.appendChild(css);
		}
		
		// Load Leaflet JS
		if (!(window as any).L) {
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
			script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
			script.crossOrigin = '';
			
			await new Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}
		
		return (window as any).L;
	}
	
	// Initialize map when modal opens
	$effect(() => {
		if (isOpen && browser && mapContainer && !map) {
			initializeMap();
		}
	});
	
	// Pre-populate search input with initial location
	$effect(() => {
		if (isOpen && initialLocation && !searchInput) {
			searchInput = initialLocation;
		}
	});
	
	async function initializeMap() {
		try {
			const L = await loadLeaflet();
			if (!L || !mapContainer) return;
			
			let initialCoords = initialCoordinates || defaultCoords;
			let shouldAddMarker = false;
			let markerText = initialLocation;
			
			// If we have a location text but no coordinates, try to geocode it
			if (initialLocation && !initialCoordinates) {
				try {
					const results = await defaultMapService.searchLocations(initialLocation);
					if (results.length > 0) {
						initialCoords = results[0].coordinates;
						shouldAddMarker = true;
						markerText = results[0].fullAddress;
						// Pre-select this location
						selectedLocation = results[0].fullAddress;
						selectedCoordinates = results[0].coordinates;
					}
				} catch (error) {
					console.warn('Failed to geocode initial location:', error);
				}
			} else if (initialCoordinates) {
				shouldAddMarker = true;
			}
			
			// Create map
			map = L.map(mapContainer).setView([initialCoords.lat, initialCoords.lng], 13);
			
			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);
			
			// Add initial marker if we have coordinates
			if (shouldAddMarker) {
				addMarker(initialCoords, markerText);
			}
			
			// Handle map clicks
			map.on('click', async (e: any) => {
				const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
				await handleMapClick(coords);
			});
			
		} catch (error) {
			console.error('Failed to load map:', error);
		}
	}
	
	async function handleMapClick(coordinates: LocationCoordinates) {
		// Add marker at clicked location
		addMarker(coordinates);
		selectedCoordinates = coordinates;
		
		// Try to get address for the coordinates
		try {
			const result = await defaultMapService.reverseGeocode(coordinates);
			selectedLocation = result.fullAddress;
		} catch (error) {
			console.warn('Reverse geocoding failed:', error);
			selectedLocation = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
		}
	}
	
	function addMarker(coordinates: LocationCoordinates, popupText?: string) {
		if (!map) return;
		
		const L = (window as any).L;
		
		// Remove existing marker
		if (currentMarker) {
			map.removeLayer(currentMarker);
		}
		
		// Add new marker
		currentMarker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
		
		if (popupText) {
			currentMarker.bindPopup(popupText).openPopup();
		}
	}
	
	async function searchLocation() {
		if (!searchInput.trim() || isSearching) return;
		
		isSearching = true;
		try {
			const results = await defaultMapService.searchLocations(searchInput);
			searchResults = results.slice(0, 5); // Limit to 5 results
		} catch (error) {
			console.error('Search failed:', error);
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}
	
	// Debounced search for auto-complete
	function handleSearchInput() {
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Clear results if input is too short
		if (searchInput.trim().length < 2) {
			searchResults = [];
			return;
		}
		
		// Debounce search to avoid too many API calls
		searchTimeout = setTimeout(() => {
			searchLocation();
		}, 300); // 300ms delay
	}
	
	function selectSearchResult(result: any) {
		if (!map) return;
		
		const coordinates = result.coordinates;
		
		// Center map on selected location
		map.setView([coordinates.lat, coordinates.lng], 15);
		
		// Add marker
		addMarker(coordinates, result.fullAddress);
		
		// Update state
		selectedLocation = result.fullAddress;
		selectedCoordinates = coordinates;
		searchInput = result.fullAddress;
		searchResults = [];
	}
	
	async function getCurrentLocation() {
		if (!navigator.geolocation || !map) return;
		
		isGettingLocation = true;
		
		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000
				});
			});
			
			const coordinates = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			
			// Center map on current location
			map.setView([coordinates.lat, coordinates.lng], 15);
			await handleMapClick(coordinates);
			
		} catch (error) {
			console.error('Failed to get current location:', error);
			alert('Unable to get your current location. Please select a location on the map.');
		} finally {
			isGettingLocation = false;
		}
	}
	
	function handleConfirm() {
		if (selectedCoordinates && selectedLocation) {
			onLocationSelect(selectedLocation, selectedCoordinates);
			handleClose();
		}
	}
	
	function handleClose() {
		// Clean up map
		if (map) {
			map.remove();
			map = null;
			currentMarker = null;
		}
		
		// Clean up search timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		
		// Reset state
		searchInput = '';
		searchResults = [];
		selectedLocation = '';
		selectedCoordinates = null;
		
		onClose();
	}
	
	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<Modal bind:isOpen={isOpen} onClose={handleClose} size="lg" closeOnClickOutside={false} title="Select Meeting Point" subtitle="Click on the map to set the exact meeting location for your tour">
	<div class="flex flex-col h-[70vh] max-h-[600px]">
		<!-- Search and Controls -->
		<div class="p-4 border-b space-y-3" style="border-color: var(--border-primary);">
			<!-- Search Bar -->
			<div class="relative">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="text"
						bind:value={searchInput}
						placeholder="Search for a location..."
						class="form-input pl-10 pr-12"
						oninput={handleSearchInput}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								searchLocation();
							}
						}}
					/>
					<button
						onclick={searchLocation}
						disabled={isSearching || !searchInput.trim()}
						class="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs rounded-md transition-colors disabled:opacity-50"
						style="background: var(--color-primary-600); color: white;"
					>
						{isSearching ? 'Searching...' : 'Search'}
					</button>
				</div>
				
				<!-- Search Results -->
				{#if searchResults.length > 0}
					<div class="absolute z-10 w-full mt-1 rounded-md shadow-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="max-h-48 overflow-y-auto">
							{#each searchResults as result}
								<button
									type="button"
									onclick={() => selectSearchResult(result)}
									class="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 flex items-start gap-2"
									style="background: var(--bg-primary); color: var(--text-primary);"
								>
									<MapPin class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--text-secondary);" />
									<div class="flex-1 min-w-0">
										<div class="font-medium">{result.name}</div>
										<div class="text-xs truncate" style="color: var(--text-secondary);">{result.fullAddress}</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Controls -->
			<div class="flex items-center gap-2">
				<button
					onclick={getCurrentLocation}
					disabled={isGettingLocation}
					class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors hover:bg-opacity-80 disabled:opacity-50"
					style="
						background: var(--color-success-50);
						border-color: var(--color-success-200);
						color: var(--color-success-700);
					"
				>
					{#if isGettingLocation}
						<div class="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
					{:else}
						<Navigation class="w-3 h-3" />
					{/if}
					{isGettingLocation ? 'Getting location...' : 'Use my location'}
				</button>
				
				{#if selectedLocation}
					<div class="flex-1 text-xs" style="color: var(--text-secondary);">
						Selected: {selectedLocation}
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Map Container -->
		<div class="flex-1 relative">
			<div bind:this={mapContainer} class="w-full h-full"></div>
			
			{#if !map}
				<div class="absolute inset-0 flex items-center justify-center" style="background: var(--bg-secondary);">
					<div class="text-center">
						<div class="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" style="color: var(--color-primary-600);"></div>
						<p class="text-sm" style="color: var(--text-secondary);">Loading map...</p>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Footer -->
		<div class="p-4 border-t flex items-center justify-between" style="border-color: var(--border-primary);">
			<div class="text-xs" style="color: var(--text-secondary);">
				Click anywhere on the map to set your meeting point
			</div>
			
			<div class="flex items-center gap-2">
				<button
					onclick={handleClose}
					class="button-secondary button--small"
				>
					Cancel
				</button>
				<button
					onclick={handleConfirm}
					disabled={!selectedCoordinates}
					class="button-primary button--small button--gap disabled:opacity-50"
				>
					<Check class="w-4 h-4" />
					Select Location
				</button>
			</div>
		</div>
	</div>
</Modal>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style> 