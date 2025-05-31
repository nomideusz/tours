<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { QRCode } from '$lib/types.js';
	import { qrCodesApi } from '$lib/pocketbase.js';
	import QRGenerator from '$lib/components/QRGenerator.svelte';
	import QrCodeIcon from 'lucide-svelte/icons/qr-code';
	import Download from 'lucide-svelte/icons/download';
	import Eye from 'lucide-svelte/icons/eye';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Plus from 'lucide-svelte/icons/plus';
	import Copy from 'lucide-svelte/icons/copy';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	
	let { data }: { data: PageData } = $props();
	
	let qrCodes = $state<QRCode[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showGenerator = $state(false);
	
	// Stats
	let totalScans = $derived(qrCodes.reduce((sum, qr) => sum + qr.scans, 0));
	let totalConversions = $derived(qrCodes.reduce((sum, qr) => sum + qr.conversions, 0));
	let conversionRate = $derived(totalScans > 0 ? ((totalConversions / totalScans) * 100).toFixed(1) : '0');
	let activeQRCount = $derived(qrCodes.filter(qr => qr.isActive).length);
	
	// Category configuration
	const categories = {
		digital: { label: 'Digital/Social', icon: '📱', color: '#3B82F6' },
		print: { label: 'Print Materials', icon: '🖨️', color: '#10B981' },
		partner: { label: 'Partner/Referral', icon: '🤝', color: '#F59E0B' },
		event: { label: 'Special Events', icon: '🎉', color: '#8B5CF6' },
		promo: { label: 'Limited Offers', icon: '🔥', color: '#EF4444' }
	};
	
	onMount(async () => {
		await loadQRCodes();
	});
	
	async function loadQRCodes() {
		try {
			isLoading = true;
			error = null;
			const allQRCodes = await qrCodesApi.getAll();
			// Filter QR codes for this specific tour
			qrCodes = allQRCodes.filter(qr => qr.tour === data.tour.id);
		} catch (err) {
			error = 'Failed to load QR codes';
			console.error('Error loading QR codes:', err);
		} finally {
			isLoading = false;
		}
	}
	
	async function toggleQRStatus(qr: QRCode) {
		try {
			await qrCodesApi.update(qr.id, { isActive: !qr.isActive });
			await loadQRCodes(); // Reload to get updated data
		} catch (err) {
			error = 'Failed to update QR code status';
			console.error('Error updating QR code:', err);
		}
	}
	
	async function deleteQRCode(qr: QRCode) {
		if (!confirm(`Are you sure you want to delete "${qr.name}"? This action cannot be undone.`)) {
			return;
		}
		
		try {
			await qrCodesApi.delete(qr.id);
			await loadQRCodes();
		} catch (err) {
			error = 'Failed to delete QR code';
			console.error('Error deleting QR code:', err);
		}
	}
	
	function copyBookingUrl(code: string) {
		const url = `${window.location.origin}/book/${code}`;
		navigator.clipboard.writeText(url);
		// You could add a toast notification here
		alert('Booking URL copied to clipboard!');
	}
	
	function onQRCodeCreated(qrCode: QRCode) {
		showGenerator = false;
		loadQRCodes();
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 py-8 sm:px-8 lg:px-12">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
				<a href="/tours" class="hover:text-blue-600">Tours</a>
				<span>/</span>
				<a href="/tours/{data.tour.id}" class="hover:text-blue-600">{data.tour.name}</a>
				<span>/</span>
				<span>QR Codes</span>
			</div>
			<h1 class="text-3xl font-bold text-gray-900">QR Code Management</h1>
			<p class="mt-1 text-gray-600">Create and manage QR codes for {data.tour.name}</p>
		</div>
		<button 
			onclick={() => showGenerator = true} 
			class="button-primary button--gap"
		>
			<Plus class="w-4 h-4" />
			Create New QR Code
		</button>
	</div>
	
	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-sm text-red-600">{error}</p>
		</div>
	{/if}
	
	<!-- Category Breakdown -->
	{#if qrCodes.length > 0}
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Performance by Category</h3>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
				{#each Object.entries(categories) as [catKey, cat]}
					{@const categoryQRs = qrCodes.filter(qr => qr.category === catKey)}
					{@const categoryScans = categoryQRs.reduce((sum, qr) => sum + qr.scans, 0)}
					{@const categoryConversions = categoryQRs.reduce((sum, qr) => sum + qr.conversions, 0)}
					<div class="text-center">
						<div 
							class="inline-flex items-center justify-center w-12 h-12 rounded-lg text-white mb-2"
							style="background-color: {cat.color}"
						>
							<span class="text-2xl">{cat.icon}</span>
						</div>
						<p class="text-xs font-medium text-gray-600">{cat.label}</p>
						<p class="text-lg font-bold text-gray-900">{categoryScans}</p>
						<p class="text-xs text-gray-500">scans</p>
						{#if categoryScans > 0}
							<p class="text-xs text-green-600 font-medium">
								{((categoryConversions / categoryScans) * 100).toFixed(0)}% conv
							</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Active QR Codes</p>
					<p class="text-2xl font-bold text-gray-900">{activeQRCount}</p>
				</div>
				<div class="p-3 bg-blue-50 rounded-lg">
					<QrCodeIcon class="w-6 h-6 text-blue-600" />
				</div>
			</div>
		</div>
		
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Scans</p>
					<p class="text-2xl font-bold text-gray-900">{totalScans}</p>
				</div>
				<div class="p-3 bg-green-50 rounded-lg">
					<Eye class="w-6 h-6 text-green-600" />
				</div>
			</div>
		</div>
		
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Conversions</p>
					<p class="text-2xl font-bold text-gray-900">{totalConversions}</p>
				</div>
				<div class="p-3 bg-purple-50 rounded-lg">
					<BarChart3 class="w-6 h-6 text-purple-600" />
				</div>
			</div>
		</div>
		
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Conversion Rate</p>
					<p class="text-2xl font-bold text-gray-900">{conversionRate}%</p>
				</div>
				<div class="p-3 bg-orange-50 rounded-lg">
					<BarChart3 class="w-6 h-6 text-orange-600" />
				</div>
			</div>
		</div>
	</div>
	
	<!-- QR Code List -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading QR codes...
			</div>
		</div>
	{:else if qrCodes.length === 0}
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
			<QrCodeIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
			<h3 class="text-lg font-semibold text-gray-900 mb-2">No QR codes yet</h3>
			<p class="text-gray-600 mb-6">Create your first QR code to start receiving bookings from offline marketing.</p>
			<button 
				onclick={() => showGenerator = true} 
				class="button-primary button--gap"
			>
				<Plus class="w-4 h-4" />
				Create Your First QR Code
			</button>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each qrCodes as qr (qr.id)}
				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								{#if qr.category && categories[qr.category]}
									<div 
										class="flex items-center gap-1 px-2 py-1 rounded-md text-white text-xs font-medium"
										style="background-color: {categories[qr.category].color}"
									>
										<span>{categories[qr.category].icon}</span>
										<span>{categories[qr.category].label}</span>
									</div>
								{/if}
								<h3 class="text-lg font-semibold text-gray-900">{qr.name}</h3>
								<span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full {qr.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
									{qr.isActive ? 'Active' : 'Inactive'}
								</span>
							</div>
							
							<div class="flex items-center gap-6 text-sm text-gray-600 mb-3">
								<span class="flex items-center gap-1">
									<Eye class="w-4 h-4" />
									{qr.scans} scans
								</span>
								<span class="flex items-center gap-1">
									<BarChart3 class="w-4 h-4" />
									{qr.conversions} bookings
								</span>
								<span>
									{qr.scans > 0 ? ((qr.conversions / qr.scans) * 100).toFixed(1) : '0'}% conversion
								</span>
							</div>
							
							<div class="flex items-center gap-2 text-xs text-gray-500">
								<span>Code: <code class="bg-gray-100 px-1 py-0.5 rounded font-mono">{qr.code}</code></span>
								<span>•</span>
								<span>Created {formatDate(qr.created)}</span>
							</div>
						</div>
						
						<div class="flex items-center gap-2">
							<button
								onclick={() => goto(`/tours/${data.tour.id}/qr/${qr.id}`)}
								class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
								title="View details"
							>
								<Eye class="w-5 h-5" />
							</button>
							<button
								onclick={() => copyBookingUrl(qr.code)}
								class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
								title="Copy booking URL"
							>
								<Copy class="w-5 h-5" />
							</button>
							<button
								class="p-2 text-gray-400 hover:text-green-600 transition-colors"
								title="Download QR code"
							>
								<Download class="w-5 h-5" />
							</button>
							<button
								onclick={() => toggleQRStatus(qr)}
								class="p-2 text-gray-400 hover:text-orange-600 transition-colors"
								title={qr.isActive ? 'Deactivate' : 'Activate'}
							>
								{#if qr.isActive}
									<ToggleRight class="w-5 h-5" />
								{:else}
									<ToggleLeft class="w-5 h-5" />
								{/if}
							</button>
							<button
								onclick={() => deleteQRCode(qr)}
								class="p-2 text-gray-400 hover:text-red-600 transition-colors"
								title="Delete QR code"
							>
								<Trash2 class="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- QR Generator Modal -->
{#if showGenerator}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Create New QR Code</h2>
					<button
						onclick={() => showGenerator = false}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
			<div class="p-6">
				<QRGenerator tour={data.tour} onSuccess={onQRCodeCreated} />
			</div>
		</div>
	</div>
{/if} 