<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { QRCode } from '$lib/types.js';
	import { qrCodesApi } from '$lib/pocketbase.js';
	import QRGenerator from '$lib/components/QRGenerator.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import QrCodeIcon from 'lucide-svelte/icons/qr-code';
	import Download from 'lucide-svelte/icons/download';
	import Eye from 'lucide-svelte/icons/eye';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Plus from 'lucide-svelte/icons/plus';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import X from 'lucide-svelte/icons/x';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	
	let { data }: { data: PageData } = $props();
	
	// QR code rendering
	let qrCodeElements = $state<Record<string, HTMLDivElement>>({});
	
	let qrCodes = $state<QRCode[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showGenerator = $state(false);
	let selectedCategory = $state('all');
	let copiedQRId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	
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
	
	// Filtered QR codes
	let filteredQRCodes = $derived(
		selectedCategory === 'all' 
			? qrCodes 
			: qrCodes.filter(qr => qr.category === selectedCategory)
	);
	
	onMount(async () => {
		await loadQRCodes();
	});
	
	// Generate QR codes when data loads or changes
	$effect(() => {
		if (qrCodes.length > 0) {
			qrCodes.forEach(qr => {
				const element = qrCodeElements[qr.id];
				if (element) {
					generateQRCodeDisplay(qr, element);
				}
			});
		}
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
	
	function initiateDelete(qrId: string) {
		if (deleteConfirmId === qrId) {
			// Second click - actually delete
			performDelete(qrId);
		} else {
			// First click - show confirmation state
			deleteConfirmId = qrId;
			// Reset after 3 seconds if not confirmed
			setTimeout(() => {
				if (deleteConfirmId === qrId) {
					deleteConfirmId = null;
				}
			}, 3000);
		}
	}
	
	async function performDelete(qrId: string) {
		try {
			await qrCodesApi.delete(qrId);
			deleteConfirmId = null;
			await loadQRCodes();
		} catch (err) {
			error = 'Failed to delete QR code';
			console.error('Error deleting QR code:', err);
			deleteConfirmId = null;
		}
	}
	
	async function copyBookingUrl(qrId: string, code: string) {
		const url = `${window.location.origin}/book/${code}`;
		try {
			await navigator.clipboard.writeText(url);
			copiedQRId = qrId;
			// Reset after 2 seconds
			setTimeout(() => {
				copiedQRId = null;
			}, 2000);
		} catch (err) {
			// Fallback for browsers that don't support clipboard API
			console.error('Failed to copy to clipboard:', err);
		}
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
	
	// Generate QR code for display
	async function generateQRCodeDisplay(qr: QRCode, element: HTMLDivElement) {
		if (!element) return;
		
		try {
			// Clear existing content
			element.innerHTML = '';
			
			const bookingUrl = `${window.location.origin}/book/${qr.code}`;
			
			if (qr.customization) {
				// Use custom styling with qr-code-styling library
				const QRCodeStylingModule = await import('qr-code-styling');
				const QRCodeStyling = QRCodeStylingModule.default || QRCodeStylingModule;
				
				const options = {
					width: 80,
					height: 80,
					type: 'canvas' as const,
					data: bookingUrl,
					dotsOptions: {
						color: qr.customization.color || '#000000',
						type: qr.customization.style === 'dots' ? 'dots' : qr.customization.style === 'rounded' ? 'rounded' : 'square'
					},
					backgroundOptions: {
						color: qr.customization.backgroundColor || '#FFFFFF',
					},
					cornersSquareOptions: {
						type: qr.customization.style === 'dots' ? 'dot' : qr.customization.style === 'rounded' ? 'rounded' : 'square'
					},
					cornersDotOptions: {
						type: qr.customization.style === 'dots' ? 'dot' : 'square'
					}
				};
				
				const qrCodeInstance = new (QRCodeStyling as any)(options);
				qrCodeInstance.append(element);
			} else {
				// Use simple img for standard QR codes
				const img = document.createElement('img');
				img.src = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(bookingUrl)}`;
				img.alt = `QR Code for ${qr.name}`;
				img.className = 'w-full h-full object-contain';
				img.loading = 'lazy';
				element.appendChild(img);
			}
		} catch (err) {
			console.error('Error generating QR code display:', err);
			// Fallback to simple image
			const img = document.createElement('img');
			img.src = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/book/${qr.code}`)}`;
			img.alt = `QR Code for ${qr.name}`;
			img.className = 'w-full h-full object-contain';
			element.appendChild(img);
		}
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="flex items-center gap-4">
				<button 
					onclick={() => goto(`/tours/${data.tour.id}`)}
					class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
					aria-label="Back to tour"
				>
					<ArrowLeft class="h-5 w-5 text-gray-600" />
				</button>
				<div>
					<nav class="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<a href="/tours" class="hover:text-primary-600">Tours</a>
						<ChevronRight class="h-3 w-3" />
						<a href="/tours/{data.tour.id}" class="hover:text-primary-600">{data.tour.name}</a>
						<ChevronRight class="h-3 w-3" />
						<span>QR Codes</span>
					</nav>
					<h1 class="text-3xl font-bold text-gray-900">QR Code Management</h1>
					<p class="mt-1 text-gray-600">Create and track QR codes for offline marketing</p>
				</div>
			</div>
			<button 
				onclick={() => showGenerator = true} 
				class="button-primary button--gap"
			>
				<Plus class="h-5 w-5" />
				Create QR Code
			</button>
		</div>
	</div>
	
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
	
	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
		<StatsCard
			title="Total QR Codes"
			value={qrCodes.length}
			subtitle="{activeQRCount} active"
			icon={QrCodeIcon}
			trend={activeQRCount > 0 ? { value: `+${activeQRCount} active`, positive: true } : undefined}
		/>

		<StatsCard
			title="Total Scans"
			value={totalScans}
			subtitle="all time scans"
			icon={Eye}
		/>

		<StatsCard
			title="Conversions"
			value={totalConversions}
			subtitle="successful bookings"
			icon={BarChart3}
		/>

		<StatsCard
			title="Conversion Rate"
			value="{conversionRate}%"
			subtitle="scan to booking"
			icon={TrendingUp}
		/>
	</div>
	
	<!-- Category Filter and Breakdown -->
	{#if qrCodes.length > 0}
		<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
			<div class="flex flex-wrap gap-2">
				<button
					onclick={() => selectedCategory = 'all'}
					class="{selectedCategory === 'all' ? 'button-primary' : 'button-secondary'} button--small"
				>
					All Categories
				</button>
				{#each Object.entries(categories) as [catKey, cat]}
					{@const categoryQRs = qrCodes.filter(qr => qr.category === catKey)}
					{@const categoryScans = categoryQRs.reduce((sum, qr) => sum + qr.scans, 0)}
					<button
						onclick={() => selectedCategory = catKey}
						class="button--small {selectedCategory === catKey 
							? 'text-white border-transparent' 
							: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
						}"
						style="{selectedCategory === catKey ? `background-color: ${cat.color}; border-color: ${cat.color};` : ''}"
					>
						<span class="mr-1">{cat.icon}</span>
						{cat.label}
						{#if categoryQRs.length > 0}
							<span class="ml-1 px-1.5 py-0.5 text-xs rounded-full {
								selectedCategory === catKey 
									? 'bg-white/20' 
									: 'bg-gray-100'
							}">
								{categoryQRs.length}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- QR Code List -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading QR codes...
			</div>
		</div>
	{:else if filteredQRCodes.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
			<div class="max-w-md mx-auto">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<QrCodeIcon class="h-8 w-8 text-gray-400" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{selectedCategory === 'all' ? 'No QR codes yet' : 'No QR codes in this category'}
				</h3>
				<p class="text-gray-600 mb-6">
					{selectedCategory === 'all' 
						? 'Create your first QR code to start tracking offline marketing performance' 
						: 'Create a QR code for this category to start tracking'}
				</p>
				<button 
					onclick={() => showGenerator = true} 
					class="button-primary button--gap"
				>
					<Plus class="h-4 w-4" />
					Create Your First QR Code
				</button>
			</div>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each filteredQRCodes as qr (qr.id)}
				<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
					<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
						<!-- QR Code Preview -->
						<div class="flex-shrink-0">
							<div class="w-24 h-24 bg-white border-2 border-gray-200 rounded-lg p-2 flex items-center justify-center relative">
								<div 
									class="w-full h-full"
									bind:this={qrCodeElements[qr.id]}
								></div>
							</div>
						</div>
						
						<div class="flex-1">
							<div class="flex items-start gap-3 mb-3">
								{#if qr.category && categories[qr.category]}
									<div 
										class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-medium"
										style="background-color: {categories[qr.category].color}"
									>
										<span>{categories[qr.category].icon}</span>
										<span>{categories[qr.category].label}</span>
									</div>
								{/if}
								<div class="flex-1">
									<div class="flex items-center gap-3">
										<h3 class="text-lg font-semibold text-gray-900">{qr.name}</h3>
										<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {
											qr.isActive 
												? 'bg-green-50 text-green-700 border-green-200' 
												: 'bg-gray-50 text-gray-700 border-gray-200'
										} border">
											<span class="w-1.5 h-1.5 rounded-full {qr.isActive ? 'bg-green-500' : 'bg-gray-500'}"></span>
											{qr.isActive ? 'Active' : 'Inactive'}
										</span>
									</div>
									<div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
										<span>Code: <code class="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{qr.code}</code></span>
										<span>•</span>
										<span>Created {formatDate(qr.created)}</span>
									</div>
								</div>
							</div>
							
							<div class="grid grid-cols-3 gap-4 text-center">
								<div class="p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center justify-center gap-1 text-gray-600 mb-1">
										<Eye class="h-4 w-4" />
										<span class="text-xs">Scans</span>
									</div>
									<p class="text-xl font-bold text-gray-900">{qr.scans}</p>
								</div>
								<div class="p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center justify-center gap-1 text-gray-600 mb-1">
										<BarChart3 class="h-4 w-4" />
										<span class="text-xs">Bookings</span>
									</div>
									<p class="text-xl font-bold text-gray-900">{qr.conversions}</p>
								</div>
								<div class="p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center justify-center gap-1 text-gray-600 mb-1">
										<TrendingUp class="h-4 w-4" />
										<span class="text-xs">Conversion</span>
									</div>
									<p class="text-xl font-bold text-gray-900">
										{qr.scans > 0 ? ((qr.conversions / qr.scans) * 100).toFixed(1) : '0'}%
									</p>
								</div>
							</div>
						</div>
						
						<div class="flex flex-col gap-3">
							<!-- Primary Actions -->
							<div class="flex gap-2">
								<button
									onclick={() => goto(`/tours/${data.tour.id}/qr/${qr.id}`)}
									class="button-primary button--small button--gap flex-1"
								>
									<BarChart3 class="h-4 w-4" />
									View Details
								</button>
								<button
									onclick={() => copyBookingUrl(qr.id, qr.code)}
									class="button-secondary button--small button--gap flex-1 {copiedQRId === qr.id ? 'bg-green-50 text-green-700 border-green-200' : ''}"
									title="Copy booking URL"
								>
									{#if copiedQRId === qr.id}
										<Check class="h-4 w-4" />
										Copied!
									{:else}
										<Copy class="h-4 w-4" />
										Copy URL
									{/if}
								</button>
							</div>
							
							<!-- Secondary Actions -->
							<div class="flex gap-1">
								<a
									href={`${window.location.origin}/book/${qr.code}`}
									target="_blank"
									class="button-secondary button--small button--icon"
									title="Open booking page"
								>
									<ExternalLink class="h-4 w-4" />
								</a>
								<button
									onclick={() => toggleQRStatus(qr)}
									class="button-secondary button--small button--icon {qr.isActive ? 'text-green-600' : 'text-gray-600'}"
									title={qr.isActive ? 'Deactivate' : 'Activate'}
								>
									{#if qr.isActive}
										<ToggleRight class="h-4 w-4" />
									{:else}
										<ToggleLeft class="h-4 w-4" />
									{/if}
								</button>
								<button
									onclick={() => initiateDelete(qr.id)}
									class="button-secondary button--small {
										deleteConfirmId === qr.id 
											? 'bg-red-500 text-white border-red-500 hover:bg-red-600 button--gap' 
											: 'text-red-600 hover:bg-red-50 button--icon'
									}"
									title={deleteConfirmId === qr.id ? 'Click to confirm deletion' : 'Delete QR code'}
								>
									<Trash2 class="h-4 w-4" />
									{#if deleteConfirmId === qr.id}
										<span class="text-xs font-medium">Confirm?</span>
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- QR Generator Modal -->
{#if showGenerator}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
			<div class="p-6 border-b border-gray-200 flex-shrink-0">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Create New QR Code</h2>
					<button
						onclick={() => showGenerator = false}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
			<div class="p-6 overflow-y-auto flex-grow">
				<QRGenerator tour={data.tour} onSuccess={onQRCodeCreated} />
			</div>
		</div>
	</div>
{/if} 