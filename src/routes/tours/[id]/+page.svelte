<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi, pb } from '$lib/pocketbase.js';
	import type { PageData } from './$types.js';
	import type { Tour } from '$lib/types.js';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Edit from 'lucide-svelte/icons/edit';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Tag from 'lucide-svelte/icons/tag';
	import Euro from 'lucide-svelte/icons/euro';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Star from 'lucide-svelte/icons/star';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Image from 'lucide-svelte/icons/image';
	import Upload from 'lucide-svelte/icons/upload';
	import Replace from 'lucide-svelte/icons/replace';

	let { data }: { data: PageData } = $props();
	let tour = $state(data.tour);
	let error = $state<string | null>(null);
	let isDeleting = $state(false);
	let isUpdatingStatus = $state(false);
	let isUploadingImage = $state(false);
	let isDeletingImage = $state<string | null>(null);
	let fileInputRef: HTMLInputElement;
	let replaceImageIndex: number | null = null;
	
	// Construct image URL manually since pb might be null on server
	function getImageUrl(imageName: string) {
		return `https://z.xeon.pl/api/files/tours/${tour.id}/${imageName}`;
	}

	async function deleteTour() {
		if (!tour || !confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
			return;
		}

		try {
			isDeleting = true;
			await toursApi.delete(tour.id);
			goto('/tours');
		} catch (err) {
			error = 'Failed to delete tour. Please try again.';
			console.error('Error deleting tour:', err);
		} finally {
			isDeleting = false;
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
			isUpdatingStatus = true;
			const updatedTour = await toursApi.update(tour.id, { status: newStatus });
			tour = updatedTour;
		} catch (err) {
			error = 'Failed to update tour status. Please try again.';
			console.error('Error updating tour status:', err);
		} finally {
			isUpdatingStatus = false;
		}
	}

	function handleImageUpload() {
		replaceImageIndex = null;
		fileInputRef.click();
	}

	function handleImageReplace(index: number) {
		replaceImageIndex = index;
		fileInputRef.click();
	}

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.length === 0 || !tour) return;

		try {
			isUploadingImage = true;
			error = null;

			const formData = new FormData();
			
			if (replaceImageIndex !== null) {
				// Replace existing image
				const currentImages = [...(tour.images || [])];
				
				// Add all existing images except the one being replaced
				currentImages.forEach((imageName, index) => {
					if (index !== replaceImageIndex) {
						formData.append('images', imageName);
					}
				});
				
				// Add the new image
				formData.append('images', files[0]);
				
				// Mark old image for deletion
				formData.append('images-', currentImages[replaceImageIndex]);
			} else {
				// Add new images
				// Keep existing images
				(tour.images || []).forEach((imageName) => {
					formData.append('images', imageName);
				});
				
				// Add new images
				Array.from(files).forEach((file) => {
					formData.append('images', file);
				});
			}

			const updatedTour = await toursApi.updateWithImages(tour.id, formData);
			tour = updatedTour;
			replaceImageIndex = null;
		} catch (err) {
			error = 'Failed to upload image. Please try again.';
			console.error('Error uploading image:', err);
		} finally {
			isUploadingImage = false;
			// Reset file input
			target.value = '';
		}
	}

	async function deleteImage(imageName: string, index: number) {
		if (!tour || !confirm('Are you sure you want to delete this image?')) {
			return;
		}

		try {
			isDeletingImage = imageName;
			error = null;

			const formData = new FormData();
			
			// Keep all images except the one being deleted
			(tour.images || []).forEach((name) => {
				if (name !== imageName) {
					formData.append('images', name);
				}
			});
			
			// Mark image for deletion
			formData.append('images-', imageName);

			const updatedTour = await toursApi.updateWithImages(tour.id, formData);
			tour = updatedTour;
		} catch (err) {
			error = 'Failed to delete image. Please try again.';
			console.error('Error deleting image:', err);
		} finally {
			isDeletingImage = null;
		}
	}

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'inactive':
				return 'bg-yellow-50 text-yellow-700 border-yellow-200';
			case 'draft':
				return 'bg-gray-50 text-gray-700 border-gray-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}

	function getStatusDot(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-500';
			case 'inactive':
				return 'bg-yellow-500';
			case 'draft':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
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

	// Mock stats (in real app, these would come from the backend)
	let stats = $derived({
		qrCodes: 3,
		totalBookings: 42,
		revenue: tour ? tour.price * 42 : 0,
		avgRating: 4.8,
		thisWeekBookings: 8,
		conversionRate: 32
	});
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInputRef}
	type="file"
	accept="image/*"
	multiple={replaceImageIndex === null}
	onchange={handleFileChange}
	class="hidden"
