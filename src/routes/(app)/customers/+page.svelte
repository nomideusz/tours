<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { onMount } from 'svelte';
	import { createTableSort, sortData, createSortableFields } from '$lib/utils/table-sort.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import TableSort from '$lib/components/TableSort.svelte';
	
	// Icons
	import Users from 'lucide-svelte/icons/users';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Search from 'lucide-svelte/icons/search';
	import Download from 'lucide-svelte/icons/download';
	import Filter from 'lucide-svelte/icons/filter';
	import X from 'lucide-svelte/icons/x';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	type Customer = {
		email: string;
		name: string;
		phone: string | null;
		totalBookings: number;
		totalSpent: number;
		totalParticipants: number;
		firstBooking: string;
		lastBooking: string;
		confirmedBookings: number;
		pendingBookings: number;
		cancelledBookings: number;
		completedBookings: number;
	};

	// Query for customers data
	const customersQuery = createQuery({
		queryKey: queryKeys.customers,
		queryFn: queryFunctions.fetchCustomers,
		staleTime: 2 * 60 * 1000, // 2 minutes - customer data doesn't change frequently
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});

	// Derive data from query
	let customers = $derived.by(() => {
		const data = ($customersQuery.data as Customer[]) || [];
		// Deduplicate by email just in case
		const seen = new Set<string>();
		return data.filter(customer => {
			if (seen.has(customer.email)) {
				console.warn(`Duplicate customer email found: ${customer.email}`);
				return false;
			}
			seen.add(customer.email);
			return true;
		});
	});
	let isLoading = $derived($customersQuery.isLoading);
	let isError = $derived($customersQuery.isError);

	// State
	let searchQuery = $state('');
	let showFilters = $state(false);
	
	// Table sorting setup
	type SortField = 'name' | 'email' | 'totalBookings' | 'totalSpent' | 'lastBooking';
	let sortBy = $state<SortField>('lastBooking');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	
	// Define sortable fields
	const sortableFields = createSortableFields<Customer>({
		name: { getValue: (item) => item.name, type: 'string' },
		email: { getValue: (item) => item.email, type: 'string' },
		totalBookings: { getValue: (item) => item.totalBookings, type: 'number' },
		totalSpent: { getValue: (item) => item.totalSpent, type: 'number' },
		lastBooking: { getValue: (item) => item.lastBooking, type: 'date' }
	});
	let selectedCustomers = $state<Set<string>>(new Set());
	let copiedEmails = $state(false);

	// Filter states
	let minBookings = $state<number | null>(null);
	let minSpent = $state<number | null>(null);
	let hasPhoneFilter = $state<'all' | 'phone' | 'no-phone'>('all');
	let bookingDateFilter = $state<'all' | 'recent' | 'old'>('all');


	// Filtered and sorted customers
	let filteredCustomers = $derived.by(() => {
		let result = [...customers]; // Create a copy to avoid mutating original array

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(customer => 
				customer.name.toLowerCase().includes(query) ||
				customer.email.toLowerCase().includes(query) ||
				(customer.phone && customer.phone.toLowerCase().includes(query))
			);
		}

		// Filters
		if (minBookings !== null) {
			result = result.filter(customer => customer.totalBookings >= minBookings!);
		}

		if (minSpent !== null) {
			result = result.filter(customer => customer.totalSpent >= minSpent!);
		}

		if (hasPhoneFilter !== 'all') {
			if (hasPhoneFilter === 'phone') {
				result = result.filter(customer => customer.phone);
			} else {
				result = result.filter(customer => !customer.phone);
			}
		}

		if (bookingDateFilter !== 'all') {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			
			if (bookingDateFilter === 'recent') {
				result = result.filter(customer => new Date(customer.lastBooking) >= thirtyDaysAgo);
			} else {
				result = result.filter(customer => new Date(customer.lastBooking) < thirtyDaysAgo);
			}
		}



		// Sort using the reusable utility
		result = sortData(result, { sortBy, sortOrder }, sortableFields);

		return result;
	});

	// Summary stats
	let summaryStats = $derived.by(() => {
		if (!customers.length) return { totalCustomers: 0, totalRevenue: 0, avgBookingsPerCustomer: 0, avgSpentPerCustomer: 0 };

		const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
		const totalBookings = customers.reduce((sum, customer) => sum + customer.totalBookings, 0);

		return {
			totalCustomers: customers.length,
			totalRevenue,
			avgBookingsPerCustomer: totalBookings / customers.length,
			avgSpentPerCustomer: totalRevenue / customers.length
		};
	});





	// Actions

	async function copySelectedEmails() {
		if (selectedCustomers.size === 0) return;
		
		const emails = Array.from(selectedCustomers).join(', ');
		try {
			await navigator.clipboard.writeText(emails);
			copiedEmails = true;
			setTimeout(() => copiedEmails = false, 2000);
		} catch (err) {
			console.error('Failed to copy emails:', err);
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement('textarea');
			textArea.value = emails;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copiedEmails = true;
			setTimeout(() => copiedEmails = false, 2000);
		}
	}

	async function exportToCSV() {
		const dataToExport = selectedCustomers.size > 0 
			? filteredCustomers.filter(c => selectedCustomers.has(c.email))
			: filteredCustomers;

		if (dataToExport.length === 0) return;

		const headers = [
			'Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Total Participants',
			'First Booking', 'Last Booking', 'Confirmed', 'Pending', 'Cancelled', 'Completed'
		];

		const csvContent = [
			headers.join(','),
			...dataToExport.map(customer => [
				`"${customer.name}"`,
				`"${customer.email}"`,
				`"${customer.phone || ''}"`,
				customer.totalBookings,
				customer.totalSpent,
				customer.totalParticipants,
				`"${formatDate(customer.firstBooking)}"`,
				`"${formatDate(customer.lastBooking)}"`,
				customer.confirmedBookings,
				customer.pendingBookings,
				customer.cancelledBookings,
				customer.completedBookings
			].join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearFilters() {
		searchQuery = '';
		minBookings = null;
		minSpent = null;
		hasPhoneFilter = 'all';
		bookingDateFilter = 'all';
		showFilters = false;
	}

	// Sort columns configuration for TableSort component
	const sortColumns = [
		{ key: 'name', label: 'Customer' },
		{ key: 'totalBookings', label: 'Bookings' },
		{ key: 'totalSpent', label: 'Revenue' },
		{ key: 'lastBooking', label: 'Last Booking' }
	];
	
	// Handle sort from component
	function handleSort(field: string) {
		const fieldTyped = field as SortField;
		if (sortBy === fieldTyped) {
			// Toggle sort order if same field is selected
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			// Set new field with default desc order
			sortBy = fieldTyped;
			sortOrder = 'desc';
		}
	}

	// Check if filters are active
	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' ||
		minBookings !== null ||
		minSpent !== null ||
		hasPhoneFilter !== 'all' ||
		bookingDateFilter !== 'all'
	);
</script>

<svelte:head>
	<title>Customers - Zaur</title>
	<meta name="description" content="Manage your customer contacts and relationships" />
</svelte:head>

<div class="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title="Customers"
			secondaryInfo={isLoading ? 'Loading...' : `${customers.length} total`}
			quickActions={[
				{
					label: 'Export',
					icon: Download,
					onclick: exportToCSV,
					variant: 'secondary',
					disabled: filteredCustomers.length === 0
				}
			]}

		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Customers"
				subtitle="Manage your customer contacts and build relationships"
			>
				<div class="flex items-center gap-4">
					{#if selectedCustomers.size > 0}
						<div class="text-sm" style="color: var(--text-secondary);">
							{selectedCustomers.size} selected
						</div>
						<button 
							onclick={() => {
								const emails = Array.from(selectedCustomers).join(',');
								window.location.href = `mailto:?bcc=${encodeURIComponent(emails)}`;
							}} 
							class="button-primary button-gap button-small"
						>
							<Mail class="h-4 w-4" />
							Email Selected
						</button>
						<button onclick={copySelectedEmails} class="button-secondary button-gap button-small">
							{#if copiedEmails}
								<CheckCircle class="h-4 w-4" />
								Copied!
							{:else}
								<Copy class="h-4 w-4" />
								Copy Emails
							{/if}
						</button>
					{/if}
					<button onclick={exportToCSV} class="button-secondary button-gap" disabled={customers.length === 0}>
						<Download class="h-4 w-4" />
						Export CSV
					</button>
				</div>
			</PageHeader>
		</div>
	</div>





	<!-- Search and Filters -->
	<div class="mb-6 space-y-4">
		<div class="flex flex-col sm:flex-row gap-3">
			<!-- Search -->
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search customers by name, email, or phone..."
					class="form-input pl-10 pr-10"
				/>
				{#if searchQuery}
					<button
						onclick={() => searchQuery = ''}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
						style="background: transparent;"
						onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
					>
						<X class="h-4 w-4" style="color: var(--text-tertiary);" />
					</button>
				{/if}
			</div>
			
			<!-- Mobile Sort & Filter Controls -->
			<div class="flex gap-2 sm:hidden">
				<!-- Mobile Sort -->
				<select 
					onchange={(e) => handleSort(e.currentTarget.value)}
					class="form-select flex-1"
					value={sortBy}
				>
					<option value="name">Sort: Customer Name</option>
					<option value="totalBookings">Sort: Most Bookings</option>
					<option value="totalSpent">Sort: Highest Revenue</option>
					<option value="lastBooking">Sort: Recent Activity</option>
				</select>
			</div>
			
			<!-- Filter Button -->
			<button
				onclick={() => showFilters = !showFilters}
				class="button-secondary button-gap {hasActiveFilters ? 'ring-2' : ''}"
				style="{hasActiveFilters ? 'ring-color: var(--color-primary-500);' : ''}"
			>
				<Filter class="h-4 w-4" />
				<span class="hidden sm:inline">Filters</span>
				{#if hasActiveFilters}
					<span class="ml-1 px-1.5 py-0.5 text-xs rounded-full" style="background: var(--color-primary-500); color: white;">
						{(minBookings !== null ? 1 : 0) + (minSpent !== null ? 1 : 0) + (hasPhoneFilter !== 'all' ? 1 : 0) + (bookingDateFilter !== 'all' ? 1 : 0)}
					</span>
				{/if}
				<ChevronDown class="h-4 w-4 ml-1 transition-transform {showFilters ? 'rotate-180' : ''}" />
			</button>
		</div>
		
		<!-- Filter Panel -->
		{#if showFilters}
			<div class="rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Min Bookings -->
					<div>
						<label for="min-bookings" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Min Bookings
						</label>
						<input
							id="min-bookings"
							type="number"
							bind:value={minBookings}
							placeholder="Any"
							min="1"
							class="form-input w-full"
						/>
					</div>
					
					<!-- Min Spent -->
					<div>
						<label for="min-spent" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Min Spent
						</label>
						<input
							id="min-spent"
							type="number"
							bind:value={minSpent}
							placeholder="Any amount"
							min="0"
							step="10"
							class="form-input w-full"
						/>
					</div>
					
					<!-- Phone Filter -->
					<div>
						<label for="phone-filter" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Phone Number
						</label>
						<select id="phone-filter" bind:value={hasPhoneFilter} class="form-select w-full">
							<option value="all">All Customers</option>
							<option value="phone">Has Phone</option>
							<option value="no-phone">No Phone</option>
						</select>
					</div>
					
					<!-- Booking Date Filter -->
					<div>
						<label for="booking-date-filter" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Last Booking
						</label>
						<select id="booking-date-filter" bind:value={bookingDateFilter} class="form-select w-full">
							<option value="all">All Time</option>
							<option value="recent">Last 30 Days</option>
							<option value="old">Over 30 Days Ago</option>
						</select>
					</div>
				</div>
				
				<div class="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
					{#if hasActiveFilters}
						<button onclick={clearFilters} class="button-secondary button-small button-gap w-full sm:w-auto">
							<X class="h-4 w-4" />
							Clear Filters
						</button>
					{/if}
					<button onclick={() => showFilters = false} class="button-primary button-small w-full sm:w-auto sm:hidden">
						Done
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Customers List -->
	{#if isLoading}
		<div class="flex justify-center py-12">
			<div class="text-center">
				<Loader2 class="h-8 w-8 mx-auto mb-4 animate-spin" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading customers...</p>
			</div>
		</div>
	{:else if isError}
		<div class="alert-error rounded-xl p-6">
			<div class="flex items-center gap-3">
				<AlertCircle class="h-5 w-5" />
				<p>Failed to load customers. Please refresh the page.</p>
			</div>
		</div>
	{:else if filteredCustomers.length === 0}
		<div class="rounded-xl p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			{#if customers.length === 0}
				<Users class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No customers yet</h3>
				<p class="text-sm mb-6" style="color: var(--text-secondary);">Start accepting bookings to build your customer base</p>
				<button onclick={() => goto('/tours')} class="button-primary button-gap">
					<Users class="h-4 w-4" />
					Manage Tours
				</button>
			{:else}
				<Search class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No customers found</h3>
				<p class="text-sm mb-6" style="color: var(--text-secondary);">Try adjusting your search or filters</p>
				<button onclick={clearFilters} class="button-secondary">
					Clear filters
				</button>
			{/if}
		</div>
	{:else}
		<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<!-- Table Header with Bulk Actions -->
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<!-- Mobile Layout -->
				<div class="sm:hidden">
					<div class="flex items-center justify-between mb-3">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
								oninput={() => {
									if (selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0) {
										selectedCustomers = new Set();
									} else {
										selectedCustomers = new Set(filteredCustomers.map(c => c.email));
									}
								}}
								class="form-checkbox"
							/>
							<span class="text-sm font-medium" style="color: var(--text-primary);">
								{selectedCustomers.size > 0 ? `${selectedCustomers.size} selected` : 'Select all'}
							</span>
						</label>
						<span class="text-sm" style="color: var(--text-secondary);">
							{filteredCustomers.length} of {customers.length}
						</span>
					</div>
					
					{#if selectedCustomers.size > 0}
						<div class="flex gap-2">
							<button 
								onclick={() => {
									const emails = Array.from(selectedCustomers).join(',');
									window.location.href = `mailto:?bcc=${encodeURIComponent(emails)}`;
								}} 
								class="button-primary button-small button-gap flex-1"
							>
								<Mail class="h-4 w-4" />
								Email
							</button>
							<button 
								onclick={copySelectedEmails} 
								class="button-secondary button-small button-gap"
							>
								{#if copiedEmails}
									<CheckCircle class="h-4 w-4" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
							<button 
								onclick={exportToCSV} 
								class="button-secondary button-small button-gap"
							>
								<Download class="h-4 w-4" />
							</button>
						</div>
					{/if}
				</div>
				
				<!-- Desktop Layout -->
				<div class="hidden sm:flex items-center justify-between min-h-[2.5rem]">
					<div class="flex items-center gap-3">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
								oninput={() => {
									if (selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0) {
										selectedCustomers = new Set();
									} else {
										selectedCustomers = new Set(filteredCustomers.map(c => c.email));
									}
								}}
								class="form-checkbox"
							/>
							<span class="text-sm font-medium" style="color: var(--text-primary);">
								{selectedCustomers.size > 0 ? `${selectedCustomers.size} selected` : 'Select all'}
							</span>
						</label>
					</div>
					
					<!-- Right Side Content - Overlapping containers -->
					<div class="relative flex justify-end">
						<!-- Action Buttons Container -->
						<div class="flex gap-2 transition-opacity duration-200" 
							 style="opacity: {selectedCustomers.size > 0 ? 1 : 0}; pointer-events: {selectedCustomers.size > 0 ? 'auto' : 'none'};">
							<button 
								onclick={() => {
									const emails = Array.from(selectedCustomers).join(',');
									window.location.href = `mailto:?bcc=${encodeURIComponent(emails)}`;
								}} 
								class="button-primary button-small button-gap"
								disabled={selectedCustomers.size === 0}
							>
								<Mail class="h-4 w-4" />
								Email Selected
							</button>
							<button 
								onclick={copySelectedEmails} 
								class="button-secondary button-small button-gap"
								disabled={selectedCustomers.size === 0}
							>
								{#if copiedEmails}
									<CheckCircle class="h-4 w-4" />
									Copied!
								{:else}
									<Copy class="h-4 w-4" />
									Copy
								{/if}
							</button>
							<button 
								onclick={exportToCSV} 
								class="button-secondary button-small button-gap"
								disabled={selectedCustomers.size === 0}
							>
								<Download class="h-4 w-4" />
								Export
							</button>
						</div>
						
						<!-- Customer Count - Desktop Only -->
						<span class="flex items-center absolute inset-0 justify-end transition-opacity duration-200" 
							  style="color: var(--text-secondary); opacity: {selectedCustomers.size === 0 ? 1 : 0}; pointer-events: none;">
							{filteredCustomers.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
			</div>

			<!-- Desktop Table -->
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full">
					<thead style="background: var(--bg-secondary);">
						<tr>
							<th class="px-4 py-3 text-left">
								<span class="sr-only">Select</span>
							</th>
							<th class="px-4 py-3 text-left">
								<button
									onclick={() => handleSort('name')}
									class="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-all group"
									style="color: var(--text-secondary);"
								>
									Customer
									<ArrowUpDown class="h-3 w-3 transition-opacity {sortBy === 'name' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}" />
								</button>
							</th>
							<th class="px-4 py-3 text-left">
								<button
									onclick={() => handleSort('totalBookings')}
									class="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-all group"
									style="color: var(--text-secondary);"
								>
									Bookings
									<ArrowUpDown class="h-3 w-3 transition-opacity {sortBy === 'totalBookings' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}" />
								</button>
							</th>
							<th class="px-4 py-3 text-left">
								<button
									onclick={() => handleSort('totalSpent')}
									class="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-all group"
									style="color: var(--text-secondary);"
								>
									Revenue
									<ArrowUpDown class="h-3 w-3 transition-opacity {sortBy === 'totalSpent' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}" />
								</button>
							</th>
							<th class="px-4 py-3 text-left">
								<button
									onclick={() => handleSort('lastBooking')}
									class="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-all group"
									style="color: var(--text-secondary);"
								>
									Last Booking
									<ArrowUpDown class="h-3 w-3 transition-opacity {sortBy === 'lastBooking' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}" />
								</button>
							</th>
							<th class="px-4 py-3 text-left">
								<span class="text-sm font-medium" style="color: var(--text-secondary);">
									Actions
								</span>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y" style="border-color: var(--border-primary);">
						{#each filteredCustomers as customer (customer.email)}
							<tr class="hover:bg-[var(--bg-secondary)] transition-colors">
								<td class="px-4 py-4">
									<input
										type="checkbox"
										checked={selectedCustomers.has(customer.email)}
										oninput={(e) => {
											const target = e.currentTarget;
											if (target.checked) {
												selectedCustomers = new Set([...selectedCustomers, customer.email]);
											} else {
												const newSet = new Set(selectedCustomers);
												newSet.delete(customer.email);
												selectedCustomers = newSet;
											}
										}}
										class="form-checkbox"
									/>
								</td>
								<td class="px-4 py-4">
									<div>
										<div class="mb-1">
											<p class="font-medium text-sm" style="color: var(--text-primary);">{customer.name}</p>
										</div>
										<p class="text-xs" style="color: var(--text-secondary);">{customer.email}</p>
										{#if customer.phone}
											<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">{customer.phone}</p>
										{/if}
									</div>
								</td>
								<td class="px-4 py-4">
									<div class="text-sm">
										<p class="font-medium" style="color: var(--text-primary);">{customer.totalBookings}</p>
										<p class="text-xs" style="color: var(--text-secondary);">
											{customer.confirmedBookings} confirmed
											{#if customer.pendingBookings > 0}
												• {customer.pendingBookings} pending
											{/if}
										</p>
									</div>
								</td>
								<td class="px-4 py-4">
									<div class="text-sm">
										<p class="font-medium" style="color: var(--text-primary);">{$globalCurrencyFormatter(customer.totalSpent)}</p>
										<p class="text-xs" style="color: var(--text-secondary);">{customer.totalParticipants} participants</p>
									</div>
								</td>
								<td class="px-4 py-4">
									<div class="text-sm">
										<p class="font-medium" style="color: var(--text-primary);">{formatDate(customer.lastBooking)}</p>
										<p class="text-xs" style="color: var(--text-secondary);">First: {formatDate(customer.firstBooking)}</p>
									</div>
								</td>
								<td class="px-4 py-4">
									<div class="flex items-center gap-2">
										<Tooltip text="Send email" position="top">
											<button
												onclick={() => window.location.href = `mailto:${customer.email}`}
												class="button-secondary button-small button-icon"
											>
												<Mail class="h-4 w-4" />
											</button>
										</Tooltip>
										{#if customer.phone}
											<Tooltip text="Call customer" position="top">
												<button
													onclick={() => window.location.href = `tel:${customer.phone}`}
													class="button-secondary button-small button-icon"
												>
													<Phone class="h-4 w-4" />
												</button>
											</Tooltip>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

						<!-- Mobile Cards -->
			<div class="md:hidden divide-y" style="border-color: var(--border-primary);">
				{#each filteredCustomers as customer (customer.email)}
					<div class="p-4 active:bg-[var(--bg-secondary)] transition-colors">
						<div class="flex items-start gap-3 mb-3">
							<input
								type="checkbox"
								checked={selectedCustomers.has(customer.email)}
								oninput={(e) => {
									const target = e.currentTarget;
									if (target.checked) {
										selectedCustomers = new Set([...selectedCustomers, customer.email]);
									} else {
										const newSet = new Set(selectedCustomers);
										newSet.delete(customer.email);
										selectedCustomers = newSet;
									}
								}}
								class="form-checkbox mt-1 flex-shrink-0"
							/>
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-2 mb-2">
									<div class="flex-1 min-w-0">
										<div class="mb-1">
											<h4 class="font-semibold text-base truncate" style="color: var(--text-primary);">{customer.name}</h4>
										</div>
										<p class="text-sm truncate mb-1" style="color: var(--text-secondary);">{customer.email}</p>
										{#if customer.phone}
											<p class="text-sm" style="color: var(--text-tertiary);">{customer.phone}</p>
										{/if}
									</div>
									<div class="flex items-center gap-1 flex-shrink-0">
										<Tooltip text="Send email" position="bottom-left">
											<button
												onclick={() => window.location.href = `mailto:${customer.email}`}
												class="button-secondary button-small button-icon"
											>
												<Mail class="h-4 w-4" />
											</button>
										</Tooltip>
										{#if customer.phone}
											<Tooltip text="Call customer" position="bottom-left">
												<button
													onclick={() => window.location.href = `tel:${customer.phone}`}
													class="button-secondary button-small button-icon"
												>
													<Phone class="h-4 w-4" />
												</button>
											</Tooltip>
										{/if}
									</div>
								</div>
								
								<div class="grid grid-cols-2 gap-3 text-sm">
									<div class="bg-[var(--bg-secondary)] rounded-lg p-2">
										<p class="font-semibold text-lg" style="color: var(--text-primary);">{customer.totalBookings}</p>
										<p class="text-xs" style="color: var(--text-secondary);">bookings</p>
										<p class="text-xs" style="color: var(--text-tertiary);">{customer.confirmedBookings} confirmed</p>
									</div>
									<div class="bg-[var(--bg-secondary)] rounded-lg p-2">
										<p class="font-semibold text-lg" style="color: var(--text-primary);">{$globalCurrencyFormatter(customer.totalSpent)}</p>
										<p class="text-xs" style="color: var(--text-secondary);">total spent</p>
										<p class="text-xs" style="color: var(--text-tertiary);">{customer.totalParticipants} participants</p>
									</div>
								</div>
								
								<div class="mt-2 text-xs" style="color: var(--text-tertiary);">
									Last booking: {formatDate(customer.lastBooking)}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

 