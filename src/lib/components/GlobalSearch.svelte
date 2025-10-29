<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	// Icons
	import Search from 'lucide-svelte/icons/search';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import X from 'lucide-svelte/icons/x';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	let searchInput = $state('');
	let showSearchDropdown = $state(false);
	let isSearching = $state(false);
	let searchResults = $state({
		tours: [] as Array<{id: string; title: string; status: string}>,
		bookings: [] as Array<{id: string; reference: string; tourName: string; status: string}>,
		customers: [] as Array<{id: string; name: string; email: string}>
	});
	let searchInputElement: HTMLInputElement;
	let dropdownElement: HTMLDivElement;
	let triggerButtonElement: HTMLButtonElement;
	
	// Keyboard shortcut (Cmd+K or Ctrl+K)
	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				openSearch();
			}
			if (e.key === 'Escape' && showSearchDropdown) {
				closeSearch();
			}
		}
		
		function handleClickOutside(e: MouseEvent) {
			// Don't close if clicking the trigger button or if dropdown doesn't exist yet
			if (!showSearchDropdown) return;
			if (triggerButtonElement && triggerButtonElement.contains(e.target as Node)) return;
			if (dropdownElement && dropdownElement.contains(e.target as Node)) return;
			
			// Click is outside - close the search
			closeSearch();
		}
		
		document.addEventListener('keydown', handleKeydown);
		// Use capture phase to handle clicks before they bubble
		document.addEventListener('click', handleClickOutside, true);
		
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('click', handleClickOutside, true);
		};
	});
	
	function openSearch() {
		showSearchDropdown = true;
		// Focus input after dropdown renders
		requestAnimationFrame(() => {
			searchInputElement?.focus();
		});
	}
	
	function closeSearch() {
		showSearchDropdown = false;
		searchInput = '';
		searchResults = {
			tours: [],
			bookings: [],
			customers: []
		};
	}
	
	// Search function with actual API calls
	async function performSearch(query: string) {
		if (!query.trim()) {
			searchResults = {
				tours: [],
				bookings: [],
				customers: []
			};
			return;
		}
		
		isSearching = true;
		
		try {
			// Search tours
			const toursPromise = fetch(`/api/tours?search=${encodeURIComponent(query)}&limit=5`)
				.then(res => res.ok ? res.json() : { tours: [] })
				.then(data => data.tours || [])
				.catch(() => []);
			
			// Search bookings
			const bookingsPromise = fetch(`/api/bookings?search=${encodeURIComponent(query)}&limit=5`)
				.then(res => res.ok ? res.json() : { bookings: [] })
				.then(data => data.bookings || [])
				.catch(() => []);
			
			// Search customers
			const customersPromise = fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=5`)
				.then(res => res.ok ? res.json() : { customers: [] })
				.then(data => data.customers || [])
				.catch(() => []);
			
			const [tours, bookings, customers] = await Promise.all([
				toursPromise,
				bookingsPromise,
				customersPromise
			]);
			
			searchResults = {
				tours: tours.map((t: any) => ({
					id: t.id,
					title: t.name || t.title,
					status: t.status
				})),
				bookings: bookings.map((b: any) => ({
					id: b.id,
					reference: b.bookingReference || b.reference,
					tourName: b.tourName || 'Unknown Tour',
					status: b.status
				})),
				customers: customers.map((c: any) => ({
					id: c.id,
					name: c.name,
					email: c.email
				}))
			};
		} catch (error) {
			console.error('Search error:', error);
			searchResults = {
				tours: [],
				bookings: [],
				customers: []
			};
		} finally {
			isSearching = false;
		}
	}
	
	// Debounced search
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (showSearchDropdown) {
			if (searchTimeout) clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				performSearch(searchInput);
			}, 300);
		}
	});
	
	function handleResultClick(type: string, id: string) {
		closeSearch();
		
		switch (type) {
			case 'tour':
				goto(`/tours/${id}`);
				break;
			case 'booking':
				goto(`/bookings/${id}`);
				break;
			case 'customer':
				goto(`/customers?id=${id}`);
				break;
		}
	}
	
	const hasResults = $derived(
		searchResults.tours.length > 0 || 
		searchResults.bookings.length > 0 || 
		searchResults.customers.length > 0
	);
</script>

<!-- Search Button -->
<button
	bind:this={triggerButtonElement}
	onclick={openSearch}
	class="global-search-trigger"
	aria-label="Search (Cmd+K)"
>
	<Search class="h-4 w-4" />
	<span class="search-hint">Search...</span>
	<kbd class="search-shortcut">⌘K</kbd>
</button>

<!-- Search Dropdown - Portal to body -->
{#if showSearchDropdown}
	{@render searchModal()}
{/if}

{#snippet searchModal()}
	<div class="global-search-backdrop" aria-hidden="true" onclick={closeSearch}></div>
	
	<div 
		bind:this={dropdownElement}
		class="global-search-dropdown"
		role="dialog"
		aria-modal="true"
		aria-label="Global search"
		tabindex="-1"
	>
		<div class="search-header">
			<div class="search-input-wrapper">
				<Search class="search-icon" />
				<input
					bind:this={searchInputElement}
					bind:value={searchInput}
					type="text"
					placeholder="Search tours, bookings, customers..."
					class="search-input"
					onkeydown={(e) => {
						if (e.key === 'Escape') {
							closeSearch();
						}
					}}
				/>
				{#if isSearching}
					<Loader2 class="search-loading" />
				{/if}
				<button onclick={closeSearch} class="search-close">
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>
		
		<div class="search-results">
			{#if searchInput && !isSearching && !hasResults}
				<div class="no-results">
					<p>No results found for "{searchInput}"</p>
					<p class="text-sm" style="color: var(--text-tertiary);">Try searching with different keywords</p>
				</div>
			{:else if hasResults}
				<!-- Tours -->
				{#if searchResults.tours.length > 0}
					<div class="result-section">
						<h3 class="result-section-title">
							<MapPin class="h-4 w-4" />
							Tours
						</h3>
						<div class="result-items">
							{#each searchResults.tours as tour}
								<button
									onclick={() => handleResultClick('tour', tour.id)}
									class="result-item"
								>
									<div class="result-content">
										<p class="result-title">{tour.title}</p>
										<p class="result-meta">
											<span class="status-badge status-{tour.status}">{tour.status}</span>
										</p>
									</div>
									<ArrowRight class="result-arrow" />
								</button>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Bookings -->
				{#if searchResults.bookings.length > 0}
					<div class="result-section">
						<h3 class="result-section-title">
							<Calendar class="h-4 w-4" />
							Bookings
						</h3>
						<div class="result-items">
							{#each searchResults.bookings as booking}
								<button
									onclick={() => handleResultClick('booking', booking.id)}
									class="result-item"
								>
									<div class="result-content">
										<p class="result-title">{booking.reference}</p>
										<p class="result-meta">{booking.tourName}</p>
									</div>
									<ArrowRight class="result-arrow" />
								</button>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Customers -->
				{#if searchResults.customers.length > 0}
					<div class="result-section">
						<h3 class="result-section-title">
							<Users class="h-4 w-4" />
							Customers
						</h3>
						<div class="result-items">
							{#each searchResults.customers as customer}
								<button
									onclick={() => handleResultClick('customer', customer.id)}
									class="result-item"
								>
									<div class="result-content">
										<p class="result-title">{customer.name}</p>
										<p class="result-meta">{customer.email}</p>
									</div>
									<ArrowRight class="result-arrow" />
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{:else if !searchInput}
				<div class="search-suggestions">
					<p class="suggestion-title">Quick Actions</p>
					<div class="suggestion-items">
						<button onclick={() => { closeSearch(); goto('/tours/new'); }} class="suggestion-item">
							<MapPin class="h-4 w-4" />
							Create New Tour
						</button>
						<button onclick={() => { closeSearch(); goto('/bookings'); }} class="suggestion-item">
							<Calendar class="h-4 w-4" />
							View Bookings
						</button>
						<button onclick={() => { closeSearch(); goto('/customers'); }} class="suggestion-item">
							<Users class="h-4 w-4" />
							Manage Customers
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<style>
	/* Search Trigger Button */
	.global-search-trigger {
		display: none;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--transition-base) ease;
		position: relative;
		z-index: 10;
		pointer-events: auto;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	
	@media (min-width: 768px) {
		.global-search-trigger {
			display: flex;
		}
	}
	
	.global-search-trigger:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	/* Ensure child elements don't block clicks */
	.global-search-trigger > * {
		pointer-events: none;
	}
	
	.search-hint {
		color: var(--text-tertiary);
		min-width: 5rem;
		text-align: left;
	}
	
	.search-shortcut {
		display: none;
		padding: 0.125rem 0.375rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		font-size: 0.6875rem;
		font-family: monospace;
		color: var(--text-tertiary);
	}
	
	@media (min-width: 1024px) {
		.global-search-trigger {
			min-width: 12rem;
		}
		
		.search-shortcut {
			display: block;
		}
	}
	
	/* Search Backdrop */
	.global-search-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		animation: fadeIn 0.15s ease-out;
	}
	
	/* Search Dropdown */
	.global-search-dropdown {
		position: fixed;
		top: 5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 90vw;
		max-width: 40rem;
		max-height: calc(100vh - 10rem);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		z-index: 1001;
		display: flex;
		flex-direction: column;
		animation: slideDown 0.15s ease-out;
	}
	
	@media (max-width: 640px) {
		.global-search-dropdown {
			top: 1rem;
			width: calc(100vw - 2rem);
			max-height: calc(100vh - 2rem);
		}
	}
	
	/* Search Header */
	.search-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border-primary);
		flex-shrink: 0;
	}
	
	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	.search-icon {
		position: absolute;
		left: 1rem;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--text-tertiary);
		pointer-events: none;
	}
	
	.search-input {
		flex: 1;
		padding: 0.75rem 3rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		font-size: 1rem;
		color: var(--text-primary);
		outline: none;
		transition: all var(--transition-base) ease;
	}
	
	.search-input:focus {
		border-color: var(--color-primary-300);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-300-rgb), 0.1);
	}
	
	.search-loading {
		position: absolute;
		right: 3rem;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--text-tertiary);
		animation: spin 1s linear infinite;
	}
	
	.search-close {
		position: absolute;
		right: 0.75rem;
		padding: 0.5rem;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-base) ease;
	}
	
	.search-close:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	/* Search Results */
	.search-results {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}
	
	.no-results {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}
	
	.result-section {
		margin-bottom: 1.5rem;
	}
	
	.result-section:last-child {
		margin-bottom: 0;
	}
	
	.result-section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}
	
	.result-items {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.result-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-base) ease;
	}
	
	.result-item:hover {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
		transform: translateX(2px);
	}
	
	.result-content {
		flex: 1;
		min-width: 0;
	}
	
	.result-title {
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.result-meta {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin: 0;
		margin-top: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.status-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--radius-sm);
	}
	
	.status-active {
		background: var(--color-success-100);
		color: var(--color-success-700);
	}
	
	.status-draft {
		background: var(--color-warning-100);
		color: var(--color-warning-700);
	}
	
	.result-arrow {
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
	
	/* Search Suggestions */
	.search-suggestions {
		padding: 1rem 0;
	}
	
	.suggestion-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem 0;
	}
	
	.suggestion-items {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.suggestion-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-base) ease;
	}
	
	.suggestion-item:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
	}
	
	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	/* Dark mode adjustments */
	:global([data-theme="dark"]) .global-search-backdrop {
		background: rgba(0, 0, 0, 0.7);
	}
	
	:global([data-theme="dark"]) .search-input {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}
	
	:global([data-theme="dark"]) .status-active {
		background: rgba(34, 197, 94, 0.1);
		color: rgb(74, 222, 128);
	}
	
	:global([data-theme="dark"]) .status-draft {
		background: rgba(245, 158, 11, 0.1);
		color: rgb(251, 191, 36);
	}
</style>
