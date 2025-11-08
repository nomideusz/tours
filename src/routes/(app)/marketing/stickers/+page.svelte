<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/layout/MobilePageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Printer from 'lucide-svelte/icons/printer';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import User from 'lucide-svelte/icons/user';
	import Sticker from 'lucide-svelte/icons/sticker';
	import Palette from 'lucide-svelte/icons/palette';
	import Type from 'lucide-svelte/icons/type';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	// @ts-ignore
	import jsPDF from 'jspdf';
	
	// Components
	import MarketingNav from '$lib/components/layout/MarketingNav.svelte';
	import ColorSchemeSelector from '$lib/components/form/inputs/ColorSchemeSelector.svelte';
	import DesignSelector from '$lib/components/form/inputs/DesignSelector.svelte';
	
	// Profile data query
	const profileQuery = createQuery({
		queryKey: ['profile'],
		queryFn: async () => {
			const response = await fetch('/api/profile');
			if (!response.ok) throw new Error('Failed to fetch profile');
			return response.json();
		},
		staleTime: 30000
	});
	
	let profile = $derived($profileQuery.data);
	
	let showCopied = $state(false);
	let generatingPDF = $state(false);
	let selectedDesign = $state<'professional' | 'colorful' | 'minimal'>('professional');
	let selectedColorScheme = $state<'primary' | 'blue' | 'green' | 'purple' | 'orange'>('primary');
	let customTagline = $state('');
	
	const colorSchemes = {
		primary: {
			primary: 'var(--color-primary-600)',
			secondary: 'var(--color-primary-500)',
			accent: '#f97316'
		},
		blue: {
			primary: '#2563EB',
			secondary: '#3B82F6',
			accent: '#1D4ED8'
		},
		green: {
			primary: '#10B981',
			secondary: '#34D399',
			accent: '#059669'
		},
		purple: {
			primary: '#8B5CF6',
			secondary: '#A78BFA',
			accent: '#7C3AED'
		},
		orange: {
			primary: '#F59E0B',
			secondary: '#FBBF24',
			accent: '#D97706'
		}
	};
	
	// Build the personalized URL
	let personalizedURL = $derived(profile?.username 
		? `https://zaur.app/${profile.username}?ref=sticker`
		: '');
	
	// Default taglines based on design
	let defaultTagline = $derived(selectedDesign === 'professional' 
		? 'Professional Tours'
		: selectedDesign === 'colorful'
		? 'Book Your Adventure'
		: 'Scan & Book');
	
	let tagline = $derived(customTagline || defaultTagline);
	
	// Generate QR code URL with appropriate colors
	let qrCodeURL = $derived.by(() => {
		if (!personalizedURL) return '';
		
		// Use black QR codes for better contrast on white/light backgrounds
		const qrColor = '000000';
		
		return generateQRImageURL(personalizedURL, { 
			size: 200, 
			color: qrColor,
			style: 'modern',
			margin: 1
		});
	});
	
	function copyURL() {
		if (personalizedURL) {
			navigator.clipboard.writeText(personalizedURL);
			showCopied = true;
			setTimeout(() => showCopied = false, 2000);
		}
	}
	
	async function printStickers() {
		if (!profile?.username || !browser) {
			alert('Please complete your profile first');
			return;
		}
		
		generatingPDF = true;
		try {
			// Get the stickers container
			const container = document.querySelector('.stickers-print-container');
			if (!container) {
				throw new Error('Stickers container not found');
			}
			
			// Show the container temporarily for capture
			container.classList.remove('hidden');
			
			// Ensure QR code images are loaded
			const qrImages = container.querySelectorAll('img');
			await Promise.all(Array.from(qrImages).map(img => {
				if (img.complete) return Promise.resolve();
				return new Promise((resolve) => {
					img.onload = () => resolve(null);
					img.onerror = () => resolve(null); // Continue even if QR fails
					setTimeout(() => resolve(null), 1000); // Fallback timeout
				});
			}));
			
			// Wait a moment for final rendering
			await new Promise(resolve => setTimeout(resolve, 200));
			
			// Generate canvas with high resolution
			const canvas = await (html2canvas as any)(container as HTMLElement, {
				backgroundColor: '#ffffff',
				scale: 3,
				useCORS: true,
				allowTaint: true,
				logging: false
			});
			
			// Hide the container again
			container.classList.add('hidden');
			
			// Convert canvas to blob first for better reliability
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((blob: Blob | null) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to create blob from canvas'));
					}
				}, 'image/png', 1.0);
			});

			// Validate blob size
			if (blob.size === 0) {
				throw new Error('Generated image is empty');
			}

			// Convert blob to data URL
			const imgData = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const result = reader.result as string;
					if (result && result.length > 0) {
						resolve(result);
					} else {
						reject(new Error('Failed to read image data'));
					}
				};
				reader.onerror = () => reject(new Error('FileReader error'));
				reader.readAsDataURL(blob);
			});

			// Validate image data
			if (!imgData.startsWith('data:image/png;base64,')) {
				throw new Error('Invalid image data format');
			}
			
			// Create PDF
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});
			
			// Calculate dimensions to fit A4 page
			const imgWidth = 210; // A4 width in mm
			const imgHeight = 297; // A4 height in mm
			
			// Add image to PDF
			pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
			
			// Download PDF
			pdf.save(`${profile.username}-stickers-${selectedDesign}-${selectedColorScheme}.pdf`);
		} catch (error) {
			console.error('Error generating stickers PDF:', error);
			alert('Failed to generate PDF. Please try again or refresh the page.');
		} finally {
			generatingPDF = false;
		}
	}

	async function downloadSticker() {
		if (!profile?.username || !browser) {
			alert('Please complete your profile first');
			return;
		}

		try {
			// Find the sticker preview element
			const stickerElement = document.querySelector('.sticker-preview');
			if (!stickerElement) {
				console.error('Sticker element not found');
				return;
			}

			// Ensure QR code image is fully loaded
			const qrImage = stickerElement.querySelector('img');
			if (qrImage && !qrImage.complete) {
				await new Promise((resolve) => {
					qrImage.onload = resolve;
					qrImage.onerror = resolve; // Continue even if QR fails
					setTimeout(resolve, 1000); // Fallback timeout
				});
			}

			// Wait a small moment for any final rendering
			await new Promise(resolve => setTimeout(resolve, 100));

			// Generate high-resolution image of the sticker
			const canvas = await (html2canvas as any)(stickerElement, {
				backgroundColor: '#ffffff',
				scale: 3, // High resolution
				useCORS: true,
				allowTaint: true,
				logging: false
			});

			// Download as PNG
			canvas.toBlob((blob: Blob | null) => {
				if (!blob) return;
				
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.download = `${profile.username}-sticker-${selectedDesign}-${selectedColorScheme}.png`;
				link.href = url;
				link.click();
				
				// Clean up
				setTimeout(() => URL.revokeObjectURL(url), 100);
			}, 'image/png');

		} catch (error) {
			console.error('Error downloading sticker:', error);
			alert('Failed to download image. Please try again.');
		}
	}
