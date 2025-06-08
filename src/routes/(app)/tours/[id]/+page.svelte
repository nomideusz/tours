<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { formatEuro } from '$lib/utils/currency.js';
	import type { PageData, ActionData } from './$types.js';
	import type { Tour } from '$lib/types.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	
	// Icons
	import Edit from 'lucide-svelte/icons/edit';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Image from 'lucide-svelte/icons/image';
	import Ticket from 'lucide-svelte/icons/ticket';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Settings from 'lucide-svelte/icons/settings';
	import Plus from 'lucide-svelte/icons/plus';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	
	// QR generation utils
	import { generateBookingURL, generateQRImageURL, getQRDisplayReference } from '$lib/utils/qr-generation.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tour = $state(data.tour);
	let error = $state<string | null>((form as any)?.error || null);
	let isDeleting = $state(false);
	let isUpdatingStatus = $state(false);
	
	// Update tour when data changes
	$effect(() => {
		tour = data.tour;
		error = (form as any)?.error || null;
	});

	function deleteTour() {
		if (!tour || !confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
			return;
		}
		
		isDeleting = true;
		const form = document.getElementById('delete-tour-form') as HTMLFormElement;
		form?.requestSubmit();
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

	function formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		return `${mins}m`;
	}

	function getImageUrl(tour: { id: string } | null | undefined, imagePath: string | null | undefined): string {
		if (!tour?.id || !imagePath || typeof imagePath !== 'string') return '';
		
		try {
			// Handle old PocketBase URLs
			if (imagePath.startsWith('http')) {
				return imagePath; // Return old URL as-is for backward compatibility
			}
			// Handle new local storage
			return `/uploads/tours/${encodeURIComponent(tour.id)}/${encodeURIComponent(imagePath)}`;
		} catch (error) {
			console.warn('Error generating image URL:', error);
			return '';
		}
	}

	// Statistics from server
	let stats = $derived(data.stats || {
		totalBookings: 0,
		confirmedBookings: 0,
		pendingBookings: 0,
		revenue: 0,
		thisWeekBookings: 0,
		totalParticipants: 0,
		averageBookingValue: 0,
		checkIns: 0,
		noShows: 0
	});

	// Upcoming bookings from server
	let upcomingBookings = $derived(data.bookings || []);
	
	// QR code state
	let copiedQR = $state(false);
	
	// QR code functions
	async function copyBookingUrl() {
		if (!tour?.qrCode) return;
		
		try {
			const url = generateBookingURL(tour.qrCode);
			await navigator.clipboard.writeText(url);
			copiedQR = true;
			setTimeout(() => { copiedQR = false; }, 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}
</script>

<svelte:head>
	<title>{tour?.name || 'Tour Details'} - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={error} />
		</div>
	{/if}

	{#if !tour}
		<div class="rounded-xl p-8 sm:p-12" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<EmptyState
				icon={MapPin}
				title="Tour Not Found"
				description="The tour you're looking for doesn't exist or has been deleted."
				actionText="Back to Tours"
				onAction={() => goto('/tours')}
			/>
		</div>
	{:else}
		<!-- Page Header -->
		<div class="mb-6 sm:mb-8">
			<PageHeader 
				title={tour.name}
				subtitle={`${tour.category ? `${tour.category} • ` : ''}${tour.location ? `${tour.location} • ` : ''}Created ${new Date(tour.createdAt).toLocaleDateString()}`}
				backUrl="/tours"
				breadcrumbs={[
					{ label: 'Tours', href: '/tours' },
					{ label: tour.name }
				]}
			>
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<!-- Status Badge -->
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(tour.status)}">
						<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
						{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
					</span>
					
					<!-- Action Buttons -->
					<div class="flex items-center gap-2">
						<!-- Status Toggle -->
						<form method="POST" action="?/toggleStatus" use:enhance={() => {
							isUpdatingStatus = true;
							return async ({ result }) => {
								isUpdatingStatus = false;
								if (result.type === 'success') {
									await invalidateAll();
								}
							};
						}}>
							<button
								type="submit"
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
						</form>
						
						<!-- Edit Button -->
						<button
							onclick={() => goto(`/tours/${tour?.id}/edit`)}
							class="button-primary button--gap button--small"
						>
							<Edit class="h-4 w-4" />
							<span class="hidden sm:inline">Edit Tour</span>
							<span class="sm:hidden">Edit</span>
						</button>
					</div>
				</div>
			</PageHeader>
		</div>

		<!-- Quick Actions (Mobile Only) -->
		<div class="lg:hidden mb-6">
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Quick Actions</h3>
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={() => goto(`/tours/${tour?.id}/bookings`)}
						class="button-secondary button--gap justify-center"
					>
						<Calendar class="h-4 w-4" />
						Bookings
					</button>
					<button
						onclick={() => { if (tour?.qrCode) { navigator.clipboard.writeText(generateBookingURL(tour.qrCode)); } }}
						class="button-secondary button--gap justify-center"
						disabled={!tour?.qrCode}
					>
						<Copy class="h-4 w-4" />
						Copy QR Link
					</button>
				</div>
			</div>
		</div>

		<!-- Content Container with Responsive Layout -->
		<div class="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
			
			<!-- Main Content (Left Column) -->
			<div class="lg:col-span-2 space-y-6">
				
				<!-- Tour Overview Card -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-6 sm:p-8">
						<div class="flex gap-6">
							<!-- Tour Image -->
							<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0" style="background: var(--bg-secondary);">
								{#if tour?.images?.[0]}
									{@const imageUrl = getImageUrl(tour, tour.images[0])}
									{#if imageUrl}
										<img 
											src={imageUrl} 
											alt={tour.name || 'Tour'}
											class="w-full h-full object-cover"
											loading="lazy"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<Image class="h-8 w-8 sm:h-12 sm:w-12" style="color: var(--text-tertiary);" />
										</div>
									{/if}
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<Image class="h-8 w-8 sm:h-12 sm:w-12" style="color: var(--text-tertiary);" />
									</div>
								{/if}
							</div>

							<!-- Tour Details -->
							<div class="flex-1 min-w-0">
								<!-- Quick Metrics Grid -->
								<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
									<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
										<div class="flex items-center justify-center mb-2">
											<DollarSign class="h-5 w-5" style="color: var(--text-tertiary);" />
										</div>
										<p class="text-lg font-bold" style="color: var(--text-primary);">€{tour.price}</p>
										<p class="text-xs" style="color: var(--text-tertiary);">Price</p>
									</div>
									<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
										<div class="flex items-center justify-center mb-2">
											<Clock class="h-5 w-5" style="color: var(--text-tertiary);" />
										</div>
										<p class="text-lg font-bold" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
										<p class="text-xs" style="color: var(--text-tertiary);">Duration</p>
									</div>
									<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
										<div class="flex items-center justify-center mb-2">
											<Users class="h-5 w-5" style="color: var(--text-tertiary);" />
										</div>
										<p class="text-lg font-bold" style="color: var(--text-primary);">{tour.capacity}</p>
										<p class="text-xs" style="color: var(--text-tertiary);">Max guests</p>
									</div>
									<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
										<div class="flex items-center justify-center mb-2">
											<MapPin class="h-5 w-5" style="color: var(--text-tertiary);" />
										</div>
										<p class="text-sm font-semibold truncate" style="color: var(--text-primary);">{tour.location || 'No location'}</p>
										<p class="text-xs" style="color: var(--text-tertiary);">Location</p>
									</div>
								</div>

								<!-- Description -->
								{#if tour.description}
									<div class="mb-6">
										<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">Description</h3>
										<p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
											{tour.description}
										</p>
									</div>
								{/if}

								<!-- Included Items & Requirements -->
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
									{#if tour.includedItems && tour.includedItems.length > 0}
										<div>
											<h4 class="font-medium mb-2" style="color: var(--text-primary);">What's Included</h4>
											<ul class="space-y-1">
												{#each tour.includedItems as item}
													<li class="text-sm flex items-center gap-2" style="color: var(--text-secondary);">
														<span class="w-1 h-1 rounded-full bg-green-500"></span>
														{item}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
									
									{#if tour.requirements && tour.requirements.length > 0}
										<div>
											<h4 class="font-medium mb-2" style="color: var(--text-primary);">Requirements</h4>
											<ul class="space-y-1">
												{#each tour.requirements as requirement}
													<li class="text-sm flex items-center gap-2" style="color: var(--text-secondary);">
														<span class="w-1 h-1 rounded-full bg-orange-500"></span>
														{requirement}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- QR Code Section -->
				{#if tour?.qrCode}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 sm:p-6" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
										<QrCode class="w-5 h-5 text-white" />
									</div>
									<div>
										<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Tour QR Code</h3>
										<p class="text-sm" style="color: var(--text-secondary);">Code: {getQRDisplayReference(tour.qrCode)}</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs" style="color: var(--text-tertiary);">{tour.qrScans || 0} scans • {tour.qrConversions || 0} bookings</span>
								</div>
							</div>
						</div>
						
						<div class="p-4 sm:p-6">
							<div class="flex flex-col sm:flex-row gap-4">
								<!-- QR Code Image -->
								<div class="flex-shrink-0">
									<div class="w-32 h-32 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
										<img 
											src={generateQRImageURL(tour.qrCode, { size: 150 })} 
											alt="QR Code for {tour.name}"
											class="w-full h-full rounded-lg"
										/>
									</div>
								</div>
								
								<!-- QR Code Info -->
								<div class="flex-1">
									<div class="space-y-3">
										<div>
											<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">Booking URL</p>
											<div class="flex items-center gap-2">
												<code class="flex-1 px-3 py-2 text-xs rounded" style="background: var(--bg-secondary); color: var(--text-secondary); font-family: monospace;">
													{generateBookingURL(tour.qrCode)}
												</code>
												<button
													onclick={copyBookingUrl}
													class="button-secondary button--gap button--small"
													disabled={copiedQR}
												>
													{#if copiedQR}
														<Check class="w-4 h-4" />
														Copied!
													{:else}
														<Copy class="w-4 h-4" />
														Copy
													{/if}
												</button>
											</div>
										</div>
										
										<div>
											<p class="text-xs" style="color: var(--text-tertiary);">
												This QR code was automatically generated when you created the tour. 
												Customers can scan it to book directly.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Today's Check-ins -->
				{#if upcomingBookings.length > 0}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 sm:p-6" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
										<UserCheck class="w-5 h-5 text-white" />
									</div>
									<div>
										<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Today's Check-ins</h3>
										<p class="text-sm" style="color: var(--text-secondary);">{upcomingBookings.length} upcoming bookings</p>
									</div>
								</div>
								<button
									onclick={() => goto(`/tours/${tour?.id}/bookings`)}
									class="button-secondary button--gap button--small"
								>
									View All
									<ChevronRight class="w-4 h-4" />
								</button>
							</div>
						</div>
						
						<div class="divide-y" style="border-color: var(--border-primary);">
							{#each upcomingBookings.slice(0, 3) as booking}
								<div class="p-4 sm:p-6 flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
											<Ticket class="w-5 h-5 text-blue-600" />
										</div>
										<div>
											<p class="font-medium" style="color: var(--text-primary);">{booking.customerName}</p>
											<p class="text-sm" style="color: var(--text-secondary);">{booking.participants} participants • {booking.bookingReference}</p>
										</div>
									</div>
									<div class="text-right">
										<p class="text-sm font-medium" style="color: var(--text-primary);">
											{booking.expand?.timeSlot?.startTime ? new Date(booking.expand.timeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
										</p>
										<p class="text-xs" style="color: var(--text-secondary);">{formatEuro(booking.totalAmount)}</p>
									</div>
								</div>
							{/each}
							
							{#if upcomingBookings.length > 3}
								<div class="p-4 text-center">
									<button
										onclick={() => goto(`/tours/${tour?.id}/bookings`)}
										class="text-sm font-medium" style="color: var(--text-tertiary);"
									>
										View {upcomingBookings.length - 3} more bookings
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Sidebar (Right Column) -->
			<div class="space-y-6">
				
				<!-- Performance Stats -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Performance</h3>
					
					<StatsCard
						title="Total Bookings"
						value={stats.total}
						subtitle="{stats.confirmed} confirmed"
						icon={Calendar}
						trend={stats.thisWeekBookings > 0 ? { value: `+${stats.thisWeekBookings} this week`, positive: true } : undefined}
						variant="small"
					/>

					<StatsCard
						title="Revenue"
						value={formatEuro(stats.totalRevenue)}
						subtitle="{stats.totalParticipants} total guests"
						icon={DollarSign}
						trend={stats.averageBookingValue > 0 ? { value: `€${stats.averageBookingValue.toFixed(0)} avg`, positive: true } : undefined}
						variant="small"
					/>

					<StatsCard
						title="Check-ins"
						value={stats.checkIns}
						subtitle="{stats.noShows} no-shows"
						icon={UserCheck}
						variant="small"
					/>
				</div>

				<!-- Quick Actions (Desktop Only) -->
				<div class="hidden lg:block rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Quick Actions</h3>
					<div class="space-y-3">
						<button
							onclick={() => goto(`/tours/${tour?.id}/schedule`)}
							class="w-full button-secondary button--gap justify-center"
						>
							<Calendar class="h-4 w-4" />
							Manage Schedule
						</button>
						<button
							onclick={() => { if (tour?.qrCode) { copyBookingUrl(); } }}
							class="w-full button-secondary button--gap justify-center"
							disabled={!tour?.qrCode}
						>
							<Copy class="h-4 w-4" />
							Copy QR Link
						</button>
											<button
						onclick={() => goto(`/tours/${tour?.id}/bookings`)}
						class="w-full button-secondary button--gap justify-center"
					>
						<BarChart3 class="h-4 w-4" />
						Manage Bookings
					</button>
						<button
							onclick={() => goto(`/srurs/${tour?.id}`)}
							class="w-full button-secondary button--gap justify-center"
						>
							<ExternalLink class="h-4 w-4" />
							View Original
						</button>
					</div>
				</div>

				<!-- Danger Zone -->
				<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-danger);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-danger);">Danger Zone</h3>
					<form id="delete-tour-form" method="POST" action="?/delete" use:enhance={() => {
						return async ({ result }) => {
							isDeleting = false;
							if (result.type === 'redirect') {
								goto(result.location);
							}
						};
					}}>
						<button
							type="button"
							onclick={deleteTour}
							disabled={isDeleting}
							class="w-full button-secondary button--gap justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
						>
							{#if isDeleting}
								<div class="form-spinner"></div>
							{:else}
								<Trash2 class="h-4 w-4" />
							{/if}
							Delete Tour
						</button>
					</form>
					<p class="text-xs mt-2" style="color: var(--text-tertiary);">This action cannot be undone</p>
				</div>
			</div>
		</div>
	{/if}
</div> 