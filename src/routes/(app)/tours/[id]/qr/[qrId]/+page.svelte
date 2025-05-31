<script lang="ts">
	import type { PageData } from './$types.js';
	import QRCodeCard from '$lib/components/QRCodeCard.svelte';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Eye from 'lucide-svelte/icons/eye';
	import Calendar from 'lucide-svelte/icons/calendar';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	
	let { data }: { data: PageData } = $props();
	
	// Calculate conversion rate
	let conversionRate = $derived(
		data.qrCode.scans > 0 
			? ((data.qrCode.conversions / data.qrCode.scans) * 100).toFixed(1)
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
	
	// Mock analytics data (in production, this would come from the server)
	const analyticsData = {
		scansByDay: [
			{ date: 'Mon', scans: 12 },
			{ date: 'Tue', scans: 8 },
			{ date: 'Wed', scans: 15 },
			{ date: 'Thu', scans: 20 },
			{ date: 'Fri', scans: 25 },
			{ date: 'Sat', scans: 30 },
			{ date: 'Sun', scans: 18 }
		],
		topLocations: [
			{ location: 'Tourist Information Center', scans: 45 },
			{ location: 'Hotel Lobby', scans: 38 },
			{ location: 'Restaurant', scans: 25 },
			{ location: 'Street Flyer', scans: 20 }
		],
		deviceTypes: [
			{ type: 'Mobile', percentage: 85 },
			{ type: 'Tablet', percentage: 10 },
			{ type: 'Desktop', percentage: 5 }
		]
	};
	
	// Get max value for chart scaling
	const maxScans = Math.max(...analyticsData.scansByDay.map(d => d.scans));
</script>

<div class="max-w-screen-2xl mx-auto px-6 py-8 sm:px-8 lg:px-12">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
			<a href="/tours" class="hover:text-blue-600">Tours</a>
			<span>/</span>
			<a href="/tours/{data.tour.id}" class="hover:text-blue-600">{data.tour.name}</a>
			<span>/</span>
			<a href="/tours/{data.tour.id}/qr" class="hover:text-blue-600">QR Codes</a>
			<span>/</span>
			<span>{data.qrCode.name}</span>
		</div>
		
		<div class="flex items-center gap-4 mb-2">
			<a 
				href="/tours/{data.tour.id}/qr" 
				class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
			>
				<ArrowLeft class="w-5 h-5" />
			</a>
			<h1 class="text-3xl font-bold text-gray-900">{data.qrCode.name}</h1>
			{#if data.qrCode.category && categories[data.qrCode.category]}
				<div 
					class="flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-sm font-medium"
					style="background-color: {categories[data.qrCode.category].color}"
				>
					<span>{categories[data.qrCode.category].icon}</span>
					<span>{categories[data.qrCode.category].label}</span>
				</div>
			{/if}
		</div>
		
		<div class="flex items-center gap-4 text-sm text-gray-600">
			<span class="flex items-center gap-1">
				<Calendar class="w-4 h-4" />
				Created {formatDate(data.qrCode.created)}
			</span>
			<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full {data.qrCode.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
				{data.qrCode.isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	</div>
	
	<div class="grid lg:grid-cols-3 gap-8">
		<!-- QR Code Display -->
		<div class="lg:col-span-1">
			<QRCodeCard qrCode={data.qrCode} size="large" />
			
			<!-- Quick Stats -->
			<div class="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
				<div class="space-y-4">
					<div>
						<div class="flex justify-between items-center mb-1">
							<span class="text-sm text-gray-600">Total Scans</span>
							<span class="font-semibold text-gray-900">{data.qrCode.scans}</span>
						</div>
					</div>
					<div>
						<div class="flex justify-between items-center mb-1">
							<span class="text-sm text-gray-600">Conversions</span>
							<span class="font-semibold text-gray-900">{data.qrCode.conversions}</span>
						</div>
					</div>
					<div>
						<div class="flex justify-between items-center mb-1">
							<span class="text-sm text-gray-600">Conversion Rate</span>
							<span class="font-semibold text-gray-900">{conversionRate}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
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
			<!-- Scan Activity Chart -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-gray-900">Scan Activity (Last 7 Days)</h3>
					<BarChart3 class="w-5 h-5 text-gray-400" />
				</div>
				
				<div class="h-64 flex items-end justify-between gap-2">
					{#each analyticsData.scansByDay as day}
						<div class="flex-1 flex flex-col items-center">
							<div class="w-full bg-gray-100 rounded-t relative flex items-end">
								<div 
									class="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
									style="height: {(day.scans / maxScans) * 100}%"
								>
									<span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
										{day.scans}
									</span>
								</div>
							</div>
							<span class="mt-2 text-xs text-gray-600">{day.date}</span>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Top Locations -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-gray-900">Top Scan Locations</h3>
					<Eye class="w-5 h-5 text-gray-400" />
				</div>
				
				<div class="space-y-4">
					{#each analyticsData.topLocations as location}
						<div>
							<div class="flex justify-between items-center mb-1">
								<span class="text-sm font-medium text-gray-700">{location.location}</span>
								<span class="text-sm text-gray-600">{location.scans} scans</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-green-500 h-2 rounded-full transition-all duration-300"
									style="width: {(location.scans / analyticsData.topLocations[0].scans) * 100}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Device Types -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-gray-900">Device Types</h3>
					<TrendingUp class="w-5 h-5 text-gray-400" />
				</div>
				
				<div class="grid grid-cols-3 gap-4 text-center">
					{#each analyticsData.deviceTypes as device}
						<div>
							<div class="text-2xl font-bold text-gray-900">{device.percentage}%</div>
							<div class="text-sm text-gray-600">{device.type}</div>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Recent Bookings -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Bookings from this QR Code</h3>
				<div class="text-center py-8 text-gray-500">
					<p>No bookings yet from this QR code</p>
				</div>
			</div>
		</div>
	</div>
</div> 