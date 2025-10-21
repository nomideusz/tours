<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Drawer from './Drawer.svelte';
	import type { LocationCoordinates } from '$lib/utils/map-integration.js';
	import { truncateLocation } from '$lib/utils/location.js';
	
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
		googleMapsApiKey: string;
	}
	
	let {
		isOpen = $bindable(),
		initialLocation = '',
		initialCoordinates,
		onLocationSelect,
		onClose,
		googleMapsApiKey
	}: Props = $props();
	
	let mapContainer: HTMLElement;
	let map = $state<google.maps.Map | null>(null);
	let currentMarker = $state<google.maps.Marker | null>(null);
	let searchBox = $state<google.maps.places.SearchBox | null>(null);
	let searchInput = $state('');
	let selectedLocation = $state('');
	let selectedCoordinates = $state<LocationCoordinates | null>(null);
	let isGettingLocation = $state(false);
	let isInitialized = $state(false);
	let searchSuggestions = $state<any[]>([]);
	let showSuggestions = $state(false);
	let isSearching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Default coordinates (Berlin, Germany - central Europe)
	const defaultCoords = { lat: 52.5200, lng: 13.4050 };
	
	// Load Google Maps API dynamically
	async function loadGoogleMaps() {
		if (typeof window === 'undefined') return false;
		
		// Check if already loaded
		if (window.google?.maps?.Map) {
			return true;
		}
		
		// Load Google Maps script
		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
		script.async = true;
		script.defer = true;
		
		return new Promise<boolean>((resolve, reject) => {
			script.onload = () => {
				// Wait a bit for Maps API to fully initialize
				setTimeout(() => {
					if (window.google?.maps?.Map) {
						resolve(true);
					} else {
						reject(false);
					}
				}, 100);
			};
			script.onerror = () => {
				console.error('Failed to load Google Maps');
				reject(false);
			};
			document.head.appendChild(script);
		});
	}
	
	// Initialize map when modal opens
	$effect(() => {
		if (isOpen && browser && mapContainer && !isInitialized && googleMapsApiKey) {
			// Add a small delay to ensure container has proper dimensions
			setTimeout(() => {
				if (mapContainer && !isInitialized) {
					initializeMap();
				}
			}, 100);
		}
	});
	
	// Set initial search input value
	$effect(() => {
		if (isOpen && initialLocation) {
			searchInput = initialLocation;
		}
	});
	
	async function initializeMap() {
		try {
			// Load Google Maps API
			const loaded = await loadGoogleMaps();
			if (!loaded || !window.google?.maps) {
				console.error('Google Maps failed to load');
				return;
			}
			
			// Ensure the container has proper dimensions
			const rect = mapContainer.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				console.warn('Map container has zero dimensions, retrying...', rect);
				setTimeout(() => initializeMap(), 100);
				return;
			}
			
			let initialCoords = initialCoordinates || defaultCoords;
			let shouldAddMarker = false;
			let markerTitle = initialLocation;
			
			// If we have a location text but no coordinates, try to geocode it
			if (initialLocation && !initialCoordinates) {
				try {
					const geocoder = new google.maps.Geocoder();
					const result = await geocoder.geocode({ address: initialLocation });
					
					if (result.results.length > 0) {
						const location = result.results[0].geometry.location;
						initialCoords = { lat: location.lat(), lng: location.lng() };
						shouldAddMarker = true;
						markerTitle = result.results[0].formatted_address;
						selectedLocation = truncateLocation(result.results[0].formatted_address);
						selectedCoordinates = initialCoords;
					}
				} catch (error) {
					console.warn('Failed to geocode initial location:', error);
				}
			} else if (initialCoordinates) {
				shouldAddMarker = true;
			}
			
			// Verify Google Maps API is fully loaded
			if (!google?.maps?.Map || !google?.maps?.MapTypeControlStyle) {
				console.error('Google Maps API not fully loaded');
				setTimeout(() => initializeMap(), 200);
				return;
			}
			
			// Create map
			map = new google.maps.Map(mapContainer, {
				center: initialCoords,
				zoom: 15,
				mapTypeControl: true,
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
				},
				streetViewControl: true,
				fullscreenControl: false
			});
			
			// Add initial marker if we have coordinates
			if (shouldAddMarker) {
				addMarker(initialCoords, markerTitle);
			}
			
			// Handle map clicks
			map.addListener('click', async (e: google.maps.MapMouseEvent) => {
				if (e.latLng) {
					const coords = {
						lat: e.latLng.lat(),
						lng: e.latLng.lng()
					};
					await handleMapClick(coords);
				}
			});
			
			isInitialized = true;
		} catch (error) {
			console.error('Failed to load Google Maps:', error);
		}
	}
	
	async function handleMapClick(coordinates: LocationCoordinates) {
		// Reverse geocode to get address
		try {
			const geocoder = new google.maps.Geocoder();
			const result = await geocoder.geocode({ location: coordinates });
			
			if (result.results.length > 0) {
				const address = result.results[0].formatted_address;
				addMarker(coordinates, address);
				selectedLocation = truncateLocation(address);
				selectedCoordinates = coordinates;
			} else {
				// If geocoding fails, use coordinates as location
				const locationString = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
				addMarker(coordinates, locationString);
				selectedLocation = locationString;
				selectedCoordinates = coordinates;
			}
		} catch (error) {
			console.error('Reverse geocoding failed:', error);
			const locationString = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
			addMarker(coordinates, locationString);
			selectedLocation = locationString;
			selectedCoordinates = coordinates;
		}
	}
	
	function addMarker(coordinates: LocationCoordinates, title: string = '') {
		if (!map) return;
		
		// Remove existing marker
		if (currentMarker) {
			currentMarker.setMap(null);
		}
		
		// Create new marker using standard Marker (AdvancedMarkerElement requires more setup)
		// We'll keep using the standard marker as it's still supported and simpler
		currentMarker = new google.maps.Marker({
			position: coordinates,
			map: map,
			title: title,
			animation: google.maps.Animation.DROP
		});
		
		// Center map on marker
		map.panTo(coordinates);
	}
	
	async function getCurrentPosition() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}
		
		isGettingLocation = true;
		
		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0
				});
			});
			
			const coords = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			
			await handleMapClick(coords);
		} catch (error) {
			console.error('Error getting location:', error);
			alert('Unable to get your location');
		} finally {
			isGettingLocation = false;
		}
	}
	
	// Debounced search for autocomplete
	async function searchLocationsAutocomplete(query: string) {
		if (!query.trim() || query.length < 2) {
			searchSuggestions = [];
			showSuggestions = false;
			return;
		}
		
		isSearching = true;
		showSuggestions = true;
		
		try {
			// Use our server endpoint for geocoding
			const response = await fetch(`/api/maps/geocode?query=${encodeURIComponent(query)}`);
			const data = await response.json();
			
			if (data.results && data.results.length > 0) {
				searchSuggestions = data.results;
			} else {
				searchSuggestions = [];
			}
		} catch (error) {
			console.error('Search failed:', error);
			searchSuggestions = [];
		} finally {
			isSearching = false;
		}
	}
	
	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const query = target.value;
		
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Clear suggestions if query too short
		if (query.trim().length < 2) {
			searchSuggestions = [];
			showSuggestions = false;
			return;
		}
		
		// Debounce search
		searchTimeout = setTimeout(() => {
			searchLocationsAutocomplete(query);
		}, 300);
	}
	
	function selectSearchSuggestion(suggestion: any) {
		const coords = suggestion.coordinates;
		const address = suggestion.fullAddress;
		
		// Update search input
		searchInput = address;
		
		// Add marker and select location
		addMarker(coords, address);
		selectedLocation = truncateLocation(address);
		selectedCoordinates = coords;
		
		// Pan to location
		map?.setCenter(coords);
		
		// Hide suggestions
		showSuggestions = false;
		searchSuggestions = [];
	}
	
	function handleSearch() {
		if (!searchInput.trim() || !map) return;
		
		// Hide suggestions
		showSuggestions = false;
		
		// Use Google Maps Geocoder for search
		const geocoder = new google.maps.Geocoder();
		geocoder.geocode({ address: searchInput }, (results, status) => {
			if (status === 'OK' && results && results.length > 0) {
				const result = results[0];
				const location = result.geometry.location;
				const coords = { lat: location.lat(), lng: location.lng() };
				
				addMarker(coords, result.formatted_address);
				selectedLocation = truncateLocation(result.formatted_address);
				selectedCoordinates = coords;
				
				// Pan to location
				map?.setCenter(location);
			} else {
				alert('Location not found. Please try a different search term.');
			}
		});
	}
	
	function handleConfirm() {
		if (selectedLocation && selectedCoordinates) {
			onLocationSelect(selectedLocation, selectedCoordinates);
		}
		handleClose();
	}
	
	function handleClose() {
		// Clean up
		if (currentMarker) {
			currentMarker.setMap(null);
			currentMarker = null;
		}
		
		searchInput = '';
		selectedLocation = '';
		selectedCoordinates = null;
		isInitialized = false;
		map = null;
		
		onClose();
	}
	
	onDestroy(() => {
		if (currentMarker) {
			currentMarker.setMap(null);
		}
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
	});
