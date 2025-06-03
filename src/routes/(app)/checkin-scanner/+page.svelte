<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
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

	// Get tour ID from URL params (optional)
	let tourId = $page.url.searchParams.get('tour');
	
	// QR Scanner types and state
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let scanning = $state(false);
	let cameraError = $state('');
	let lastScanResult = $state('');
	let lastScanTime = $state(0);
	let scanHistory = $state<string[]>([]);
	let isInitializing = $state(false);

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
		if (!QrScanner || !videoElement) {
			cameraError = 'QR Scanner not ready';
			return;
		}

		try {
			isInitializing = true;
			cameraError = '';
			
			scanner = new QrScanner(
				videoElement,
				(result: any) => handleScanResult(result.data),
				{
					onDecodeError: (error: any) => {
						// Ignore decode errors - they're normal when no QR code is visible
					},
					highlightScanRegion: true,
					highlightCodeOutline: true,
				}
			);

			await scanner.start();
			scanning = true;
			console.log('QR Scanner started successfully');
		} catch (error: any) {
			console.error('Error starting scanner:', error);
			cameraError = `Camera access denied or not available: ${error.message}`;
		} finally {
			isInitializing = false;
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

	function handleScanResult(data: string) {
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
		
		// Check if it's a booking check-in code
		if (data.includes('/checkin/')) {
			// Extract the code from the URL
			const parts = data.split('/checkin/');
			if (parts.length > 1) {
				const code = parts[1].split('?')[0].split('#')[0]; // Remove query params and hash
				goto(`/checkin/${code}`);
				return;
			}
		}
		
		// If it's just a code (not a full URL), try to navigate to checkin
		if (/^[A-Za-z0-9]{6,12}$/.test(data)) {
			goto(`/checkin/${data}`);
			return;
		}
		
		// Otherwise, it might be a different URL - navigate to it
		if (data.startsWith('http')) {
			window.location.href = data;
		}
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

	<div class="max-w-lg mx-auto">
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
			<div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
				<LoadingSpinner size="large" text="Initializing camera..." centered />
			</div>
		{:else if !scanning}
			<EmptyState
				icon={Camera}
				title="Start QR Scanner"
				description="Click the button below to start scanning QR codes for guest check-ins"
				actionText="Start Camera"
				onAction={startScanning}
			/>
		{:else}
			<!-- Camera View -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="p-4 bg-gray-50 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
							<span class="text-sm font-medium text-gray-700">Scanning active</span>
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
						class="w-full aspect-square object-cover"
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
				
				<div class="p-4 bg-gray-50 border-t border-gray-200">
					<p class="text-xs text-gray-600 text-center">
						Position QR code within the frame to scan
					</p>
				</div>
			</div>
		{/if}

		<!-- Recent Scans -->
		{#if scanHistory.length > 0}
			<div class="mt-8 bg-white rounded-xl border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
				<div class="space-y-3">
					{#each scanHistory.slice(0, 5) as scan, i}
						<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
							<QrCode class="h-4 w-4 text-gray-400 flex-shrink-0" />
							<span class="text-sm text-gray-700 font-mono truncate flex-1">{scan}</span>
							<span class="text-xs text-gray-500">#{i + 1}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Instructions -->
		<div class="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
			<h3 class="text-lg font-semibold text-blue-900 mb-3">How to use</h3>
			<ul class="space-y-2 text-sm text-blue-800">
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
</div>

<!-- Hidden canvas for QR processing -->
<canvas bind:this={canvasElement} class="hidden"></canvas> 