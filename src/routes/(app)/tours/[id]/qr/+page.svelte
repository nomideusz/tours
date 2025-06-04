<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { qrCodesApi } from '$lib/pocketbase.js';
	import type { QRCode } from '$lib/types.js';
	import type { PageData } from './$types.js';
	import QRGenerator from '$lib/components/QRGenerator.svelte';
	
	import QrCodeIcon from 'lucide-svelte/icons/qr-code';
	import Plus from 'lucide-svelte/icons/plus';
	import Eye from 'lucide-svelte/icons/eye';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Filter from 'lucide-svelte/icons/filter';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';

	import PageHeader from '$lib/components/PageHeader.svelte';
	import TourHeader from '$lib/components/TourHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let { data }: { data: PageData } = $props();

	let qrCodes = $state<QRCode[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let showGenerator = $state(false);
	let copiedQRId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	let qrCodeElements = $state<{ [key: string]: HTMLElement }>({});
	let selectedCategory = $state<string>('all');
	let showFirstQRAlert = $derived(qrCodes.length === 1 && (typeof window !== 'undefined' && !localStorage.getItem('qr_first_time_dismissed')));
	let showMobileActions = $state<string | null>(null);

	// Categories for QR codes
	const categories = {
		'digital': { label: 'Digital/Social', icon: '📱', color: '#3B82F6' },
		'print': { label: 'Print Materials', icon: '🖨️', color: '#10B981' },
		'partner': { label: 'Partner/Referral', icon: '🤝', color: '#F59E0B' },
		'event': { label: 'Special Events', icon: '🎉', color: '#8B5CF6' },
		'limited': { label: 'Limited Offers', icon: '🔥', color: '#EF4444' },
		'promo': { label: 'Limited Offers', icon: '🔥', color: '#EF4444' }
	};

	// Computed values for statistics
	let activeQRCount = $derived(qrCodes.filter(qr => qr.isActive).length);
	let totalScans = $derived(qrCodes.reduce((sum, qr) => sum + (qr.scans || 0), 0));
	let totalConversions = $derived(qrCodes.reduce((sum, qr) => sum + (qr.conversions || 0), 0));
	let conversionRate = $derived(totalScans > 0 ? ((totalConversions / totalScans) * 100).toFixed(1) : '0');

	let filteredQRCodes = $derived(
		selectedCategory === 'all' 
			? qrCodes 
			: qrCodes.filter(qr => qr.category === selectedCategory)
	);

	onMount(async () => {
		if (qrCodes.length === 0) {
			await loadQRCodes();
		}
		
		// Generate QR codes for display
		await generateQRCodeImages();
		
		// Handle click outside mobile actions
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		// Clean up timers and event listeners
		if (copiedQRId) {
			copiedQRId = null;
		}
		if (typeof window !== 'undefined') {
			document.removeEventListener('click', handleClickOutside);
		}
	});

	async function loadQRCodes() {
		try {
			isLoading = true;
			error = null;
			qrCodes = await qrCodesApi.getByTour(data.tour.id);
		} catch (err) {
			error = 'Failed to load QR codes.';
			console.error('Error loading QR codes:', err);
		} finally {
			isLoading = false;
		}
	}

	async function generateQRCodeImages() {
		if (typeof window === 'undefined') return;
		
		for (const qr of qrCodes) {
			const element = qrCodeElements[qr.id];
			if (element) {
				const url = `${window.location.origin}/book/${qr.code}`;
				try {
					// Use the same colors as defined in customization, or defaults
					const darkColor = qr.customization?.color || '#000000';
					const lightColor = qr.customization?.backgroundColor || '#FFFFFF';
					
					// Use API-based QR generation to match the modal
					const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=${darkColor.replace('#', '')}&bgcolor=${lightColor.replace('#', '')}`;
					
					const img = document.createElement('img');
					img.src = qrApiUrl;
					img.alt = `QR code for ${qr.name}`;
					img.className = 'w-full h-full object-contain';
					
					element.innerHTML = '';
					element.appendChild(img);
				} catch (err) {
					console.error('Error generating QR code:', err);
				}
			}
		}
	}

	async function copyBookingUrl(qrId: string, code: string) {
		if (typeof window === 'undefined') return;
		
		const url = `${window.location.origin}/book/${code}`;
		try {
			await navigator.clipboard.writeText(url);
			copiedQRId = qrId;
			setTimeout(() => {
				copiedQRId = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}

	async function toggleQRStatus(qr: QRCode) {
		try {
			const updatedQR = await qrCodesApi.update(qr.id, {
				isActive: !qr.isActive
			});
			
			// Update the QR code in the list
			qrCodes = qrCodes.map(q => q.id === qr.id ? updatedQR : q);
		} catch (err) {
			error = 'Failed to update QR code status.';
			console.error('Error updating QR status:', err);
		}
	}

	function initiateDelete(qrId: string) {
		if (deleteConfirmId === qrId) {
			deleteQRCode(qrId);
		} else {
			deleteConfirmId = qrId;
			// Reset confirmation after 3 seconds
			setTimeout(() => {
				if (deleteConfirmId === qrId) {
					deleteConfirmId = null;
				}
			}, 3000);
		}
	}

	async function deleteQRCode(qrId: string) {
		try {
			await qrCodesApi.delete(qrId);
			qrCodes = qrCodes.filter(qr => qr.id !== qrId);
			deleteConfirmId = null;
		} catch (err) {
			error = 'Failed to delete QR code.';
			console.error('Error deleting QR code:', err);
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	}

	function onQRCodeCreated(newQR: QRCode) {
		qrCodes = [...qrCodes, newQR];
		showGenerator = false;
		
		// Generate QR code image for the new QR
		setTimeout(() => generateQRCodeImages(), 100);
	}

	// Handle click outside mobile actions
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('[data-mobile-actions]')) {
			showMobileActions = null;
		}
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="QR Code Management"
		subtitle="Create and track QR codes for offline marketing"
		backUrl="/tours/{data.tour.id}"
		breadcrumbs={[
			{ label: 'Tours', href: '/tours' },
			{ label: data.tour.name, href: `/tours/${data.tour.id}` },
			{ label: 'QR Codes' }
		]}
	>
		<!-- Tour Status & Name Indicator -->
		<TourHeader 
			tour={data.tour} 
			countInfo={qrCodes.length > 0 ? {
				icon: QrCodeIcon,
				label: `${qrCodes.length} QR code${qrCodes.length !== 1 ? 's' : ''}`,
				detail: activeQRCount > 0 ? `${activeQRCount} enabled` : undefined
			} : undefined}
		/>

		<button 
			onclick={() => showGenerator = true} 
			class="button-primary button--gap"
		>
			<Plus class="h-5 w-5" />
			<span class="hidden sm:inline">Create QR Code</span>
			<span class="sm:hidden">Create</span>
		</button>
	</PageHeader>
	
	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div class="flex-1">
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
				<button
					onclick={() => error = null}
					class="text-red-400 hover:text-red-600 transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}
	
	<!-- First QR Code Notice -->
	{#if qrCodes.length === 1 && showFirstQRAlert}
		<div class="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-4 sm:p-6">
			<div class="flex items-start gap-4">
				<div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
					<QrCodeIcon class="h-5 w-5 sm:h-6 sm:w-6" />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-lg sm:text-xl font-bold text-purple-900 mb-2 sm:mb-3">🎉 Your First QR Code is Ready!</h3>
					<p class="text-purple-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
						We automatically created your first QR code when you set up this tour. You can start using it right away!
					</p>
					<div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
						<button 
							onclick={() => copyBookingUrl(qrCodes[0].id, qrCodes[0].code)}
							class="button-primary button--gap button--small"
						>
							<Copy class="h-4 w-4" />
							Copy Link
						</button>
						<button 
							onclick={() => showGenerator = true} 
							class="button-secondary button--gap button--small"
						>
							<Plus class="h-4 w-4" />
							Create Another
						</button>
					</div>
				</div>
				
				<button
					onclick={() => {
						showFirstQRAlert = false;
						localStorage.setItem('qr_first_time_dismissed', 'true');
					}}
					class="p-2 text-purple-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-white/50 flex-shrink-0"
				>
					<X class="h-4 w-4 sm:h-5 sm:w-5" />
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Statistics Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
		<StatsCard
			title="Total QR Codes"
			value={qrCodes.length}
			subtitle="{activeQRCount} enabled"
			icon={QrCodeIcon}
			trend={activeQRCount > 0 ? { value: `${activeQRCount} active`, positive: true } : undefined}
		/>

		<StatsCard
			title="Total Scans"
			value={totalScans}
			subtitle="all time"
			icon={Eye}
		/>

		<StatsCard
			title="Conversions"
			value={totalConversions}
			subtitle="bookings"
			icon={BarChart3}
		/>

		<StatsCard
			title="Conversion Rate"
			value="{conversionRate}%"
			subtitle="scan to booking"
			icon={TrendingUp}
		/>
	</div>
	
	<!-- Category Filter -->
	{#if qrCodes.length > 0}
		<div class="rounded-xl p-4 sm:p-6 mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-3 mb-4">
				<Filter class="h-5 w-5" style="color: var(--text-secondary);" />
				<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Filter by Category</h3>
			</div>
			
			<!-- Mobile: Dropdown -->
			<div class="sm:hidden">
				<select 
					bind:value={selectedCategory}
					class="form-select w-full"
				>
					<option value="all">All Categories ({qrCodes.length})</option>
					{#each Object.entries(categories) as [catKey, cat]}
						{@const categoryQRs = qrCodes.filter(qr => qr.category === catKey)}
						{#if categoryQRs.length > 0}
							<option value={catKey}>{cat.icon} {cat.label} ({categoryQRs.length})</option>
						{/if}
					{/each}
				</select>
			</div>
			
								<!-- Desktop: Buttons -->
			<div class="hidden sm:flex flex-wrap gap-2">
				<button
					onclick={() => selectedCategory = 'all'}
					class="{selectedCategory === 'all' ? 'button-primary' : 'button-secondary'} button--small"
				>
					All Categories ({qrCodes.length})
				</button>
				{#each Object.entries(categories) as [catKey, cat]}
					{@const categoryQRs = qrCodes.filter(qr => qr.category === catKey)}
					{#if categoryQRs.length > 0}
						<button
							onclick={() => selectedCategory = catKey}
							class="button--small {selectedCategory === catKey 
								? 'text-white border-transparent' 
								: 'border-gray-300'
							}"
							style="{selectedCategory === catKey 
								? `background-color: ${cat.color}; border-color: ${cat.color};` 
								: 'background: var(--bg-primary); color: var(--text-secondary); border-color: var(--border-primary);'
							}"
							onmouseenter="{selectedCategory !== catKey ? (e) => e.currentTarget.style.background = 'var(--bg-secondary)' : null}"
							onmouseleave="{selectedCategory !== catKey ? (e) => e.currentTarget.style.background = 'var(--bg-primary)' : null}"
						>
							<span class="mr-1">{cat.icon}</span>
							{cat.label}
							<span class="ml-1 px-1.5 py-0.5 text-xs rounded-full {
								selectedCategory === catKey 
									? 'bg-white/20' 
									: ''
							}" style="{selectedCategory !== catKey ? 'background: var(--bg-tertiary);' : ''}">
								{categoryQRs.length}
							</span>
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- QR Code List -->
	{#if isLoading}
		<div class="rounded-xl p-12" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center justify-center">
				<div class="flex items-center gap-2" style="color: var(--text-secondary);">
					<div class="form-spinner"></div>
					Loading QR codes...
				</div>
			</div>
		</div>
	{:else if filteredQRCodes.length === 0}
		<div class="rounded-xl p-8 sm:p-12" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<EmptyState
				icon={QrCodeIcon}
				title={selectedCategory === 'all' ? 'No QR codes yet' : 'No QR codes in this category'}
				description={selectedCategory === 'all' 
					? 'Create your first QR code to start tracking offline marketing performance' 
					: 'Create a QR code for this category to start tracking'}
				actionText="Create Your First QR Code"
				onAction={() => showGenerator = true}
			/>
		</div>
	{:else}
		<!-- QR Code Cards - Unified Design -->
		<div class="grid gap-4 lg:gap-6">
			{#each filteredQRCodes as qr (qr.id)}
				<div class="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<!-- Card Header -->
					<div class="px-6 py-4" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3 min-w-0 flex-1">
								<!-- Category Badge -->
								{#if qr.category && categories[qr.category]}
									<div 
										class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
										style="background-color: {categories[qr.category].color}"
									>
										<span>{categories[qr.category].icon}</span>
										<span class="hidden sm:inline">{categories[qr.category].label}</span>
									</div>
								{/if}
								
								<!-- Name and Status -->
								<div class="min-w-0 flex-1">
									<h3 class="text-lg font-semibold truncate" style="color: var(--text-primary);">{qr.name}</h3>
									<div class="flex items-center gap-2 mt-1">
										<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {
											qr.isActive 
												? 'bg-green-100 text-green-800' 
												: 'bg-gray-100 text-gray-800'
										}">
											<span class="w-1.5 h-1.5 rounded-full {qr.isActive ? 'bg-green-500' : 'bg-gray-500'}"></span>
											{qr.isActive ? 'Enabled' : 'Disabled'}
										</span>
										<span class="text-xs" style="color: var(--text-tertiary);">Created {formatDate(qr.created)}</span>
									</div>
								</div>
							</div>
							
							<!-- Mobile Menu Toggle -->
							<div class="sm:hidden relative" data-mobile-actions>
								<button
									onclick={() => showMobileActions = showMobileActions === qr.id ? null : qr.id}
									class="p-2 transition-colors rounded-lg"
									style="color: var(--text-tertiary); hover:color: var(--text-secondary); hover:background: var(--bg-tertiary);"
								>
									<MoreVertical class="h-4 w-4" />
								</button>
								
								{#if showMobileActions === qr.id}
									<div class="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-10 min-w-[180px] py-2" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<button
											onclick={() => {
												copyBookingUrl(qr.id, qr.code);
												showMobileActions = null;
											}}
											class="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
											style="color: var(--text-secondary); hover:background: var(--bg-secondary);"
										>
											<Copy class="h-4 w-4" />
											Copy URL
										</button>
										<a
											href={`${window.location.origin}/book/${qr.code}`}
											target="_blank"
											class="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
											style="color: var(--text-secondary); hover:background: var(--bg-secondary);"
											onclick={() => showMobileActions = null}
										>
											<ExternalLink class="h-4 w-4" />
											Open Page
										</a>
										<button
											onclick={() => {
												toggleQRStatus(qr);
												showMobileActions = null;
											}}
											class="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
											style="color: var(--text-secondary); hover:background: var(--bg-secondary);"
										>
											{#if qr.isActive}
												<ToggleLeft class="h-4 w-4" />
												Disable
											{:else}
												<ToggleRight class="h-4 w-4" />
												Enable
											{/if}
										</button>
										<div class="my-1" style="border-top: 1px solid var(--border-primary);"></div>
										<button
											onclick={() => {
												initiateDelete(qr.id);
												showMobileActions = null;
											}}
											class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
										>
											<Trash2 class="h-4 w-4" />
											Delete
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Card Content -->
					<div class="p-6">
						<div class="flex flex-col lg:flex-row gap-6">
							<!-- QR Code Section -->
							<div class="flex flex-col items-center lg:items-start">
								<div class="w-28 h-28 rounded-xl p-3 shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
									<div 
										class="w-full h-full flex items-center justify-center"
										bind:this={qrCodeElements[qr.id]}
									></div>
								</div>
								<div class="mt-3 text-center lg:text-left">
									<p class="text-xs mb-1" style="color: var(--text-tertiary);">QR Code</p>
									<code class="px-2 py-1 rounded-md font-mono text-xs" style="background: var(--bg-tertiary); color: var(--text-primary);">{qr.code}</code>
								</div>
							</div>
							
							<!-- Stats and Actions -->
							<div class="flex-1 space-y-6">
								<!-- Performance Stats -->
								<div>
									<h4 class="text-sm font-medium mb-3" style="color: var(--text-primary);">Performance</h4>
									<div class="grid grid-cols-3 gap-4">
										<div class="text-center p-4 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--color-primary-200);">
											<div class="flex items-center justify-center mb-2">
												<Eye class="h-5 w-5" style="color: var(--text-secondary);" />
											</div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">{qr.scans}</p>
											<p class="text-xs font-medium" style="color: var(--text-secondary);">Scans</p>
										</div>
										<div class="text-center p-4 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--color-primary-200);">
											<div class="flex items-center justify-center mb-2">
												<BarChart3 class="h-5 w-5" style="color: var(--text-secondary);" />
											</div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">{qr.conversions}</p>
											<p class="text-xs font-medium" style="color: var(--text-secondary);">Bookings</p>
										</div>
										<div class="text-center p-4 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--color-primary-200);">
											<div class="flex items-center justify-center mb-2">
												<TrendingUp class="h-5 w-5" style="color: var(--text-secondary);" />
											</div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">
												{qr.scans > 0 ? ((qr.conversions / qr.scans) * 100).toFixed(1) : '0'}%
											</p>
											<p class="text-xs font-medium" style="color: var(--text-secondary);">Conversion</p>
										</div>
									</div>
								</div>
								
								<!-- Actions -->
								<div class="hidden sm:block">
									<h4 class="text-sm font-medium mb-3" style="color: var(--text-primary);">Actions</h4>
									<div class="flex flex-wrap gap-3">
										<!-- Primary Actions -->
										<button
											onclick={() => goto(`/tours/${data.tour.id}/qr/${qr.id}`)}
											class="button-primary button--gap"
										>
											<BarChart3 class="h-4 w-4" />
											View Details
										</button>
										<button
											onclick={() => copyBookingUrl(qr.id, qr.code)}
											class="button-secondary button--gap {copiedQRId === qr.id ? 'bg-green-50 text-green-700 border-green-200' : ''}"
										>
											{#if copiedQRId === qr.id}
												<Check class="h-4 w-4" />
												Copied!
											{:else}
												<Copy class="h-4 w-4" />
												Copy URL
											{/if}
										</button>
										
										<!-- Secondary Actions -->
										<a
											href={`${window.location.origin}/book/${qr.code}`}
											target="_blank"
											class="button-secondary button--gap"
										>
											<ExternalLink class="h-4 w-4" />
											Preview
										</a>
										<button
											onclick={() => toggleQRStatus(qr)}
											class="button-secondary button--gap {qr.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}"
										>
											{#if qr.isActive}
												<ToggleLeft class="h-4 w-4" />
												Disable
											{:else}
												<ToggleRight class="h-4 w-4" />
												Enable
											{/if}
										</button>
										<button
											onclick={() => initiateDelete(qr.id)}
											class="button-secondary button--gap {
												deleteConfirmId === qr.id 
													? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
													: 'text-red-600 hover:bg-red-50 hover:border-red-200'
											}"
										>
											<Trash2 class="h-4 w-4" />
											{#if deleteConfirmId === qr.id}
												Confirm Delete
											{:else}
												Delete
											{/if}
										</button>
									</div>
								</div>
								
								<!-- Mobile Primary Actions -->
								<div class="sm:hidden flex gap-3">
									<button
										onclick={() => goto(`/tours/${data.tour.id}/qr/${qr.id}`)}
										class="button-primary button--gap flex-1"
									>
										<BarChart3 class="h-4 w-4" />
										Details
									</button>
									<button
										onclick={() => copyBookingUrl(qr.id, qr.code)}
										class="button-secondary button--gap flex-1 {copiedQRId === qr.id ? 'bg-green-50 text-green-700 border-green-200' : ''}"
									>
										{#if copiedQRId === qr.id}
											<Check class="h-4 w-4" />
											Copied!
										{:else}
											<Copy class="h-4 w-4" />
											Copy
										{/if}
									</button>
								</div>
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
		<div class="rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" style="background: var(--bg-primary);">
			<div class="p-4 sm:p-6 flex-shrink-0" style="border-bottom: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Create New QR Code</h2>
					<button
						onclick={() => showGenerator = false}
						class="p-2 transition-colors rounded-lg"
						style="color: var(--text-tertiary); hover:color: var(--text-secondary); hover:background: var(--bg-tertiary);"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
			<div class="p-4 sm:p-6 overflow-y-auto flex-grow">
				<QRGenerator tour={data.tour} onSuccess={onQRCodeCreated} />
			</div>
		</div>
	</div>
{/if} 