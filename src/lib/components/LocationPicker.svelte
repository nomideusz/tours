<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Navigation from 'lucide-svelte/icons/navigation';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import Heart from 'lucide-svelte/icons/heart';
	import Clock from 'lucide-svelte/icons/clock';
	import GoogleMapPickerModal from './modals/GoogleMapPickerModal.svelte';
	import { defaultMapService, getPlacesAPIService } from '$lib/utils/map-integration.js';
	import { env } from '$env/dynamic/public';
	import { MEETING_POINT_TYPES } from '$lib/types/places.js';
	import type { PlaceSuggestion } from '$lib/types/places.js';

	// Cleanup on component destroy
	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		if (blurTimeout) {
			clearTimeout(blurTimeout);
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
		placeholder = 'Search for a location...',
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
	let usePlacesAPI = $state(true);
	let selectedPlaceId = $state<string | null>(null);
	let inputElement = $state<HTMLInputElement>();
	let hasAutoLocated = $state(false);
	let blurTimeout: ReturnType<typeof setTimeout> | null = null;


	// Recent locations storage (in memory for now, could be localStorage)
	let recentLocations = $state<string[]>([]);

	// Auto-suggest current location on first focus
	async function autoSuggestCurrentLocation() {
		if (hasAutoLocated || !enableGeolocation || !navigator.geolocation) return;

		try {
			isGeolocating = true;
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 300000
				});
			});

			const coordinates = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			const result = await defaultMapService.reverseGeocode(coordinates);
			hasAutoLocated = true;

			// Add to suggestions with special "current" category
			locationSuggestions = [{
				name: 'Current Location',
				fullAddress: result.fullAddress,
				type: 'current',
				isPlace: false,
				coordinates,
				icon: '📍'
			}, ...locationSuggestions.slice(0, 5)];

			showSuggestions = true;
		} catch (error) {
			console.warn('Auto-geolocation failed:', error);
		} finally {
			isGeolocating = false;
		}
	}
	
	// Get user's current location (manual trigger)
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
				addToRecentLocations(result.fullAddress);
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

	// Enhanced search with intelligent suggestions
	async function searchLocations(query: string) {
		if (isSearching) return;

		isSearching = true;
		try {
			let suggestions: any[] = [];

			// Add quick actions for empty/short queries
			if (!query.trim() || query.length < 2) {
				suggestions = getDefaultSuggestions();
			} else {
				// Real search results
				if (usePlacesAPI) {
					const placesService = getPlacesAPIService();
					const placeSuggestions = await placesService.searchLocationsWithPlacesAPI(query, {
						sessionToken: undefined
					});

					suggestions = placeSuggestions.map(suggestion => ({
						placeId: suggestion.placeId,
						name: suggestion.name,
						fullAddress: suggestion.fullAddress || suggestion.name,
						type: 'search',
						isPlace: true,
						icon: '📍'
					}));
				}

				// Fallback to geocoding
				if (suggestions.length === 0) {
					const geocodingResults = await defaultMapService.searchLocations(query);
					suggestions = geocodingResults.map(result => ({
						...result,
						type: 'search',
						isPlace: false,
						icon: '📍'
					}));
				}

			}

			locationSuggestions = suggestions.slice(0, 6);
			showSuggestions = locationSuggestions.length > 0;
		} catch (error) {
			console.error('Location search failed:', error);
			locationSuggestions = getDefaultSuggestions();
			showSuggestions = true;
		} finally {
			isSearching = false;
		}
	}

	// Get default suggestions when no search query
	function getDefaultSuggestions() {
		const suggestions = [];

		// Profile location if available
		if (profileLocation && !value) {
			suggestions.push({
				name: 'Home Location',
				fullAddress: profileLocation,
				type: 'profile',
				isPlace: false,
				icon: '🏠'
			});
		}

		// Recent locations
		recentLocations.slice(0, 3).forEach(location => {
			suggestions.push({
				name: location,
				fullAddress: location,
				type: 'recent',
				isPlace: false,
				icon: '🕐'
			});
		});

		return suggestions;
	}

	// Add location to recent list
	function addToRecentLocations(location: string) {
		recentLocations = [location, ...recentLocations.filter(l => l !== location)].slice(0, 5);
	}
	
	// Enhanced debounced search with immediate suggestions
	function handleSearchInput(query: string) {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Show suggestions immediately for better UX
		if (query.trim().length === 0) {
			locationSuggestions = getDefaultSuggestions();
			showSuggestions = true;
			return;
		}

		// Show default suggestions for short queries
		if (query.trim().length < 2) {
			locationSuggestions = getDefaultSuggestions();
			showSuggestions = true;
			return;
		}

		// Debounce API calls for longer queries
		searchTimeout = setTimeout(() => {
			searchLocations(query);
		}, 250);
	}

	function selectSuggestion(suggestion: any) {
		const selectedLocation = suggestion.fullAddress || suggestion.name;
		value = selectedLocation;

		// Store place ID if this is from Places API
		if (suggestion.isPlace && suggestion.placeId) {
			selectedPlaceId = suggestion.placeId;
			placeId = suggestion.placeId;
		} else {
			selectedPlaceId = null;
			placeId = null;
		}

		// Clear any pending blur timeout
		if (blurTimeout) {
			clearTimeout(blurTimeout);
			blurTimeout = null;
		}

		onLocationSelect?.(selectedLocation);
		addToRecentLocations(selectedLocation);
		showSuggestions = false;
		locationSuggestions = [];
	}

	// Quick actions for common selections
	function selectProfileLocation() {
		if (profileLocation) {
			value = profileLocation;
			placeId = null;
			selectedPlaceId = null;
			onLocationSelect?.(profileLocation);
			showSuggestions = false;
		}
	}

	function selectCurrentLocation() {
		getCurrentLocation();
		showSuggestions = false;
	}

	// Handle input changes
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;
		handleSearchInput(newValue);
	}

	// Handle focus - show suggestions immediately
	function handleFocus() {
		// Clear any pending blur timeout
		if (blurTimeout) {
			clearTimeout(blurTimeout);
			blurTimeout = null;
		}

		// Always show suggestions when focused
		if (!showSuggestions) {
			locationSuggestions = getDefaultSuggestions();
			showSuggestions = true;
		}
		// Only try to auto-locate if we haven't already and geolocation is enabled
		if (!hasAutoLocated && enableGeolocation && navigator.geolocation) {
			autoSuggestCurrentLocation();
		}
	}

	// Clear the location input
	function clearLocation() {
		value = '';
		placeId = null;
		selectedPlaceId = null;

		// Clear any pending blur timeout
		if (blurTimeout) {
			clearTimeout(blurTimeout);
			blurTimeout = null;
		}

		showSuggestions = false;
		locationSuggestions = [];
		onLocationSelect?.('');
		inputElement?.focus();
	}

	// Open map picker modal
	function openMapPicker() {
		showMapPicker = true;
		showSuggestions = false;
	}

	// Handle location selection from map
	function handleMapLocationSelect(location: string, coordinates: any) {
		value = location;
		onLocationSelect?.(location);
		addToRecentLocations(location);
		showMapPicker = false;
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (!showSuggestions || locationSuggestions.length === 0) return;

		const currentIndex = -1; // Could track selected index

		switch (event.key) {
			case 'Escape':
				showSuggestions = false;
				break;
			case 'Enter':
				event.preventDefault();
				if (currentIndex >= 0) {
					selectSuggestion(locationSuggestions[currentIndex]);
				}
				break;
		}
	}
