<script lang="ts">
	import { onDestroy } from 'svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Navigation from 'lucide-svelte/icons/navigation';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import GoogleMapPickerModal from './GoogleMapPickerModal.svelte';
	import { getMapService } from '$lib/utils/map-integration.js';
	import { truncateLocation } from '$lib/utils/location.js';
	import { env } from '$env/dynamic/public';
	
	// Cleanup on component destroy
	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
	});
	
	interface Props {
		value: string;
		placeholder?: string;
		label?: string;
		profileLocation?: string;
		onLocationSelect?: (location: string) => void;
		enableGeolocation?: boolean;
		enableMapsIntegration?: boolean;
	}
	
	let {
		value = $bindable(),
		placeholder = 'Enter location...',
		label = 'Location',
		profileLocation = '',
		onLocationSelect,
		enableGeolocation = true,
		enableMapsIntegration = false
	}: Props = $props();
	
	let isGeolocating = $state(false);
	let locationSuggestions = $state<any[]>([]);
	let showSuggestions = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let showMapPicker = $state(false);
	let isSearching = $state(false);
	
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
				const mapService = getMapService(env.PUBLIC_GOOGLE_MAPS_API_KEY);
				const result = await mapService.reverseGeocode(coordinates);
				const truncatedAddress = truncateLocation(result.fullAddress);
				value = truncatedAddress;
				onLocationSelect?.(truncatedAddress);
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
	
	// Search for location suggestions using real map service
	async function searchLocations(query: string) {
		if (!query.trim() || isSearching) return;
		
		isSearching = true;
		try {
			// Get real location results from map service
			const mapService = getMapService(env.PUBLIC_GOOGLE_MAPS_API_KEY);
			const realResults = await mapService.searchLocations(query);
			
			// Filter popular locations that match query
			const popularMatches = popularLocations
				.filter(loc => loc.toLowerCase().includes(query.toLowerCase()))
				.map(loc => ({ name: loc, fullAddress: loc, type: 'popular' }));
			
			// Combine real results with popular matches, limit to 6 total
			const combined = [...realResults.slice(0, 4), ...popularMatches.slice(0, 2)];
			locationSuggestions = combined.slice(0, 6);
			showSuggestions = locationSuggestions.length > 0;
		} catch (error) {
			console.error('Location search failed:', error);
			// Fallback to popular locations only
			const filtered = popularLocations.filter(loc => 
				loc.toLowerCase().includes(query.toLowerCase())
			).map(loc => ({ name: loc, fullAddress: loc, type: 'popular' }));
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
		const selectedLocation = truncateLocation(suggestion.fullAddress || suggestion.name);
		value = selectedLocation;
		onLocationSelect?.(selectedLocation);
		showSuggestions = false;
		locationSuggestions = [];
	}
	
	function useProfileLocation() {
		if (profileLocation) {
			value = profileLocation;
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
		const truncatedLocation = truncateLocation(location);
		value = truncatedLocation;
		onLocationSelect?.(truncatedLocation);
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
			<div class="absolute z-10 w-full mt-1 rounded-md shadow-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
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
	<div class="flex flex-wrap gap-1.5 overflow-x-auto pb-1" style="max-width: 100%; -webkit-overflow-scrolling: touch;">
		<!-- Use profile location -->
		{#if profileLocation && value !== profileLocation}
			<button
				type="button"
				onclick={useProfileLocation}
				class="location-action-button location-action-button--profile"
				title="Use my location: {profileLocation}"
			>
				<MapPin class="w-3 h-3 flex-shrink-0" />
				<span class="truncate">Use my location</span>
			</button>
		{/if}
		
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
				<MapPin class="w-3 h-3" />
				Pick on map
			</button>
		{/if}
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
	.location-action-button {
		display: inline-flex;
		align-items: center;
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
		flex-shrink: 0;
	}
	
	.location-action-button--profile {
		max-width: calc(100vw - 4rem);
	}
	
	.location-action-button--profile span {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	@media (max-width: 640px) {
		.location-action-button {
			font-size: 0.6875rem !important;
			padding: 0.25rem 0.5rem !important;
			gap: 0.1875rem !important;
		}
		
		.location-action-button--profile {
			max-width: 140px;
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
</style> 