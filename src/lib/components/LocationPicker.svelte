<script lang="ts">
	import { onDestroy } from 'svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Navigation from 'lucide-svelte/icons/navigation';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import MapPickerModal from './MapPickerModal.svelte';
	import { defaultMapService } from '$lib/utils/map-integration.js';
	
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
				const result = await defaultMapService.reverseGeocode(coordinates);
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
	
	// Search for location suggestions using real map service
	async function searchLocations(query: string) {
		if (!query.trim() || isSearching) return;
		
		isSearching = true;
		try {
			// Get real location results from map service
			const realResults = await defaultMapService.searchLocations(query);
			
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
		value = suggestion.fullAddress || suggestion.name;
		onLocationSelect?.(suggestion.fullAddress || suggestion.name);
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
			<MapPin class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
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
				class="form-input pl-10 pr-12"
				autocomplete="off"
			/>
			{#if value && value.trim()}
				<button
					type="button"
					onclick={clearLocation}
					class="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded hover:bg-opacity-20 transition-colors"
					style="color: var(--text-tertiary); background: transparent;"
					aria-label="Clear location"
				>
					<X class="h-4 w-4" />
				</button>
			{:else}
				<Search class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
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
	<div class="flex flex-wrap gap-2">
		<!-- Use profile location -->
		{#if profileLocation && value !== profileLocation}
			<button
				type="button"
				onclick={useProfileLocation}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors hover:bg-opacity-80"
				style="
					background: var(--color-primary-50);
					border-color: var(--color-primary-200);
					color: var(--color-primary-700);
				"
			>
				<MapPin class="w-3 h-3" />
				Use my location: {profileLocation}
			</button>
		{/if}
		
		<!-- Current location -->
		{#if enableGeolocation}
			<button
				type="button"
				onclick={getCurrentLocation}
				disabled={isGeolocating}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors hover:bg-opacity-80 disabled:opacity-50"
				style="
					background: var(--color-success-50);
					border-color: var(--color-success-200);
					color: var(--color-success-700);
				"
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
				class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors hover:bg-opacity-80"
				style="
					background: var(--color-info-50);
					border-color: var(--color-info-200);
					color: var(--color-info-700);
				"
			>
				<MapPin class="w-3 h-3" />
				Pick on map
			</button>
		{/if}
	</div>
	
	<p class="text-xs" style="color: var(--text-secondary);">
		Be specific to help customers find your tour meeting point
	</p>
</div>

<!-- Map Picker Modal -->
<MapPickerModal
	bind:isOpen={showMapPicker}
	initialLocation={value}
	onLocationSelect={handleMapLocationSelect}
	onClose={() => { showMapPicker = false; }}
/>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style> 