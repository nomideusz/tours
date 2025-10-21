<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { 
		createUnifiedWeatherService,
		type ForecastData,
		type LocationCoordinates
	} from '$lib/utils/weather-integration.js';
	
	// Icons
	import Cloud from 'lucide-svelte/icons/cloud';
	import CloudRain from 'lucide-svelte/icons/cloud-rain';
	import CloudSnow from 'lucide-svelte/icons/cloud-snow';
	import Sun from 'lucide-svelte/icons/sun';
	import Wind from 'lucide-svelte/icons/wind';
	import Droplets from 'lucide-svelte/icons/droplets';
	import Umbrella from 'lucide-svelte/icons/umbrella';
	import Shirt from 'lucide-svelte/icons/shirt';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Info from 'lucide-svelte/icons/info';
	
	interface Props {
		coordinates: LocationCoordinates;
		tourDateTime: Date;
		locationName?: string;
	}
	
	let {
		coordinates,
		tourDateTime,
		locationName = ''
	}: Props = $props();
	
	let weatherForecast = $state<ForecastData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Check if date is within forecast range
	let daysUntilTour = $derived.by(() => {
		const now = new Date();
		now.setHours(0, 0, 0, 0); // Start of today
		const tourDate = new Date(tourDateTime);
		tourDate.setHours(0, 0, 0, 0); // Start of tour day
		const diffTime = tourDate.getTime() - now.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	});
	
	// 10-day forecast = today + 9 more days (0-9 range)
	let isWithinForecastRange = $derived(daysUntilTour >= 0 && daysUntilTour < 10);
	
	// Fetch weather for tour date
	async function fetchTourWeather() {
		if (!browser) {
			loading = false;
			return;
		}
		
		// Don't fetch if date is out of range
		if (!isWithinForecastRange) {
			loading = false;
			weatherForecast = null;
			return;
		}
		
		const googleKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		const openWeatherKey = env.PUBLIC_OPENWEATHER_API_KEY;
		
		if (!googleKey && !openWeatherKey) {
			loading = false;
			return; // Silently skip if no API keys
		}
		
		loading = true;
		error = null;
		
		try {
			const weatherService = createUnifiedWeatherService(googleKey, openWeatherKey);
			const forecast = await weatherService.getWeatherForDateTime(coordinates, tourDateTime);
			
			if (forecast) {
				weatherForecast = forecast;
			}
		} catch (err) {
			console.error('Tour weather fetch error:', err);
			// Don't show error to customers, just don't display weather
		} finally {
			loading = false;
		}
	}
	
	// Fetch on mount and when date changes
	onMount(() => {
		fetchTourWeather();
	});
	
	$effect(() => {
		if (tourDateTime) {
			fetchTourWeather();
		}
	});
	
	// Get weather emoji
	function getWeatherEmoji(conditionId: number): string {
		if (conditionId >= 200 && conditionId < 300) return '⛈️';
		if (conditionId >= 300 && conditionId < 400) return '🌦️';
		if (conditionId >= 500 && conditionId < 600) return '🌧️';
		if (conditionId >= 600 && conditionId < 700) return '❄️';
		if (conditionId >= 700 && conditionId < 800) return '🌫️';
		if (conditionId === 800) return '☀️';
		if (conditionId > 800) return '☁️';
		return '🌡️';
	}
	
	// Get what to bring recommendations
	function getWhatToBring(): string[] {
		if (!weatherForecast) return [];
		
		const recommendations: string[] = [];
		const temp = weatherForecast.temperature;
		const conditionId = weatherForecast.conditions[0].id;
		const pop = weatherForecast.pop;
		
		// Temperature-based
		if (temp < 10) {
			recommendations.push('🧥 Warm jacket');
		} else if (temp < 18) {
			recommendations.push('👕 Light jacket or sweater');
		} else if (temp > 28) {
			recommendations.push('🧢 Hat and sunscreen');
		}
		
		// Precipitation
		if (pop > 0.6 || (conditionId >= 500 && conditionId < 600)) {
			recommendations.push('☔ Umbrella or rain jacket');
		} else if (pop > 0.3) {
			recommendations.push('🌂 Umbrella (just in case)');
		}
		
		// Snow
		if (conditionId >= 600 && conditionId < 700) {
			recommendations.push('👢 Winter boots');
			recommendations.push('🧤 Gloves and warm layers');
		}
		
		// Always good to have
		if (temp > 20 || conditionId === 800) {
			recommendations.push('💧 Water bottle');
		}
		
		return recommendations;
	}
	
	let whatToBring = $derived(getWhatToBring());
