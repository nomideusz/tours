<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { page } from '$app/stores';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	
	// Icons
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Download from 'lucide-svelte/icons/download';
	import Printer from 'lucide-svelte/icons/printer';
	import FileText from 'lucide-svelte/icons/file-text';
	import Palette from 'lucide-svelte/icons/palette';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import Phone from 'lucide-svelte/icons/phone';
	import Mail from 'lucide-svelte/icons/mail';
	import ExternalLink from 'lucide-svelte/icons/external-link';

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

	// Tours data query for statistics
	const toursQuery = createQuery({
		queryKey: ['userTours'],
		queryFn: async () => {
			const response = await fetch('/api/tours');
			if (!response.ok) throw new Error('Failed to fetch tours');
			return response.json();
		},
		staleTime: 30000
	});

	// Reactive data
	let profile = $derived($profileQuery.data || null);
	let tours = $derived($toursQuery.data || []);
	let isLoading = $derived($profileQuery.isLoading || $toursQuery.isLoading);
	let error = $derived($profileQuery.error || $toursQuery.error);

	// Business card template selection
	let selectedTemplate = $state('professional');
	let selectedColorScheme = $state<'primary' | 'blue' | 'green' | 'purple' | 'orange'>('primary');

	// Color schemes
	const colorSchemes: Record<string, { primary: string; secondary: string; accent: string; text: string }> = {
		primary: {
			primary: 'var(--color-primary-600)',
			secondary: 'var(--color-primary-700)',
			accent: 'var(--color-primary-500)',
			text: 'var(--text-primary)'
		},
		blue: {
			primary: '#3B82F6',
			secondary: '#1E40AF',
			accent: '#60A5FA',
			text: '#1F2937'
		},
		green: {
			primary: '#10B981',
			secondary: '#047857',
			accent: '#34D399',
			text: '#1F2937'
		},
		purple: {
			primary: '#8B5CF6',
			secondary: '#7C3AED',
			accent: '#A78BFA',
			text: '#1F2937'
		},
		orange: {
			primary: '#F59E0B',
			secondary: '#D97706',
			accent: '#FCD34D',
			text: '#1F2937'
		}
	};

	// Generate profile URL and QR code
	let profileURL = $derived(profile?.username ? `${$page.url.origin}/${profile.username}` : '');
	let qrCodeURL = $derived.by(() => {
		if (!profileURL) return '';
		
		// Get the primary color for the selected scheme
		const scheme = colorSchemes[selectedColorScheme];
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
			size: 200, 
			color: qrColor,
			style: 'modern'
		});
	});

	// Featured tours (top 3)
	let featuredTours = $derived(tours.slice(0, 3));

	async function printBusinessCard() {
		try {
			// Find the business card preview element
			const cardElement = document.querySelector('.business-card-container .business-card');
			if (!cardElement) {
				console.error('Business card element not found');
				return;
			}

					// Generate high-resolution PNG for printing (300 DPI equivalent)
		const rawCanvas = await (html2canvas as any)(cardElement, {
			backgroundColor: null,
			scale: 4, // Very high resolution for print quality
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

		// Crop off the extra pixels (preserve borders for modern template)
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const cropX = selectedTemplate === 'modern' ? 2 : 4;
		const cropY = 0; // No vertical cropping
		const cropHeight = 0; // No vertical cropping
		canvas.width = rawCanvas.width - cropX;
		canvas.height = rawCanvas.height - cropHeight;
		
		if (ctx) {
			ctx.drawImage(rawCanvas, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		}

			// Open the image in a new window for printing
			canvas.toBlob((blob: Blob | null) => {
				if (!blob) return;
				
				const url = URL.createObjectURL(blob);
				const printWindow = window.open('', '_blank');
				
				if (printWindow) {
					// Create HTML with landscape orientation and centered image
					printWindow.document.write(`
						<!DOCTYPE html>
						<html>
						<head>
							<title>Business Card - Print</title>
							<style>
								@page {
									size: A4 landscape;
									margin: 1in;
								}
								body {
									margin: 0;
									padding: 0;
									display: flex;
									justify-content: center;
									align-items: center;
									min-height: 100vh;
									background: white;
								}
								img {
									width: 3.5in;
									height: 2in;
									display: block;
									object-fit: contain;
								}
							</style>
						</head>
						<body>
							<img src="${url}" alt="Business Card" />
						</body>
						</html>
					`);
					
					printWindow.document.close();
					
					printWindow.onload = () => {
						setTimeout(() => {
							printWindow.print();
							// Clean up after printing
							setTimeout(() => {
								printWindow.close();
								URL.revokeObjectURL(url);
							}, 1000);
						}, 500);
					};
				}
			}, 'image/png');
		} catch (error) {
			console.error('Error preparing business card for print:', error);
			// Fallback to regular print if image generation fails
			window.print();
		}
	}

	async function downloadImage() {
		try {
			// Find the business card preview element
			const cardElement = document.querySelector('.business-card-container .business-card');
			if (!cardElement) {
				console.error('Business card element not found');
				return;
			}

					// Capture the element as canvas
		const rawCanvas = await (html2canvas as any)(cardElement, {
			backgroundColor: null,
			scale: 2, // Higher resolution
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

		// Crop off the extra pixels (preserve borders for modern template)
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const cropX = selectedTemplate === 'modern' ? 1 : 2;
		const cropY = 0; // No vertical cropping
		const cropHeight = 0; // No vertical cropping
		canvas.width = rawCanvas.width - cropX;
		canvas.height = rawCanvas.height - cropHeight;
		
		if (ctx) {
			ctx.drawImage(rawCanvas, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		}

			// Convert to blob and download
			canvas.toBlob((blob: Blob | null) => {
				if (!blob) return;
				
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `business-card-${selectedTemplate}-${selectedColorScheme}.png`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			}, 'image/png');
		} catch (error) {
			console.error('Error downloading business card:', error);
		}
	}
</script>

<svelte:head>
	<title>Marketing Materials - Zaur</title>
	<meta name="description" content="Create professional marketing materials for your tour business" />

</svelte:head>

<div class="page-content max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: var(--color-primary-50);">
				<Sparkles class="w-5 h-5" style="color: var(--color-primary-600);" />
			</div>
			<h1 class="text-2xl font-bold" style="color: var(--text-primary);">Marketing Materials</h1>
		</div>
		<p class="text-lg" style="color: var(--text-secondary);">
			Create professional marketing materials to promote your tours
		</p>
	</div>

	{#if isLoading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="text-center">
				<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
				<p class="font-medium" style="color: var(--text-primary);">Loading your data...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="rounded-xl p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<AlertCircle class="w-12 h-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
			<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Unable to Load Data</h3>
			<p style="color: var(--text-secondary);">Please try refreshing the page or check your connection.</p>
		</div>
	{:else if profile}
		<div class="grid gap-6 lg:gap-8 lg:grid-cols-3">
			<!-- Business Card Generator -->
			<div class="lg:col-span-2 min-w-0">
				<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
						<div class="flex items-center gap-3 mb-4">
							<CreditCard class="w-5 h-5" style="color: var(--color-primary-600);" />
							<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Business Card Generator</h2>
						</div>
						
						<!-- Template & Color Selection -->
						<div class="grid gap-4 sm:grid-cols-2 min-w-0">
							<div>
								<p class="block text-sm font-medium mb-2" style="color: var(--text-primary);">Template</p>
								<div class="grid grid-cols-3 gap-2">
									<button
										onclick={() => selectedTemplate = 'professional'}
										class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
										style="background: {selectedTemplate === 'professional' ? 'var(--color-primary-600)' : 'var(--bg-secondary)'}; color: {selectedTemplate === 'professional' ? 'white' : 'var(--text-primary)'}; border: 1px solid {selectedTemplate === 'professional' ? 'var(--color-primary-600)' : 'var(--border-primary)'};"
									>
										Professional
									</button>
									<button
										onclick={() => selectedTemplate = 'modern'}
										class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
										style="background: {selectedTemplate === 'modern' ? 'var(--color-primary-600)' : 'var(--bg-secondary)'}; color: {selectedTemplate === 'modern' ? 'white' : 'var(--text-primary)'}; border: 1px solid {selectedTemplate === 'modern' ? 'var(--color-primary-600)' : 'var(--border-primary)'};"
									>
										Modern
									</button>
									<button
										onclick={() => selectedTemplate = 'minimal'}
										class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
										style="background: {selectedTemplate === 'minimal' ? 'var(--color-primary-600)' : 'var(--bg-secondary)'}; color: {selectedTemplate === 'minimal' ? 'white' : 'var(--text-primary)'}; border: 1px solid {selectedTemplate === 'minimal' ? 'var(--color-primary-600)' : 'var(--border-primary)'};"
									>
										Minimal
									</button>
								</div>
							</div>
							<div>
								<p class="block text-sm font-medium mb-2" style="color: var(--text-primary);">Color Scheme</p>
								<div class="flex gap-2 flex-wrap">
									{#each Object.keys(colorSchemes) as scheme}
										<button
											onclick={() => selectedColorScheme = scheme as 'primary' | 'blue' | 'green' | 'purple' | 'orange'}
											class="w-8 h-8 rounded-full border-2"
											style="background: {colorSchemes[scheme].primary}; border-color: {selectedColorScheme === scheme ? 'var(--color-primary-600)' : 'var(--border-primary)'};"
											title={scheme === 'primary' ? 'Theme Color' : scheme}
											aria-label="Select {scheme === 'primary' ? 'theme' : scheme} color scheme"
										></button>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<!-- Business Card Preview -->
					<div class="p-4 sm:p-6">
						<div class="business-card-container mb-6 overflow-hidden">
							{#if selectedTemplate === 'professional'}
								<!-- Professional Template -->
								<div 
									class="business-card business-card-professional color-{selectedColorScheme} w-full max-w-[280px] sm:max-w-[350px] h-[160px] sm:h-[200px] mx-auto rounded-lg shadow-lg relative overflow-hidden"
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
													<div class="space-y-1 text-xs">
														{#if profile.phone}
															<div class="flex items-center gap-2">
																<Phone class="w-3 h-3" />
																<span>{profile.phone}</span>
															</div>
														{/if}
														<div class="flex items-center gap-2">
															<Mail class="w-3 h-3" />
															<span>{profile.email}</span>
														</div>
														{#if profile.website}
															<div class="flex items-center gap-2">
																<Globe class="w-3 h-3" />
																<span>{profile.website.replace(/^https?:\/\//, '')}</span>
															</div>
														{/if}
														{#if profile.location}
															<div class="flex items-center gap-2">
																<MapPin class="w-3 h-3" />
																<span>{profile.location}</span>
															</div>
														{/if}
													</div>
												</div>
												<div class="text-xs opacity-90">
													<span>{tours.length} Tour{tours.length === 1 ? '' : 's'} Available</span>
												</div>
											</div>
											<div class="w-12 sm:w-16 flex flex-col items-center justify-center">
												{#if qrCodeURL}
													<div class="qr-container w-10 h-10 sm:w-14 sm:h-14 bg-white p-1 rounded" style="background: white !important;">
														<img src={qrCodeURL} alt="Profile QR Code" class="w-full h-full" style="background: white !important;" />
													</div>
													<p class="text-xs mt-1 text-center">Scan to Book</p>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{:else if selectedTemplate === 'modern'}
								<!-- Modern Template -->
								<div 
									class="business-card business-card-modern w-full max-w-[280px] sm:max-w-[350px] h-[160px] sm:h-[200px] mx-auto rounded-lg shadow-lg relative overflow-hidden"
									style="background: white !important; border-left: 6px solid {colorSchemes[selectedColorScheme].primary};"
								>
									<div class="absolute inset-0 p-3 sm:p-4">
										<div class="flex h-full">
											<div class="flex-1">
												<div class="mb-4">
													<h3 class="text-lg sm:text-xl font-bold mb-1" style="color: {colorSchemes[selectedColorScheme].primary};">{profile.name}</h3>
													{#if profile.businessName}
														<p class="text-sm font-medium mb-2" style="color: {colorSchemes[selectedColorScheme].secondary};">{profile.businessName}</p>
													{/if}
													<div class="h-px" style="background: {colorSchemes[selectedColorScheme].accent};"></div>
												</div>
																					<div class="space-y-1 text-xs" style="color: #1F2937;">
										{#if profile.phone}
											<div>{profile.phone}</div>
										{/if}
										<div>{profile.email}</div>
										{#if profile.website}
											<div>{profile.website.replace(/^https?:\/\//, '')}</div>
										{/if}
										{#if profile.location}
											<div>{profile.location}</div>
										{/if}
									</div>
											</div>
											<div class="w-16 sm:w-20 flex flex-col items-center justify-center">
												{#if qrCodeURL}
													<div class="qr-container w-12 h-12 sm:w-16 sm:h-16 p-1 rounded-lg" style="background: {colorSchemes[selectedColorScheme].primary};">
														<img src={qrCodeURL} alt="Profile QR Code" class="w-full h-full bg-white rounded" style="background: white !important;" />
													</div>
													<p class="text-xs mt-2 text-center font-medium" style="color: {colorSchemes[selectedColorScheme].primary};">SCAN</p>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{:else if selectedTemplate === 'minimal'}
								<!-- Minimal Template -->
								<div 
									class="business-card business-card-minimal w-full max-w-[280px] sm:max-w-[350px] h-[160px] sm:h-[200px] mx-auto rounded-lg shadow-lg relative overflow-hidden bg-white"
									style="background: white !important;"
								>
									<div class="absolute inset-0 p-4 sm:p-6">
										<div class="flex h-full items-center">
											<div class="flex-1">
												<h3 class="text-xl sm:text-2xl font-light mb-2" style="color: #1F2937;">{profile.name}</h3>
												{#if profile.businessName}
													<p class="text-sm font-normal mb-4 opacity-70" style="color: #1F2937;">{profile.businessName}</p>
												{/if}
												<div class="space-y-1 text-xs font-light" style="color: #1F2937;">
													<div>{profile.email}</div>
													{#if profile.phone}
														<div>{profile.phone}</div>
													{/if}
													{#if profile.location}
														<div>{profile.location}</div>
													{/if}
												</div>
											</div>
											<div class="ml-4 sm:ml-6">
												{#if qrCodeURL}
													<div class="qr-container w-10 h-10 sm:w-12 sm:h-12" style="background: white !important; border-radius: 4px; padding: 2px;">
														<img src={qrCodeURL} alt="Profile QR Code" class="w-full h-full" style="background: white !important;" />
													</div>
												{/if}
											</div>
										</div>
										<!-- Minimal accent line -->
										<div 
											class="absolute bottom-0 left-0 right-0 h-1"
											style="background: {colorSchemes[selectedColorScheme].primary};"
										></div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Print Actions -->
						<div class="flex flex-col sm:flex-row gap-3 justify-center">
							<button onclick={printBusinessCard} class="button-primary button--gap">
								<Printer class="w-4 h-4" />
								Print Card
							</button>
							<button onclick={downloadImage} class="button--secondary button--gap">
								<Download class="w-4 h-4" />
								Download Image
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Sidebar - Marketing Tools -->
			<div class="space-y-6 min-w-0">
				<!-- Profile Summary -->
				<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">Your Profile</h3>
					</div>
					<div class="p-4 space-y-3">
						<div class="flex items-center gap-3">
							{#if profile.avatar}
								<img src={profile.avatar} alt={profile.name} class="w-10 h-10 rounded-full" />
							{:else}
								<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
									<User class="w-5 h-5" style="color: var(--text-tertiary);" />
								</div>
							{/if}
							<div>
								<p class="font-medium" style="color: var(--text-primary);">{profile.name}</p>
								<p class="text-sm" style="color: var(--text-secondary);">@{profile.username}</p>
							</div>
						</div>
						
						{#if profileURL}
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
								<p class="text-xs font-medium mb-1" style="color: var(--text-tertiary);">Booking Page</p>
								<a 
									href={profileURL} 
									target="_blank"
									class="text-sm hover-link flex items-center gap-1"
									style="color: var(--color-primary-600);"
								>
									{profileURL.replace('https://', '')}
									<ExternalLink class="w-3 h-3" />
								</a>
							</div>
						{/if}
					</div>
				</div>

				<!-- Quick Stats -->
				<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">Quick Stats</h3>
					</div>
					<div class="p-4 space-y-3">
						<div class="flex justify-between">
							<span class="text-sm" style="color: var(--text-secondary);">Active Tours</span>
							<span class="font-medium" style="color: var(--text-primary);">{tours.length}</span>
						</div>
						{#if featuredTours.length > 0}
							<div>
								<p class="text-xs font-medium mb-2" style="color: var(--text-tertiary);">Featured Tours</p>
								<div class="space-y-1">
									{#each featuredTours as tour}
										<p class="text-xs" style="color: var(--text-secondary);">• {tour.name}</p>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Coming Soon -->
				<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">Coming Soon</h3>
					</div>
					<div class="p-4 space-y-3">
						<div class="flex items-center gap-3 opacity-60">
							<FileText class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span class="text-sm" style="color: var(--text-secondary);">Tour Flyers</span>
						</div>
						<div class="flex items-center gap-3 opacity-60">
							<Palette class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span class="text-sm" style="color: var(--text-secondary);">Social Media Graphics</span>
						</div>
						<div class="flex items-center gap-3 opacity-60">
							<QrCode class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span class="text-sm" style="color: var(--text-secondary);">Custom QR Materials</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div> 



<style>
	/* Ensure QR codes always have proper contrast */
	.qr-container {
		background: white !important;
	}
	.qr-container img {
		background: white !important;
	}
	
	/* Force minimal and modern cards to always be white */
	.business-card-minimal,
	.business-card-modern {
		background: white !important;
	}

	

	

</style>