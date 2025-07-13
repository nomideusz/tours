<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Drawer from './Drawer.svelte';
	import { defaultMapService } from '$lib/utils/map-integration.js';
	import type { LocationCoordinates } from '$lib/utils/map-integration.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Search from 'lucide-svelte/icons/search';
	import Navigation from 'lucide-svelte/icons/navigation';
	import Check from 'lucide-svelte/icons/check';
	import Layers from 'lucide-svelte/icons/layers';
	
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
	let currentTileLayer = $state<any>(null);
	let showMapStyles = $state(false);
	let selectedMapStyle = $state('osm');
	
	// Default coordinates (Berlin, Germany - central Europe)
	const defaultCoords = { lat: 52.5200, lng: 13.4050 };
	
	// Available map styles
	const mapStyles = [
		{
			id: 'osm',
			name: 'Street Map',
			description: 'Default street view',
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		},
		{
			id: 'carto-light',
			name: 'Clean',
			description: 'Minimal clean style',
			url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
		},
		{
			id: 'carto-dark',
			name: 'Dark',
			description: 'Dark theme style',
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
		},
		{
			id: 'topo',
			name: 'Topographic',
			description: 'Terrain and elevation',
			url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		},
		{
			id: 'carto-voyager',
			name: 'Voyager',
			description: 'Balanced detailed style',
			url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
		}
	];
	
	function getCurrentMapStyle() {
		return mapStyles.find(style => style.id === selectedMapStyle) || mapStyles[0];
	}
	
	// Add or update tile layer
	function addTileLayer() {
		if (!map) return;
		
		const L = (window as any).L;
		const style = getCurrentMapStyle();
		
		// Remove existing tile layer
		if (currentTileLayer) {
			map.removeLayer(currentTileLayer);
		}
		
		// Add new tile layer
		currentTileLayer = L.tileLayer(style.url, {
			attribution: style.attribution,
			maxZoom: 19
		}).addTo(map);
	}
	
	// Change map style
	function changeMapStyle(styleId: string) {
		selectedMapStyle = styleId;
		addTileLayer();
		showMapStyles = false;
	}
	
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
			// Add a small delay to ensure container has proper dimensions
			setTimeout(() => {
				if (mapContainer && !map) {
					initializeMap();
				}
			}, 100);
		}
	});
	
	// Mobile-specific touch handling to prevent drawer interference on non-map elements
	$effect(() => {
		if (isOpen && browser) {
			const handleTouchStart = (e: TouchEvent) => {
				// Only prevent drawer interference for non-map elements
				// Let the map handle its own touch events
				const target = e.target as HTMLElement;
				if (mapContainer && mapContainer.contains(target)) {
					// Allow map to handle touch events naturally
					return;
				}
				
				// For search controls, prevent unintended drawer closing
				if (target.closest('.search-controls')) {
					e.stopPropagation();
				}
			};
			
			document.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
			
			return () => {
				document.removeEventListener('touchstart', handleTouchStart, { capture: true });
			};
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
			
			// Ensure the container has proper dimensions
			const rect = mapContainer.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				console.warn('Map container has zero dimensions, retrying...', rect);
				setTimeout(() => initializeMap(), 100);
				return;
			}
			
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
			
			// Add tile layer with current style
			addTileLayer();
			
			// Force map to recalculate size (important for mobile)
			setTimeout(() => {
				if (map) {
					map.invalidateSize();
				}
			}, 200);
			
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
			currentTileLayer = null;
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
		showMapStyles = false;
		
		onClose();
	}
	
	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<Drawer 
	bind:isOpen={isOpen} 
	onClose={handleClose} 
	closeOnClickOutside={false} 
	title="Meeting Point"
	class="map-drawer"
>
	{#snippet children()}
		<div class="flex flex-col h-full min-h-[85vh] max-h-[90vh] sm:h-[70vh] sm:max-h-[600px]" style="touch-action: manipulation; overflow: hidden;">
		<!-- Search and Controls -->
		<div class="p-3 sm:p-4 border-b space-y-2 sm:space-y-3 flex-shrink-0 search-controls" style="border-color: var(--border-primary); background: var(--bg-primary);">
			<!-- Search Bar -->
			<div class="relative">
				<div class="flex gap-2">
					<div class="relative flex-1">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
						<input
							type="text"
							bind:value={searchInput}
							placeholder="Search for a location..."
							class="form-input pl-10 w-full"
							oninput={handleSearchInput}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									searchLocation();
								}
							}}
						/>
					</div>
					<button
						onclick={searchLocation}
						disabled={isSearching || !searchInput.trim()}
						class="px-3 py-2 text-xs rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
						style="background: var(--color-primary-600); color: white;"
					>
						<span class="sm:hidden">{isSearching ? '...' : 'Go'}</span>
						<span class="hidden sm:inline">{isSearching ? 'Searching...' : 'Search'}</span>
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
			<div class="space-y-2">
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
						<span class="sm:hidden">{isGettingLocation ? 'Getting...' : 'GPS'}</span>
						<span class="hidden sm:inline">{isGettingLocation ? 'Getting location...' : 'Use my location'}</span>
					</button>
					
					<!-- Map Style Selector -->
					<div class="relative" onclick={(e) => e.stopPropagation()}>
						<button
							onclick={() => showMapStyles = !showMapStyles}
							class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors hover:bg-opacity-80"
							style="
								background: var(--color-info-50);
								border-color: var(--color-info-200);
								color: var(--color-info-700);
							"
						>
							<Layers class="w-3 h-3" />
							<span class="sm:hidden">Style</span>
							<span class="hidden sm:inline">{getCurrentMapStyle().name}</span>
						</button>
						
						{#if showMapStyles}
							<div class="absolute z-[9999] top-full mt-1 left-0 w-48 rounded-md shadow-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
								<div class="py-1">
									{#each mapStyles as style}
										<button
											type="button"
											onclick={() => changeMapStyle(style.id)}
											class="w-full px-3 py-2 text-left text-xs hover:bg-opacity-80 flex items-start gap-2"
											style="background: {selectedMapStyle === style.id ? 'var(--bg-secondary)' : 'transparent'}; color: var(--text-primary);"
										>
											<div class="flex-1">
												<div class="font-medium">{style.name}</div>
												<div class="text-xs" style="color: var(--text-secondary);">{style.description}</div>
											</div>
											{#if selectedMapStyle === style.id}
												<Check class="w-3 h-3 mt-0.5" style="color: var(--color-primary-600);" />
											{/if}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
				
				{#if selectedLocation}
					<div class="text-xs p-2 rounded-md" style="background: var(--bg-secondary); color: var(--text-secondary);">
						<div class="font-medium mb-1" style="color: var(--text-primary);">Selected location:</div>
						<div class="break-words leading-relaxed">{selectedLocation}</div>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Map Container -->
		<div class="flex-1 relative min-h-0" onclick={() => { if (showMapStyles) showMapStyles = false; }} style="touch-action: manipulation; background: var(--bg-secondary);">
			<div bind:this={mapContainer} class="absolute inset-0 w-full h-full" style="touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; z-index: 1;"></div>
			
			{#if !map}
				<div class="absolute inset-0 flex items-center justify-center" style="background: var(--bg-secondary); z-index: 1000;">
					<div class="text-center">
						<div class="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" style="color: var(--color-primary-600);"></div>
						<p class="text-sm" style="color: var(--text-secondary);">Loading map...</p>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Footer -->
		<div class="p-3 sm:p-4 border-t flex items-center justify-between flex-shrink-0 map-footer" style="border-color: var(--border-primary); background: var(--bg-primary); position: relative; z-index: 10; padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));">
			<div class="text-xs flex-1 pr-4" style="color: var(--text-secondary);">
				<span class="hidden sm:inline">Click anywhere on the map to set your meeting point</span>
				<span class="sm:hidden">Tap map to select location</span>
			</div>
			
			<div class="flex items-center gap-2 flex-shrink-0">
				<button
					onclick={handleClose}
					class="button-secondary px-3 py-2 text-sm rounded-md font-medium footer-button"
				>
					Cancel
				</button>
				<button
					onclick={handleConfirm}
					disabled={!selectedCoordinates}
					class="button-primary px-3 py-2 text-sm rounded-md disabled:opacity-50 flex items-center gap-2 font-medium footer-button"
				>
					<Check class="w-4 h-4" />
					<span class="hidden sm:inline">Select Location</span>
					<span class="sm:hidden">Save</span>
				</button>
			</div>
		</div>
		</div>
	{/snippet}
</Drawer>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	/* Override drawer content styling for map */
	:global(.map-drawer .flex-1.overflow-y-auto) {
		overflow: hidden !important;
		touch-action: none !important;
	}
	
	/* Mobile-specific fixes */
	@media (max-width: 768px) {
		/* Make mobile drawer take up more space but leave room for footer */
		:global(.map-drawer .mobile-drawer-panel) {
			touch-action: manipulation !important;
		}
		
		:global(.map-drawer .rounded-t-xl) {
			max-height: 92vh !important;
		}
		
		/* Only remove padding from the main content wrapper, not individual sections */
		:global(.map-drawer .flex-1.overflow-y-auto .px-6.py-6) {
			padding: 0 !important;
		}
		
		:global(.map-drawer .overscroll-contain) {
			overscroll-behavior: none !important;
		}
	}
	
	/* Very small smartphone fixes */
	@media (max-width: 375px) and (max-height: 667px) {
		:global(.map-drawer .rounded-t-xl) {
			max-height: 90vh !important;
		}
		
		/* Reduce padding on very small screens */
		.search-controls {
			padding: 0.5rem !important;
		}
		
		.search-controls .space-y-2 > * + * {
			margin-top: 0.375rem !important;
		}
		
		/* Compact footer buttons */
		.footer-button {
			padding: 0.5rem 1rem !important;
			font-size: 0.8rem !important;
		}
		
		/* Ensure footer is always visible */
		.map-footer {
			padding: 0.5rem !important;
			min-height: 3rem !important;
		}
	}
	
	/* Extra small smartphones (like iPhone SE) */
	@media (max-width: 320px) and (max-height: 568px) {
		:global(.map-drawer .rounded-t-xl) {
			max-height: 88vh !important;
		}
		
		/* Even more aggressive space saving */
		.search-controls {
			padding: 0.375rem !important;
		}
		
		.search-controls .space-y-2 > * + * {
			margin-top: 0.25rem !important;
		}
		
		/* Smaller buttons */
		.search-controls button {
			padding: 0.375rem 0.75rem !important;
			font-size: 0.75rem !important;
		}
		
		/* Compact footer buttons */
		.footer-button {
			padding: 0.375rem 0.75rem !important;
			font-size: 0.75rem !important;
		}
		
		/* Ensure footer is always visible */
		.map-footer {
			padding: 0.375rem !important;
			min-height: 2.5rem !important;
		}
	}
</style> 