</script>

{#if !loading && weatherForecast && isWithinForecastRange}
	<div>
			<!-- Main Weather Display -->
			<div class="flex items-center gap-4 mb-4">
				<div class="text-5xl">
					{getWeatherEmoji(weatherForecast.conditions[0].id)}
				</div>
				<div class="flex-1">
					<div class="flex items-baseline gap-2 mb-1">
						<span class="text-3xl font-bold" style="color: var(--text-primary);">
							{Math.round(weatherForecast.temperature)}°C
						</span>
						{#if weatherForecast.feelsLike !== weatherForecast.temperature}
							<span class="text-sm" style="color: var(--text-secondary);">
								Feels like {Math.round(weatherForecast.feelsLike)}°C
							</span>
						{/if}
					</div>
					<p class="text-sm capitalize" style="color: var(--text-secondary);">
						{weatherForecast.conditions[0].description}
					</p>
					{#if weatherForecast.pop > 0.3}
						<div class="flex items-center gap-1 mt-1">
							<CloudRain class="w-3 h-3" style="color: var(--color-info-600);" />
							<span class="text-xs" style="color: var(--text-secondary);">
								{Math.round(weatherForecast.pop * 100)}% chance of rain
							</span>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Weather Details Grid -->
			<div class="grid grid-cols-2 gap-3 mb-4">
				<div class="flex items-center gap-2 text-sm">
					<Wind class="w-4 h-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-secondary);">
						{Math.round(weatherForecast.windSpeed * 3.6)} km/h wind
					</span>
				</div>
				<div class="flex items-center gap-2 text-sm">
					<Droplets class="w-4 h-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-secondary);">
						{weatherForecast.humidity}% humidity
					</span>
				</div>
			</div>
			
			<!-- What to Bring -->
			{#if whatToBring.length > 0}
				<div class="pt-4 border-t" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-2 mb-2">
						<Info class="w-4 h-4" style="color: var(--color-info-600);" />
						<h4 class="text-sm font-medium" style="color: var(--text-primary);">What to Bring</h4>
					</div>
					<ul class="space-y-1">
						{#each whatToBring as item}
							<li class="text-sm flex items-center gap-2" style="color: var(--text-secondary);">
								<span class="text-xs">•</span>
								{item}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			
			<!-- Weather Warning -->
			{#if weatherForecast.conditions[0].id < 800 || weatherForecast.pop > 0.6 || weatherForecast.temperature < 5 || weatherForecast.temperature > 35}
				<div class="mt-4 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
					<div class="flex items-start gap-2">
						<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
						<div class="flex-1">
							<p class="text-xs font-medium mb-1" style="color: var(--color-warning-900);">Weather Advisory</p>
							<p class="text-xs" style="color: var(--color-warning-700);">
								{#if weatherForecast.temperature < 5}
									Cold weather expected. Please dress warmly.
								{:else if weatherForecast.temperature > 35}
									Very hot conditions. Stay hydrated and use sun protection.
								{:else if weatherForecast.pop > 0.6}
									High chance of rain. Bring appropriate rain gear.
								{:else if weatherForecast.conditions[0].id >= 200 && weatherForecast.conditions[0].id < 300}
									Thunderstorms possible. Tour may be rescheduled if conditions are severe.
								{:else}
									Weather conditions may affect the tour. Check forecast closer to the date.
								{/if}
							</p>
						</div>
					</div>
				</div>
			{/if}
			
		<!-- Forecast Note -->
		<p class="text-xs mt-3 text-center" style="color: var(--text-tertiary);">
			Forecast for {tourDateTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
		</p>
	</div>
{/if}

