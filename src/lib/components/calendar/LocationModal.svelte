<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import FlagIcon from '$lib/components/ui/icons/FlagIcon.svelte';
	import { COUNTRY_LIST, getCountryInfo } from '$lib/utils/countries.js';

	// Props
	let {
		show = $bindable(false),
		selectedCountry = $bindable(''),
		savingCurrency = $bindable(false)
	}: {
		show?: boolean;
		selectedCountry?: string;
		savingCurrency?: boolean;
	} = $props();

	const dispatch = createEventDispatcher<{
		close: void;
		save: void;
	}>();

	// Local state
	let countrySearchTerm = $state('');

	// Filter countries based on search
	let filteredCountryList = $derived(
		countrySearchTerm.trim() === '' 
			? COUNTRY_LIST 
			: COUNTRY_LIST.filter(country => 
				country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
				country.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
			)
	);

	function handleClose() {
		dispatch('close');
	}

	function handleSave() {
		dispatch('save');
	}
</script>

{#if show}
	<div class="location-modal">
		<button 
			class="location-backdrop" 
			onclick={handleClose}
			aria-label="Close modal"
			type="button"
		></button>
		<div class="location-content">
			<div class="location-header">
				<h3 class="location-title">Select Your Business Location</h3>
				<p class="location-description">
					This determines your payment currency and cannot be changed later
				</p>
			</div>

			<div class="country-search">
				<input
					type="text"
					bind:value={countrySearchTerm}
					placeholder="Search countries..."
					class="search-input"
				/>
			</div>

			<div class="country-grid">
				{#each filteredCountryList as country}
					<button
						onclick={() => selectedCountry = country.code}
						class="country-option {selectedCountry === country.code ? 'country-option--selected' : ''}"
					>
						<FlagIcon countryCode={country.code} size="sm" />
						<span>{country.name}</span>
					</button>
				{/each}
			</div>

			{#if selectedCountry}
				{@const countryInfo = getCountryInfo(selectedCountry)}
				<div class="text-sm text-center mb-4" style="color: var(--text-secondary);">
					Selected: <strong>{countryInfo?.name}</strong> • Currency: <strong>{countryInfo?.currency}</strong>
				</div>
			{/if}

			<div class="location-actions">
				<button
					onclick={handleClose}
					class="button-secondary"
				>
					Cancel
				</button>
				<button
					onclick={handleSave}
					disabled={!selectedCountry || savingCurrency}
					class="button-primary button-gap"
				>
					{#if savingCurrency}
						<Loader2 class="h-4 w-4 animate-spin" />
					{/if}
					Confirm Location
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Location modal - simple overlay */
	.location-modal {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.location-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}

	.location-content {
		position: relative;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: var(--shadow-lg);
	}

	.location-header {
		margin-bottom: 1rem;
	}

	.location-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.location-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.country-search {
		margin-bottom: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.country-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.country-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.75rem;
	}

	.country-option:hover {
		background: var(--bg-secondary);
		border-color: var(--color-primary);
	}

	.country-option--selected {
		background: var(--color-primary-50);
		border-color: var(--color-primary);
	}

	.location-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}
</style>
