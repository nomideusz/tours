<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Camera from 'lucide-svelte/icons/camera';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	// Get tour ID from URL params (optional)
	let tourId = $page.url.searchParams.get('tour');
	
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let isScanning = $state(false);
	let error = $state<string | null>(null);
	let manualCode = $state('');
	let showManualInput = $state(false);

	async function startScanning() {
		try {
			error = null;
			isScanning = true;

			// Request camera access
			stream = await navigator.mediaDevices.getUserMedia({
				video: { 
					facingMode: 'environment', // Use back camera on mobile
					width: { ideal: 720 },
					height: { ideal: 720 }
				}
			});

			if (videoElement) {
				videoElement.srcObject = stream;
				videoElement.play();
			}

			// Start scanning for QR codes
			scanForQRCode();
		} catch (err) {
			console.error('Error accessing camera:', err);
			error = 'Unable to access camera. Please check permissions and try again.';
			isScanning = false;
		}
	}

	function stopScanning() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		isScanning = false;
	}

	function scanForQRCode() {
		if (!isScanning || !videoElement || !canvasElement) return;

		const context = canvasElement.getContext('2d');
		if (!context) return;

		// Draw video frame to canvas
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;
		context.drawImage(videoElement, 0, 0);

		// Try to read QR code from canvas
		try {
			const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
			// Note: In a real implementation, you'd use a QR code reading library like jsQR
			// For now, we'll rely on manual input
		} catch (err) {
			console.error('Error reading QR code:', err);
		}

		// Continue scanning
		if (isScanning) {
			requestAnimationFrame(scanForQRCode);
		}
	}

	function handleManualSubmit(event: Event) {
		event.preventDefault();
		
		if (!manualCode.trim()) {
			error = 'Please enter a ticket code';
			return;
		}

		// Validate ticket code format (starts with TKT-)
		if (!manualCode.startsWith('TKT-')) {
			error = 'Invalid ticket code format. Should start with TKT-';
			return;
		}

		// Redirect to checkin page
		goto(`/checkin/${manualCode.trim()}`);
	}

	onMount(() => {
		return () => {
			stopScanning();
		};
	});
</script>

<svelte:head>
	<title>QR Check-in Scanner</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-lg mx-auto">
		<!-- Header -->
		<div class="bg-white shadow-sm border-b border-gray-200">
			<div class="px-6 py-4">
				<div class="flex items-center gap-4">
					<button
						onclick={() => tourId ? goto(`/tours/${tourId}`) : goto('/tours')}
						class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
						aria-label="Back"
					>
						<ArrowLeft class="h-5 w-5 text-gray-600" />
					</button>
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
							<UserCheck class="w-6 h-6 text-white" />
						</div>
						<div>
							<h1 class="text-xl font-bold text-gray-900">Check-in Scanner</h1>
							<p class="text-sm text-gray-600">Scan customer tickets</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Scanner Interface -->
		<div class="p-6">
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

			<!-- Camera Scanner -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
				<div class="p-6 text-center">
					<div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<QrCode class="w-8 h-8 text-indigo-600" />
					</div>
					
					{#if !isScanning}
						<h3 class="text-lg font-semibold text-gray-900 mb-2">QR Code Scanner</h3>
						<p class="text-gray-600 mb-6">
							Scan customer ticket QR codes for quick check-in
						</p>
						
						<button
							onclick={startScanning}
							class="button-primary button--gap button--small mb-4"
						>
							<Camera class="w-4 h-4" />
							Start Camera Scanner
						</button>
						
						<p class="text-xs text-gray-500">
							Allow camera access when prompted
						</p>
					{:else}
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Scanning for QR Codes</h3>
						<p class="text-gray-600 mb-4">
							Point your camera at the customer's ticket QR code
						</p>
						
						<!-- Video preview -->
						<div class="relative w-full max-w-xs mx-auto mb-4">
							<video
								bind:this={videoElement}
								class="w-full h-auto rounded-lg bg-gray-100"
								playsinline
								muted
							></video>
							<canvas bind:this={canvasElement} class="hidden"></canvas>
							
							<!-- Scanning overlay -->
							<div class="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none">
								<div class="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-indigo-500"></div>
								<div class="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-indigo-500"></div>
								<div class="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-indigo-500"></div>
								<div class="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-indigo-500"></div>
							</div>
						</div>
						
						<button
							onclick={stopScanning}
							class="button-secondary button--small"
						>
							Stop Scanner
						</button>
					{/if}
				</div>
			</div>

			<!-- Manual Input Alternative -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<button
					onclick={() => showManualInput = !showManualInput}
					class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
				>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-sm font-semibold text-gray-900">Manual Entry</h3>
							<p class="text-xs text-gray-600">Enter ticket code manually</p>
						</div>
						<div class="text-gray-400">
							{showManualInput ? '−' : '+'}
						</div>
					</div>
				</button>
				
				{#if showManualInput}
					<div class="px-6 pb-6 border-t border-gray-200">
						<form onsubmit={handleManualSubmit} class="space-y-4">
							<div>
								<label for="ticketCode" class="block text-sm font-medium text-gray-700 mb-2">
									Ticket Code
								</label>
								<input
									id="ticketCode"
									type="text"
									bind:value={manualCode}
									placeholder="TKT-..."
									class="form-input"
									autocomplete="off"
									autocapitalize="none"
								/>
								<p class="mt-1 text-xs text-gray-500">
									Enter the ticket code shown on the customer's ticket
								</p>
							</div>
							
							<button
								type="submit"
								class="button-primary button--gap button--small w-full"
							>
								<UserCheck class="w-4 h-4" />
								Check In Customer
							</button>
						</form>
					</div>
				{/if}
			</div>

			<!-- Help Text -->
			<div class="mt-6 p-4 bg-blue-50 rounded-lg">
				<h4 class="text-sm font-medium text-blue-900 mb-2">How to use:</h4>
				<ul class="text-sm text-blue-800 space-y-1">
					<li>• Ask customer to show their ticket QR code</li>
					<li>• Use camera scanner to scan the code automatically</li>
					<li>• Or manually enter the ticket code (TKT-...)</li>
					<li>• You'll be redirected to the check-in page</li>
				</ul>
			</div>
		</div>
	</div>
</div> 