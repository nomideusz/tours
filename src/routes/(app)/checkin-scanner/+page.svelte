<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Camera from 'lucide-svelte/icons/camera';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Scan from 'lucide-svelte/icons/scan';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	
	// QR Scanner types and state
	let videoElement: HTMLVideoElement | undefined = $state();
	let canvasElement: HTMLCanvasElement | undefined = $state();
	let scanning = $state(false);
	let cameraError = $state('');
	let lastScanResult = $state('');
	let lastScanTime = $state(0);
	let scanHistory = $state<string[]>([]);
	let isInitializing = $state(false);
	
	// Server data
	let recentQRCodes = $state(data.recentQRCodes || []);
	let activeTours = $state(data.activeTours || []);
	let scannerConfig = $state(data.scannerConfig || {});

	// QR Code categories configuration
	const categories = {
		'Digital/Social': { icon: '📱', color: '#3B82F6' },
		'Print Materials': { icon: '🖨️', color: '#10B981' },
		'Partner/Referral': { icon: '🤝', color: '#F59E0B' },
		'Special Events': { icon: '🎉', color: '#8B5CF6' },
		'Limited Offers': { icon: '🔥', color: '#EF4444' }
	};

	function getCategoryDisplay(category: string) {
		// Handle case variations and partial matches
		const normalizedCategory = category.toLowerCase();
		
		if (normalizedCategory.includes('digital') || normalizedCategory.includes('social')) {
			return categories['Digital/Social'];
		} else if (normalizedCategory.includes('print')) {
			return categories['Print Materials'];
		} else if (normalizedCategory.includes('partner') || normalizedCategory.includes('referral')) {
			return categories['Partner/Referral'];
		} else if (normalizedCategory.includes('event')) {
			return categories['Special Events'];
		} else if (normalizedCategory.includes('limited') || normalizedCategory.includes('offer')) {
			return categories['Limited Offers'];
		}
		
		// Fallback for unknown categories
		return { icon: '🏷️', color: '#6B7280' };
	}

	// Import QR scanner dynamically to avoid SSR issues
	let QrScanner: any = null;
	let scanner: any = null;

	onMount(async () => {
		if (browser) {
			try {
				isInitializing = true;
				const QrScannerModule = await import('qr-scanner');
				QrScanner = QrScannerModule.default;
				console.log('QR Scanner loaded successfully');
			} catch (error) {
				console.error('Failed to load QR Scanner:', error);
				cameraError = 'Failed to load QR scanner library';
			} finally {
				isInitializing = false;
			}
		}
	});

	async function startScanning() {
		if (!QrScanner) {
			cameraError = 'QR Scanner library not loaded';
			return;
		}
		
		// Set scanning to true first to render the video element
		scanning = true;
		
		// Wait for DOM to update and element to be ready
		await tick();
		
		let attempts = 0;
		while (!videoElement && attempts < 10) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
		}
		
		if (!videoElement) {
			cameraError = 'Video element not ready';
			scanning = false; // Reset scanning state on error
			return;
		}

		try {
			cameraError = '';
			
			scanner = new QrScanner(
				videoElement,
				(result: any) => handleScanResult(result.data),
				{
					onDecodeError: (error: any) => {
						// Ignore decode errors - they're normal when no QR code is visible
					},
					highlightScanRegion: scannerConfig.highlightScanRegion ?? true,
					highlightCodeOutline: scannerConfig.highlightCodeOutline ?? true,
					preferredCamera: 'environment',
				}
			);

			await scanner.start();
			console.log('QR Scanner started successfully');
		} catch (error: any) {
			console.error('Error starting scanner:', error);
			cameraError = `Camera access denied or not available: ${error.message}`;
			scanning = false; // Reset scanning state on error
		}
	}

	function stopScanning() {
		if (scanner) {
			scanner.stop();
			scanner.destroy();
			scanner = null;
		}
		scanning = false;
	}

	async function handleScanResult(data: string) {
		const now = Date.now();
		
		// Prevent duplicate scans within 2 seconds
		if (data === lastScanResult && now - lastScanTime < 2000) {
			return;
		}

		lastScanResult = data;
		lastScanTime = now;
		
		// Add to scan history
		scanHistory = [data, ...scanHistory.slice(0, 9)]; // Keep last 10 scans
		
		console.log('QR Code scanned:', data);
		
		// Extract QR code from various formats
		let qrCode = data;
		
		// Check if it's a booking check-in code URL
		if (data.includes('/checkin/')) {
			const parts = data.split('/checkin/');
			if (parts.length > 1) {
				qrCode = parts[1].split('?')[0].split('#')[0]; // Remove query params and hash
			}
		}
		// If it's a QR code URL format
		else if (data.includes('/qr/')) {
			const parts = data.split('/qr/');
			if (parts.length > 1) {
				qrCode = parts[1].split('?')[0].split('#')[0];
			}
		}
		// If it's just a code (not a full URL)
		else if (/^[A-Za-z0-9]{6,12}$/.test(data)) {
			qrCode = data;
		}
		// If it's a different URL, handle it separately
		else if (data.startsWith('http')) {
			window.location.href = data;
			return;
		}

		// Call the scan API to track the scan
		try {
			await fetch(`/api/qr/${qrCode}/scan`, {
				method: 'POST'
			});
		} catch (error) {
			console.warn('Failed to track QR scan:', error);
			// Continue anyway
		}
		
		// Navigate to check-in page
		goto(`/checkin/${qrCode}`);
	}

	onDestroy(() => {
		stopScanning();
	});