</script>

<svelte:head>
	<title>Promotional Stickers - Marketing - Zaur</title>
</svelte:head>

<div class="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile Header -->
	<MobilePageHeader
		title="Promotional Stickers"
		secondaryInfo={profile ? `${selectedDesign} • ${selectedColorScheme} • "${tagline.length > 20 ? tagline.substring(0, 17) + '...' : tagline}"` : 'Set up your profile first'}
		primaryAction={{
			label: "Download",
			icon: Download,
			onclick: downloadSticker,
			disabled: !personalizedURL,
			variant: "primary"
		}}
		quickActions={[
			{
				label: "PDF",
				icon: Printer,
				onclick: printStickers,
				disabled: !personalizedURL || generatingPDF,
				variant: "secondary"
			}
		]}
	/>
	
	<!-- Desktop Header -->
	<div class="hidden sm:block">
		<PageHeader title="Promotional Stickers" />
	</div>
	
	<MarketingNav />
	
	{#if $profileQuery.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if !profile?.username}
		<div class="professional-card max-w-md mx-auto text-center py-8">
			<User class="w-8 h-8 mx-auto mb-3 text-secondary" />
			<h2 class="text-lg font-semibold text-primary mb-2">Complete Profile First</h2>
			<p class="text-secondary mb-4">Set up your username to create stickers</p>
			<button onclick={() => goto('/profile')} class="button-primary">
				Complete Profile
			</button>
		</div>
	{:else}
		<div class="grid gap-4 lg:gap-6 lg:grid-cols-[300px_1fr]">
			<!-- Options Sidebar -->
			<div class="professional-card h-fit order-2 lg:order-1">
				<div class="p-3 sm:p-4 border-b border-border">
					<h3 class="font-semibold text-primary">Design Options</h3>
				</div>
				<div class="p-3 sm:p-4 space-y-4 lg:space-y-6">
					<!-- Design Selection -->
					<DesignSelector 
						selectedDesign={selectedDesign}
						designs={['professional', 'colorful', 'minimal']}
						onDesignChange={(design) => selectedDesign = design as 'professional' | 'colorful' | 'minimal'}
						label="Template"
					/>
					
					<!-- Color Selection -->
					<ColorSchemeSelector 
						{selectedColorScheme}
						{colorSchemes}
						onColorSchemeChange={(scheme) => selectedColorScheme = scheme}
					/>
					
					<!-- Tagline -->
					<div>
						<label for="tagline" class="text-sm font-medium text-primary mb-2 block">
							Custom Tagline
						</label>
						<input
							id="tagline"
							type="text"
							bind:value={customTagline}
							placeholder={defaultTagline}
							maxlength="30"
							class="form-input"
						/>
						<p class="text-xs text-secondary mt-1">Default: "{defaultTagline}"</p>
					</div>
				</div>
			</div>

			<!-- Preview Area -->
			<div class="professional-card order-1 lg:order-2">
				<!-- Desktop Header -->
				<div class="hidden sm:block p-4 border-b border-border">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold text-primary">Preview</h3>
						<div class="flex gap-2">
							<button
								onclick={printStickers}
								class="button-secondary button-small button-gap"
								disabled={!personalizedURL || generatingPDF}
							>
								{#if generatingPDF}
									<div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
									Generating...
								{:else}
									<Printer class="w-4 h-4" />
									Print PDF
								{/if}
							</button>
							<button
								onclick={downloadSticker}
								class="button-primary button-small button-gap"
								disabled={!personalizedURL}
							>
								<Download class="w-4 h-4" />
								Download PNG
							</button>
						</div>
					</div>
				</div>
				
				<!-- Mobile Header -->
				<div class="sm:hidden p-3 border-b border-border">
					<h3 class="font-semibold text-primary text-center">Preview</h3>
				</div>
				
				<div class="p-3 sm:p-4 lg:p-6 flex justify-center">
					<div 
						class="sticker-preview"
						style="
							{selectedDesign === 'professional' 
								? 'background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%); border: 2px solid #e5e7eb;'
								: selectedDesign === 'colorful' 
								? `background: linear-gradient(135deg, ${colorSchemes[selectedColorScheme].primary}, ${colorSchemes[selectedColorScheme].secondary});`
								: 'background: #ffffff; border: 2px solid #000000;'}
						"
					>
					<div class="sticker-content">
						<div 
							class="business-name"
							style="color: {selectedDesign === 'professional' || selectedDesign === 'minimal' ? '#1f2937' : '#ffffff'};"
						>
							{profile.businessName || profile.name}
						</div>
						<div 
							class="tagline"
							style="color: {selectedDesign === 'professional' ? '#6b7280' : selectedDesign === 'minimal' ? '#6b7280' : 'rgba(255, 255, 255, 0.9)'};"
						>
							{tagline}
						</div>
						<div class="qr-placeholder" style="
							{selectedDesign === 'professional' 
								? 'background: #ffffff; border: 1px solid #e5e7eb;'
								: selectedDesign === 'colorful' 
								? 'background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(255, 255, 255, 0.3);'
								: 'background: #f5f5f5; border: 1px solid #000000;'}
						">
							{#if qrCodeURL}
								<img src={qrCodeURL} alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
							{:else}
								<QrCode class="w-10 h-10" style="color: #374151;" />
							{/if}
						</div>
						<div 
							class="website-url"
							style="color: {selectedDesign === 'professional' ? colorSchemes[selectedColorScheme].accent : selectedDesign === 'minimal' ? '#000000' : '#ffffff'};"
						>
							zaur.app/{profile.username}
						</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Hidden Print Container -->
<div class="stickers-print-container hidden" style="position: absolute; left: -9999px; background: white;">
	<div class="print-page" style="width: 210mm; height: 297mm; padding: 15mm; background: white; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: 12mm;">
		{#each Array(6) as _, i}
			<div class="print-sticker print-sticker--{selectedDesign}" style="width: 80mm; height: 80mm; border-radius: 12mm; padding: 8mm; display: flex; flex-direction: column; justify-content: space-between; {selectedDesign === 'professional' ? 'background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%); border: 2px solid #e5e7eb;' : selectedDesign === 'colorful' ? `background: linear-gradient(135deg, ${colorSchemes[selectedColorScheme].primary}, ${colorSchemes[selectedColorScheme].secondary});` : 'background: #ffffff; border: 2px solid #000000;'}"
				>
				<div style="text-align: center;">
					<div style="font-size: 18pt; font-weight: 800; margin-bottom: 2mm; letter-spacing: -0.5pt; {selectedDesign === 'professional' ? 'color: #1f2937;' : selectedDesign === 'colorful' ? 'color: #ffffff;' : 'color: #000000;'}">{profile?.businessName || profile?.name}</div>
					<div style="font-size: 9pt; font-weight: 500; {selectedDesign === 'professional' ? 'color: #6b7280;' : selectedDesign === 'colorful' ? 'color: rgba(255, 255, 255, 0.9);' : 'color: #666666;'}">{tagline}</div>
				</div>
				
				<div style="display: flex; justify-content: center; align-items: center; margin: 6mm 0;">
					<div style="width: 25mm; height: 25mm; border-radius: 3mm; display: flex; align-items: center; justify-content: center; overflow: hidden; {selectedDesign === 'professional' ? 'background: #ffffff; border: 1px solid #e5e7eb;' : selectedDesign === 'colorful' ? 'background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(255, 255, 255, 0.3);' : 'background: #f5f5f5; border: 1px solid #000000;'}">
						{#if qrCodeURL}
							<img src={qrCodeURL} alt="QR Code" style="width: 95%; height: 95%; object-fit: contain;" />
						{/if}
					</div>
				</div>
				
				<div style="text-align: center;">
					<div style="font-size: 11pt; font-weight: 700; {selectedDesign === 'professional' ? `color: ${colorSchemes[selectedColorScheme].accent};` : selectedDesign === 'colorful' ? 'color: #ffffff;' : 'color: #000000;'}">zaur.app/{profile?.username}</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Ensure icon containers have proper colors */
	:global(.professional-icon svg) {
		color: white !important;
	}
	
	/* Ensure preview section has proper contrast */
	:global(.qr-placeholder svg) {
		color: #374151 !important;
	}
	
	/* Hidden print container */
	.hidden {
		display: none !important;
	}
	
	/* Print page styles */
	.print-page {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	/* Sticker preview styles */
	.sticker-preview {
		width: 180px;
		height: 180px;
		padding: 0.875rem;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	/* Responsive sticker preview */
	@media (min-width: 640px) {
		.sticker-preview {
			width: 200px;
			height: 200px;
			padding: 1rem;
		}
	}
	
	/* Sticker preview backgrounds are now handled with inline styles */
	
	.sticker-content {
		text-align: center;
	}
	
	.business-name {
		font-size: 0.875rem;
		font-weight: 800;
		margin-bottom: 0.25rem;
	}
	
	@media (min-width: 640px) {
		.business-name {
			font-size: 1.125rem;
		}
	}
	
	.tagline {
		font-size: 0.625rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
		/* Color handled with inline styles */
	}
	
	@media (min-width: 640px) {
		.tagline {
			font-size: 0.75rem;
			margin-bottom: 1rem;
		}
	}
	
	.qr-placeholder {
		width: 2.5rem;
		height: 2.5rem;
		margin: 1rem auto;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
	}
	
	/* QR placeholder and website URL colors are now handled with inline styles */
	
	.website-url {
		font-size: 0.875rem;
		font-weight: 700;
		/* Color handled with inline styles */
	}
</style> 