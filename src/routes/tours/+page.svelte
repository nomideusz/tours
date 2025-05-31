<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toursApi } from '$lib/pocketbase.js';
	import type { Tour } from '$lib/types.js';

	let tours = $state<Tour[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedStatus = $state('all');

	onMount(async () => {
		await loadTours();
	});

	async function loadTours() {
		try {
			isLoading = true;
			error = null;
			tours = await toursApi.getAll();
		} catch (err) {
			error = 'Failed to load tours. Please try again.';
			console.error('Error loading tours:', err);
		} finally {
			isLoading = false;
		}
	}

	async function deleteTour(tourId: string) {
		if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
			return;
		}

		try {
			await toursApi.delete(tourId);
			tours = tours.filter((tour) => tour.id !== tourId);
		} catch (err) {
			error = 'Failed to delete tour. Please try again.';
			console.error('Error deleting tour:', err);
		}
	}

	async function duplicateTour(tour: Tour) {
		try {
			const duplicatedData = {
				name: `${tour.name} (Copy)`,
				description: tour.description,
				price: tour.price,
				duration: tour.duration,
				capacity: tour.capacity,
				status: 'draft' as Tour['status'],
				category: tour.category,
				location: tour.location,
				includedItems: tour.includedItems || [],
				requirements: tour.requirements || [],
				cancellationPolicy: tour.cancellationPolicy
			};

			const newTour = await toursApi.create(duplicatedData);
			tours = [newTour, ...tours];
		} catch (err) {
			error = 'Failed to duplicate tour. Please try again.';
			console.error('Error duplicating tour:', err);
		}
	}

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'inactive':
				return 'bg-yellow-100 text-yellow-800';
			case 'draft':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'inactive':
				return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'draft':
				return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
			default:
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}

	// Filter tours based on selected status
	let filteredTours = $derived(
		selectedStatus === 'all' ? tours : tours.filter((tour) => tour.status === selectedStatus)
	);

	// Calculate statistics
	let stats = $derived({
		total: tours.length,
		active: tours.filter((t) => t.status === 'active').length,
		draft: tours.filter((t) => t.status === 'draft').length,
		inactive: tours.filter((t) => t.status === 'inactive').length
	});
</script>

<div class="mx-auto max-w-screen-2xl px-6 py-8 sm:px-8 lg:px-12">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Your Tours</h1>
			<p class="mt-1 text-gray-600">Manage your tour offerings and track their performance</p>
		</div>
		<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Create New Tour
		</button>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex">
				<div class="text-red-600">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Statistics Cards -->
	<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Tours</p>
					<p class="text-2xl font-bold text-gray-900">{stats.total}</p>
				</div>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg"
					style="background-color: var(--color-primary-100);"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						style="color: var(--color-primary-600);"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Active</p>
					<p class="text-2xl font-bold text-green-600">{stats.active}</p>
				</div>
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
					<svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Draft</p>
					<p class="text-2xl font-bold text-gray-600">{stats.draft}</p>
				</div>
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
					<svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Inactive</p>
					<p class="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
				</div>
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
					<svg
						class="h-4 w-4 text-yellow-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row">
		<div class="flex gap-2">
			<button
				onclick={() => (selectedStatus = 'all')}
				class="{selectedStatus === 'all' ? 'button-primary' : 'button-secondary'} button--small"
			>
				All Tours
			</button>
			<button
				onclick={() => (selectedStatus = 'active')}
				class="{selectedStatus === 'active' ? 'button-primary' : 'button-secondary'} button--small"
			>
				Active
			</button>
			<button
				onclick={() => (selectedStatus = 'draft')}
				class="{selectedStatus === 'draft' ? 'button-primary' : 'button-secondary'} button--small"
			>
				Draft
			</button>
			<button
				onclick={() => (selectedStatus = 'inactive')}
				class="{selectedStatus === 'inactive'
					? 'button-primary'
					: 'button-secondary'} button--small"
			>
				Inactive
			</button>
		</div>
	</div>

	<!-- Tour List -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading tours...
			</div>
		</div>
	{:else if filteredTours.length === 0}
		<div class="py-12 text-center">
			<svg
				class="mx-auto mb-4 h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<h3 class="mb-2 text-lg font-semibold text-gray-900">
				{selectedStatus === 'all' ? 'No tours yet' : `No ${selectedStatus} tours`}
			</h3>
			<p class="mb-4 text-gray-600">
				{selectedStatus === 'all'
					? 'Create your first tour to start receiving bookings'
					: `You don't have any ${selectedStatus} tours at the moment`}
			</p>
			{#if selectedStatus === 'all'}
				<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Create Your First Tour
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid gap-6">
			{#each filteredTours as tour (tour.id)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
				>
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-start justify-between">
								<div class="flex-1">
									<h3 class="mb-1 text-xl font-semibold text-gray-900">{tour.name}</h3>
									<div class="mb-2 flex items-center gap-4 text-sm text-gray-600">
										{#if tour.category}
											<span class="flex items-center gap-1">
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
													/>
												</svg>
												{tour.category}
											</span>
										{/if}
										{#if tour.location}
											<span class="flex items-center gap-1">
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
													/>
												</svg>
												{tour.location}
											</span>
										{/if}
									</div>
									{#if tour.description}
										<p class="line-clamp-2 text-gray-600">{tour.description}</p>
									{/if}
								</div>
								<span
									class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium {getStatusColor(
										tour.status
									)} lg:hidden"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={getStatusIcon(tour.status)}
										/>
									</svg>
									{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
								</span>
							</div>

							<div class="flex items-center gap-6 text-sm text-gray-500">
								<span class="flex items-center gap-1">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
										/>
									</svg>
									€{tour.price} per person
								</span>
								<span class="flex items-center gap-1">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									{Math.floor(tour.duration / 60)}h {tour.duration % 60}m
								</span>
								<span class="flex items-center gap-1">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									Max {tour.capacity} people
								</span>
							</div>
						</div>

						<div class="flex flex-col gap-4 lg:items-end">
							<span
								class="hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-medium lg:inline-flex {getStatusColor(
									tour.status
								)}"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getStatusIcon(tour.status)}
									/>
								</svg>
								{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
							</span>
							<div class="flex items-center gap-2">
								<button
									onclick={() => goto(`/tours/${tour.id}`)}
									class="p-2 text-gray-400 transition-colors hover:text-blue-600"
									title="View details"
									aria-label="View details"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								</button>
								<button
									onclick={() => goto(`/tours/${tour.id}/edit`)}
									class="p-2 text-gray-400 transition-colors hover:text-blue-600"
									title="Edit tour"
									aria-label="Edit tour"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									onclick={() => duplicateTour(tour)}
									class="p-2 text-gray-400 transition-colors hover:text-green-600"
									title="Duplicate tour"
									aria-label="Duplicate tour"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								</button>
								<button
									onclick={() => deleteTour(tour.id)}
									class="p-2 text-gray-400 transition-colors hover:text-red-600"
									title="Delete tour"
									aria-label="Delete tour"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
