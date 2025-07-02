<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import Camera from 'lucide-svelte/icons/camera';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Scan from 'lucide-svelte/icons/scan';
	import type { PageData } from './$types.js';
	import QrScannerLib from 'qr-scanner';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import Search from 'lucide-svelte/icons/search';
	import { isValidTicketQRCode } from '$lib/ticket-qr.js';

	let { data }: { data: PageData } = $props();
	
	// QR Scanner state
	let videoElement: HTMLVideoElement | undefined = $state();

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

	function handleScan(data: string) {
		// Prevent rapid duplicate scans
		if (scanCooldown || data === lastScannedCode) return;
		
		console.log('QR Code scanned:', data);
		
		// Extract ticket code from various formats
		let ticketCode = data;
		
		// Check if it's a booking check-in code URL
		if (data.includes('/checkin/')) {
			const parts = data.split('/checkin/');
			if (parts.length > 1) {
				ticketCode = parts[1].split('?')[0].split('#')[0]; // Remove query params and hash
			}
		}
		// If it's a ticket URL (extract just the short code)
		else if (data.includes('/ticket/')) {
			const parts = data.split('/ticket/');
			if (parts.length > 1) {
				const fullCode = parts[1].split('?')[0].split('#')[0];
				// Extract short code from TKT-xxx-SHORTCODE format
				const codeParts = fullCode.split('-');
				if (codeParts.length === 3 && codeParts[0] === 'TKT') {
					ticketCode = codeParts[2]; // Just the short code
				} else {
					ticketCode = fullCode;
				}
			}
		}
		// If it's a QR code URL format
		else if (data.includes('/qr/')) {
			const parts = data.split('/qr/');
			if (parts.length > 1) {
				ticketCode = parts[1].split('?')[0].split('#')[0];
			}
		}
		// If it's just a code (not a full URL)
		else if (!data.startsWith('http')) {
			ticketCode = data;
		}
		// If it's a different URL, ignore it
		else {
			console.log('Ignoring non-ticket URL:', data);
			return;
		}
		
		// Validate the ticket code - either short code or full format
		if (!isValidShortCode(ticketCode) && !isValidTicketQRCode(ticketCode)) {
			console.log('Invalid ticket code:', ticketCode);
			return;
		}
		
		// Set cooldown to prevent rapid scans
		scanCooldown = true;
		lastScannedCode = data;
		
		// Resolve the code to ensure we have the full ticket code
		resolveAndNavigate(ticketCode);
		
		// Reset cooldown after 2 seconds
		setTimeout(() => {
			scanCooldown = false;
		}, 2000);
	}
	
	function isValidShortCode(code: string): boolean {
		// Short codes are typically 6 characters, alphanumeric
		return /^[A-Z0-9]{6}$/i.test(code);
	}
	
	async function resolveAndNavigate(code: string) {
		try {
			// If it's already a full ticket code, navigate directly
			if (code.startsWith('TKT-')) {
				goto(`/checkin/${code}`);
				return;
			}
			
			// Otherwise, resolve the short code
			const response = await fetch('/api/checkin/resolve-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code })
			});
			
			const result = await response.json();
			
			if (response.ok && result.ticketCode) {
				goto(`/checkin/${result.ticketCode}`);
			} else {
				console.error('Failed to resolve ticket code:', result.error);
				// Try navigating with the original code anyway
				goto(`/checkin/${code}`);
			}
		} catch (error) {
			console.error('Error resolving ticket code:', error);
			// Fallback: try navigating with the original code
			goto(`/checkin/${code}`);
		}
	}

	async function handleManualSubmit() {
		manualError = '';
		const code = manualCode.trim().toUpperCase(); // Normalize to uppercase
		
		if (!code) {
			manualError = 'Please enter a ticket code';
			return;
		}
		
		isSubmitting = true;
		
		try {
			// Try to resolve the code (handles both short and full formats)
			const response = await fetch('/api/checkin/resolve-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code })
			});
			
			const result = await response.json();
			
			if (response.ok && result.ticketCode) {
				// Navigate with the resolved full ticket code
				goto(`/checkin/${result.ticketCode}`);
			} else {
				isSubmitting = false;
				manualError = result.error || 'Invalid ticket code';
				
				// Show suggestion if available
				if (result.suggestion) {
					manualError += '. ' + result.suggestion;
				}
			}
		} catch (error) {
			console.error('Error resolving ticket code:', error);
			isSubmitting = false;
			manualError = 'Failed to validate ticket code. Please try again.';
		}
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
		<!-- Mode Toggle - Hidden on mobile since MobilePageHeader provides this -->
		<div class="hidden sm:block mb-6 text-center">
			<div class="p-1 rounded-lg inline-flex" style="background: var(--bg-secondary);">
				<button
				onclick={() => switchMode('camera')}
				class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 {scanMode === 'camera' ? 'shadow-sm' : ''}"
				style="{scanMode === 'camera' ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
				disabled={!hasCamera}
			>
				<QrCode class="w-4 h-4 inline mr-2" />
				Scanner
			</button>
			<button
				onclick={() => switchMode('manual')}
				class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 {scanMode === 'manual' ? 'shadow-sm' : ''}"
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
									placeholder="e.g., CB3577"
									class="form-input text-lg font-mono uppercase"
									class:error={manualError}
									disabled={isSubmitting}
									autocomplete="off"
									autocorrect="off"
									autocapitalize="characters"
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
							Ticket Code Format:
						</h3>
						<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
							<li>• Short code: <span class="font-mono font-medium">CB3577</span> (6 characters)</li>
							<li>• Full code: <span class="font-mono text-xs">TKT-mc9m9kgi-CB3577</span></li>
							<li>• Try the short code first, shown on the ticket</li>
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