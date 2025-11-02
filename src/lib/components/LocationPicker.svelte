<script lang="ts">
	import { onDestroy } from 'svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Navigation from 'lucide-svelte/icons/navigation';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import GoogleMapPickerModal from './GoogleMapPickerModal.svelte';
	import { defaultMapService, getPlacesAPIService } from '$lib/utils/map-integration.js';
	import { env } from '$env/dynamic/public';
	import { MEETING_POINT_TYPES } from '$lib/types/places.js';
	import type { PlaceSuggestion } from '$lib/types/places.js';
	
	// Cleanup on component destroy
	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
	});
	
	interface Props {
		value: string;
		placeId?: string | null;
		placeholder?: string;
		label?: string;
		profileLocation?: string;
		onLocationSelect?: (location: string) => void;
		enableGeolocation?: boolean;
		enableMapsIntegration?: boolean;
	}
	
	let {
		value = $bindable(),
		placeId = $bindable(null),
		placeholder = 'Enter location...',
		label = 'Location',
		profileLocation = '',
		onLocationSelect,
		enableGeolocation = true,
		enableMapsIntegration = false
	}: Props = $props();
	
	let isGeolocating = $state(false);
	let locationSuggestions = $state<(PlaceSuggestion | any)[]>([]);
	let showSuggestions = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let showMapPicker = $state(false);
	let isSearching = $state(false);
	let usePlacesAPI = $state(true); // Flag to enable/disable Places API
	
	// Track selected place ID for potential future use (e.g., getting details)
	let selectedPlaceId = $state<string | null>(null);
	
	// Popular location suggestions based on common tour locations
	const popularLocations = [
		'City Center',
		'Old Town Square',
		'Central Park',
		'Historic District',
		'Downtown',
		'Harbor Area',
		'Cathedral Square',
		'Market Square',
		'Riverside',
		'Museum Quarter'
	];
	
	// Get user's current location
	async function getCurrentLocation() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}
		
		isGeolocating = true;
		
		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000 // 5 minutes
				});
			});
			
			const coordinates = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			
			// Try to reverse geocode to get human-readable address
			try {
				const result = await defaultMapService.reverseGeocode(coordinates);
				// Use full address - no truncation for precise location selection
				value = result.fullAddress;
				onLocationSelect?.(result.fullAddress);
			} catch (reverseGeocodeError) {
				console.warn('Reverse geocoding failed, using coordinates:', reverseGeocodeError);
				// Fallback to coordinates if reverse geocoding fails
				const lat = coordinates.lat.toFixed(6);
				const lng = coordinates.lng.toFixed(6);
				const locationString = `${lat}, ${lng}`;
				value = locationString;
				onLocationSelect?.(locationString);
			}
			
		} catch (error) {
			console.error('Error getting location:', error);
			alert('Unable to get your location. Please enter it manually.');
		} finally {
			isGeolocating = false;
		}
	}
	
	// Search for location suggestions using Places API (New) with Geocoding fallback
	async function searchLocations(query: string) {
		if (!query.trim() || isSearching) return;
		
		isSearching = true;
		try {
			let realResults: any[] = [];
			
			if (usePlacesAPI) {
				// Try Places API (New) first - better autocomplete for landmarks and POIs
				console.log('🗺️ Using Places API (New) for autocomplete');
				const placesService = getPlacesAPIService();
				// Don't filter by types to get broader results (includes all landmarks)
				// We can add type filtering later for more specific use cases
				const placeSuggestions = await placesService.searchLocationsWithPlacesAPI(query, {
					// types: MEETING_POINT_TYPES, // Commented out - too restrictive
					sessionToken: undefined // TODO: Implement session tokens for cost optimization
				});
				
				// Transform PlaceSuggestion to match our interface
				realResults = placeSuggestions.map(suggestion => ({
					placeId: suggestion.placeId,
					name: suggestion.name,
					fullAddress: suggestion.fullAddress || suggestion.name,
					type: suggestion.type,
					isPlace: true // Mark as coming from Places API
				}));
				
				console.log(`✅ Places API returned ${realResults.length} results`);
			}
			
			// Fallback to Geocoding API if Places API returns no results or is disabled
			if (realResults.length === 0) {
				console.log('🔄 Falling back to Geocoding API');
				const geocodingResults = await defaultMapService.searchLocations(query);
				realResults = geocodingResults.map(result => ({
					...result,
					isPlace: false // Mark as coming from Geocoding API
				}));
			}
			
			// Filter popular locations that match query
			const popularMatches = popularLocations
				.filter(loc => loc.toLowerCase().includes(query.toLowerCase()))
				.map(loc => ({ 
					name: loc, 
					fullAddress: loc, 
					type: 'popular',
					isPlace: false
				}));
			
			// Combine results: prioritize Places API results, then add popular matches
			const combined = [...realResults.slice(0, 5), ...popularMatches.slice(0, 1)];
			locationSuggestions = combined.slice(0, 6);
			showSuggestions = locationSuggestions.length > 0;
		} catch (error) {
			console.error('Location search failed:', error);
			// Fallback to popular locations only
			const filtered = popularLocations.filter(loc => 
				loc.toLowerCase().includes(query.toLowerCase())
			).map(loc => ({ 
				name: loc, 
				fullAddress: loc, 
				type: 'popular',
				isPlace: false
			}));
			locationSuggestions = filtered.slice(0, 6);
			showSuggestions = filtered.length > 0;
		} finally {
			isSearching = false;
		}
	}
	
	// Debounced search for auto-complete
	function handleSearchInput(query: string) {
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Clear results if input is too short or empty
		if (query.trim().length < 2) {
			locationSuggestions = [];
			showSuggestions = false;
			return;
		}
		
		// Debounce search to avoid too many API calls
		searchTimeout = setTimeout(() => {
			searchLocations(query);
		}, 300); // 300ms delay
	}
	
	function selectSuggestion(suggestion: any) {
		// Use the full address text from autocomplete (what user saw and clicked)
		// This ensures "what you see is what you get" UX
		const selectedLocation = suggestion.fullAddress || suggestion.name;
		value = selectedLocation;
		
		// Store place ID if this is from Places API
		if (suggestion.isPlace && suggestion.placeId) {
			selectedPlaceId = suggestion.placeId;
			placeId = suggestion.placeId; // Bind to parent component
			console.log('📍 Selected:', selectedLocation, '| Place ID:', selectedPlaceId);
		} else {
			selectedPlaceId = null;
			placeId = null;
		}
		
		onLocationSelect?.(selectedLocation);
		showSuggestions = false;
		locationSuggestions = [];
	}
	
	function useProfileLocation() {
		if (profileLocation) {
			value = profileLocation;
			placeId = null; // Profile location doesn't have a place ID
			selectedPlaceId = null;
			onLocationSelect?.(profileLocation);
		}
	}
	
	// Handle input changes for search functionality
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;
		// Trigger search functionality
		handleSearchInput(newValue);
	}
	
	// Clear the location input
	function clearLocation() {
		value = '';
		placeId = null;
		selectedPlaceId = null;
		showSuggestions = false;
		locationSuggestions = [];
		onLocationSelect?.('');
	}
	
	// Open map picker modal
	function openMapPicker() {
		showMapPicker = true;
	}
	
	// Handle location selection from map
	function handleMapLocationSelect(location: string, coordinates: any) {
		// Use full address - no truncation for precise location selection
		value = location;
		onLocationSelect?.(location);
		showMapPicker = false;
	}