</script>

<Drawer 
	{isOpen} 
	onClose={handleClose}
	title="Select Location"
	class="!max-w-7xl"
>
	<div class="h-full flex flex-col -mx-6 -my-6" style="min-height: 70vh;">
		<!-- Search Bar -->
		<div class="px-6 py-4 border-b" style="border-color: var(--border-primary); background: var(--bg-primary);">
			<div class="flex gap-2">
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10" style="color: var(--text-tertiary); pointer-events: none;" />
					<input
						type="text"
						bind:value={searchInput}
						oninput={handleSearchInput}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								showSuggestions = false;
								handleSearch();
							} else if (e.key === 'Escape') {
								showSuggestions = false;
								searchSuggestions = [];
							}
						}}
						onblur={() => {
							// Delay hiding to allow clicking suggestions
							setTimeout(() => {
								showSuggestions = false;
							}, 200);
						}}
						onfocus={() => {
							if (searchSuggestions.length > 0) {
								showSuggestions = true;
							}
						}}
						placeholder="Search for a location..."
						class="form-input pl-10 relative z-0"
						autocomplete="off"
					/>
					
					<!-- Autocomplete Suggestions Dropdown -->
					{#if showSuggestions && (searchSuggestions.length > 0 || isSearching)}
						<div class="absolute z-50 w-full mt-1 rounded-md shadow-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary); max-height: 300px; overflow-y: auto;">
							{#if isSearching}
								<div class="px-3 py-2 text-sm flex items-center gap-2" style="color: var(--text-secondary);">
									<div class="animate-spin w-4 h-4 border border-current border-t-transparent rounded-full"></div>
									Searching...
								</div>
							{/if}
							{#each searchSuggestions as suggestion}
								<button
									type="button"
									onclick={() => selectSearchSuggestion(suggestion)}
									class="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 flex items-start gap-2 transition-colors"
									style="background: var(--bg-primary); color: var(--text-primary);"
								>
									<MapPin class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--text-secondary);" />
									<div class="flex-1 min-w-0">
										<div class="font-medium">{suggestion.name}</div>
										{#if suggestion.fullAddress && suggestion.fullAddress !== suggestion.name}
											<div class="text-xs truncate" style="color: var(--text-secondary);">{suggestion.fullAddress}</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<button
					type="button"
					onclick={handleSearch}
					class="button-primary"
					title="Search"
				>
					<Search class="w-4 h-4" />
				</button>
				<button
					type="button"
					onclick={getCurrentPosition}
					disabled={isGettingLocation}
					class="button-secondary"
					title="Use current location"
				>
					{#if isGettingLocation}
						<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
					{:else}
						<Navigation class="w-4 h-4" />
					{/if}
				</button>
			</div>
			
			<!-- Selected Location Display -->
			{#if selectedLocation}
				<div class="mt-3 p-3 rounded-lg flex items-center gap-2" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
					<MapPin class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
					<span class="text-sm flex-1" style="color: var(--color-success-900);">
						{selectedLocation}
					</span>
				</div>
			{/if}
		</div>
		
		<!-- Map Container -->
		<div class="flex-1 relative" style="min-height: 65vh;">
			<div 
				bind:this={mapContainer}
				class="w-full h-full"
				style="min-height: 65vh;"
			></div>
			
			<!-- Loading Overlay -->
			{#if !isInitialized && googleMapsApiKey}
				<div class="absolute inset-0 flex items-center justify-center" style="background: var(--bg-primary);">
					<div class="text-center">
						<div class="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-2" style="border-color: var(--color-primary-500);"></div>
						<p class="text-sm" style="color: var(--text-secondary);">Loading Google Maps...</p>
					</div>
				</div>
			{/if}
			
			<!-- No API Key Warning -->
			{#if !googleMapsApiKey}
				<div class="absolute inset-0 flex items-center justify-center" style="background: var(--bg-secondary);">
					<div class="text-center px-4">
						<MapPin class="w-12 h-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">
							Google Maps API Key Required
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">
							Please configure PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables
						</p>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Action Buttons -->
		<div class="px-6 py-4 border-t flex gap-2" style="border-color: var(--border-primary); background: var(--bg-primary);">
			<button
				type="button"
				onclick={handleConfirm}
				disabled={!selectedLocation || !selectedCoordinates}
				class="button-primary flex-1"
			>
				<Check class="w-4 h-4 mr-2" />
				Confirm Location
			</button>
			<button
				type="button"
				onclick={handleClose}
				class="button-secondary"
			>
				Cancel
			</button>
		</div>
	</div>
</Drawer>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>

