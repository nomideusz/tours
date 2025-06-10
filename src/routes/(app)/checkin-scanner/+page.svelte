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

	function resetScanner() {
		stopScanning();
		cameraError = '';
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

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="QR Scanner"
			secondaryInfo={scanning ? "Camera Active" : "Ready to Scan"}
			quickActions={[
				...(scanning ? [{
					label: 'Stop',
					icon: Square,
					onclick: stopScanning,
					variant: 'danger' as const
				}] : [{
					label: 'Start Camera',
					icon: Play,
					onclick: startScanning,
					variant: 'primary' as const
				}]),
				...(cameraError ? [{
					label: 'Reset',
					icon: RotateCcw,
					onclick: resetScanner,
					variant: 'secondary' as const
				}] : [])
			]}
			infoItems={[
				{
					icon: Camera,
					label: 'Status',
					value: scanning ? 'Scanning' : cameraError ? 'Error' : 'Ready'
				},
				{
					icon: Scan,
					label: 'Mode',
					value: 'Check-in Only'
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="QR Code Scanner"
				subtitle="Scan QR codes to check in guests"
			/>
		</div>
	</div>

	<!-- Scanner Card -->
	<div class="max-w-2xl mx-auto">
		<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary); background: var(--bg-secondary);">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
						<Camera class="w-5 h-5 text-white" />
					</div>
					<div>
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Guest Check-in Scanner</h2>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Point camera at guest QR codes</p>
					</div>
				</div>
			</div>
			
			<div class="p-4 sm:p-6">
				{#if cameraError}
					<div class="text-center py-8">
						<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle class="w-8 h-8 text-red-600" />
						</div>
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Camera Error</h3>
						<p class="text-sm mb-6" style="color: var(--text-secondary);">{cameraError}</p>
						<div class="flex gap-3 justify-center">
							<button onclick={resetScanner} class="button-secondary button--gap">
								<RotateCcw class="h-4 w-4" />
								Reset Scanner
							</button>
							<button onclick={startScanning} class="button-primary button--gap">
								<Camera class="h-4 w-4" />
								Try Again
							</button>
						</div>
					</div>
				{:else if isInitializing}
					<div class="text-center py-12">
						<LoadingSpinner size="large" text="Initializing camera..." centered />
					</div>
				{:else if !scanning}
					<div class="text-center py-8">
						<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Camera class="w-8 h-8 text-blue-600" />
						</div>
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Ready to Scan</h3>
						<p class="text-sm mb-6" style="color: var(--text-secondary);">Start the camera to scan guest QR codes for check-in</p>
						<button onclick={startScanning} class="button-primary button--gap">
							<Play class="h-4 w-4" />
							Start Camera
						</button>
					</div>
				{:else}
					<!-- Camera View -->
					<div class="relative">
						<video
							bind:this={videoElement}
							class="w-full aspect-square object-cover rounded-lg"
							autoplay
							playsinline
							muted
						></video>
						
						<!-- Scanning overlay -->
						<div class="absolute inset-0 pointer-events-none rounded-lg">
							<div class="absolute inset-8 border-2 border-white/50 rounded-lg"></div>
							<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
								<Scan class="h-8 w-8 text-white/70 animate-pulse" />
							</div>
						</div>
						
						<!-- Scanner status -->
						<div class="absolute top-4 left-4 right-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm">
									<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span class="text-white text-sm font-medium">Scanning</span>
								</div>
								<button
									onclick={stopScanning}
									class="px-3 py-2 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-sm font-medium hover:bg-red-600/90 transition-colors"
								>
									Stop
								</button>
							</div>
						</div>
					</div>
					
					<!-- Instructions below camera -->
					<div class="mt-4 p-4 rounded-lg text-center" style="background: var(--bg-secondary);">
						<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">Position QR code within the frame</p>
						<p class="text-xs" style="color: var(--text-secondary);">Scanner will automatically detect and process codes</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Tips Card -->
		{#if !scanning}
			<div class="mt-6 rounded-xl p-4 sm:p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Scanner Tips</h3>
				<div class="space-y-2 text-sm" style="color: var(--text-secondary);">
					<div class="flex items-start gap-2">
						<span class="font-semibold text-blue-600">•</span>
						<span>Hold your device steady and ensure good lighting</span>
					</div>
					<div class="flex items-start gap-2">
						<span class="font-semibold text-blue-600">•</span>
						<span>Position the QR code fully within the scanning frame</span>
					</div>
					<div class="flex items-start gap-2">
						<span class="font-semibold text-blue-600">•</span>
						<span>Scanner works with booking tickets and tour QR codes</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div> 