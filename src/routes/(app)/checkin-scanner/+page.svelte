<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Camera from 'lucide-svelte/icons/camera';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Scan from 'lucide-svelte/icons/scan';
	import Play from 'lucide-svelte/icons/play';
	import Square from 'lucide-svelte/icons/square';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import type { PageData } from './$types.js';
	import QrScannerLib from 'qr-scanner';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import Search from 'lucide-svelte/icons/search';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { isValidTicketQRCode } from '$lib/ticket-qr.js';

	let { data }: { data: PageData } = $props();
	
	// QR Scanner types and state
	let videoElement: HTMLVideoElement | undefined = $state();
	let scanning = $state(false);
	let cameraError = $state('');
	let lastScanResult = $state('');
	let lastScanTime = $state(0);
	let isInitializing = $state(false);
	
	// Server data
	let scannerConfig = $state(data.scannerConfig || {});

	// Scanner instance
	let scanner: any = null;

	let scanMode: 'camera' | 'manual' = $state('camera');
	let qrScanner: any = null;
	let hasCamera = $state(true);
	let scannerStarted = $state(false);
	let lastScannedCode = '';
	let scanCooldown = false;
	let manualCode = $state('');
	let manualError = $state('');
	let isSubmitting = $state(false);

	onMount(async () => {
		if (scanMode === 'camera') {
			startScanner();
		}
	});

	async function startScanner() {
		if (!browser || !videoElement || scannerStarted || scanMode !== 'camera') return;
		
		try {
			// @ts-ignore - qr-scanner has complex type definitions
			qrScanner = new QrScannerLib(
				videoElement,
				(result: any) => handleScan(result.data),
				{
					returnDetailedScanResult: true,
					highlightScanRegion: true,
					highlightCodeOutline: true,
				}
			);
			
			await qrScanner.start();
			scannerStarted = true;
			hasCamera = true;
		} catch (error) {
			console.error('Failed to start QR scanner:', error);
			hasCamera = false;
			scanMode = 'manual'; // Auto-switch to manual if camera fails
		}
	}

	function stopScanner() {
		if (qrScanner) {
			qrScanner.stop();
			qrScanner.destroy();
			qrScanner = null;
			scannerStarted = false;
		}
	}

	function handleScan(code: string) {
		// Prevent rapid duplicate scans
		if (scanCooldown || code === lastScannedCode) return;
		
		// Validate the QR code format
		if (!isValidTicketQRCode(code)) {
			console.log('Invalid QR code format:', code);
			return;
		}
		
		// Set cooldown to prevent rapid scans
		scanCooldown = true;
		lastScannedCode = code;
		
		// Navigate to check-in page
		goto(`/checkin/${code}`);
		
		// Reset cooldown after 2 seconds
		setTimeout(() => {
			scanCooldown = false;
		}, 2000);
	}

	function handleManualSubmit() {
		manualError = '';
		const code = manualCode.trim();
		
		if (!code) {
			manualError = 'Please enter a ticket code';
			return;
		}
		
		if (!isValidTicketQRCode(code)) {
			manualError = 'Invalid ticket code format';
			return;
		}
		
		isSubmitting = true;
		goto(`/checkin/${code}`);
	}

	function switchMode(mode: 'camera' | 'manual') {
		scanMode = mode;
		manualError = '';
		
		if (mode === 'camera' && hasCamera) {
			// Start scanner when switching to camera mode
			setTimeout(() => startScanner(), 100);
		} else if (mode === 'manual') {
			// Stop scanner when switching to manual mode
			stopScanner();
		}
	}

	async function handleScanResult(data: string) {
		const now = Date.now();
		
		// Prevent duplicate scans within 2 seconds
		if (data === lastScanResult && now - lastScanTime < 2000) {
			return;
		}

		lastScanResult = data;
		lastScanTime = now;
		
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
		
		// Navigate to check-in page - now in same route group, can use goto()
		try {
			console.log('Navigating to check-in page:', `/checkin/${qrCode}`);
			
			// Now that check-in is in (app) group, we can use goto()
			await goto(`/checkin/${qrCode}`);
		} catch (navError) {
			console.error('Navigation error:', navError);
			// Fallback to direct navigation if goto() fails
			window.location.href = `/checkin/${qrCode}`;
		}
	}

	onDestroy(() => {
		stopScanner();
	});
</script>

