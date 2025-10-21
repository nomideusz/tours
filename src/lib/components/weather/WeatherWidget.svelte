<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { 
		createUnifiedWeatherService, 
		type WeatherData,
		type LocationCoordinates,
		formatTemperature,
		formatWindSpeed,
		formatPrecipitation
	} from '$lib/utils/weather-integration.js';
	
	// Icons
	import Cloud from 'lucide-svelte/icons/cloud';
	import CloudRain from 'lucide-svelte/icons/cloud-rain';
	import CloudSnow from 'lucide-svelte/icons/cloud-snow';
	import Sun from 'lucide-svelte/icons/sun';
	import Wind from 'lucide-svelte/icons/wind';
	import Droplets from 'lucide-svelte/icons/droplets';
	import Eye from 'lucide-svelte/icons/eye';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	
	interface Props {
		coordinates: LocationCoordinates;
		locationName?: string;
		apiKey?: string; // OpenWeather key (optional, for backward compatibility)
		showDetails?: boolean;
		compact?: boolean;
	}
	
	let {
		coordinates,
		locationName = '',
		apiKey = '', // Backward compatibility
		showDetails = false,
		compact = false
	}: Props = $props();
	
	let weather = $state<WeatherData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let lastUpdate = $state<Date | null>(null);
	
	// Fetch weather data
	async function fetchWeather() {
		if (!browser) {
			loading = false;
			return;
		}
		
		// Get API keys from environment (prefer Google, fallback to OpenWeather)
		const googleKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		const openWeatherKey = apiKey || env.PUBLIC_OPENWEATHER_API_KEY;
		
		if (!googleKey && !openWeatherKey) {
			loading = false;
			error = 'No weather API keys configured';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			// Create unified service that tries Google first, then OpenWeather
			const weatherService = createUnifiedWeatherService(googleKey, openWeatherKey);
			const data = await weatherService.getCurrentWeather(coordinates);
			
			if (data) {
				weather = data;
				lastUpdate = new Date();
			} else {
				error = 'Unable to fetch weather data';
			}
		} catch (err) {
			console.error('Weather fetch error:', err);
			error = 'Failed to load weather data';
		} finally {
			loading = false;
		}
	}
	
	// Fetch weather on mount
	onMount(() => {
		fetchWeather();
	});
	
	// Derived values
	let weatherSummary = $derived.by(() => {
		if (!weather) return null;
		const googleKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		const openWeatherKey = apiKey || env.PUBLIC_OPENWEATHER_API_KEY;
		const weatherService = createUnifiedWeatherService(googleKey, openWeatherKey);
		const suitability = weatherService.isWeatherSuitableForTours(weather);
		return {
			emoji: weatherService.getWeatherEmoji(weather.conditions[0].id),
			summary: weatherService.getWeatherSummary(weather),
			suitable: suitability.suitable,
			warnings: suitability.warnings
		};
	});
	
	// Refresh weather
	function handleRefresh() {
		fetchWeather();
	}
</script>