/>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if !tour}
		<div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
			<div class="max-w-md mx-auto">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<MapPin class="h-8 w-8 text-gray-400" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Tour Not Found</h3>
				<p class="text-gray-600 mb-6">The tour you're looking for doesn't exist or has been deleted.</p>
				<button
					onclick={() => goto('/tours')}
					class="button-primary button--gap"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to Tours
				</button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-8">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex items-center gap-4">
					<button 
						onclick={() => goto('/tours')}
						class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
						aria-label="Back to tours"
					>
						<ArrowLeft class="h-5 w-5 text-gray-600" />
					</button>
					<div>
						<div class="flex items-center gap-3">
							<h1 class="text-3xl font-bold text-gray-900">{tour.name}</h1>
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(tour.status)}">
								<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
								{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
							</span>
						</div>
						<div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
							{#if tour.category}
								<span class="flex items-center gap-1">
									<Tag class="h-4 w-4" />
									{tour.category}
								</span>
							{/if}
							{#if tour.location}
								<span class="flex items-center gap-1">
									<MapPin class="h-4 w-4" />
									{tour.location}
								</span>
							{/if}
							<span class="flex items-center gap-1">
								<Calendar class="h-4 w-4" />
								Created {new Date(tour.created).toLocaleDateString()}
							</span>
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={toggleStatus}
						disabled={isUpdatingStatus}
						class="button-secondary button--gap button--small"
					>
						{#if isUpdatingStatus}
							<div class="form-spinner"></div>
						{:else if tour.status === 'active'}
							<ToggleRight class="h-4 w-4" />
						{:else}
							<ToggleLeft class="h-4 w-4" />
						{/if}
						{tour.status === 'active' ? 'Deactivate' : 'Activate'}
					</button>
					<button
						onclick={() => goto(`/tours/${tour?.id}/edit`)}
						class="button-primary button--gap button--small"
					>
						<Edit class="h-4 w-4" />
						Edit Tour
					</button>
				</div>
			</div>
		</div>

		<!-- Quick Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
			<div class="bg-white rounded-xl border border-gray-200 p-4">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm text-gray-600">QR Codes</span>
					<QrCode class="h-4 w-4 text-gray-400" />
				</div>
				<p class="text-2xl font-bold text-gray-900">{stats.qrCodes}</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-4">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm text-gray-600">Bookings</span>
					<UserCheck class="h-4 w-4 text-gray-400" />
				</div>
				<p class="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-4">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm text-gray-600">Revenue</span>
					<Euro class="h-4 w-4 text-gray-400" />
				</div>
				<p class="text-2xl font-bold text-gray-900">€{stats.revenue}</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-4">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm text-gray-600">This Week</span>
					<TrendingUp class="h-4 w-4 text-green-500" />
				</div>
				<p class="text-2xl font-bold text-gray-900">{stats.thisWeekBookings}</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-4">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm text-gray-600">Rating</span>
					<Star class="h-4 w-4 text-yellow-500" />
				</div>
				<p class="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-4">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm text-gray-600">Conversion</span>
					<TrendingUp class="h-4 w-4 text-blue-500" />
				</div>
				<p class="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Tour Images -->
				{#if tour.images && tour.images.length > 0}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
						<div class="p-6 border-b border-gray-200">
							<div class="flex items-center justify-between">
								<h2 class="text-xl font-semibold text-gray-900">Tour Images</h2>
								<button
									onclick={handleImageUpload}
									disabled={isUploadingImage}
									class="button-secondary button--gap button--small"
								>
									{#if isUploadingImage}
										<div class="form-spinner"></div>
									{:else}
										<Upload class="h-4 w-4" />
									{/if}
									Add More
								</button>
							</div>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
								{#each tour.images as imageName, index}
									<div class="relative group">
										<img 
											src={getImageUrl(imageName)} 
											alt="{tour.name} photo"
											class="w-full h-40 object-cover rounded-lg transition-transform duration-200"
										/>
										
										<!-- Hover Overlay -->
										<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
											<button
												onclick={() => handleImageReplace(index)}
												disabled={isUploadingImage || isDeletingImage === imageName}
												class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
												title="Replace image"
											>
												{#if isUploadingImage && replaceImageIndex === index}
													<div class="form-spinner"></div>
												{:else}
													<Replace class="h-4 w-4" />
												{/if}
											</button>
											<button
												onclick={() => deleteImage(imageName, index)}
												disabled={isUploadingImage || isDeletingImage === imageName}
												class="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
												title="Delete image"
											>
												{#if isDeletingImage === imageName}
													<div class="form-spinner"></div>
												{:else}
													<Trash2 class="h-4 w-4" />
												{/if}
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<div class="bg-white rounded-xl border border-gray-200 p-8">
						<div class="text-center">
							<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Image class="h-8 w-8 text-gray-400" />
							</div>
							<h3 class="text-lg font-semibold text-gray-900 mb-2">No Images</h3>
							<p class="text-gray-600 mb-6">Add images to make your tour more appealing</p>
							<div class="flex flex-col sm:flex-row gap-3 justify-center">
								<button
									onclick={handleImageUpload}
									disabled={isUploadingImage}
									class="button-primary button--gap button--small"
								>
									{#if isUploadingImage}
										<div class="form-spinner"></div>
										Uploading...
									{:else}
										<Upload class="h-4 w-4" />
										Upload Images
									{/if}
								</button>
								<button
									onclick={() => goto(`/tours/${tour?.id}/edit`)}
									class="button-secondary button--gap button--small"
								>
									<Edit class="h-4 w-4" />
									Edit Tour
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Tour Details -->
				<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
					<div class="p-6 border-b border-gray-200">
						<h2 class="text-xl font-semibold text-gray-900">Tour Details</h2>
					</div>
					<div class="p-6 space-y-6">
						{#if tour.description}
							<div>
								<h3 class="text-sm font-medium text-gray-700 mb-2">Description</h3>
								<p class="text-gray-900 leading-relaxed">{tour.description}</p>
							</div>
						{/if}

						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div class="text-center p-4 bg-gray-50 rounded-lg">
								<Euro class="h-8 w-8 text-gray-400 mx-auto mb-2" />
								<p class="text-2xl font-bold text-gray-900">€{tour.price}</p>
								<p class="text-sm text-gray-500">per person</p>
							</div>
							<div class="text-center p-4 bg-gray-50 rounded-lg">
								<Clock class="h-8 w-8 text-gray-400 mx-auto mb-2" />
								<p class="text-lg font-semibold text-gray-900">{formatDuration(tour.duration)}</p>
								<p class="text-sm text-gray-500">duration</p>
							</div>
							<div class="text-center p-4 bg-gray-50 rounded-lg">
								<Users class="h-8 w-8 text-gray-400 mx-auto mb-2" />
								<p class="text-lg font-semibold text-gray-900">{tour.capacity}</p>
								<p class="text-sm text-gray-500">max capacity</p>
							</div>
						</div>
					</div>
				</div>

				<!-- What's Included -->
				{#if tour.includedItems && tour.includedItems.length > 0}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-xl font-semibold text-gray-900">What's Included</h2>
						</div>
						<div class="p-6">
							<ul class="space-y-3">
								{#each tour.includedItems as item}
									<li class="flex items-start gap-3">
										<Check class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span class="text-gray-700">{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				<!-- Requirements -->
				{#if tour.requirements && tour.requirements.length > 0}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-xl font-semibold text-gray-900">Requirements</h2>
						</div>
						<div class="p-6">
							<ul class="space-y-3">
								{#each tour.requirements as requirement}
									<li class="flex items-start gap-3">
										<Info class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
										<span class="text-gray-700">{requirement}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				<!-- Cancellation Policy -->
				{#if tour.cancellationPolicy}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-xl font-semibold text-gray-900">Cancellation Policy</h2>
						</div>
						<div class="p-6">
							<p class="text-gray-700 leading-relaxed">{tour.cancellationPolicy}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Quick Actions -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
					<div class="space-y-3">
						<button
							onclick={() => goto(`/tours/${tour?.id}/qr`)}
							class="button-primary button--full-width button--gap button--small justify-center rounded-lg flex items-center"
						>
							<QrCode class="h-4 w-4 flex-shrink-0" />
							Manage QR Codes
						</button>
						<button
							onclick={() => goto(`/tours/${tour?.id}/schedule`)}
							class="button-secondary button--full-width button--gap button--small justify-center rounded-lg flex items-center"
						>
							<CalendarDays class="h-4 w-4 flex-shrink-0" />
							Manage Schedule
						</button>
						<button
							onclick={() => goto(`/tours/${tour?.id}/bookings`)}
							class="button-secondary button--full-width button--gap button--small justify-center rounded-lg flex items-center"
						>
							<UserCheck class="h-4 w-4 flex-shrink-0" />
							View Bookings
						</button>
					</div>
				</div>

				<!-- Danger Zone -->
				<div class="bg-white rounded-xl border border-red-200 overflow-hidden">
					<div class="p-6 bg-red-50">
						<h3 class="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
						<p class="text-sm text-red-700">
							Deleting a tour is permanent and cannot be undone.
						</p>
					</div>
					<div class="p-6">
						<button
							onclick={deleteTour}
							disabled={isDeleting}
							class="button-danger button--full-width button--gap button--small justify-center rounded-lg flex items-center"
						>
							{#if isDeleting}
								<div class="form-spinner"></div>
								Deleting...
							{:else}
								<Trash2 class="h-4 w-4 flex-shrink-0" />
								Delete Tour
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.button-danger {
		background-color: #ef4444;
		border: 1px solid #ef4444;
		color: white;
		font-weight: 500;
		transition: all 0.2s ease;
	}
	
	.button-danger:hover:not(:disabled) {
		background-color: #dc2626;
		border-color: #dc2626;
	}
	
	.button-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-danger .form-spinner {
		border-color: rgba(255, 255, 255, 0.3);
		border-top-color: white;
	}
</style> 