</script>

<svelte:head>
	<title>QR Check-in Scanner</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="QR Code Scanner"
		subtitle="Scan QR codes to check in guests and access bookings"
	/>

	{#if data.loadError}
		<div class="mb-8">
			<ErrorAlert variant="warning" message={data.loadError} />
		</div>
	{/if}

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Scanner Section -->
		<div class="lg:col-span-2">
			{#if cameraError}
				<EmptyState
					icon={AlertCircle}
					title="Camera Error"
					description={cameraError}
					variant="error"
					actionText="Try Again"
					onAction={() => {
						cameraError = '';
						startScanning();
					}}
				/>
			{:else if isInitializing}
				<div class="rounded-xl p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<LoadingSpinner size="large" text="Initializing camera..." centered />
				</div>
			{:else if !scanning}
				<div class="rounded-xl p-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<EmptyState
						icon={Camera}
						title="Start QR Scanner"
						description="Click the button below to start scanning QR codes for guest check-ins"
						actionText="Start Camera"
						onAction={startScanning}
					/>
					
					<!-- Instructions for non-scanning state -->
					<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">How to use</h3>
						<ul class="space-y-2 text-sm" style="color: var(--text-secondary);">
							<li class="flex items-start gap-2">
								<span class="font-semibold">1.</span>
								<span>Click "Start Camera" to activate the QR scanner</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="font-semibold">2.</span>
								<span>Point your camera at a guest's QR code ticket</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="font-semibold">3.</span>
								<span>The system will automatically check them in</span>
							</li>
						</ul>
					</div>
				</div>
			{:else}
				<!-- Camera View -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
								<span class="text-sm font-medium" style="color: var(--text-primary);">Scanning active</span>
							</div>
							<button
								onclick={stopScanning}
								class="text-sm text-red-600 hover:text-red-700 font-medium"
							>
								Stop
							</button>
						</div>
					</div>
					
					<div class="relative">
						<video
							bind:this={videoElement}
							class="w-full aspect-[3/4] sm:aspect-square lg:aspect-[4/3] object-cover"
							autoplay
							playsinline
							muted
						></video>
						
						<!-- Scanning overlay -->
						<div class="absolute inset-0 pointer-events-none">
							<div class="absolute inset-4 border-2 border-white/50 rounded-lg"></div>
							<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
								<Scan class="h-8 w-8 text-white/70 animate-pulse" />
							</div>
						</div>
					</div>
					
					<div class="p-4" style="background: var(--bg-secondary); border-top: 1px solid var(--border-primary);">
						<p class="text-xs text-center" style="color: var(--text-secondary);">
							Position QR code within the frame to scan
						</p>
					</div>
				</div>

				<!-- Session Scans (when scanning) -->
				{#if scanHistory.length > 0}
					<div class="mt-6 rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Recent Scans</h3>
						<div class="grid gap-3">
							{#each scanHistory.slice(0, 3) as scan, i}
								<div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
									<QrCode class="h-4 w-4 flex-shrink-0" style="color: var(--text-tertiary);" />
									<span class="text-sm font-mono truncate flex-1" style="color: var(--text-primary);">{scan}</span>
									<span class="text-xs" style="color: var(--text-tertiary);">#{i + 1}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Recent QR Codes -->
			{#if recentQRCodes.length > 0}
				<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Your QR Codes</h3>
					<div class="space-y-3">
						{#each recentQRCodes.slice(0, 5) as qr}
							<div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
								<QrCode class="h-4 w-4 text-blue-500 flex-shrink-0" />
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium truncate" style="color: var(--text-primary);">
										{qr.tourName}
									</div>
									<div class="text-xs font-mono" style="color: var(--text-tertiary);">
										{qr.code}
									</div>
									{#if qr.category}
										{@const categoryDisplay = getCategoryDisplay(qr.category)}
										<div class="text-xs flex items-center gap-1" style="color: {categoryDisplay.color}">
											<span>{categoryDisplay.icon}</span>
											<span>{qr.category}</span>
										</div>
									{/if}
								</div>
								<div class="text-right">
									<div class="text-xs flex items-center gap-1" style="color: var(--text-tertiary);">
										<UserCheck class="h-3 w-3" />
										{qr.scans}
									</div>
									<div class="text-xs mt-1" style="color: var(--text-tertiary);">
										{new Date(qr.created).toLocaleDateString()}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}



			<!-- Session Scans (when not scanning, for mobile/fallback) -->
			{#if scanHistory.length > 0 && !scanning}
				<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Session Scans</h3>
					<div class="space-y-3">
						{#each scanHistory.slice(0, 5) as scan, i}
							<div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
								<QrCode class="h-4 w-4 flex-shrink-0" style="color: var(--text-tertiary);" />
								<span class="text-sm font-mono truncate flex-1" style="color: var(--text-primary);">{scan}</span>
								<span class="text-xs" style="color: var(--text-tertiary);">#{i + 1}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Hidden canvas for QR processing -->
<canvas bind:this={canvasElement} class="hidden"></canvas> 