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
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import Phone from 'lucide-svelte/icons/phone';
	import Mail from 'lucide-svelte/icons/mail';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	
	// Components
	import Tooltip from '$lib/components/Tooltip.svelte';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

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

	let profile = $derived($profileQuery.data);
	let tours = $derived($toursQuery.data?.tours || []);
	let isLoading = $derived($profileQuery.isLoading || $toursQuery.isLoading);
	let error = $derived($profileQuery.error || $toursQuery.error);

	// Business card template selection
	let selectedTemplate = $state<'professional' | 'modern' | 'minimal'>('professional');

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
							<script>
								window.onload = () => {
									setTimeout(() => {
										window.print();
									}, 1000);
								};
							<\/script>
						</body>
						</html>
					`);
					printWindow.document.close();
				}
			});
		} catch (error) {
			console.error('Error preparing business card for print:', error);
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
				backgroundColor: null,
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

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
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
		<div class="grid gap-6 lg:gap-8 lg:grid-cols-3">
			<!-- Business Card Generator -->
			<div class="lg:col-span-2 min-w-0">
				<div class="professional-card">
					<div class="p-4 sm:p-6 border-b border-border">
						<div class="flex items-center gap-3 mb-4">
							<CreditCard class="w-5 h-5 text-primary" />
							<h2 class="text-xl font-semibold text-primary">Business Card Generator</h2>
						</div>
						
						<!-- Template & Color Selection -->
						<div class="grid gap-4 sm:grid-cols-2 min-w-0">
							<div>
								<p class="block text-sm font-medium mb-2 text-primary">Template</p>
								<div class="grid grid-cols-3 gap-2">
									<button
										onclick={() => selectedTemplate = 'professional'}
										class="px-3 py-2 rounded-lg text-sm font-medium transition-colors border {selectedTemplate === 'professional' ? 'bg-primary text-white border-primary' : 'bg-bg-secondary text-primary border-border'}"
									>
										Professional
									</button>
									<button
										onclick={() => selectedTemplate = 'modern'}
										class="px-3 py-2 rounded-lg text-sm font-medium transition-colors border {selectedTemplate === 'modern' ? 'bg-primary text-white border-primary' : 'bg-bg-secondary text-primary border-border'}"
									>
										Modern
									</button>
									<button
										onclick={() => selectedTemplate = 'minimal'}
										class="px-3 py-2 rounded-lg text-sm font-medium transition-colors border {selectedTemplate === 'minimal' ? 'bg-primary text-white border-primary' : 'bg-bg-secondary text-primary border-border'}"
									>
										Minimal
									</button>
								</div>
							</div>
							<div>
								<p class="block text-sm font-medium mb-2 text-primary">Color Scheme</p>
								<div class="flex gap-2 flex-wrap">
									{#each Object.keys(colorSchemes) as scheme}
										<Tooltip text={scheme === 'primary' ? 'Theme Color' : scheme.charAt(0).toUpperCase() + scheme.slice(1)} position="bottom">
											<button
												onclick={() => selectedColorScheme = scheme as 'primary' | 'blue' | 'green' | 'purple' | 'orange'}
												class="w-8 h-8 rounded-full border-2 {selectedColorScheme === scheme ? 'border-primary' : 'border-border'}"
												style="background: {colorSchemes[scheme as keyof typeof colorSchemes].primary};"
												aria-label="Select {scheme === 'primary' ? 'theme' : scheme} color scheme"
											></button>
										</Tooltip>
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
														{#if profile.email}
															<div class="flex items-center gap-2">
																<Mail class="w-3 h-3" />
																<span>{profile.email}</span>
															</div>
														{/if}
														{#if profile.website}
															<div class="flex items-center gap-2">
																<Globe class="w-3 h-3" />
																<span>{profile.website}</span>
															</div>
														{/if}
													</div>
												</div>
												
												<div class="text-xs opacity-90">
													zaur.app/{profile.username}
												</div>
											</div>
											
											<div class="flex flex-col justify-center items-center ml-3">
												{#if qrCodeURL}
													<img src={qrCodeURL} alt="Profile QR Code" class="w-full h-full" style="background: white !important;" />
												{/if}
											</div>
										</div>
									</div>
								</div>
							{:else if selectedTemplate === 'modern'}
								<!-- Modern Template -->
								<div class="business-card business-card-modern w-full max-w-[280px] sm:max-w-[350px] h-[160px] sm:h-[200px] mx-auto rounded-xl shadow-lg bg-white relative overflow-hidden">
									<div class="absolute inset-0 p-3 sm:p-4">
										<div class="flex h-full">
											<div class="flex-1">
												<div class="h-full flex flex-col justify-between">
													<div>
														<h3 class="text-base sm:text-lg font-bold mb-1" style="color: {colorSchemes[selectedColorScheme].primary};">{profile.name}</h3>
														{#if profile.businessName}
															<p class="text-sm text-gray-600 mb-3">{profile.businessName}</p>
														{/if}
														<div class="space-y-1 text-xs text-gray-700">
															{#if profile.phone}
																<div class="flex items-center gap-2">
																	<Phone class="w-3 h-3" style="color: {colorSchemes[selectedColorScheme].primary};" />
																	<span>{profile.phone}</span>
																</div>
															{/if}
															{#if profile.email}
																<div class="flex items-center gap-2">
																	<Mail class="w-3 h-3" style="color: {colorSchemes[selectedColorScheme].primary};" />
																	<span>{profile.email}</span>
																</div>
															{/if}
															{#if profile.website}
																<div class="flex items-center gap-2">
																	<Globe class="w-3 h-3" style="color: {colorSchemes[selectedColorScheme].primary};" />
																	<span>{profile.website}</span>
																</div>
															{/if}
														</div>
													</div>
													
													<div class="text-xs" style="color: {colorSchemes[selectedColorScheme].primary};">
														zaur.app/{profile.username}
													</div>
												</div>
											</div>
											
											<div class="w-16 sm:w-20 h-16 sm:h-20 ml-3 flex items-center justify-center">
												{#if qrCodeURL}
													<img src={qrCodeURL} alt="Profile QR Code" class="w-full h-full bg-white rounded" style="background: white !important;" />
												{/if}
											</div>
										</div>
									</div>
								</div>
							{:else if selectedTemplate === 'minimal'}
								<!-- Minimal Template -->
								<div class="business-card business-card-minimal w-full max-w-[280px] sm:max-w-[350px] h-[160px] sm:h-[200px] mx-auto border-2 bg-white relative overflow-hidden" style="border-color: {colorSchemes[selectedColorScheme].primary};">
									<div class="absolute inset-0 p-3 sm:p-4">
										<div class="flex h-full">
											<div class="flex-1">
												<div class="h-full flex flex-col justify-center">
													<h3 class="text-base sm:text-lg font-bold mb-1 text-gray-900">{profile.name}</h3>
													{#if profile.businessName}
														<p class="text-sm text-gray-600 mb-4">{profile.businessName}</p>
													{/if}
													<div class="space-y-1 text-xs text-gray-700">
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
													
													<div class="text-xs mt-3" style="color: {colorSchemes[selectedColorScheme].primary};">
														zaur.app/{profile.username}
													</div>
												</div>
											</div>
											
											<div class="w-16 sm:w-20 h-16 sm:h-20 ml-3 flex items-center justify-center">
												{#if qrCodeURL}
													<img src={qrCodeURL} alt="Profile QR Code" class="w-full h-full" style="background: white !important;" />
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex flex-col sm:flex-row gap-3">
							<button onclick={printBusinessCard} class="button button--primary flex items-center justify-center gap-2">
								<Printer class="w-4 h-4" />
								Print Card
							</button>
							<button onclick={downloadBusinessCard} class="button button--secondary flex items-center justify-center gap-2">
								<Download class="w-4 h-4" />
								Download PNG
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Information Panel -->
			<div class="space-y-6">
				<!-- Profile Stats -->
				{#if featuredTours.length > 0}
					<div class="professional-card">
						<div class="p-4 border-b border-border">
							<h3 class="font-semibold text-primary">Featured Tours</h3>
						</div>
						<div class="p-4 space-y-3">
							{#each featuredTours as tour}
								<div class="flex items-center justify-between">
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium text-primary truncate">{tour.name}</p>
										<p class="text-xs text-secondary">{formatTourOwnerCurrency(tour.price, tour.currency)}</p>
									</div>
									<div class="ml-2 text-xs text-secondary">
										{tour.capacity} max
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- No Profile State -->
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">Set up your profile to create professional business cards</p>
			<a href="/profile" class="button button--primary">
				Complete Profile
			</a>
		</div>
	{/if}
</div>

<style>
	/* Ensure QR codes always have proper contrast */
	.business-card img {
		background: white !important;
	}
</style> 