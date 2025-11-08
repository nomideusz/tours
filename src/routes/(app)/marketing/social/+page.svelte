<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Image from 'lucide-svelte/icons/image';
	import User from 'lucide-svelte/icons/user';
	import Instagram from 'lucide-svelte/icons/instagram';
	import Facebook from 'lucide-svelte/icons/facebook';
	import Twitter from 'lucide-svelte/icons/twitter';
	import Linkedin from 'lucide-svelte/icons/linkedin';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import FileType from 'lucide-svelte/icons/file-type';
	import Palette from 'lucide-svelte/icons/palette';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	
	// Components
	import ColorSchemeSelector from '$lib/components/form/inputs/ColorSchemeSelector.svelte';
	
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
	
	// Tours data query
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
	let tours = $derived($toursQuery.data || []);
	let activeTours = $derived(tours.filter((tour: any) => tour.status === 'active'));
	
	let generating = $state(false);
	let selectedPlatform = $state<'instagram-post' | 'instagram-story' | 'facebook' | 'twitter' | 'linkedin'>('instagram-post');
	let selectedTemplate = $state<'tour-promo' | 'profile-intro' | 'schedule'>('tour-promo');
	let selectedTourId = $state<string>('');
	let customText = $state('');
	let includeQR = $state(true);
	let selectedColorScheme = $state<'primary' | 'blue' | 'green' | 'purple' | 'orange'>('primary');
	
	let selectedTour = $derived(
		selectedTourId ? tours.find((t: any) => t.id === selectedTourId) : activeTours[0]
	);
	
	// Auto-select first active tour when tours load
	$effect(() => {
		if (activeTours.length > 0 && !selectedTourId) {
			selectedTourId = activeTours[0].id;
		}
	});
	
	// Platform dimensions
	const platformDimensions = {
		'instagram-post': { width: 1080, height: 1080 },
		'instagram-story': { width: 1080, height: 1920 },
		'facebook': { width: 1200, height: 630 },
		'twitter': { width: 1200, height: 675 },
		'linkedin': { width: 1200, height: 627 }
	};
	
	let dimensions = $derived(platformDimensions[selectedPlatform]);
	
	// Generate QR code
	let qrCodeURL = $derived.by(() => {
		if (!profile?.username || !includeQR) return '';
		const url = `https://zaur.app/${profile.username}`;
		return generateQRImageURL(url, { 
			size: 300, // Increased for better quality
			color: '1f2937',
			style: 'modern'
		});
	});
	
	// Unified color schemes (matching business cards and stickers)
	const colorSchemes = {
		primary: {
			primary: '#EF5C48',
			secondary: '#F37A6A',
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
	
	let colorScheme = $derived(colorSchemes[selectedColorScheme]);
	
	// Generate display colors from the color scheme for social media graphics
	let displayColors = $derived({
		background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
		text: '#FFFFFF',
		accent: colorScheme.accent
	});
	
	// Check if current platform is landscape format
	let isLandscape = $derived(selectedPlatform === 'facebook' || selectedPlatform === 'twitter' || selectedPlatform === 'linkedin');
	
	async function generateGraphic() {
		if (!profile?.username || !browser) {
			alert('Please complete your profile first');
			return;
		}
		
		if (selectedTemplate === 'tour-promo' && !selectedTour) {
			alert('Please select a tour or create one first');
			return;
		}
		
		generating = true;
		try {
			// Get the graphic container
			const container = document.querySelector('.social-graphic-container') as HTMLElement;
			if (!container) {
				throw new Error('Graphic container not found');
			}
			
			// Show the container temporarily for capture
			container.classList.remove('hidden');
			container.style.opacity = '1';
			container.style.visibility = 'visible';
			
			// Ensure QR code images are loaded
			const qrImages = container.querySelectorAll('img');
			await Promise.all(Array.from(qrImages).map(img => {
				if (img.complete) return Promise.resolve();
				return new Promise((resolve) => {
					img.onload = () => resolve(null);
					img.onerror = () => resolve(null); // Continue even if QR fails
					setTimeout(() => resolve(null), 2000); // Fallback timeout
				});
			}));
			
			// Wait for final rendering
			await new Promise(resolve => setTimeout(resolve, 200));
			
			// Generate high-resolution canvas
			const canvas = await (html2canvas as any)(container, {
				backgroundColor: null, // Transparent to preserve gradient backgrounds
				scale: 3, // High resolution for quality
				useCORS: true,
				allowTaint: true,
				logging: false,
				width: dimensions.width,
				height: dimensions.height,
				x: 0,
				y: 0,
				scrollX: 0,
				scrollY: 0
			});
			
			// Hide the container again
			container.classList.add('hidden');
			container.style.opacity = '0';
			container.style.visibility = 'hidden';
			
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
			
			// Download the image
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${profile.username}-${selectedPlatform}-${selectedTemplate}-${selectedColorScheme}-${new Date().toISOString().split('T')[0]}.png`;
			a.click();
			URL.revokeObjectURL(url);
			
		} catch (error) {
			console.error('Error generating social media graphic:', error);
			alert('Failed to generate graphic. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Social Media Graphics - Marketing - Zaur</title>
</svelte:head>

<div class="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile Header -->
	<MobilePageHeader
		title="Social Graphics"
		secondaryInfo={profile ? `${selectedPlatform} • ${selectedTemplate.replace('-', ' ')} • ${selectedColorScheme}` : 'Set up your profile first'}
		primaryAction={{
			label: "Download",
			icon: Download,
			onclick: generateGraphic,
			disabled: generating || (selectedTemplate === 'tour-promo' && !selectedTourId),
			variant: "primary"
		}}
	/>
	
	<!-- Desktop Header -->
	<div class="hidden sm:block">
		<PageHeader title="Social Media Graphics" />
	</div>
	
	<MarketingNav />
	
	{#if $profileQuery.isLoading || $toursQuery.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if !profile?.username}
		<div class="professional-card max-w-md mx-auto text-center py-8">
			<User class="w-8 h-8 mx-auto mb-3 text-secondary" />
			<h2 class="text-lg font-semibold text-primary mb-2">Complete Profile First</h2>
			<p class="text-secondary mb-4">Set up your username to create graphics</p>
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
					<!-- Platform Selection -->
					<div>
						<div class="text-sm font-medium text-primary mb-3">Platform</div>
						<div class="space-y-2">
							<button
								onclick={() => selectedPlatform = 'instagram-post'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 {selectedPlatform === 'instagram-post' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								<Instagram class="w-4 h-4" />
								Instagram Post
							</button>
							<button
								onclick={() => selectedPlatform = 'instagram-story'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 {selectedPlatform === 'instagram-story' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								<Instagram class="w-4 h-4" />
								Instagram Story
							</button>
							<button
								onclick={() => selectedPlatform = 'facebook'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 {selectedPlatform === 'facebook' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								<Facebook class="w-4 h-4" />
								Facebook
							</button>
							<button
								onclick={() => selectedPlatform = 'twitter'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 {selectedPlatform === 'twitter' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								<Twitter class="w-4 h-4" />
								Twitter
							</button>
							<button
								onclick={() => selectedPlatform = 'linkedin'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 {selectedPlatform === 'linkedin' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								<Linkedin class="w-4 h-4" />
								LinkedIn
							</button>
						</div>
					</div>
					
					<!-- Template Selection -->
					<div>
						<div class="text-sm font-medium text-primary mb-3">Template</div>
						<div class="space-y-2">
							{#each ['tour-promo', 'profile-intro', 'schedule'] as template}
								<button
									onclick={() => selectedTemplate = template as 'tour-promo' | 'profile-intro' | 'schedule'}
									class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedTemplate === template 
										? 'bg-secondary text-primary font-medium' 
										: 'text-secondary hover:bg-tertiary hover:text-primary'}"
								>
									{#if template === 'tour-promo'}
										Tour Promotion
									{:else if template === 'profile-intro'}
										Profile Intro
									{:else if template === 'schedule'}
										Tour Schedule
									{/if}
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Color Scheme -->
					<ColorSchemeSelector 
						{selectedColorScheme}
						{colorSchemes}
						onColorSchemeChange={(scheme) => selectedColorScheme = scheme}
						label="Color Scheme"
					/>
					
					<!-- Tour Selection -->
					{#if selectedTemplate === 'tour-promo' && activeTours.length > 0}
						<div>
							<label for="tour-select" class="text-sm font-medium text-primary mb-2 block">
								Select Tour
							</label>
							<select
								id="tour-select"
								bind:value={selectedTourId}
								class="form-select"
							>
								<option value="">Choose...</option>
								{#each activeTours as tour}
									<option value={tour.id}>{tour.name}</option>
								{/each}
							</select>
						</div>
					{/if}
					
					<!-- Custom Text -->
					<div>
						<label for="custom-text" class="text-sm font-medium text-primary mb-2 block">
							Custom Text
						</label>
						<textarea
							id="custom-text"
							bind:value={customText}
							placeholder="Optional"
							rows="3"
							class="form-textarea resize-none"
						></textarea>
					</div>
					
					<!-- Options -->
					<div>
						<label class="flex items-center gap-2 cursor-pointer text-sm">
							<input
								type="checkbox"
								bind:checked={includeQR}
								class="rounded"
							/>
							<span class="text-primary">Include QR code</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Preview Area -->
			<div class="professional-card order-1 lg:order-2">
				<!-- Desktop Header -->
				<div class="hidden sm:block p-4 border-b border-border">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold text-primary">Preview</h3>
						<button
							onclick={generateGraphic}
							class="button-primary button-small button-gap"
							disabled={generating || (selectedTemplate === 'tour-promo' && !selectedTourId)}
						>
							{#if generating}
								<div class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
								Generating...
							{:else}
								<Download class="w-4 h-4" />
								Download PNG
							{/if}
						</button>
					</div>
				</div>
				
				<!-- Mobile Header -->
				<div class="sm:hidden p-3 border-b border-border">
					<h3 class="font-semibold text-primary text-center">Preview</h3>
				</div>
				
				<div class="p-3 sm:p-4 lg:p-6">
					<!-- Graphic Preview -->
					<div class="mx-auto overflow-hidden rounded-lg shadow-lg border border-border" style="{selectedPlatform === 'instagram-post' || selectedPlatform === 'instagram-story' ? 'max-width: 280px;' : 'max-width: 320px; max-height: 180px;'} {selectedPlatform === 'instagram-post' || selectedPlatform === 'instagram-story' ? 'sm:max-width: 400px;' : 'sm:max-width: 500px; sm:max-height: 280px;'} aspect-ratio: {dimensions.width}/{dimensions.height};">
						<div class="w-full h-full relative" style="background: {displayColors.background}; color: {displayColors.text};">
							{#if selectedTemplate === 'tour-promo' && selectedTour}
								<!-- Tour Promo Preview -->
								<div class="p-3 sm:p-6 h-full flex flex-col justify-between">
									<div>
										<h2 class="text-base sm:text-2xl font-bold mb-1 sm:mb-2">{selectedTour.name}</h2>
										<p class="text-sm opacity-90 mb-3 line-clamp-3">{customText || selectedTour.description || 'Join us for an unforgettable experience!'}</p>
										<p class="text-xl font-bold">{formatCurrency(selectedTour.price, selectedTour.currency)}</p>
									</div>
									{#if includeQR && qrCodeURL}
										<div class="flex justify-end">
											<img 
												src={qrCodeURL} 
												alt="QR Code" 
												class="w-16 h-16 bg-white p-1 rounded"
											/>
										</div>
									{/if}
								</div>
							{:else if selectedTemplate === 'profile-intro'}
								<!-- Profile Intro Preview -->
								<div class="p-6 h-full flex flex-col justify-center text-center">
									<h2 class="text-2xl font-bold mb-2">{profile?.businessName || profile?.name}</h2>
									<p class="text-sm opacity-90 mb-4">{(customText || 'Discover Amazing Tours & Experiences').substring(0, 60)}{(customText || '').length > 60 ? '...' : ''}</p>
									
									{#if activeTours.length > 0}
										<div class="mb-4">
											<p class="text-xs opacity-80 mb-2">Our Tours:</p>
											{#each activeTours.slice(0, 3) as tour}
												<p class="text-xs mb-1">• {tour.name.substring(0, 30)}{tour.name.length > 30 ? '...' : ''}</p>
											{/each}
										</div>
									{/if}
									
									{#if includeQR && qrCodeURL}
										<img 
											src={qrCodeURL} 
											alt="QR Code" 
											class="w-16 h-16 bg-white p-1 rounded mx-auto mb-2"
										/>
									{/if}
									<p class="text-xs font-semibold">Book Now: zaur.app/{profile?.username}</p>
								</div>
							{:else if selectedTemplate === 'schedule'}
								<!-- Schedule Preview -->
								<div class="p-6 h-full flex flex-col">
									<h2 class="text-xl font-bold mb-2 text-center">Upcoming Tours</h2>
									{#if customText}
										<p class="text-sm opacity-90 mb-4 text-center">{customText.substring(0, 50)}{customText.length > 50 ? '...' : ''}</p>
									{/if}
									
									<div class="flex-1 overflow-hidden">
										{#if activeTours.length > 0}
											{#each activeTours.slice(0, 4) as tour}
												<div class="mb-3 pb-3 border-b border-white border-opacity-30">
													<h3 class="text-sm font-bold mb-1">{tour.name.substring(0, 35)}{tour.name.length > 35 ? '...' : ''}</h3>
													<div class="flex justify-between text-xs opacity-80">
														<span>{formatCurrency(tour.price, tour.currency)}</span>
														<span>{formatDuration(tour.duration || 60)}</span>
													</div>
												</div>
											{/each}
										{:else}
											<p class="text-sm text-center opacity-70">Tours coming soon!</p>
										{/if}
									</div>
									
									<div class="text-center mt-auto">
										{#if includeQR && qrCodeURL}
											<img 
												src={qrCodeURL} 
												alt="QR Code" 
												class="w-12 h-12 bg-white p-1 rounded mx-auto mb-2"
											/>
										{/if}
										<p class="text-xs font-semibold">zaur.app/{profile?.username}</p>
									</div>
								</div>

							{:else}
								<!-- No template selected -->
								<div class="h-full flex items-center justify-center">
									<div class="text-center">
										<Image class="w-12 h-12 mx-auto mb-3 opacity-30" />
										<p class="text-sm opacity-50">Select options to preview</p>
									</div>
								</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
		</div>
	{/if}
</div>

<!-- Hidden Graphic Container -->
<div class="social-graphic-container hidden" style="position: fixed; top: 0; left: 0; z-index: -9999; opacity: 0; pointer-events: none;">
	<div 
		class="social-graphic" 
		style="width: {dimensions.width}px; height: {dimensions.height}px; background: {displayColors.background}; color: {displayColors.text}; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; position: relative; overflow: hidden; font-size: 16px; line-height: 1.5;"
	>
		<!-- Tour Promo Template -->
		{#if selectedTemplate === 'tour-promo' && selectedTour}
			{#if isLandscape}
				<!-- Landscape Layout for Facebook/Twitter/LinkedIn -->
				<div style="padding: {dimensions.height * 0.08}px {dimensions.width * 0.06}px; height: 100%; display: flex; align-items: center; box-sizing: border-box;">
					<div style="flex: 1; margin-right: {dimensions.width * 0.04}px;">
						<h1 style="font-size: {dimensions.height * 0.12}px; font-weight: 800; margin: 0 0 {dimensions.height * 0.03}px 0; line-height: 1.1;">
							{selectedTour.name.substring(0, 35)}{selectedTour.name.length > 35 ? '...' : ''}
						</h1>
						<p style="font-size: {dimensions.height * 0.065}px; opacity: 0.9; margin: 0 0 {dimensions.height * 0.03}px 0; line-height: 1.3;">
							{(customText || selectedTour.description || 'Join us for an unforgettable experience!').substring(0, 100)}{(customText || selectedTour.description || '').length > 100 ? '...' : ''}
						</p>
						<div style="font-size: {dimensions.height * 0.09}px; font-weight: 700; margin: {dimensions.height * 0.03}px 0;">
							{formatCurrency(selectedTour.price, selectedTour.currency)}
						</div>
						<div style="margin-top: {dimensions.height * 0.04}px;">
							<p style="font-size: {dimensions.height * 0.055}px; opacity: 0.8; margin: 0;">
								{profile?.businessName || profile?.name}
							</p>
							<p style="font-size: {dimensions.height * 0.05}px; opacity: 0.7; margin: {dimensions.height * 0.01}px 0 0 0;">
								zaur.app/{profile?.username}
							</p>
						</div>
					</div>
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.height * 0.35}px; height: {dimensions.height * 0.35}px; background: white; padding: {dimensions.height * 0.02}px; border-radius: {dimensions.height * 0.03}px; flex-shrink: 0;" />
					{/if}
				</div>
			{:else}
				<!-- Portrait/Square Layout for Instagram -->
				<div style="padding: {dimensions.width * 0.06}px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
					<div style="flex: 1; min-height: 0; overflow: hidden;">
						<h1 style="font-size: {dimensions.width * 0.065}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.02}px 0; line-height: 1.1; word-wrap: break-word;">
							{selectedTour.name.substring(0, 28)}{selectedTour.name.length > 28 ? '...' : ''}
						</h1>
						<p style="font-size: {dimensions.width * 0.035}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.02}px 0; line-height: 1.6; overflow: hidden; word-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
							{(customText || selectedTour.description || 'Join us for an unforgettable experience!').substring(0, 85)}{(customText || selectedTour.description || '').length > 85 ? '...' : ''}
						</p>
						<div style="font-size: {dimensions.width * 0.05}px; font-weight: 700; margin: {dimensions.width * 0.015}px 0;">
							{formatCurrency(selectedTour.price, selectedTour.currency)}
						</div>
					</div>
					
					<div style="display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0; margin-top: {dimensions.width * 0.02}px;">
						<div style="flex: 1; margin-right: {dimensions.width * 0.015}px;">
							<p style="font-size: {dimensions.width * 0.03}px; opacity: 0.8; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
								{profile?.businessName || profile?.name}
							</p>
							<p style="font-size: {dimensions.width * 0.026}px; opacity: 0.7; margin: {dimensions.width * 0.005}px 0 0 0;">
								zaur.app/{profile?.username}
							</p>
						</div>
						{#if includeQR && qrCodeURL}
							<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.12}px; height: {dimensions.width * 0.12}px; background: white; padding: {dimensions.width * 0.008}px; border-radius: {dimensions.width * 0.015}px; flex-shrink: 0;" />
						{/if}
					</div>
				</div>
			{/if}
		{:else if selectedTemplate === 'profile-intro'}
			<!-- Profile Intro Template -->
			{#if isLandscape}
				<!-- Landscape Layout -->
				<div style="padding: {dimensions.height * 0.08}px {dimensions.width * 0.06}px; height: 100%; display: flex; align-items: center; box-sizing: border-box;">
					<div style="flex: 1; text-align: center;">
						<h1 style="font-size: {dimensions.height * 0.14}px; font-weight: 800; margin: 0 0 {dimensions.height * 0.03}px 0;">
							{profile?.businessName || profile?.name}
						</h1>
						<p style="font-size: {dimensions.height * 0.08}px; opacity: 0.9; margin: 0 0 {dimensions.height * 0.05}px 0; line-height: 1.3;">
							{(customText || 'Discover Amazing Tours & Experiences').substring(0, 60)}{(customText || '').length > 60 ? '...' : ''}
						</p>
						
						{#if activeTours.length > 0}
							<div style="display: flex; justify-content: center; gap: {dimensions.width * 0.03}px; margin-bottom: {dimensions.height * 0.05}px;">
								{#each activeTours.slice(0, 3) as tour}
									<p style="font-size: {dimensions.height * 0.065}px; margin: 0;">
										• {tour.name.substring(0, 20)}{tour.name.length > 20 ? '...' : ''}
									</p>
								{/each}
							</div>
						{/if}
						
						<p style="font-size: {dimensions.height * 0.07}px; font-weight: 600;">
							Book Now: zaur.app/{profile?.username}
						</p>
					</div>
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.height * 0.4}px; height: {dimensions.height * 0.4}px; background: white; padding: {dimensions.height * 0.025}px; border-radius: {dimensions.height * 0.03}px; margin-left: {dimensions.width * 0.04}px;" />
					{/if}
				</div>
			{:else}
				<!-- Portrait/Square Layout -->
				<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: center; box-sizing: border-box;">
					<h1 style="font-size: {dimensions.width * 0.09}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.03}px 0; word-wrap: break-word;">
						{profile?.businessName || profile?.name}
					</h1>
					<p style="font-size: {dimensions.width * 0.045}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.04}px 0; line-height: 2.2; max-height: {dimensions.width * 0.12}px; overflow: hidden; word-wrap: break-word;">
						{(customText || 'Discover Amazing Tours & Experiences').substring(0, 60)}{(customText || '').length > 60 ? '...' : ''}
					</p>
					
					{#if activeTours.length > 0}
						<div style="margin: {dimensions.width * 0.04}px 0; overflow: hidden;">
							<p style="font-size: {dimensions.width * 0.035}px; opacity: 0.8; margin-bottom: {dimensions.width * 0.02}px;">Our Tours:</p>
							{#each activeTours.slice(0, 3) as tour}
								<p style="font-size: {dimensions.width * 0.04}px; margin: {dimensions.width * 0.01}px 0; line-height: 2.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
									• {tour.name.substring(0, 30)}{tour.name.length > 30 ? '...' : ''}
								</p>
							{/each}
						</div>
					{/if}
					
					<div style="margin-top: auto;">
						{#if includeQR && qrCodeURL}
							<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.2}px; height: {dimensions.width * 0.2}px; background: white; padding: {dimensions.width * 0.015}px; border-radius: {dimensions.width * 0.02}px; margin: 0 auto {dimensions.width * 0.03}px; display: block;" />
						{/if}
						<p style="font-size: {dimensions.width * 0.04}px; font-weight: 600;">
							Book Now: zaur.app/{profile?.username}
						</p>
					</div>
				</div>
			{/if}
		{:else if selectedTemplate === 'schedule'}
			<!-- Schedule Template -->
			{#if isLandscape}
				<!-- Landscape Layout -->
				<div style="padding: {dimensions.height * 0.08}px {dimensions.width * 0.06}px; height: 100%; display: flex; align-items: center; box-sizing: border-box;">
					<div style="flex: 1;">
						<h1 style="font-size: {dimensions.height * 0.12}px; font-weight: 800; margin: 0 0 {customText ? dimensions.height * 0.02 : dimensions.height * 0.05}px 0;">
							Upcoming Tours
						</h1>
						{#if customText}
							<p style="font-size: {dimensions.height * 0.075}px; opacity: 0.9; margin: 0 0 {dimensions.height * 0.04}px 0; line-height: 1.3;">
								{customText.substring(0, 80)}{customText.length > 80 ? '...' : ''}
							</p>
						{/if}
						{#if activeTours.length > 0}
							<div style="display: grid; grid-template-columns: 1fr 1fr; gap: {dimensions.width * 0.02}px;">
								{#each activeTours.slice(0, 4) as tour}
									<div style="margin-bottom: {dimensions.height * 0.03}px;">
										<h3 style="font-size: {dimensions.height * 0.07}px; font-weight: 700; margin: 0 0 {dimensions.height * 0.01}px 0;">
											{tour.name.substring(0, 25)}{tour.name.length > 25 ? '...' : ''}
										</h3>
										<div style="display: flex; gap: {dimensions.width * 0.02}px; font-size: {dimensions.height * 0.055}px; opacity: 0.8;">
											<span>{formatCurrency(tour.price, tour.currency)}</span>
											<span>• {tour.duration || 60} min</span>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p style="font-size: {dimensions.height * 0.07}px; opacity: 0.7;">
								Tours coming soon!
							</p>
						{/if}
						<p style="font-size: {dimensions.height * 0.065}px; font-weight: 600; margin-top: {dimensions.height * 0.05}px;">
							zaur.app/{profile?.username}
						</p>
					</div>
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.height * 0.35}px; height: {dimensions.height * 0.35}px; background: white; padding: {dimensions.height * 0.02}px; border-radius: {dimensions.height * 0.03}px; margin-left: {dimensions.width * 0.04}px;" />
					{/if}
				</div>
			{:else}
				<!-- Portrait/Square Layout -->
				<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; box-sizing: border-box;">
					<h1 style="font-size: {dimensions.width * 0.08}px; font-weight: 800; margin: 0 0 {customText ? dimensions.width * 0.02 : dimensions.width * 0.04}px 0; text-align: center;">
						Upcoming Tours
					</h1>
					{#if customText}
						<p style="font-size: {dimensions.width * 0.045}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.03}px 0; text-align: center; line-height: 1.3;">
							{customText.substring(0, 60)}{customText.length > 60 ? '...' : ''}
						</p>
					{/if}
					
					<div style="flex: 1; overflow: hidden;">
						{#if activeTours.length > 0}
							{#each activeTours.slice(0, selectedPlatform === 'instagram-story' ? 5 : 4) as tour}
								<div style="margin-bottom: {dimensions.width * 0.03}px; padding-bottom: {dimensions.width * 0.03}px; border-bottom: 1px solid rgba(255,255,255,0.3);">
									<h3 style="font-size: {dimensions.width * 0.045}px; font-weight: 700; margin: 0 0 {dimensions.width * 0.01}px 0; line-height: 2.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
										{tour.name.substring(0, 35)}{tour.name.length > 35 ? '...' : ''}
									</h3>
									<div style="display: flex; justify-content: space-between; font-size: {dimensions.width * 0.035}px; opacity: 0.8;">
										<span>{formatCurrency(tour.price, tour.currency)}</span>
										<span>{tour.duration || 60} min</span>
									</div>
								</div>
							{/each}
						{:else}
							<p style="font-size: {dimensions.width * 0.04}px; text-align: center; opacity: 0.7;">
								Tours coming soon!
							</p>
						{/if}
					</div>
					
					<div style="text-align: center; margin-top: auto; flex-shrink: 0;">
						{#if includeQR && qrCodeURL}
							<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.15}px; height: {dimensions.width * 0.15}px; background: white; padding: {dimensions.width * 0.01}px; border-radius: {dimensions.width * 0.02}px; margin: 0 auto {dimensions.width * 0.02}px; display: block;" />
						{/if}
						<p style="font-size: {dimensions.width * 0.04}px; font-weight: 600;">
							zaur.app/{profile?.username}
						</p>
					</div>
				</div>
			{/if}

		{/if}
		
		<!-- Watermark -->
		<div style="position: absolute; bottom: {isLandscape ? dimensions.height * 0.02 : dimensions.width * 0.01}px; right: {isLandscape ? dimensions.height * 0.025 : dimensions.width * 0.015}px; font-size: {isLandscape ? dimensions.height * 0.035 : dimensions.width * 0.018}px; opacity: 0.35; pointer-events: none;">
			Created with Zaur
		</div>
	</div>
</div>

<style>
	.social-graphic-container {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		z-index: -9999 !important;
		pointer-events: none !important;
	}
	
	.social-graphic-container.hidden {
		opacity: 0 !important;
		visibility: hidden !important;
	}
	
	/* Ensure consistent font rendering */
	.social-graphic * {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
	}
	
	/* Prevent content overflow */
	.social-graphic {
		overflow: hidden !important;
	}
	
	/* Ensure text stays within bounds */
	.social-graphic h1, 
	.social-graphic h3, 
	.social-graphic p {
		word-break: break-word;
		overflow-wrap: break-word;
	}
</style> 