{#if !env.PUBLIC_GOOGLE_MAPS_API_KEY && !env.PUBLIC_OPENWEATHER_API_KEY && !apiKey}
	<div class="rounded-lg p-4 text-center" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
		<p class="text-sm" style="color: var(--color-warning-800);">
			Weather data unavailable - API key not configured
		</p>
	</div>
{:else if loading && !weather}
	<div class="rounded-lg p-4 flex items-center justify-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" style="color: var(--text-secondary);"></div>
		<span class="text-sm" style="color: var(--text-secondary);">Loading weather...</span>
	</div>
{:else if error && !weather}
	<div class="rounded-lg p-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
		<p class="text-sm" style="color: var(--color-error-800);">{error}</p>
		<button
			type="button"
			onclick={handleRefresh}
			class="mt-2 text-xs underline"
			style="color: var(--color-error-700);"
		>
			Try again
		</button>
	</div>
{:else if weather && weatherSummary}
	<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		{#if !compact}
			<!-- Full Weather Display -->
			<div class="p-4">
				<!-- Header with Location and Refresh -->
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center gap-2">
						<span class="text-2xl">{weatherSummary.emoji}</span>
						{#if locationName}
							<h3 class="font-semibold" style="color: var(--text-primary);">{locationName}</h3>
						{:else}
							<h3 class="font-semibold" style="color: var(--text-primary);">Current Weather</h3>
						{/if}
					</div>
					<button
						type="button"
						onclick={handleRefresh}
						disabled={loading}
						class="p-1.5 rounded hover:bg-opacity-80 transition-colors"
						style="background: var(--bg-secondary);"
						title="Refresh weather"
					>
						<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" style="color: var(--text-secondary);" />
					</button>
				</div>
				
				<!-- Main Temperature -->
				<div class="mb-3">
					<div class="flex items-baseline gap-2">
						<span class="text-4xl font-bold" style="color: var(--text-primary);">
							{Math.round(weather.temperature)}°C
						</span>
						<span class="text-sm" style="color: var(--text-secondary);">
							Feels like {Math.round(weather.feelsLike)}°C
						</span>
					</div>
					<p class="text-sm mt-1 capitalize" style="color: var(--text-secondary);">
						{weather.conditions[0].description}
					</p>
				</div>
				
				<!-- Weather Warnings -->
				{#if !weatherSummary.suitable && weatherSummary.warnings.length > 0}
					<div class="mb-3 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
						<div class="flex items-start gap-2">
							<AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
							<div class="flex-1">
								<p class="text-xs font-medium mb-1" style="color: var(--color-warning-900);">
									Weather Advisory
								</p>
								<ul class="text-xs space-y-0.5" style="color: var(--color-warning-800);">
									{#each weatherSummary.warnings as warning}
										<li>• {warning}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{:else if weatherSummary.warnings.length > 0}
					<div class="mb-3 p-2 rounded-lg" style="background: var(--color-info-50); border: 1px solid var(--color-info-200);">
						<div class="flex items-start gap-2">
							<Cloud class="w-3 h-3 flex-shrink-0 mt-0.5" style="color: var(--color-info-600);" />
							<div class="flex-1">
								<ul class="text-xs space-y-0.5" style="color: var(--color-info-800);">
									{#each weatherSummary.warnings as warning}
										<li>{warning}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/if}
				
				{#if showDetails}
					<!-- Detailed Weather Info -->
					<div class="grid grid-cols-2 gap-3">
						<!-- Humidity -->
						<div class="flex items-center gap-2">
							<Droplets class="w-4 h-4" style="color: var(--text-tertiary);" />
							<div>
								<p class="text-xs" style="color: var(--text-secondary);">Humidity</p>
								<p class="text-sm font-medium" style="color: var(--text-primary);">{weather.humidity}%</p>
							</div>
						</div>
						
						<!-- Wind -->
						<div class="flex items-center gap-2">
							<Wind class="w-4 h-4" style="color: var(--text-tertiary);" />
							<div>
								<p class="text-xs" style="color: var(--text-secondary);">Wind</p>
								<p class="text-sm font-medium" style="color: var(--text-primary);">
									{formatWindSpeed(weather.windSpeed)}
								</p>
							</div>
						</div>
						
						<!-- Visibility -->
						<div class="flex items-center gap-2">
							<Eye class="w-4 h-4" style="color: var(--text-tertiary);" />
							<div>
								<p class="text-xs" style="color: var(--text-secondary);">Visibility</p>
								<p class="text-sm font-medium" style="color: var(--text-primary);">
									{Math.round(weather.visibility / 1000)} km
								</p>
							</div>
						</div>
						
						<!-- Clouds -->
						<div class="flex items-center gap-2">
							<Cloud class="w-4 h-4" style="color: var(--text-tertiary);" />
							<div>
								<p class="text-xs" style="color: var(--text-secondary);">Cloudiness</p>
								<p class="text-sm font-medium" style="color: var(--text-primary);">{weather.cloudiness}%</p>
							</div>
						</div>
					</div>
					
					<!-- Precipitation -->
					{#if weather.rain || weather.snow}
						<div class="mt-3 pt-3 border-t" style="border-color: var(--border-primary);">
							<div class="flex items-center gap-2">
								{#if weather.rain}
									<CloudRain class="w-4 h-4" style="color: var(--color-info-600);" />
									<span class="text-sm" style="color: var(--text-primary);">
										Rain: {formatPrecipitation(weather.rain['1h'])}
									</span>
								{/if}
								{#if weather.snow}
									<CloudSnow class="w-4 h-4" style="color: var(--color-info-600);" />
									<span class="text-sm" style="color: var(--text-primary);">
										Snow: {formatPrecipitation(weather.snow['1h'])}
									</span>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
				
				<!-- Last Update -->
				{#if lastUpdate}
					<div class="mt-3 pt-3 border-t text-xs" style="border-color: var(--border-primary); color: var(--text-tertiary);">
						Updated {lastUpdate.toLocaleTimeString()}
					</div>
				{/if}
			</div>
		{:else}
			<!-- Compact Weather Display -->
			<div class="p-3 flex items-center gap-3">
				<span class="text-2xl">{weatherSummary.emoji}</span>
				<div class="flex-1">
					<div class="flex items-baseline gap-2">
						<span class="text-lg font-bold" style="color: var(--text-primary);">
							{Math.round(weather.temperature)}°C
						</span>
						<span class="text-xs capitalize" style="color: var(--text-secondary);">
							{weather.conditions[0].description}
						</span>
					</div>
					{#if !weatherSummary.suitable}
						<div class="flex items-center gap-1 mt-1">
							<AlertTriangle class="w-3 h-3" style="color: var(--color-warning-600);" />
							<span class="text-xs" style="color: var(--color-warning-700);">
								Check weather advisory
							</span>
						</div>
					{/if}
				</div>
				<button
					type="button"
					onclick={handleRefresh}
					disabled={loading}
					class="p-1 rounded"
					title="Refresh"
				>
					<RefreshCw class="w-3 h-3 {loading ? 'animate-spin' : ''}" style="color: var(--text-secondary);" />
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>

