<script lang="ts">
	import { onMount } from 'svelte';
	import type { Tour, QRCode } from '$lib/types.js';
	import { qrCodesApi, pb } from '$lib/pocketbase.js';
	import { goto } from '$app/navigation';
	
	interface Props {
		tour: Tour;
		onSuccess?: (qrCode: QRCode) => void;
	}
	
	let { tour, onSuccess }: Props = $props();
	
	// Form data
	let name = $state('');
	let category = $state<'digital' | 'print' | 'partner' | 'event' | 'promo'>('print');
	let customization = $state({
		color: '#000000',
		backgroundColor: '#FFFFFF',
		style: 'square' as 'square' | 'rounded' | 'dots',
		logoUrl: ''
	});
	
	// Category configuration
	const categories = [
		{ value: 'digital', label: 'Digital/Social', icon: '📱', color: '#3B82F6' },
		{ value: 'print', label: 'Print Materials', icon: '🖨️', color: '#10B981' },
		{ value: 'partner', label: 'Partner/Referral', icon: '🤝', color: '#F59E0B' },
		{ value: 'event', label: 'Special Events', icon: '🎉', color: '#8B5CF6' },
		{ value: 'promo', label: 'Limited Offers', icon: '🔥', color: '#EF4444' }
	] as const;
	
	// UI state
	let isGenerating = $state(false);
	let error = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);
	let generatedCode = $state<string | null>(null);
	
	// Generate unique code
	function generateUniqueCode(): string {
		const tourPrefix = tour.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
		const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
		return `${tourPrefix}-${randomSuffix}`;
	}
	
	// Generate QR code preview
	async function generatePreview() {
		try {
			error = null;
			generatedCode = generateUniqueCode();
			
			// Import qr-code-styling dynamically (client-side only)
			const QRCodeStylingModule = await import('qr-code-styling');
			const QRCodeStyling = QRCodeStylingModule.default || QRCodeStylingModule;
			
			const bookingUrl = `${window.location.origin}/book/${generatedCode}`;
			
			const options = {
				width: 300,
				height: 300,
				type: 'canvas' as const,
				data: bookingUrl,
				dotsOptions: {
					color: customization.color,
					type: customization.style === 'dots' ? 'dots' : customization.style === 'rounded' ? 'rounded' : 'square'
				},
				backgroundOptions: {
					color: customization.backgroundColor,
				},
				cornersSquareOptions: {
					type: customization.style === 'dots' ? 'dot' : customization.style === 'rounded' ? 'rounded' : 'square'
				},
				cornersDotOptions: {
					type: customization.style === 'dots' ? 'dot' : 'square'
				}
			};
			
			// Add image options only if logo URL is provided
			if (customization.logoUrl) {
				(options as any).image = customization.logoUrl;
				(options as any).imageOptions = {
					crossOrigin: 'anonymous',
					margin: 20
				};
			}
			
			const qrCode = new (QRCodeStyling as any)(options);
			
			// Create a container and append QR code to it
			const container = document.createElement('div');
			qrCode.append(container);
			
			// Get canvas from QR code - wait a bit for rendering
			setTimeout(async () => {
				try {
					const blob = await qrCode.getRawData('png');
					if (blob) {
						previewUrl = URL.createObjectURL(blob);
					}
				} catch (err) {
					console.error('Error getting QR code data:', err);
					// Fallback - try to get canvas directly
					const canvas = container.querySelector('canvas');
					if (canvas) {
						canvas.toBlob((blob) => {
							if (blob) {
								previewUrl = URL.createObjectURL(blob);
							}
						});
					}
				}
			}, 100);
		} catch (err) {
			console.error('Preview generation error:', err);
			// Fallback to simple QR code API
			try {
				const bookingUrl = encodeURIComponent(`${window.location.origin}/book/${generatedCode}`);
				const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${bookingUrl}&color=${customization.color.replace('#', '')}&bgcolor=${customization.backgroundColor.replace('#', '')}`;
				previewUrl = qrApiUrl;
			} catch (fallbackErr) {
				error = 'Failed to generate preview';
				console.error('Fallback QR generation error:', fallbackErr);
			}
		}
	}
	
	// Save QR code
	async function saveQRCode() {
		if (!name.trim()) {
			error = 'Please enter a name for this QR code';
			return;
		}
		
		if (!generatedCode) {
			error = 'Please generate a QR code first';
			return;
		}
		
		try {
			isGenerating = true;
			error = null;
			
			// Get current user ID
			const userId = pb?.authStore.record?.id;
			if (!userId) {
				error = 'User not authenticated';
				return;
			}
			
			const qrData: Partial<QRCode> = {
				tour: tour.id,
				user: userId,
				name: name.trim(),
				category: category,
				code: generatedCode,
				scans: 0,
				conversions: 0,
				isActive: true,
				customization: {
					color: customization.color,
					backgroundColor: customization.backgroundColor,
					style: customization.style,
					logo: customization.logoUrl || undefined
				}
			};
			
			const qrCode = await qrCodesApi.create(qrData);
			
			if (onSuccess) {
				onSuccess(qrCode);
			} else {
				goto(`/tours/${tour.id}/qr/${qrCode.id}`);
			}
		} catch (err) {
			error = 'Failed to save QR code. Please try again.';
			console.error('Save error:', err);
		} finally {
			isGenerating = false;
		}
	}
	
	// Download QR code in different formats
	async function downloadQR(format: 'png' | 'svg' | 'pdf') {
		if (!generatedCode) return;
		
		try {
			const QRCodeStylingModule = await import('qr-code-styling');
			const QRCodeStyling = QRCodeStylingModule.default || QRCodeStylingModule;
			const bookingUrl = `${window.location.origin}/book/${generatedCode}`;
			
			const options = {
				width: 1000,
				height: 1000,
				type: format === 'svg' ? 'svg' as const : 'canvas' as const,
				data: bookingUrl,
				dotsOptions: {
					color: customization.color,
					type: customization.style === 'dots' ? 'dots' : customization.style === 'rounded' ? 'rounded' : 'square'
				},
				backgroundOptions: {
					color: customization.backgroundColor,
				},
				cornersSquareOptions: {
					type: customization.style === 'dots' ? 'dot' : customization.style === 'rounded' ? 'rounded' : 'square'
				},
				cornersDotOptions: {
					type: customization.style === 'dots' ? 'dot' : 'square'
				}
			};
			
			// Add image options only if logo URL is provided
			if (customization.logoUrl) {
				(options as any).image = customization.logoUrl;
				(options as any).imageOptions = {
					crossOrigin: 'anonymous',
					margin: 20
				};
			}
			
			const qrCode = new (QRCodeStyling as any)(options);
			
			if (format === 'pdf') {
				// For PDF, we need to create a canvas first
				const canvas = document.createElement('canvas');
				canvas.width = 1000;
				canvas.height = 1000;
				await qrCode.append(canvas);
				
				// Convert to PDF (would need jsPDF library)
				alert('PDF export coming soon! Use PNG or SVG for now.');
			} else {
				qrCode.download({
					name: `qr-${generatedCode}`,
					extension: format
				});
			}
		} catch (err) {
			error = 'Failed to download QR code';
			console.error('Download error:', err);
		}
	}
	
	// Initialize with preview on mount
	onMount(() => {
		generatePreview();
	});
</script>

<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
	<div class="grid lg:grid-cols-2 gap-8">
		<!-- Preview Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">QR Code Preview</h3>
			
			<div class="bg-gray-50 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
				{#if previewUrl}
					<img src={previewUrl} alt="QR Code Preview" class="max-w-full h-auto rounded-lg shadow-sm" />
				{:else}
					<div class="text-center">
						<div class="form-spinner"></div>
						<p class="text-sm text-gray-500 mt-2">Generating preview...</p>
					</div>
				{/if}
			</div>
			
			{#if generatedCode}
				<div class="flex items-center gap-2 justify-center">
					<span class="text-sm text-gray-600">Code:</span>
					<code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{generatedCode}</code>
				</div>
			{/if}
			
			<div class="flex gap-2 justify-center">
				<button 
					onclick={() => downloadQR('png')} 
					class="button-secondary button--small"
					disabled={!previewUrl}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					PNG
				</button>
				<button 
					onclick={() => downloadQR('svg')} 
					class="button-secondary button--small"
					disabled={!previewUrl}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
					SVG
				</button>
				<button 
					onclick={() => downloadQR('pdf')} 
					class="button-secondary button--small"
					disabled={!previewUrl}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					PDF
				</button>
			</div>
		</div>
		
		<!-- Settings Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Customize Your QR Code</h3>
			
			{#if error}
				<div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}
			
			<form onsubmit={(e) => { e.preventDefault(); saveQRCode(); }} class="space-y-4">
				<!-- Name -->
				<div>
					<label for="qr-name" class="form-label">
						QR Code Name
						<span class="text-red-500">*</span>
					</label>
					<input
						id="qr-name"
						type="text"
						bind:value={name}
						placeholder="e.g., Flyer Campaign, Business Card"
						class="form-input"
						required
					/>
					<p class="mt-1 text-xs text-gray-500">
						Give this QR code a memorable name to track its performance
					</p>
				</div>
				
				<!-- Category -->
				<div>
					<label class="form-label">Category</label>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each categories as cat}
							<label class="relative flex items-center gap-2 px-3 py-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md min-h-[3.5rem] {
								category === cat.value 
									? 'border-blue-500 bg-blue-50' 
									: 'border-gray-200 hover:border-gray-300'
							}">
								<input
									type="radio"
									name="category"
									value={cat.value}
									bind:group={category}
									class="sr-only"
								/>
								<span class="text-lg flex-shrink-0">{cat.icon}</span>
								<span class="text-xs sm:text-sm font-medium leading-tight flex-1 pr-6 break-words">{cat.label}</span>
								{#if category === cat.value}
									<svg class="absolute top-2 right-2 w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
								{/if}
							</label>
						{/each}
					</div>
					<p class="mt-1 text-xs text-gray-500">
						Choose a category to organize and track your QR codes
					</p>
				</div>
				
				<!-- Style -->
				<div>
					<label for="style-square" class="form-label">Pattern Style</label>
					<div class="grid grid-cols-3 gap-3">
						<label class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
							<input
								id="style-square"
								type="radio"
								name="style"
								value="square"
								bind:group={customization.style}
								onchange={generatePreview}
								class="form-radio"
							/>
							<span>Square</span>
						</label>
						<label class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
							<input
								type="radio"
								name="style"
								value="rounded"
								bind:group={customization.style}
								onchange={generatePreview}
								class="form-radio"
							/>
							<span>Rounded</span>
						</label>
						<label class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
							<input
								type="radio"
								name="style"
								value="dots"
								bind:group={customization.style}
								onchange={generatePreview}
								class="form-radio"
							/>
							<span>Dots</span>
						</label>
					</div>
				</div>
				
				<!-- Colors -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="qr-color" class="form-label">Pattern Color</label>
						<div class="flex gap-2">
							<input
								id="qr-color"
								type="color"
								bind:value={customization.color}
								onchange={generatePreview}
								class="w-12 h-10 rounded border border-gray-300 cursor-pointer"
							/>
							<input
								type="text"
								bind:value={customization.color}
								onchange={generatePreview}
								class="form-input"
								placeholder="#000000"
							/>
						</div>
					</div>
					
					<div>
						<label for="qr-bg-color" class="form-label">Background Color</label>
						<div class="flex gap-2">
							<input
								id="qr-bg-color"
								type="color"
								bind:value={customization.backgroundColor}
								onchange={generatePreview}
								class="w-12 h-10 rounded border border-gray-300 cursor-pointer"
							/>
							<input
								type="text"
								bind:value={customization.backgroundColor}
								onchange={generatePreview}
								class="form-input"
								placeholder="#FFFFFF"
							/>
						</div>
					</div>
				</div>
				
				<!-- Logo URL (optional) -->
				<div>
					<label for="qr-logo" class="form-label">
						Logo URL <span class="text-gray-500">(optional)</span>
					</label>
					<input
						id="qr-logo"
						type="url"
						bind:value={customization.logoUrl}
						onchange={generatePreview}
						placeholder="https://example.com/logo.png"
						class="form-input"
					/>
					<p class="mt-1 text-xs text-gray-500">
						Add your logo to the center of the QR code
					</p>
				</div>
				
				<!-- Actions -->
				<div class="flex gap-3 pt-4">
					<button
						type="submit"
						disabled={isGenerating}
						class="button-primary button--gap flex-1"
					>
						{#if isGenerating}
							<div class="form-spinner"></div>
							Saving...
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Save QR Code
						{/if}
					</button>
					<button
						type="button"
						onclick={generatePreview}
						class="button-secondary"
					>
						Refresh Preview
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

 