</script>

<!-- Modern Location Picker -->
<div class="location-picker-container">
	<!-- Label -->
	<label for="location-input" class="location-label">
		{label}
	</label>

	<!-- Input Container -->
	<div class="location-input-container">
		<!-- Input Field -->
		<div class="relative">
			<div class="location-input-wrapper">
				<input
					bind:this={inputElement}
					id="location-input"
					type="text"
					bind:value={value}
					oninput={handleInput}
					onfocus={handleFocus}
					onkeydown={handleKeydown}
					onblur={() => {
						blurTimeout = setTimeout(() => {
							showSuggestions = false;
							blurTimeout = null;
						}, 150);
					}}
					placeholder={placeholder}
					class="location-input"
					autocomplete="off"
				/>
				{#if value}
					<button
						type="button"
						onclick={clearLocation}
						class="location-clear-btn"
						aria-label="Clear location"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>
		</div>

		<!-- Smart Suggestions Panel -->
		{#if showSuggestions}
			<div class="location-suggestions-panel">
				{#if isSearching}
					<div class="location-loading">
						<div class="location-spinner"></div>
						<span>Finding locations...</span>
					</div>
				{:else}
					<!-- Quick Actions Header -->
					{#if locationSuggestions.length > 0 && !value}
						<div class="location-quick-header">
							<span class="location-quick-title">Quick select</span>
						</div>
					{/if}

					<!-- Suggestions List -->
					<div class="location-suggestions-list">
						{#each locationSuggestions as suggestion, index}
							<button
								type="button"
								onclick={() => selectSuggestion(suggestion)}
								class="location-suggestion-item"
								class:active={index === 0}
							>
								<!-- Icon based on type -->
								<div class="location-suggestion-icon">
									{#if suggestion.icon}
										<span class="location-emoji">{suggestion.icon}</span>
									{:else}
										<MapPin class="w-4 h-4" style="color: var(--text-secondary);" />
									{/if}
								</div>

								<!-- Content -->
								<div class="location-suggestion-content">
									<div class="location-suggestion-name">
										{suggestion.name}
										{#if suggestion.type === 'current'}
											<span class="location-badge location-badge--current">Current</span>
										{:else if suggestion.type === 'profile'}
											<span class="location-badge location-badge--profile">Home</span>
										{:else if suggestion.type === 'recent'}
											<span class="location-badge location-badge--recent">Recent</span>
										{/if}
									</div>
									{#if suggestion.fullAddress && suggestion.fullAddress !== suggestion.name}
										<div class="location-suggestion-address">
											{suggestion.fullAddress}
										</div>
									{/if}
								</div>

								<!-- Action hint -->
								{#if suggestion.type === 'current'}
									<Navigation class="location-action-icon" />
								{:else if suggestion.type === 'profile'}
									<Heart class="location-action-icon" />
								{:else if suggestion.type === 'recent'}
									<Clock class="location-action-icon" />
								{/if}
							</button>
						{/each}
					</div>

					<!-- Action Buttons Footer -->
					{#if !value || value.length < 2}
						<div class="location-actions-footer">
							{#if enableGeolocation && !hasAutoLocated}
								<button
									type="button"
									onclick={selectCurrentLocation}
									disabled={isGeolocating}
									class="location-action-btn location-action-btn--primary"
								>
									{#if isGeolocating}
										<div class="location-spinner-small"></div>
									{:else}
										<Navigation class="w-4 h-4" />
									{/if}
									<span>{isGeolocating ? 'Finding you...' : 'Use my location'}</span>
								</button>
							{/if}

							{#if enableMapsIntegration}
								<button
									type="button"
									onclick={openMapPicker}
									class="location-action-btn location-action-btn--secondary"
								>
									<Search class="w-4 h-4" />
									<span>Pick on map</span>
								</button>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
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
	/* Modern Location Picker Styles */
	.location-picker-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
	}

	.location-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.location-input-container {
		position: relative;
	}

	.location-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.location-clear-btn {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		color: var(--text-tertiary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		z-index: 1;
	}

	.location-clear-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	.location-input {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 1rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all 0.15s ease;
		outline: none;
	}

	.location-input:focus {
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.1);
	}

	.location-input::placeholder {
		color: var(--text-tertiary);
	}

	/* Suggestions Panel */
	.location-suggestions-panel {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 9999;
		margin-top: 0.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		overflow: hidden;
		animation: slideDown 0.15s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Loading State */
	.location-loading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.location-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--border-primary);
		border-top: 2px solid var(--color-primary-500);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.location-spinner-small {
		width: 0.75rem;
		height: 0.75rem;
		border: 1.5px solid var(--border-primary);
		border-top: 1.5px solid var(--color-primary-500);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Quick Actions Header */
	.location-quick-header {
		padding: 0.5rem 1rem 0.25rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.location-quick-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Suggestions List */
	.location-suggestions-list {
		max-height: 280px;
		overflow-y: auto;
	}

	.location-suggestion-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
		position: relative;
	}

	.location-suggestion-item:hover {
		background: var(--bg-secondary);
	}

	.location-suggestion-item.active {
		background: var(--color-primary-50);
	}

	.location-suggestion-item:first-child {
		border-top-left-radius: 0.375rem;
		border-top-right-radius: 0.375rem;
	}

	.location-suggestion-item:last-child {
		border-bottom-left-radius: 0.375rem;
		border-bottom-right-radius: 0.375rem;
	}

	.location-suggestion-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
	}

	.location-emoji {
		font-size: 1.25rem;
		line-height: 1;
	}

	.location-suggestion-content {
		flex: 1;
		min-width: 0;
	}

	.location-suggestion-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.125rem;
	}

	.location-suggestion-address {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.25;
	}

	.location-action-icon {
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	/* Badges */
	.location-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: 1;
	}

	.location-badge--current {
		background: var(--color-primary-100);
		color: var(--color-primary-700);
	}

	.location-badge--profile {
		background: var(--color-red-100);
		color: var(--color-red-700);
	}

	.location-badge--recent {
		background: var(--color-yellow-100);
		color: var(--color-yellow-700);
	}

	/* Action Buttons Footer */
	.location-actions-footer {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.location-action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		border: 1px solid;
		flex: 1;
		min-height: 2.5rem;
	}

	.location-action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.location-action-btn--primary {
		background: var(--color-primary-500);
		border-color: var(--color-primary-500);
		color: white;
	}

	.location-action-btn--primary:hover:not(:disabled) {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.3);
	}

	.location-action-btn--secondary {
		background: var(--bg-primary);
		border-color: var(--border-primary);
		color: var(--text-primary);
	}

	.location-action-btn--secondary:hover:not(:disabled) {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
	}

	/* Dark mode support */
	:root[data-theme='dark'] {
		.location-suggestion-item:hover {
			background: var(--bg-tertiary);
		}

		.location-suggestion-item.active {
			background: rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.1);
		}

		.location-action-btn--primary {
			background: var(--color-primary-600);
			border-color: var(--color-primary-600);
		}

		.location-action-btn--primary:hover:not(:disabled) {
			background: var(--color-primary-700);
			border-color: var(--color-primary-700);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.location-input {
			padding: 0.875rem 2.5rem 0.875rem 1rem;
			font-size: 1rem; /* Prevent zoom on iOS */
		}

		.location-suggestions-panel {
			margin-top: 0.125rem;
		}

		.location-suggestion-item {
			padding: 0.875rem 1rem;
		}

		.location-actions-footer {
			padding: 0.875rem 1rem;
		}

		.location-action-btn {
			padding: 0.625rem 0.875rem;
			font-size: 0.875rem;
		}
	}

	/* Focus management */
	.location-suggestion-item:focus {
		outline: 2px solid var(--color-primary-500);
		outline-offset: -2px;
	}
</style> 