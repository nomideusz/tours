<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi } from '$lib/pocketbase.js';
	import type { Tour } from '$lib/types.js';

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	// Form data
	let formData = $state({
		name: '',
		description: '',
		price: 0,
		duration: 60, // in minutes
		capacity: 10,
		status: 'draft' as Tour['status'],
		category: '',
		location: '',
		includedItems: [''],
		requirements: [''],
		cancellationPolicy: ''
	});

	function addIncludedItem() {
		formData.includedItems = [...formData.includedItems, ''];
	}

	function removeIncludedItem(index: number) {
		formData.includedItems = formData.includedItems.filter((_, i) => i !== index);
	}

	function addRequirement() {
		formData.requirements = [...formData.requirements, ''];
	}

	function removeRequirement(index: number) {
		formData.requirements = formData.requirements.filter((_, i) => i !== index);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = null;

		try {
			// Filter out empty strings from arrays
			const cleanedData = {
				...formData,
				includedItems: formData.includedItems.filter(item => item.trim() !== ''),
				requirements: formData.requirements.filter(req => req.trim() !== '')
			};

			const tour = await toursApi.create(cleanedData);
			goto(`/tours`);
		} catch (err) {
			error = 'Failed to create tour. Please try again.';
			console.error('Error creating tour:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
			goto('/');
		}
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<button 
			onclick={() => goto('/')}
			class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Create New Tour</h1>
			<p class="text-gray-600 mt-1">Set up your tour details and start receiving bookings</p>
		</div>
	</div>

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
	{/if}

	<form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main form content -->
		<div class="lg:col-span-2 space-y-8">
			<!-- Basic Information -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2">
						<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
							Tour Name *
						</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							required
							placeholder="e.g., Historic Walking Tour of Prague"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label for="category" class="block text-sm font-medium text-gray-700 mb-2">
							Category
						</label>
						<select
							id="category"
							bind:value={formData.category}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						>
							<option value="">Select category</option>
							<option value="walking">Walking Tour</option>
							<option value="food">Food Tour</option>
							<option value="cultural">Cultural Tour</option>
							<option value="historical">Historical Tour</option>
							<option value="art">Art Tour</option>
							<option value="adventure">Adventure Tour</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
							Location
						</label>
						<input
							type="text"
							id="location"
							bind:value={formData.location}
							placeholder="e.g., Prague Castle Area"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div class="md:col-span-2">
						<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
							Description *
						</label>
						<textarea
							id="description"
							bind:value={formData.description}
							required
							rows="4"
							placeholder="Describe your tour, what makes it special, what guests will see and experience..."
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Pricing & Logistics -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Pricing & Logistics</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label for="price" class="block text-sm font-medium text-gray-700 mb-2">
							Price per Person (€) *
						</label>
						<input
							type="number"
							id="price"
							bind:value={formData.price}
							required
							min="0"
							step="0.01"
							placeholder="0.00"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
							Duration (minutes) *
						</label>
						<input
							type="number"
							id="duration"
							bind:value={formData.duration}
							required
							min="1"
							placeholder="60"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label for="capacity" class="block text-sm font-medium text-gray-700 mb-2">
							Max Capacity *
						</label>
						<input
							type="number"
							id="capacity"
							bind:value={formData.capacity}
							required
							min="1"
							placeholder="10"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						/>
					</div>
				</div>
			</div>

			<!-- What's Included -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">What's Included</h2>
				
				<div class="space-y-3">
					{#each formData.includedItems as item, index (index)}
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={formData.includedItems[index]}
								placeholder="e.g., Professional guide, Historical insights, Photo stops"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							/>
							{#if formData.includedItems.length > 1}
								<button
									type="button"
									onclick={() => removeIncludedItem(index)}
									class="p-2 text-red-600 hover:text-red-800 transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
					
					<button
						type="button"
						onclick={addIncludedItem}
						class="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
					>
						+ Add another item
					</button>
				</div>
			</div>

			<!-- Requirements -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Requirements</h2>
				
				<div class="space-y-3">
					{#each formData.requirements as requirement, index (index)}
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={formData.requirements[index]}
								placeholder="e.g., Comfortable walking shoes, Basic fitness level"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							/>
							{#if formData.requirements.length > 1}
								<button
									type="button"
									onclick={() => removeRequirement(index)}
									class="p-2 text-red-600 hover:text-red-800 transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
					
					<button
						type="button"
						onclick={addRequirement}
						class="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
					>
						+ Add another requirement
					</button>
				</div>
			</div>

			<!-- Cancellation Policy -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Cancellation Policy</h2>
				
				<textarea
					bind:value={formData.cancellationPolicy}
					rows="3"
					placeholder="e.g., Free cancellation up to 24 hours before the tour. 50% refund for cancellations between 24-12 hours. No refund for cancellations within 12 hours."
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				></textarea>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Status -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Status</h3>
				
				<div class="space-y-3">
					<label class="flex items-center">
						<input
							type="radio"
							bind:group={formData.status}
							value="draft"
							class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
						/>
						<span class="ml-3">
							<span class="text-sm font-medium text-gray-900">Draft</span>
							<p class="text-xs text-gray-500">Not visible to customers</p>
						</span>
					</label>
					
					<label class="flex items-center">
						<input
							type="radio"
							bind:group={formData.status}
							value="active"
							class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
						/>
						<span class="ml-3">
							<span class="text-sm font-medium text-gray-900">Active</span>
							<p class="text-xs text-gray-500">Available for booking</p>
						</span>
					</label>
					
					<label class="flex items-center">
						<input
							type="radio"
							bind:group={formData.status}
							value="inactive"
							class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
						/>
						<span class="ml-3">
							<span class="text-sm font-medium text-gray-900">Inactive</span>
							<p class="text-xs text-gray-500">Temporarily unavailable</p>
						</span>
					</label>
				</div>
			</div>

			<!-- Tour Images -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Tour Images</h3>
				
				<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
					<svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-sm text-gray-600 mb-2">Upload tour images</p>
					<p class="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
					<input
						type="file"
						multiple
						accept="image/*"
						class="hidden"
						id="images"
					/>
					<label
						for="images"
						class="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
					>
						Choose Files
					</label>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<div class="space-y-3">
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
							</svg>
						{/if}
						{isSubmitting ? 'Creating...' : 'Create Tour'}
					</button>
					
					<button
						type="button"
						onclick={handleCancel}
						disabled={isSubmitting}
						class="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</form>
</div> 