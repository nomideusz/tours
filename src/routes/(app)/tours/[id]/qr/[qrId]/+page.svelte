<script lang="ts">
	import type { PageData } from './$types.js';
	import QRCodeCard from '$lib/components/QRCodeCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TourHeader from '$lib/components/TourHeader.svelte';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Eye from 'lucide-svelte/icons/eye';
	import Calendar from 'lucide-svelte/icons/calendar';
	
	let { data }: { data: PageData } = $props();
	
	// Calculate conversion rate (capped at 100%)
	let conversionRate = $derived(
		data.qrCode.scans > 0 
			? Math.min(((data.qrCode.conversions / data.qrCode.scans) * 100), 100).toFixed(1)
			: '0'
	);
	
	// Category configuration
	const categories = {
		digital: { label: 'Digital/Social', icon: '📱', color: '#3B82F6' },
		print: { label: 'Print Materials', icon: '🖨️', color: '#10B981' },
		partner: { label: 'Partner/Referral', icon: '🤝', color: '#F59E0B' },
		event: { label: 'Special Events', icon: '🎉', color: '#8B5CF6' },
		promo: { label: 'Limited Offers', icon: '🔥', color: '#EF4444' }
	};
	
	// Format dates
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
	
	// Format booking date for display
	function formatBookingDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title={data.qrCode.name}
		subtitle="Performance analytics and detailed insights"
		backUrl="/tours/{data.tour.id}/qr"
		breadcrumbs={[
			{ label: 'Tours', href: '/tours' },
			{ label: data.tour.name, href: `/tours/${data.tour.id}` },
			{ label: 'QR Codes', href: `/tours/${data.tour.id}/qr` },
			{ label: data.qrCode.name }
		]}
	>
		<!-- Tour Status & Name Indicator -->
		<TourHeader tour={data.tour} />

		<!-- QR Code Details -->
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<span class="text-sm" style="color: var(--text-secondary);">QR Code:</span>
			{#if data.qrCode.category && categories[data.qrCode.category]}
				<span 
					class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-white text-xs font-medium"
					style="background-color: {categories[data.qrCode.category].color}"
				>
					<span>{categories[data.qrCode.category].icon}</span>
					<span>{categories[data.qrCode.category].label}</span>
				</span>
			{/if}
			<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md {
				data.qrCode.isActive 
					? 'bg-green-50 text-green-700 border border-green-200' 
					: 'bg-gray-50 text-gray-600 border border-gray-200'
			}">
				<span class="w-1 h-1 rounded-full {data.qrCode.isActive ? 'bg-green-500' : 'bg-gray-400'}"></span>
				{data.qrCode.isActive ? 'Enabled' : 'Disabled'}
			</span>
			<span style="color: var(--text-tertiary);">•</span>
			<span class="text-xs" style="color: var(--text-tertiary);">
				Code: <code class="px-1.5 py-0.5 rounded font-mono" style="background: var(--bg-tertiary); color: var(--text-primary);">{data.qrCode.code}</code>
			</span>
		</div>
	</PageHeader>
	
	<div class="grid lg:grid-cols-3 gap-8">
		<!-- QR Code Display -->
		<div class="lg:col-span-1">
			<QRCodeCard qrCode={data.qrCode} size="large" />
			
					<!-- Quick Stats -->
		<div class="mt-6 rounded-xl shadow-sm p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Performance Summary</h3>
			<div class="space-y-4">
				<div>
					<div class="flex justify-between items-center mb-1">
						<span class="text-sm" style="color: var(--text-secondary);">Total Scans</span>
						<span class="font-semibold" style="color: var(--text-primary);">{data.qrCode.scans}</span>
					</div>
				</div>
				<div>
					<div class="flex justify-between items-center mb-1">
						<span class="text-sm" style="color: var(--text-secondary);">Conversions</span>
						<span class="font-semibold" style="color: var(--text-primary);">{data.qrCode.conversions}</span>
					</div>
				</div>
				<div>
					<div class="flex justify-between items-center mb-1">
						<span class="text-sm" style="color: var(--text-secondary);">Conversion Rate</span>
						<span class="font-semibold" style="color: var(--text-primary);">{conversionRate}%</span>
					</div>
					<div class="w-full rounded-full h-2" style="background: var(--bg-tertiary);">
						<div 
							class="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style="width: {conversionRate}%"
						></div>
					</div>
				</div>
			</div>
		</div>
		</div>
		
		<!-- Analytics -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Analytics Coming Soon -->
			<div class="rounded-xl shadow-sm p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Detailed Analytics</h3>
					<BarChart3 class="w-5 h-5" style="color: var(--text-tertiary);" />
				</div>
				
				<div class="text-center py-8" style="color: var(--text-tertiary);">
					<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--bg-tertiary);">
						<BarChart3 class="h-8 w-8" style="color: var(--text-tertiary);" />
					</div>
					<p class="font-medium">Advanced Analytics Coming Soon</p>
					<p class="text-sm mt-1">Detailed scan tracking, location data, and device analytics will be available in a future update</p>
				</div>
			</div>
			
			<!-- Recent Bookings -->
			<div class="rounded-xl shadow-sm p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Recent Bookings from this QR Code</h3>
				
				{#if data.recentBookings && data.recentBookings.length > 0}
					<div class="space-y-3">
						{#each data.recentBookings as booking}
							<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<div class="flex justify-between items-start">
									<div>
										<h4 class="font-medium" style="color: var(--text-primary);">{booking.customerName}</h4>
										<p class="text-sm" style="color: var(--text-secondary);">{booking.customerEmail}</p>
										{#if booking.expand?.timeSlot?.startTime}
											<p class="text-xs mt-1" style="color: var(--text-tertiary);">
												Tour Date: {formatDate(booking.expand.timeSlot.startTime)}
											</p>
										{/if}
									</div>
									<div class="text-right">
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
											booking.status === 'confirmed' 
												? 'bg-green-100 text-green-800' 
												: booking.status === 'pending'
												? 'bg-yellow-100 text-yellow-800'
												: 'bg-gray-100 text-gray-800'
										}">
											{booking.status}
										</span>
										<p class="text-xs mt-1" style="color: var(--text-tertiary);">
											{formatBookingDate(booking.created)}
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
					
					{#if data.recentBookings.length >= 10}
						<div class="mt-4 text-center">
							<p class="text-sm" style="color: var(--text-tertiary);">Showing 10 most recent bookings</p>
						</div>
					{/if}
				{:else}
					<div class="text-center py-8" style="color: var(--text-tertiary);">
						<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--bg-tertiary);">
							<Calendar class="h-8 w-8" style="color: var(--text-tertiary);" />
						</div>
						<p>No bookings yet from this QR code</p>
						<p class="text-sm mt-1">Bookings will appear here once customers start using this QR code</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div> 