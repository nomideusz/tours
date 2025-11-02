<script lang="ts">
	/**
	 * TEST PAGE: Places API Integration
	 * Use this to verify Places API and photo fetching works
	 * Access at: /test-places
	 */
	import { onMount } from 'svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import MeetingPointCard from '$lib/components/MeetingPointCard.svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	
	let location = $state('');
	let placeId = $state<string | null>(null);
	let testResults = $state<string[]>([]);
	
	// Track previous values to avoid infinite loops
	let previousLocation = $state('');
	let previousPlaceId = $state<string | null>(null);
	
	function addTestResult(message: string) {
		testResults = [...testResults, `${new Date().toLocaleTimeString()}: ${message}`];
		console.log(message);
	}
	
	// Watch for changes (without creating infinite loops)
	$effect(() => {
		if (placeId !== previousPlaceId) {
			if (placeId) {
				addTestResult(`✅ Place ID captured: ${placeId}`);
			}
			previousPlaceId = placeId;
		}
	});
	
	$effect(() => {
		if (location !== previousLocation) {
			if (location) {
				addTestResult(`📍 Location set: ${location}`);
			}
			previousLocation = location;
		}
	});
</script>

<div class="test-page">
	<div class="test-container">
		<div class="test-header">
			<h1>Places API Integration Test</h1>
			<p>Test the Google Places API autocomplete and photo features</p>
		</div>
		
		<!-- Test 1: Location Picker -->
		<div class="test-section">
			<h2>Test 1: Location Autocomplete</h2>
			<p class="test-instructions">
				Type a famous landmark (e.g., "Eiffel Tower", "Colosseum", "Big Ben")
			</p>
			
			<LocationPicker
				bind:value={location}
				bind:placeId={placeId}
				placeholder="Type a famous landmark..."
				enableGeolocation={true}
				enableMapsIntegration={true}
			/>
			
			<div class="test-results">
				<div class="result-item">
					<strong>Location:</strong> {location || '(none)'}
				</div>
				<div class="result-item">
					<strong>Place ID:</strong> {placeId || '(none)'}
				</div>
				<div class="result-item">
					<strong>Has Place ID:</strong> {placeId ? '✅ Yes (photos will work!)' : '❌ No (no photos available)'}
				</div>
			</div>
		</div>
		
		<!-- Test 2: Meeting Point Card -->
		{#if location && placeId}
			<div class="test-section">
				<h2>Test 2: Meeting Point Photos</h2>
				<p class="test-instructions">
					If Place ID was captured, photos should load below:
				</p>
				
				<MeetingPointCard
					locationName={location}
					placeId={placeId}
					showPhotos={true}
					photoCount={3}
				/>
			</div>
		{:else if location}
			<div class="test-section">
				<h2>Test 2: No Photos Available</h2>
				<div class="test-warning">
					<MapPin class="w-5 h-5" />
					<p>
						Location was entered manually (no Place ID).
						<br />
						<strong>To get photos:</strong> Delete the location and select from autocomplete dropdown.
					</p>
				</div>
			</div>
		{/if}
		
		<!-- Test Log -->
		<div class="test-section">
			<h2>Test Log</h2>
			<div class="test-log">
				{#if testResults.length === 0}
					<p class="text-log-empty">No events yet. Try selecting a location above.</p>
				{:else}
					{#each testResults as result}
						<div class="log-entry">{result}</div>
					{/each}
				{/if}
			</div>
		</div>
		
		<!-- Instructions -->
		<div class="test-section">
			<h2>How to Test</h2>
			<ol class="test-steps">
				<li>Type "Eiffel Tower" in the location field above</li>
				<li>Wait for autocomplete suggestions to appear (should show "🗺️ Using Places API")</li>
				<li>Click/select one of the suggestions</li>
				<li>Check that "Place ID" shows a value (starts with "ChIJ...")</li>
				<li>Photos should load automatically in the Meeting Point Card below</li>
			</ol>
			
			<div class="test-checklist">
				<h3>Success Checklist:</h3>
				<ul>
					<li class:success={location}>📍 Location: {location ? '✅ Set' : '❌ Not set'}</li>
					<li class:success={placeId}>🆔 Place ID: {placeId ? '✅ Captured' : '❌ Not captured'}</li>
					<li class:success={placeId}>📸 Photos: {placeId ? '✅ Should load' : '❌ Won\'t load'}</li>
				</ul>
			</div>
		</div>
		
		<!-- Browser Console Check -->
		<div class="test-section">
			<h2>Check Browser Console</h2>
			<p>Press F12 and look for these logs:</p>
			<pre class="console-example">🗺️ Using Places API (New) for autocomplete
✅ Places API returned X results
📍 Selected place ID: ChIJLU7jZClu5kcR4PcOOO6p3I0
📸 Place Photo requested: ...</pre>
		</div>
	</div>
</div>

<style>
	.test-page {
		min-height: 100vh;
		padding: 2rem;
		background: var(--bg-secondary);
	}
	
	.test-container {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.test-header {
		text-align: center;
		padding: 2rem;
		background: var(--bg-primary);
		border-radius: 1rem;
		border: 2px solid var(--color-primary-500);
	}
	
	.test-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.test-header p {
		color: var(--text-secondary);
	}
	
	.test-section {
		background: var(--bg-primary);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	.test-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.test-instructions {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}
	
	.test-results {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.result-item {
		font-size: 0.875rem;
		color: var(--text-primary);
		font-family: monospace;
	}
	
	.test-warning {
		display: flex;
		align-items: start;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.5rem;
		color: var(--color-warning-800);
	}
	
	.test-log {
		background: #000;
		color: #0f0;
		padding: 1rem;
		border-radius: 0.5rem;
		font-family: monospace;
		font-size: 0.75rem;
		max-height: 300px;
		overflow-y: auto;
	}
	
	.text-log-empty {
		color: #888;
		font-style: italic;
	}
	
	.log-entry {
		margin-bottom: 0.25rem;
	}
	
	.test-steps {
		padding-left: 1.5rem;
		color: var(--text-primary);
	}
	
	.test-steps li {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}
	
	.test-checklist {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}
	
	.test-checklist h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.test-checklist ul {
		list-style: none;
		padding: 0;
	}
	
	.test-checklist li {
		padding: 0.5rem;
		margin-bottom: 0.25rem;
		border-radius: 0.25rem;
		color: var(--text-secondary);
	}
	
	.test-checklist li.success {
		background: var(--color-success-50);
		color: var(--color-success-700);
	}
	
	.console-example {
		background: #1e1e1e;
		color: #d4d4d4;
		padding: 1rem;
		border-radius: 0.5rem;
		font-family: monospace;
		font-size: 0.875rem;
		overflow-x: auto;
	}
</style>