</script>

<div class="space-y-2">
	<label for="location-input" class="form-label">
		{label}
	</label>
	
	<div class="relative">
		<div class="relative">
			<MapPin class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10" style="color: var(--text-tertiary); pointer-events: none;" />
			<input
				id="location-input"
				type="text"
				bind:value={value}
				oninput={handleInput}
				onblur={() => {
					// Delay hiding suggestions to allow clicks
					setTimeout(() => {
						showSuggestions = false;
					}, 200);
				}}
				onfocus={() => {
					if (locationSuggestions.length > 0) {
						showSuggestions = true;
					}
				}}
				placeholder={placeholder}
				class="form-input form-input--no-transform pl-10 pr-12 relative z-0"
				autocomplete="off"
			/>
			{#if value && value.trim()}
				<button
					type="button"
					onclick={clearLocation}
					class="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded hover:bg-opacity-20 transition-colors z-10"
					style="color: var(--text-tertiary); background: transparent;"
					aria-label="Clear location"
				>
					<X class="h-4 w-4" />
				</button>
			{:else}
				<Search class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10" style="color: var(--text-tertiary); pointer-events: none;" />
			{/if}
		</div>
		
				<!-- Location suggestions dropdown -->
		{#if showSuggestions && (locationSuggestions.length > 0 || isSearching)}
			<div class="location-suggestions-dropdown">
				<div class="max-h-48 overflow-y-auto">
				{#if isSearching}
					<div class="px-3 py-2 text-sm flex items-center gap-2" style="color: var(--text-secondary);">
						<div class="animate-spin w-4 h-4 border border-current border-t-transparent rounded-full"></div>
						Searching locations...
					</div>
				{/if}
				{#each locationSuggestions as suggestion}
					<button
						type="button"
						onclick={() => selectSuggestion(suggestion)}
						class="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 flex items-start gap-2"
						style="background: var(--bg-primary); color: var(--text-primary);"
					>
						<MapPin class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--text-secondary);" />
						<div class="flex-1 min-w-0">
							<div class="font-medium">{suggestion.name}</div>
							{#if suggestion.fullAddress && suggestion.fullAddress !== suggestion.name}
								<div class="text-xs truncate" style="color: var(--text-secondary);">{suggestion.fullAddress}</div>
							{/if}
							{#if suggestion.type === 'popular'}
								<div class="text-xs" style="color: var(--color-primary-600);">Popular location</div>
							{/if}
						</div>
					</button>
				{/each}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Quick action buttons -->
	<div class="location-actions-container">
		<!-- Use profile location (full width) -->
		{#if profileLocation && value !== profileLocation}
			<button
				type="button"
				onclick={useProfileLocation}
				class="location-action-button location-action-button--profile"
				title="Use my location: {profileLocation}"
			>
				<MapPin class="w-3 h-3 flex-shrink-0" />
				<span class="truncate">{profileLocation}</span>
			</button>
		{/if}
		
		<!-- Other buttons row (stretched equally) -->
		<div class="location-actions-secondary">
			<!-- Current location -->
			{#if enableGeolocation}
				<button
					type="button"
					onclick={getCurrentLocation}
					disabled={isGeolocating}
					class="location-action-button"
					class:disabled={isGeolocating}
				>
					{#if isGeolocating}
						<div class="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
					{:else}
						<Navigation class="w-3 h-3" />
					{/if}
					{isGeolocating ? 'Getting location...' : 'Use current location'}
				</button>
			{/if}
			
			<!-- Map picker (future feature) -->
			{#if enableMapsIntegration}
				<button
					type="button"
					onclick={openMapPicker}
					class="location-action-button"
				>
					<Search class="w-3 h-3" />
					Pick on map
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Google Map Picker Modal -->
<GoogleMapPickerModal
	bind:isOpen={showMapPicker}
	initialLocation={value}
	googleMapsApiKey={env.PUBLIC_GOOGLE_MAPS_API_KEY || ''}
	onLocationSelect={handleMapLocationSelect}
	onClose={() => { showMapPicker = false; }}
/>

<style>
	.location-actions-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.location-actions-secondary {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.location-action-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 0.375rem;
		border: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		color: var(--text-secondary);
		transition: all 0.15s ease;
		cursor: pointer;
		white-space: nowrap;
		flex: 1;
	}
	
	.location-action-button--profile {
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}
	
	.location-action-button--profile span {
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		display: block;
	}
	
	/* Desktop: Stacked full-width layout */
	@media (min-width: 641px) {
		.location-actions-container {
			flex-direction: column;
		}
		
		.location-actions-secondary {
			width: 100%;
		}
		
		.location-action-button--profile {
			width: 100%;
			max-width: 100%;
		}
	}
	
	/* Mobile: Stacked full-width buttons */
	@media (max-width: 640px) {
		.location-actions-container {
			align-items: stretch;
		}
		
		.location-actions-secondary {
			width: 100%;
			justify-content: center;
		}
		
		.location-action-button {
			font-size: 0.75rem;
			padding: 0.5rem 0.75rem;
		}
		
		.location-action-button--profile {
			width: 100%;
		}
	}
	
	.location-action-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
	}
	
	.location-action-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.location-action-button.disabled:hover {
		transform: none;
	}
	
	
	:root[data-theme='dark'] .location-action-button {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}
	
	:root[data-theme='dark'] .location-action-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	/* Location suggestions dropdown - High z-index for modal compatibility */
	.location-suggestions-dropdown {
		position: absolute;
		z-index: 9999; /* Very high to appear above modals */
		width: 100%;
		margin-top: 0.25rem;
		border-radius: 0.375rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
	}
</style> 