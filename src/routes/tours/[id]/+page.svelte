<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi, pb } from '$lib/pocketbase.js';
	import type { PageData } from './$types.js';
	import type { Tour } from '$lib/types.js';

	let { data }: { data: PageData } = $props();
	let tour = $state(data.tour);
	let error = $state<string | null>(null);
	
	// Construct image URL manually since pb might be null on server
	function getImageUrl(imageName: string) {
		if (pb) {
			return pb.files.getURL(tour, imageName);
		}
		// Fallback for server-side rendering
		return `${data.pbUrl}/api/files/tours/${tour.id}/${imageName}`;
	}

	async function deleteTour() {
		if (!tour || !confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
			return;
		}

		try {
			await toursApi.delete(tour.id);
			goto('/tours');
		} catch (err) {
			error = 'Failed to delete tour. Please try again.';
			console.error('Error deleting tour:', err);
		}
	}

	async function toggleStatus() {
		if (!tour) return;

		let newStatus: Tour['status'];
		if (tour.status === 'active') {
			newStatus = 'inactive';
		} else if (tour.status === 'inactive' || tour.status === 'draft') {
			newStatus = 'active';
		} else {
			return;
		}

		try {
			const updatedTour = await toursApi.update(tour.id, { status: newStatus });
			tour = updatedTour;
		} catch (err) {
			error = 'Failed to update tour status. Please try again.';
			console.error('Error updating tour status:', err);
		}
	}

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'inactive':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'draft':
				return 'bg-gray-100 text-gray-800 border-gray-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
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

	function formatDuration(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		
		if (hours === 0) {
			return `${mins} minutes`;
		} else if (mins === 0) {
			return `${hours} hour${hours > 1 ? 's' : ''}`;
		} else {
			return `${hours}h ${mins}m`;
		}
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex">
				<div class="text-red-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-red-800 font-medium">Error</p>
					<p class="text-red-700 text-sm">{error}</p>
				</div>
			</div>
		</div>
	{:else if !tour}
		<div class="text-center py-12">
			<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
			</svg>
			<h3 class="text-lg font-semibold text-gray-900 mb-2">Tour Not Found</h3>
			<p class="text-gray-600 mb-4">The tour you're looking for doesn't exist or has been deleted.</p>
			<button
				onclick={() => goto('/tours')}
				class="button-primary button--gap"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Tours
			</button>
		</div>
	{:else}
		<!-- Header -->
		<div class="flex items-center gap-4 mb-8">
			<button 
				onclick={() => goto('/tours')}
				class="button-secondary button--small"
				aria-label="Back to tours"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<div class="flex-1">
				<div class="flex items-center gap-3 mb-2">
					<h1 class="text-3xl font-bold text-gray-900">{tour.name}</h1>
					<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border {getStatusColor(tour.status)}">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{getStatusIcon(tour.status)}" />
						</svg>
						{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
					</span>
				</div>
				<div class="flex items-center gap-6 text-sm text-gray-600">
					{#if tour.category}
						<span class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
							</svg>
							{tour.category}
						</span>
					{/if}
					{#if tour.location}
						<span class="flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							{tour.location}
						</span>
					{/if}
					<span class="flex items-center gap-1">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m1 0h-9m9 0v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4" />
						</svg>
						Created {new Date(tour.created).toLocaleDateString()}
					</span>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={toggleStatus}
					class="button-secondary button--gap"
				>
					{#if tour.status === 'active'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Deactivate
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Activate
					{/if}
				</button>
				<button
					onclick={() => goto(`/tours/${tour?.id}/edit`)}
					class="button-primary button--gap"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Edit Tour
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-8">
				<!-- Tour Images -->
				{#if tour.images && tour.images.length > 0}
					<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-6">Tour Images</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each tour.images as imageName}
								<div class="aspect-w-16 aspect-h-12 rounded-lg overflow-hidden">
									<img 
										src={getImageUrl(imageName)} 
										alt="{tour.name} photo"
										class="w-full h-48 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform duration-200"
									/>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Basic Information -->
				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-6">Tour Details</h2>
					
					<div class="space-y-4">
						{#if tour.description}
							<div>
								<h3 class="text-sm font-medium text-gray-700 mb-2">Description</h3>
								<p class="text-gray-900 leading-relaxed">{tour.description}</p>
							</div>
						{/if}

						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<h3 class="text-sm font-medium text-gray-700 mb-2">Price</h3>
								<p class="text-2xl font-bold text-gray-900">€{tour.price}</p>
								<p class="text-sm text-gray-500">per person</p>
							</div>
							<div>
								<h3 class="text-sm font-medium text-gray-700 mb-2">Duration</h3>
								<p class="text-lg font-semibold text-gray-900">{formatDuration(tour.duration)}</p>
							</div>
							<div>
								<h3 class="text-sm font-medium text-gray-700 mb-2">Capacity</h3>
								<p class="text-lg font-semibold text-gray-900">{tour.capacity} people</p>
								<p class="text-sm text-gray-500">maximum</p>
							</div>
						</div>
					</div>
				</div>

				<!-- What's Included -->
				{#if tour.includedItems && tour.includedItems.length > 0}
					<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-6">What's Included</h2>
						<ul class="space-y-3">
							{#each tour.includedItems as item}
								<li class="flex items-start gap-3">
									<svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									<span class="text-gray-700">{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Requirements -->
				{#if tour.requirements && tour.requirements.length > 0}
					<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-6">Requirements</h2>
						<ul class="space-y-3">
							{#each tour.requirements as requirement}
								<li class="flex items-start gap-3">
									<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="text-gray-700">{requirement}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Cancellation Policy -->
				{#if tour.cancellationPolicy}
					<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-6">Cancellation Policy</h2>
						<p class="text-gray-700 leading-relaxed">{tour.cancellationPolicy}</p>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Quick Stats -->
				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">QR Codes</span>
							<span class="font-semibold text-gray-900">0</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">Total Bookings</span>
							<span class="font-semibold text-gray-900">0</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">Revenue</span>
							<span class="font-semibold text-gray-900">€0</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">Avg. Rating</span>
							<span class="font-semibold text-gray-900">-</span>
						</div>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
					<div class="space-y-3">
						<button
							onclick={() => goto(`/tours/${tour?.id}/qr`)}
							class="button-primary button--full-width button--gap"
							style="background-color: var(--color-success); border-color: var(--color-success);"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
							</svg>
							Generate QR Code
						</button>
						<button
							onclick={() => goto(`/tours/${tour?.id}/schedule`)}
							class="button-secondary button--full-width button--gap"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m1 0h-9m9 0v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4" />
							</svg>
							Manage Schedule
						</button>
						<button
							onclick={() => goto(`/tours/${tour?.id}/bookings`)}
							class="button-secondary button--full-width button--gap"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
							View Bookings
						</button>
					</div>
				</div>

				<!-- Danger Zone -->
				<div class="bg-white rounded-lg shadow-md border border-red-200 p-6">
					<h3 class="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
					<p class="text-sm text-red-700 mb-4">
						Once you delete a tour, there's no going back. Please be certain.
					</p>
					<button
						onclick={deleteTour}
						class="button--danger button--full-width button--gap"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Delete Tour
					</button>
				</div>
			</div>
		</div>
	{/if}
</div> 