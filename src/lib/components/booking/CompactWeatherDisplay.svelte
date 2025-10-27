<script lang="ts">
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { 
		createUnifiedWeatherService,
		type ForecastData,
		type LocationCoordinates
	} from '$lib/utils/weather-integration.js';
	
	// Icons
	import CloudRain from 'lucide-svelte/icons/cloud-rain';
	
	interface Props {
		coordinates: LocationCoordinates;
		tourDateTime: Date;
	}
	
	let {
		coordinates,
		tourDateTime
	}: Props = $props();
	
	let weatherForecast = $state<ForecastData | null>(null);
	let loading = $state(true);
	
	// Check if date is within forecast range
	let daysUntilTour = $derived.by(() => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const tourDate = new Date(tourDateTime);
		tourDate.setHours(0, 0, 0, 0);
		const diffTime = tourDate.getTime() - now.getTime();
		return Math.floor(diffTime / (1000 * 60 * 60 * 24));
	});
	
	let isWithinForecastRange = $derived(daysUntilTour >= 0 && daysUntilTour < 10);
	
	// Fetch weather
	async function fetchWeather() {
		if (!browser || !isWithinForecastRange) {
			loading = false;
			return;
		}
		
		const googleKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		const openWeatherKey = env.PUBLIC_OPENWEATHER_API_KEY;
		
		if (!googleKey && !openWeatherKey) {
			loading = false;
			return;
		}
		
		loading = true;
		
		try {
			const weatherService = createUnifiedWeatherService(googleKey, openWeatherKey);
			const forecast = await weatherService.getWeatherForDateTime(coordinates, tourDateTime);
			if (forecast) {
				weatherForecast = forecast;
			}
		} catch (err) {
			// Silent fail for compact display
		} finally {
			loading = false;
		}
	}
	
	// Use $effect instead of onMount to reactively fetch when tourDateTime changes
	// This prevents duplicate API calls by consolidating into a single reactive fetch
	$effect(() => {
		if (tourDateTime) {
			fetchWeather();
		}
	});
	
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
</script>

{#if !loading && weatherForecast && isWithinForecastRange}
	<div class="inline-flex items-center gap-2 px-2 py-0 rounded text-xs" style="background: var(--bg-secondary); color: var(--text-secondary);">
		<span>{getWeatherEmoji(weatherForecast.conditions[0].id)}</span>
		<span>{Math.round(weatherForecast.temperature)}°C</span>
		{#if weatherForecast.pop > 0.3}
			<span class="flex items-center gap-0.5">
				<CloudRain class="w-3 h-3" />
				{Math.round(weatherForecast.pop * 100)}%
			</span>
		{/if}
	</div>
{/if}

