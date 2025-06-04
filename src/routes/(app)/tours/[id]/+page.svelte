<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi, pb } from '$lib/pocketbase.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import type { PageData } from './$types.js';
	import type { Tour } from '$lib/types.js';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Edit from 'lucide-svelte/icons/edit';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
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
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import User from 'lucide-svelte/icons/user';
	import Ticket from 'lucide-svelte/icons/ticket';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

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
			newStatus = 'draft';
		} else if (tour.status === 'draft') {
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

		// Define allowed file types (must match PocketBase schema)
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		const maxFileSize = 5 * 1024 * 1024; // 5MB limit
		
		// Filter valid files and show errors for invalid ones
		const validFiles: File[] = [];
		const errors: string[] = [];
		
		Array.from(files).forEach(file => {
			if (!allowedTypes.includes(file.type.toLowerCase())) {
				errors.push(`${file.name}: Only JPEG, PNG, and WebP images are allowed`);
			} else if (file.size > maxFileSize) {
				errors.push(`${file.name}: File size must be less than 5MB`);
			} else {
				validFiles.push(file);
			}
		});
		
		// Show errors if any
		if (errors.length > 0) {
			error = 'Some files were not uploaded:\n\n' + errors.join('\n');
			target.value = '';
			return;
		}
		
		// If no valid files, return early
		if (validFiles.length === 0) {
			target.value = '';
			return;
		}

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
				
				// Add the new image (use first valid file)
				formData.append('images', validFiles[0]);
				
				// Mark old image for deletion
				formData.append('images-', currentImages[replaceImageIndex]);
			} else {
				// Add new images
				// Keep existing images
				(tour.images || []).forEach((imageName) => {
					formData.append('images', imageName);
				});
				
				// Add new images (use all valid files)
				validFiles.forEach((file) => {
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
			case 'draft':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

	function formatDuration(minutes: number) {
		// Round to handle any floating point precision issues
		const totalMinutes = Math.round(minutes);
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;
		
		if (hours === 0) {
			return `${mins} minutes`;
		} else if (mins === 0) {
			return `${hours} hour${hours > 1 ? 's' : ''}`;
		} else {
			return `${hours}h ${mins}m`;
		}
	}

	// Real statistics from server
	let stats = $derived(data.stats || {
		qrCodes: 0,
		totalBookings: 0,
		revenue: 0,
		avgRating: 0, // TODO: Implement rating system
		thisWeekBookings: 0,
		conversionRate: 0
	});

	// Use upcoming bookings from server (already filtered for today's check-ins)
	let upcomingBookings = $derived(data.bookings || []);
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInputRef}
	type="file"
	accept="image/jpeg,image/jpg,image/png,image/webp"
	multiple={replaceImageIndex === null}
	onchange={handleFileChange}
	class="hidden"
/>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
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
		<div class="bg-white rounded-xl border border-gray-200 p-12">
			<EmptyState
				icon={MapPin}
				title="Tour Not Found"
				description="The tour you're looking for doesn't exist or has been deleted."
				actionText="Back to Tours"
				onAction={() => goto('/tours')}
			/>
		</div>
	{:else}
		<div class="mb-6 sm:mb-8">
			<PageHeader 
				title={tour.name}
				subtitle={`${tour.category ? `${tour.category} • ` : ''}${tour.location ? `${tour.location} • ` : ''}Created ${new Date(tour.created).toLocaleDateString()}`}
				backUrl="/tours"
			>
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<span class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(tour.status)}">
						<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
						{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
					</span>
					<div class="flex items-center gap-2 sm:gap-3">
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
							<span class="hidden sm:inline">{tour.status === 'active' ? 'Save as Draft' : 'Publish Tour'}</span>
							<span class="sm:hidden">{tour.status === 'active' ? 'Draft' : 'Publish'}</span>
						</button>
						<button
							onclick={() => goto(`/tours/${tour?.id}/edit`)}
							class="hidden sm:flex button-primary button--gap button--small"
						>
							<Edit class="h-4 w-4" />
							Edit Tour
						</button>
					</div>
				</div>
			</PageHeader>
		</div>

		<!-- Today's Check-ins Section -->
		{#if upcomingBookings.length > 0}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
				<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
								<UserCheck class="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">Today's Check-ins</h3>
								<p class="text-sm text-gray-600">Upcoming tours requiring check-in</p>
							</div>
						</div>
						<button
							onclick={() => goto(`/tours/${tour?.id}/bookings?date=today`)}
							class="button-secondary button--gap button--small"
						>
							View All
							<ChevronRight class="w-4 h-4" />
						</button>
					</div>
				</div>
				
				<div class="divide-y divide-gray-200">
					{#each upcomingBookings.slice(0, 3) as booking}
						<div class="px-6 py-4 hover:bg-gray-50">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="flex-shrink-0">
										<div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
											<User class="w-6 h-6 text-gray-600" />
										</div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<p class="text-sm font-semibold text-gray-900 truncate">
												{booking.customerName}
											</p>
											<span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full {
												booking.attendanceStatus === 'checked_in' ? 'bg-green-50 text-green-700' :
												booking.attendanceStatus === 'no_show' ? 'bg-gray-50 text-gray-700' :
												'bg-amber-50 text-amber-700'
											}">
												{booking.attendanceStatus === 'checked_in' ? '✅ Checked In' :
												 booking.attendanceStatus === 'no_show' ? '❌ No Show' : 
												 '⏳ Awaiting'}
											</span>
										</div>
										<div class="flex items-center gap-4 text-xs text-gray-500">
											<span class="flex items-center gap-1">
												<Clock class="w-3 h-3" />
												{booking.expand?.timeSlot?.startTime ? 
													new Date(booking.expand.timeSlot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 
													'Time TBD'}
											</span>
											<span class="flex items-center gap-1">
												<Users class="w-3 h-3" />
												{booking.participants} {booking.participants === 1 ? 'person' : 'people'}
											</span>
											<span class="flex items-center gap-1">
												<Ticket class="w-3 h-3" />
												{booking.bookingReference}
											</span>
										</div>
									</div>
								</div>
								
								<div class="flex items-center gap-2">
									{#if booking.ticketQRCode && booking.attendanceStatus !== 'checked_in'}
										<a
											href="/checkin/{booking.ticketQRCode}"
											target="_blank"
											class="button-primary button--gap button--small"
										>
											<UserCheck class="w-4 h-4" />
											Check In
										</a>
									{:else if booking.attendanceStatus === 'checked_in'}
										<span class="text-sm font-medium text-green-600">
											Completed
										</span>
									{:else}
										<span class="text-sm text-gray-500">
											No ticket
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
				
				{#if upcomingBookings.length > 3}
					<div class="px-6 py-3 bg-gray-50 text-center">
						<button
							onclick={() => goto(`/tours/${tour?.id}/bookings?date=today`)}
							class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
						>
							View {upcomingBookings.length - 3} more upcoming check-ins
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="bg-white rounded-xl border border-gray-200 p-8 mb-8">
				<EmptyState
					icon={UserCheck}
					title="No Check-ins Today"
					description="No upcoming tours require check-in today. Check-ins will appear here when guests have confirmed bookings."
					actionText="View All Bookings"
					onAction={() => goto(`/tours/${tour?.id}/bookings`)}
				/>
			</div>
		{/if}

		<!-- Mobile Quick Actions - Prominent on mobile -->
	<div class="lg:hidden mb-6">
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<h3 class="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => goto(`/checkin-scanner?tour=${tour?.id}`)}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<UserCheck class="h-4 w-4" />
					Check-in
				</button>
				<button
					onclick={() => goto(`/tours/${tour?.id}/bookings`)}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Calendar class="h-4 w-4" />
					Bookings
				</button>
			</div>
			<div class="grid grid-cols-3 gap-3 mt-3">
				<button
					onclick={() => goto(`/tours/${tour?.id}/qr`)}
					class="button-secondary button--gap button--small justify-center py-3"
				>
					<QrCode class="h-4 w-4" />
					QR Codes
				</button>
				<button
					onclick={() => goto(`/tours/${tour?.id}/schedule`)}
					class="button-secondary button--gap button--small justify-center py-3"
				>
					<CalendarDays class="h-4 w-4" />
					Schedule
				</button>
				<button
					onclick={() => goto(`/tours/${tour?.id}/edit`)}
					class="button-secondary button--gap button--small justify-center py-3"
				>
					<Edit class="h-4 w-4" />
					Edit
				</button>
			</div>
		</div>
	</div>

			<!-- Quick Stats Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 items-stretch">
		<StatsCard
			title="QR Codes"
			value={stats.qrCodes || 0}
			subtitle="{stats.activeQRCodes || 0} active"
			icon={QrCode}
			variant="small"
		/>

		<StatsCard
			title="Total Bookings"
			value={stats.totalBookings || 0}
			subtitle="{stats.confirmedBookings || 0} confirmed"
			icon={UserCheck}
			variant="small"
		/>

		<StatsCard
			title="Revenue"
			value={formatEuro(stats.revenue || 0)}
			subtitle="{stats.averageBookingValue && stats.averageBookingValue > 0 ? formatEuro(stats.averageBookingValue) : formatEuro(0)} avg"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="This Week"
			value={stats.thisWeekBookings || 0}
			subtitle="new bookings"
			icon={TrendingUp}
			variant="small"
			trend={stats.thisWeekBookings > 0 ? { value: "This week", positive: true } : undefined}
		/>

		<StatsCard
			title="Participants"
			value={stats.totalParticipants || 0}
			subtitle="total guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="QR Conversion"
			value="{(stats.conversionRate || 0).toFixed(1)}%"
			subtitle="{stats.totalQRScans || 0} scans"
			icon={TrendingUp}
			variant="small"
		/>
	</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
						<div class="p-4 sm:p-6">
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
								{#each tour.images as imageName, index}
									<div class="relative group">
										<img 
											src={getImageUrl(imageName)} 
											alt="{tour.name} photo"
											class="w-full h-32 sm:h-40 object-cover rounded-lg transition-transform duration-200"
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
						<EmptyState
							icon={Image}
							title="No Images"
							description="Add images to make your tour more appealing to customers"
							actionText={isUploadingImage ? "Uploading..." : "Upload Images"}
							onAction={isUploadingImage ? undefined : handleImageUpload}
						/>
						{#if !isUploadingImage}
							<div class="text-center mt-4">
								<button
									onclick={() => goto(`/tours/${tour?.id}/edit`)}
									class="button-secondary button--gap button--small"
								>
									<Edit class="h-4 w-4" />
									Edit Tour Details
								</button>
							</div>
						{/if}
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

						<div class="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-6">
							<div class="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
								<Euro class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
								<p class="text-lg sm:text-2xl font-bold text-gray-900">€{tour.price}</p>
								<p class="text-xs sm:text-sm text-gray-500">per person</p>
							</div>
							<div class="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
								<Clock class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
								<p class="text-sm sm:text-lg font-semibold text-gray-900">{formatDuration(tour.duration)}</p>
								<p class="text-xs sm:text-sm text-gray-500">duration</p>
							</div>
							<div class="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
								<Users class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
								<p class="text-sm sm:text-lg font-semibold text-gray-900">{tour.capacity}</p>
								<p class="text-xs sm:text-sm text-gray-500">max capacity</p>
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
			<div class="hidden lg:block space-y-6">
				<!-- Quick Actions -->
				<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
					<div class="p-6 border-b border-gray-200">
						<h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
						<p class="text-sm text-gray-600 mt-1">Manage your tour efficiently</p>
					</div>
					
					<div class="p-6 space-y-4">
						<!-- Primary Action - Most Important -->
						<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
										<UserCheck class="h-4 w-4 text-white" />
									</div>
									<div>
										<h4 class="font-medium text-gray-900">Guest Check-in</h4>
										<p class="text-xs text-gray-600">Scan QR codes to check in guests</p>
									</div>
								</div>
								{#if upcomingBookings.length > 0}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
										{upcomingBookings.length} pending
									</span>
								{/if}
							</div>
							<button
								onclick={() => goto(`/checkin-scanner?tour=${tour?.id}`)}
								class="button-primary button--full-width button--gap button--small justify-center"
							>
								<UserCheck class="h-4 w-4" />
								Open QR Scanner
							</button>
						</div>

						<!-- Secondary Actions Grid -->
						<div class="grid grid-cols-1 gap-3">
							<button
								onclick={() => goto(`/tours/${tour?.id}/bookings`)}
								class="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-all"
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
										<Calendar class="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
									</div>
									<div class="text-left">
										<h4 class="font-medium text-gray-900">All Bookings</h4>
										<p class="text-sm text-gray-600">{stats.totalBookings || 0} total bookings</p>
									</div>
								</div>
								<ChevronRight class="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
							</button>

							<button
								onclick={() => goto(`/tours/${tour?.id}/qr`)}
								class="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50/50 transition-all {stats.qrCodes > 0 ? 'ring-2 ring-purple-200 border-purple-300' : ''}"
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors {stats.qrCodes > 0 ? 'bg-purple-100' : ''}">
										<QrCode class="h-5 w-5 text-gray-600 group-hover:text-purple-600 {stats.qrCodes > 0 ? 'text-purple-600' : ''}" />
									</div>
									<div class="text-left">
										<h4 class="font-medium text-gray-900">QR Codes</h4>
										<p class="text-sm text-gray-600">
											{#if stats.qrCodes > 0}
												{stats.qrCodes} code{stats.qrCodes !== 1 ? 's' : ''} ready to share
											{:else}
												Create marketing QR codes
											{/if}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if stats.qrCodes > 0}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
											{stats.activeQRCodes} active
										</span>
									{/if}
								<ChevronRight class="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
								</div>
							</button>

							<button
								onclick={() => goto(`/tours/${tour?.id}/schedule`)}
								class="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-200 hover:bg-green-50/50 transition-all"
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-gray-100 group-hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors">
										<CalendarDays class="h-5 w-5 text-gray-600 group-hover:text-green-600" />
									</div>
									<div class="text-left">
										<h4 class="font-medium text-gray-900">Schedule</h4>
										<p class="text-sm text-gray-600">Manage time slots</p>
									</div>
								</div>
								<ChevronRight class="h-4 w-4 text-gray-400 group-hover:text-green-600" />
							</button>
						</div>


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