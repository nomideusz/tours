<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { goto } from '$app/navigation';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	// @ts-ignore
	import jsPDF from 'jspdf';
	
	// Icons
	import Download from 'lucide-svelte/icons/download';
	import Printer from 'lucide-svelte/icons/printer';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import User from 'lucide-svelte/icons/user';
	
	// Components
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ColorSchemeSelector from '$lib/components/ColorSchemeSelector.svelte';
	import DesignSelector from '$lib/components/DesignSelector.svelte';

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
	let isLoading = $derived($profileQuery.isLoading);
	let error = $derived($profileQuery.error);
	let generatingPDF = $state(false);

	// Business card template selection
	let selectedTemplate = $state<'professional' | 'colorful' | 'minimal'>('professional');

	// Color scheme selection
	let selectedColorScheme = $state<'primary' | 'blue' | 'green' | 'purple' | 'orange'>('primary');

	const colorSchemes = {
		primary: {
			primary: 'var(--color-primary-600)',
			secondary: 'var(--color-primary-500)'
		},
		blue: {
			primary: '#2563EB',
			secondary: '#3B82F6'
		},
		green: {
			primary: '#10B981',
			secondary: '#34D399'
		},
		purple: {
			primary: '#8B5CF6',
			secondary: '#A78BFA'
		},
		orange: {
			primary: '#F59E0B',
			secondary: '#FBBF24'
		}
	};

	// Generate profile URL and QR code
	let profileURL = $derived(profile?.username ? `https://zaur.app/${profile.username}` : '');
	let qrCodeURL = $derived.by(() => {
		if (!profileURL) return '';
		
		// Get the primary color for the selected scheme
		const scheme = colorSchemes[selectedColorScheme as keyof typeof colorSchemes];
		let qrColor = scheme.primary;
		
		// Convert CSS variables to hex colors for QR generation
		if (qrColor.startsWith('var(')) {
			// Get the actual computed value of the CSS variable
			if (typeof window !== 'undefined') {
				const computedStyle = getComputedStyle(document.documentElement);
				const actualColor = computedStyle.getPropertyValue('--color-primary-600').trim();
				qrColor = actualColor || '#2563EB'; // Fallback if not found
			} else {
				qrColor = '#2563EB'; // Server-side fallback
			}
		}
		
		// Remove # from hex color for API
		qrColor = qrColor.replace('#', '');
		
		return generateQRImageURL(profileURL, { 
			size: 120, 
			color: qrColor,
			style: 'modern'
		});
	});

	async function printBusinessCard() {
		if (!profile?.username) {
			alert('Please complete your profile first');
			return;
		}

		generatingPDF = true;
		try {
			// Use the visible business card preview element instead of hidden one
			const cardElement = document.querySelector('.business-card-container .business-card');
			if (!cardElement) {
				console.error('Business card element not found');
				return;
			}

			// Ensure QR code image is fully loaded
			const qrImage = cardElement.querySelector('img');
			if (qrImage && !qrImage.complete) {
				await new Promise((resolve) => {
					qrImage.onload = resolve;
					qrImage.onerror = resolve; // Continue even if QR fails
					// Fallback timeout
					setTimeout(resolve, 1000);
				});
			}
			
			// Wait a small moment for any final rendering
			await new Promise(resolve => setTimeout(resolve, 100));

			// Generate high-resolution image of the business card
			const canvas = await (html2canvas as any)(cardElement, {
				backgroundColor: '#ffffff',
				scale: 3, // High resolution for print quality
				useCORS: true,
				allowTaint: true,
				width: 350,
				height: 200,
				logging: false,
				x: 0,
				y: 0,
				scrollX: 0,
				scrollY: 0
			});

			// Crop off the extra pixels to get clean edges
			const cropCanvas = document.createElement('canvas');
			const cropCtx = cropCanvas.getContext('2d');
			const cropX = selectedTemplate === 'minimal' ? 2 : 4;
			const cropY = 0;
			cropCanvas.width = canvas.width - cropX;
			cropCanvas.height = canvas.height - cropY;
			
			if (cropCtx) {
				cropCtx.drawImage(canvas, cropX, cropY, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);
			}

			// Convert canvas to blob first, then to data URL for better reliability
			const blob = await new Promise<Blob>((resolve, reject) => {
				cropCanvas.toBlob((blob) => {
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

			// Create PDF with multiple business cards arranged for printing
			const pdf = new jsPDF('portrait', 'mm', 'a4'); // A4 portrait
			
			// Business card dimensions in mm (standard business card: 3.5" x 2" = 89mm x 51mm)
			const cardWidth = 89;
			const cardHeight = 51;
			const margin = 10;
			const spacingX = 5;
			const spacingY = 5;
			
			// Calculate how many cards fit on a page
			const cardsPerRow = 2;
			const cardsPerColumn = 5;
			const totalCards = cardsPerRow * cardsPerColumn; // 10 cards per page
			
			// Calculate starting positions to center the grid
			const totalWidth = (cardsPerRow * cardWidth) + ((cardsPerRow - 1) * spacingX);
			const totalHeight = (cardsPerColumn * cardHeight) + ((cardsPerColumn - 1) * spacingY);
			const startX = (210 - totalWidth) / 2; // A4 width is 210mm
			const startY = (297 - totalHeight) / 2; // A4 height is 297mm
			
			// Add business cards to PDF
			for (let row = 0; row < cardsPerColumn; row++) {
				for (let col = 0; col < cardsPerRow; col++) {
					const x = startX + (col * (cardWidth + spacingX));
					const y = startY + (row * (cardHeight + spacingY));
					
					pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
				}
			}
			
			// Save the PDF
			pdf.save(`${profile.username}-business-cards-${selectedTemplate}-${selectedColorScheme}.pdf`);
		} catch (error) {
			console.error('Error generating business cards PDF:', error);
			// Show user-friendly error message
			alert('Failed to generate PDF. Please try again or refresh the page.');
		} finally {
			generatingPDF = false;
		}
	}

	async function downloadBusinessCard() {
		try {
			// Find the business card preview element
			const cardElement = document.querySelector('.business-card-container .business-card');
			if (!cardElement) {
				console.error('Business card element not found');
				return;
			}

			// Generate high-resolution canvas
			const canvas = await (html2canvas as any)(cardElement, {
				backgroundColor: '#ffffff', // Force white background
				scale: 3, // High resolution
				useCORS: true,
				allowTaint: true,
				width: 350, // Standard business card width in pixels
				height: 200, // Standard business card height in pixels
				logging: false,
				x: 0,
				y: 0,
				scrollX: 0,
				scrollY: 0
			});

			// Create download link
			canvas.toBlob((blob: Blob | null) => {
				if (!blob) return;
				
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${profile?.username || 'business'}-card-${selectedTemplate}-${selectedColorScheme}.png`;
				a.click();
				URL.revokeObjectURL(url);
			});
		} catch (error) {
			console.error('Error downloading business card:', error);
		}
	}
</script>

<svelte:head>
	<title>Business Cards - Marketing - Zaur</title>
	<meta name="description" content="Create professional business cards for your tour business" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<PageHeader title="Business Cards" />
	
	<MarketingNav />

	{#if isLoading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="text-center">
				<div class="w-12 h-12 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
				<p class="font-medium text-primary">Loading your data...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="professional-card text-center py-12">
			<AlertCircle class="w-12 h-12 mx-auto mb-4 text-danger" />
			<h3 class="text-lg font-semibold mb-2 text-primary">Unable to Load Data</h3>
			<p class="text-secondary">Please try refreshing the page or check your connection.</p>
		</div>
	{:else if profile}
		<div class="grid gap-6 lg:grid-cols-[300px_1fr]">
			<!-- Options Sidebar -->
			<div class="professional-card h-fit">
				<div class="p-4 border-b border-border">
					<h3 class="font-semibold text-primary">Design Options</h3>
				</div>
				<div class="p-4 space-y-6">
					<!-- Template Selection -->
					<DesignSelector 
						selectedDesign={selectedTemplate}
						designs={['professional', 'colorful', 'minimal']}
						onDesignChange={(design) => selectedTemplate = design as 'professional' | 'colorful' | 'minimal'}
						label="Template"
					/>
					
					<!-- Color Selection -->
					<ColorSchemeSelector 
						{selectedColorScheme}
						{colorSchemes}
						onColorSchemeChange={(scheme) => selectedColorScheme = scheme}
					/>
				</div>
			</div>

			<!-- Preview Area -->
			<div class="professional-card">
				<div class="p-4 border-b border-border flex items-center justify-between">
					<h3 class="font-semibold text-primary">Preview</h3>
					<div class="flex gap-2">
						<button
							onclick={printBusinessCard}
							class="button--secondary button--small button--gap"
							disabled={!profileURL || generatingPDF}
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
							onclick={downloadBusinessCard}
							class="button--primary button--small button--gap"
							disabled={!profileURL}
						>
							<Download class="w-4 h-4" />
							Download PNG
						</button>
					</div>
				</div>

					<!-- Business Card Preview -->
					<div class="p-4 sm:p-6">
						<div class="business-card-container mb-6 overflow-hidden">
							{#if selectedTemplate === 'professional'}
								<!-- Professional Template -->
								<div class="business-card business-card-professional w-full max-w-[300px] sm:max-w-[350px] h-[170px] sm:h-[200px] mx-auto relative overflow-hidden" style="background-color: #fafafa; border: 1px solid #e5e7eb;">
									<!-- Color accent on left side -->
									<div class="absolute left-0 top-0 bottom-0 w-1" style="background-color: {colorSchemes[selectedColorScheme].primary};"></div>
									
									<div class="absolute inset-0 p-3 sm:p-4 pl-4 sm:pl-5">
										<div class="flex h-full">
											<div class="flex-1">
												<div class="h-full flex flex-col justify-center">
													<h3 class="text-base sm:text-lg font-bold mb-1" style="color: #111827;">{profile.name}</h3>
													{#if profile.businessName}
														<p class="text-sm mb-3 uppercase tracking-wide" style="color: {colorSchemes[selectedColorScheme].primary}; font-size: 0.625rem; font-weight: 600;">{profile.businessName}</p>
													{/if}
													<div class="space-y-1 text-xs" style="color: #4B5563;">
														{#if profile.phone}
															<div>{profile.phone}</div>
														{/if}
														{#if profile.email}
															<div>{profile.email}</div>
														{/if}
														{#if profile.website}
															<div>{profile.website}</div>
														{/if}
													</div>
													
													<div class="text-xs mt-3 font-medium" style="color: #111827;">
														zaur.app/{profile.username}
													</div>
												</div>
											</div>
											
											<div class="flex items-center justify-center ml-3">
												{#if qrCodeURL}
													<div style="padding: 2px; background-color: {colorSchemes[selectedColorScheme].primary};">
														<img src={qrCodeURL} alt="Profile QR Code" class="w-10 h-10 sm:w-12 sm:h-12" style="background: white; padding: 0.125rem; display: block;" />
													</div>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{:else if selectedTemplate === 'colorful'}
								<!-- Colorful Template -->
								<div 
									class="business-card business-card-colorful color-{selectedColorScheme} w-full max-w-[300px] sm:max-w-[350px] h-[170px] sm:h-[200px] mx-auto shadow-lg relative overflow-hidden"
									style="background: linear-gradient(135deg, {colorSchemes[selectedColorScheme].primary}, {colorSchemes[selectedColorScheme].secondary});"
								>
									<div class="absolute inset-0 p-3 sm:p-4 text-white">
										<div class="flex h-full">
											<div class="flex-1 flex flex-col justify-between">
												<div>
													<h3 class="text-base sm:text-lg font-bold mb-1 text-white">{profile.name}</h3>
													{#if profile.businessName}
														<p class="text-sm opacity-90 mb-3">{profile.businessName}</p>
													{/if}
													<div class="space-y-1 text-xs text-white">
														{#if profile.phone}
															<div class="contact-item">{profile.phone}</div>
														{/if}
														{#if profile.email}
															<div class="contact-item">{profile.email}</div>
														{/if}
														{#if profile.website}
															<div class="contact-item">{profile.website}</div>
														{/if}
													</div>
												</div>
												
												<div class="text-xs opacity-90">
													zaur.app/{profile.username}
												</div>
											</div>
											
											<div class="flex flex-col justify-center items-center ml-3">
												{#if qrCodeURL}
													<img src={qrCodeURL} alt="Profile QR Code" class="w-10 h-10 sm:w-12 sm:h-12" style="background: white; padding: 0.125rem;" />
												{/if}
											</div>
										</div>
									</div>
								</div>
							{:else if selectedTemplate === 'minimal'}
								<!-- Minimal Template -->
								<div class="business-card business-card-minimal w-full max-w-[300px] sm:max-w-[350px] h-[170px] sm:h-[200px] mx-auto shadow-lg relative overflow-hidden" style="background-color: #ffffff;">
									<!-- Gradient accent bar -->
									<div class="absolute top-0 left-0 right-0 h-1" style="background: linear-gradient(90deg, {colorSchemes[selectedColorScheme].primary}, {colorSchemes[selectedColorScheme].secondary});"></div>
									
									<div class="absolute inset-0 p-3 sm:p-4 pt-4 sm:pt-5">
										<div class="flex h-full">
											<div class="flex-1">
												<div class="h-full flex flex-col justify-between">
													<div>
														<h3 class="text-base sm:text-lg font-bold mb-1" style="color: #111827;">{profile.name}</h3>
														{#if profile.businessName}
															<p class="text-sm mb-3 font-medium" style="color: {colorSchemes[selectedColorScheme].primary};">{profile.businessName}</p>
														{/if}
														<div class="space-y-1 text-xs" style="color: #4B5563;">
															{#if profile.phone}
																<div class="contact-item">{profile.phone}</div>
															{/if}
															{#if profile.email}
																<div class="contact-item">{profile.email}</div>
															{/if}
															{#if profile.website}
																<div class="contact-item">{profile.website}</div>
															{/if}
														</div>
													</div>
													
													<div class="text-xs font-medium" style="color: {colorSchemes[selectedColorScheme].primary};">
														zaur.app/{profile.username}
													</div>
												</div>
											</div>
											
											<div class="flex items-center justify-center ml-3">
												{#if qrCodeURL}
													<div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 0.125rem;">
														<img src={qrCodeURL} alt="Profile QR Code" class="w-10 h-10 sm:w-12 sm:h-12" style="background: white;" />
													</div>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
	{:else}
		<!-- No Profile State -->
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">Set up your profile to create professional business cards</p>
			<button onclick={() => goto('/profile')} class="button--primary">
				Complete Profile
			</button>
		</div>
	{/if}
</div>



<style>
	/* Ensure QR codes always have proper contrast */
	.business-card img {
		background: white !important;
	}
	
	/* Force light mode styles on business cards */
	.business-card-container {
		color-scheme: light;
	}
	
	.business-card {
		color-scheme: light;
	}
	
	/* Ensure professional template always has white text */
	.business-card-professional {
		color: white !important;
	}
	
	.business-card-professional * {
		color: inherit;
	}
	
	/* Contact information styling */
	.business-card .contact-item {
		font-size: 0.75rem !important;
		line-height: 1.3 !important;
		display: block !important;
	}
	
	/* QR Code styling */
	/* QR codes now have inline styles for better control */
	
	/* Professional template enhancements */
	.business-card-professional {
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}
	
	/* Colorful template enhancements */
	.business-card-colorful {
		background-size: 100% 100%;
	}
	
	/* Minimal template enhancements */
	.business-card-minimal {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
</style> 