<svelte:head>
	<title>Check-in Scanner - Zaur</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
	<!-- Mobile Header -->
	<MobilePageHeader
		title="Check-in Scanner"
		secondaryInfo={scanMode === 'camera' ? 'Camera Mode' : 'Manual Entry'}
		quickActions={[
			{
				label: scanMode === 'camera' ? 'Manual' : 'Scanner',
				icon: scanMode === 'camera' ? Keyboard : QrCode,
				onclick: () => switchMode(scanMode === 'camera' ? 'manual' : 'camera'),
				variant: 'secondary' as const
			}
		]}
		infoItems={[
			{
				icon: scanMode === 'camera' ? Camera : Keyboard,
				label: 'Mode',
				value: scanMode === 'camera' ? 'QR Scanner' : 'Manual Entry'
			},
			{
				icon: Scan,
				label: 'Function',
				value: 'Check-in'
			}
		]}
	/>

	<!-- Desktop Header -->
	<div class="hidden sm:block mb-8">
		<PageHeader 
			title="Check-in Scanner"
			subtitle="Scan or enter ticket codes to check in customers"
		/>
	</div>

	<div class="max-w-2xl mx-auto">
		<!-- Mode Toggle -->
		<div class="mb-4 sm:mb-6 text-center">
			<div class="p-1 rounded-lg inline-flex" style="background: var(--bg-secondary);">
				<button
				onclick={() => switchMode('camera')}
				class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all duration-200 {scanMode === 'camera' ? 'shadow-sm' : ''}"
				style="{scanMode === 'camera' ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
				disabled={!hasCamera}
			>
				<QrCode class="w-4 h-4 inline mr-2" />
				Scanner
			</button>
			<button
				onclick={() => switchMode('manual')}
				class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all duration-200 {scanMode === 'manual' ? 'shadow-sm' : ''}"
				style="{scanMode === 'manual' ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
			>
				<Keyboard class="w-4 h-4 inline mr-2" />
				Manual
			</button>
			</div>
		</div>

		{#if scanMode === 'camera'}
			<!-- QR Scanner Card -->
			<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 sm:p-6">
					{#if hasCamera}
						<div class="relative aspect-square sm:aspect-[4/3] md:aspect-square max-w-md mx-auto rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
							<video
								bind:this={videoElement}
								class="w-full h-full object-cover"
								style="transform: scaleX(-1);"
								muted
							></video>
							
							{#if scannerStarted}
								<div class="absolute inset-0 pointer-events-none">
									<div class="absolute inset-0 flex items-center justify-center p-4">
										<div class="scanner-frame w-36 h-36 xs:w-48 xs:h-48 sm:w-64 sm:h-64 rounded-lg"></div>
									</div>
									<div class="absolute bottom-2 sm:bottom-4 left-0 right-0 text-center">
										<p class="scanner-hint text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-2 rounded-full inline-block">
											Position QR code within the frame
										</p>
									</div>
								</div>
							{/if}
						</div>
						
						<p class="text-xs sm:text-sm text-center mt-3 sm:mt-4" style="color: var(--text-secondary);">
							Scanner will automatically detect ticket QR codes
						</p>
					{:else}
						<div class="text-center py-12">
							<div class="status-icon-wrapper status-pending mx-auto mb-4" style="width: 4rem; height: 4rem;">
								<AlertCircle class="w-8 h-8" />
							</div>
							<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Camera Not Available</h3>
							<p class="text-sm mb-4" style="color: var(--text-secondary);">
								Please check camera permissions or use manual entry
							</p>
							<button onclick={() => switchMode('manual')} class="button-primary button--gap">
								<Keyboard class="w-4 h-4" />
								Switch to Manual Entry
							</button>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Manual Entry Card -->
			<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6">
					
					<form onsubmit={(e) => { e.preventDefault(); handleManualSubmit(); }}>
						<div class="space-y-4">
							<div>
								<label for="ticket-code" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
									Ticket Code
								</label>
								<input
									id="ticket-code"
									type="text"
									bind:value={manualCode}
									placeholder="e.g., TKT-ABC123-XYZ"
									class="form-input text-lg font-mono"
									class:error={manualError}
									disabled={isSubmitting}
									autocomplete="off"
									autocorrect="off"
									autocapitalize="off"
									spellcheck="false"
								/>
								{#if manualError}
									<p class="form-error mt-1">{manualError}</p>
								{/if}
							</div>
							
							<button
								type="submit"
								disabled={isSubmitting || !manualCode.trim()}
								class="w-full button-primary button--gap justify-center"
							>
								{#if isSubmitting}
									<div class="form-spinner"></div>
									Checking...
								{:else}
									<Search class="w-5 h-5" />
									Check Ticket
								{/if}
							</button>
						</div>
					</form>
					
					<div class="mt-6 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-medium mb-2" style="color: var(--text-primary);">
							Where to find the ticket code:
						</h3>
						<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
							<li>• In the booking confirmation email</li>
							<li>• Below the QR code on printed tickets</li>
							<li>• In the booking details in your app</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Scanner-specific styles */
	.scanner-frame {
		border: 2px solid var(--color-primary-400);
	}
	
	[data-theme="dark"] .scanner-frame {
		border-color: var(--color-primary-500);
	}
	
	.scanner-hint {
		background: rgba(0, 0, 0, 0.7);
		color: rgba(255, 255, 255, 1);
	}
	
	[data-theme="dark"] .scanner-hint {
		background: rgba(0, 0, 0, 0.9);
		color: rgba(255, 255, 255, 1);
	}

	/* Fix QR scanner sizing issue */
	:global(.qr-scanner-region-box-container) {
		max-width: 100%;
		z-index: var(--z-10);
	}
	
	/* Extra small breakpoint for very narrow devices */
	@media (min-width: 400px) {
		.xs\:w-48 { width: 12rem; }
		.xs\:h-48 { height: 12rem; }
	}
</style> 