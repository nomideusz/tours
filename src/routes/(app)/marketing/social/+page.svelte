<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Image from 'lucide-svelte/icons/image';
	import User from 'lucide-svelte/icons/user';
	import Instagram from 'lucide-svelte/icons/instagram';
	import Facebook from 'lucide-svelte/icons/facebook';
	import Twitter from 'lucide-svelte/icons/twitter';
	import Linkedin from 'lucide-svelte/icons/linkedin';
	import QrCode from 'lucide-svelte/icons/qr-code';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	
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
	let selectedTemplate = $state<'tour-promo' | 'profile-intro' | 'schedule' | 'testimonial'>('tour-promo');
	let selectedTourId = $state<string>('');
	let customText = $state('');
	let includeQR = $state(true);
	let selectedColor = $state<'brand' | 'vibrant' | 'minimal' | 'dark'>('brand');
	
	let selectedTour = $derived(
		selectedTourId ? tours.find((t: any) => t.id === selectedTourId) : activeTours[0]
	);
	
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
			size: 200, 
			color: selectedColor === 'dark' ? 'ffffff' : '1f2937',
			style: 'modern'
		});
	});
	
	// Color schemes
	const colorSchemes = {
		brand: {
			background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
			text: '#FFFFFF',
			accent: '#FED7AA'
		},
		vibrant: {
			background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
			text: '#FFFFFF',
			accent: '#FDF4FF'
		},
		minimal: {
			background: '#FFFFFF',
			text: '#1F2937',
			accent: '#E5E7EB'
		},
		dark: {
			background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
			text: '#FFFFFF',
			accent: '#374151'
		}
	};
	
	let colorScheme = $derived(colorSchemes[selectedColor]);
	
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
			const container = document.querySelector('.social-graphic-container');
			if (!container) {
				throw new Error('Graphic container not found');
			}
			
			// Show the container temporarily for capture
			container.classList.remove('hidden');
			
			// Wait for images to load
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Generate canvas
			const canvas = await (html2canvas as any)(container as HTMLElement, {
				backgroundColor: null,
				scale: 1, // Use actual size
				useCORS: true,
				allowTaint: true,
				logging: false,
				width: dimensions.width,
				height: dimensions.height
			});
			
			// Hide the container again
			container.classList.add('hidden');
			
			// Convert to blob and download
			canvas.toBlob((blob: Blob | null) => {
				if (!blob) {
					throw new Error('Failed to generate image');
				}
				
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${profile.username}-${selectedPlatform}-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.png`;
				a.click();
				URL.revokeObjectURL(url);
			}, 'image/png');
			
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

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<PageHeader title="Social Media Graphics" />
	
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
			<button onclick={() => goto('/profile')} class="button--primary">
				Complete Profile
			</button>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-[300px_1fr]">
			<!-- Options Sidebar -->
			<div class="professional-card h-fit">
				<div class="p-4 border-b border-border">
					<h3 class="font-semibold text-primary">Design Options</h3>
				</div>
				<div class="p-4 space-y-6">
					<!-- Platform Selection -->
					<div>
						<label class="text-sm font-medium text-primary mb-3 block">Platform</label>
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
						<label class="text-sm font-medium text-primary mb-3 block">Template</label>
						<div class="space-y-2">
							{#each ['tour-promo', 'profile-intro', 'schedule', 'testimonial'] as template}
								<button
									onclick={() => selectedTemplate = template as 'tour-promo' | 'profile-intro' | 'schedule' | 'testimonial'}
									class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedTemplate === template 
										? 'bg-secondary text-primary font-medium' 
										: 'text-secondary hover:bg-tertiary hover:text-primary'}"
								>
									{template === 'tour-promo' && 'Tour Promotion'}
									{template === 'profile-intro' && 'Profile Intro'}
									{template === 'schedule' && 'Tour Schedule'}
									{template === 'testimonial' && 'Testimonial'}
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Color Theme -->
					<div>
						<label class="text-sm font-medium text-primary mb-3 block">Color Theme</label>
						<div class="grid grid-cols-2 gap-2">
							{#each ['brand', 'vibrant', 'minimal', 'dark'] as color}
								<button
									onclick={() => selectedColor = color as 'brand' | 'vibrant' | 'minimal' | 'dark'}
									class="aspect-square rounded-md border-2 transition-all relative overflow-hidden {selectedColor === color 
										? 'border-primary scale-110 shadow-md' 
										: 'border-border hover:border-secondary'}"
									aria-label="{color} color theme"
								>
									<div class="w-full h-full {color === 'brand' ? 'bg-gradient-to-br from-orange-400 to-coral-500' : color === 'vibrant' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : color === 'minimal' ? 'bg-gradient-to-br from-gray-100 to-gray-300' : 'bg-gradient-to-br from-gray-800 to-gray-900'}"></div>
								</button>
							{/each}
						</div>
					</div>
					
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
			<div class="professional-card">
				<div class="p-4 border-b border-border flex items-center justify-between">
					<h3 class="font-semibold text-primary">Preview</h3>
					<button
						onclick={generateGraphic}
						class="button--primary button--small"
						disabled={generating || (selectedTemplate === 'tour-promo' && !selectedTourId)}
					>
						{#if generating}
							<div class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
							Generating...
						{:else}
							<Download class="w-4 h-4" />
							Download
						{/if}
					</button>
				</div>
				
				<div class="p-6">
					<!-- Graphic Preview -->
					<div class="mx-auto overflow-hidden rounded-lg shadow-lg border border-border" style="max-width: 400px; aspect-ratio: {dimensions.width}/{dimensions.height};">
						<div class="w-full h-full {selectedColor === 'dark' ? 'bg-gray-900 text-white' : selectedColor === 'minimal' ? 'bg-gray-50 text-gray-900' : 'bg-white text-gray-900'} relative">
							{#if selectedTemplate === 'tour-promo' && selectedTour}
								<!-- Tour Promo Preview -->
								<div class="p-6 h-full flex flex-col justify-between">
									<div>
										<h2 class="text-2xl font-bold mb-2">{selectedTour.name}</h2>
										<p class="text-sm opacity-90 mb-3 line-clamp-3">{customText || selectedTour.description || 'Join us for an unforgettable experience!'}</p>
										<p class="text-xl font-bold">{formatCurrency(selectedTour.price, selectedTour.currency)}</p>
									</div>
									{#if includeQR}
										<div class="flex justify-end">
											<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
												<QrCode class="w-10 h-10 text-gray-400" />
											</div>
										</div>
									{/if}
								</div>
							{:else if selectedTemplate === 'profile-intro'}
								<!-- Profile Intro Preview -->
								<div class="p-6 h-full flex flex-col justify-center text-center">
									<h2 class="text-2xl font-bold mb-2">{profile?.businessName || profile?.name}</h2>
									<p class="text-sm opacity-90">{customText || 'Professional tour guide'}</p>
									{#if includeQR}
										<div class="mt-4 flex justify-center">
											<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
												<QrCode class="w-10 h-10 text-gray-400" />
											</div>
										</div>
									{/if}
								</div>
							{:else if selectedTemplate === 'schedule'}
								<!-- Schedule Preview -->
								<div class="p-6 h-full">
									<h2 class="text-xl font-bold mb-4">Tour Schedule</h2>
									<div class="space-y-2">
										{#each activeTours.slice(0, 4) as tour}
											<div class="text-sm">
												<span class="font-medium">{tour.name}</span>
												<span class="opacity-75 ml-2">{formatCurrency(tour.price, tour.currency)}</span>
											</div>
										{/each}
									</div>
								</div>
							{:else if selectedTemplate === 'testimonial'}
								<!-- Testimonial Preview -->
								<div class="p-6 h-full flex flex-col justify-center">
									<div class="text-3xl opacity-20 mb-2">"</div>
									<p class="text-sm italic mb-4">{customText || 'Amazing tour! Highly recommended.'}</p>
									<p class="text-xs opacity-75">- Happy Customer</p>
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
<div class="social-graphic-container hidden" style="position: absolute; left: -9999px;">
	<div 
		class="social-graphic" 
		style="width: {dimensions.width}px; height: {dimensions.height}px; background: {colorScheme.background}; color: {colorScheme.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; overflow: hidden;"
	>
		<!-- Tour Promo Template -->
		{#if selectedTemplate === 'tour-promo' && selectedTour}
			<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
				<div>
					<h1 style="font-size: {dimensions.width * 0.08}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.03}px 0; line-height: 1.2;">
						{selectedTour.name}
					</h1>
					<p style="font-size: {dimensions.width * 0.045}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.04}px 0; line-height: 1.4;">
						{selectedTour.description || 'Join us for an unforgettable experience!'}
					</p>
					<div style="font-size: {dimensions.width * 0.06}px; font-weight: 700; margin: {dimensions.width * 0.03}px 0;">
						{formatCurrency(selectedTour.price, selectedTour.currency)}
					</div>
				</div>
				
				<div style="display: flex; justify-content: space-between; align-items: flex-end;">
					<div>
						<p style="font-size: {dimensions.width * 0.035}px; opacity: 0.8; margin: 0;">
							{profile?.businessName || profile?.name}
						</p>
						<p style="font-size: {dimensions.width * 0.03}px; opacity: 0.7; margin: {dimensions.width * 0.01}px 0 0 0;">
							zaur.app/{profile?.username}
						</p>
					</div>
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.15}px; height: {dimensions.width * 0.15}px; background: white; padding: {dimensions.width * 0.01}px; border-radius: {dimensions.width * 0.02}px;" />
					{/if}
				</div>
			</div>
		{:else if selectedTemplate === 'profile-intro'}
			<!-- Profile Intro Template -->
			<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: center;">
				<h1 style="font-size: {dimensions.width * 0.09}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.03}px 0;">
					{profile?.businessName || profile?.name}
				</h1>
				<p style="font-size: {dimensions.width * 0.05}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.05}px 0; line-height: 1.4;">
					Discover Amazing Tours & Experiences
				</p>
				
				{#if activeTours.length > 0}
					<div style="margin: {dimensions.width * 0.04}px 0;">
						<p style="font-size: {dimensions.width * 0.035}px; opacity: 0.8; margin-bottom: {dimensions.width * 0.02}px;">Our Tours:</p>
						{#each activeTours.slice(0, 3) as tour}
							<p style="font-size: {dimensions.width * 0.04}px; margin: {dimensions.width * 0.01}px 0;">
								• {tour.name}
							</p>
						{/each}
					</div>
				{/if}
				
				<div style="margin-top: auto;">
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.2}px; height: {dimensions.width * 0.2}px; background: white; padding: {dimensions.width * 0.015}px; border-radius: {dimensions.width * 0.02}px; margin: 0 auto {dimensions.width * 0.03}px;" />
					{/if}
					<p style="font-size: {dimensions.width * 0.04}px; font-weight: 600;">
						Book Now: zaur.app/{profile?.username}
					</p>
				</div>
			</div>
		{:else if selectedTemplate === 'schedule'}
			<!-- Schedule Template -->
			<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column;">
				<h1 style="font-size: {dimensions.width * 0.08}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.04}px 0; text-align: center;">
					Upcoming Tours
				</h1>
				
				<div style="flex: 1; overflow: hidden;">
					{#if activeTours.length > 0}
						{#each activeTours.slice(0, selectedPlatform === 'instagram-story' ? 5 : 4) as tour}
							<div style="margin-bottom: {dimensions.width * 0.03}px; padding-bottom: {dimensions.width * 0.03}px; border-bottom: 1px solid {colorScheme.accent};">
								<h3 style="font-size: {dimensions.width * 0.045}px; font-weight: 700; margin: 0 0 {dimensions.width * 0.01}px 0;">
									{tour.name}
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
				
				<div style="text-align: center; margin-top: auto;">
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.15}px; height: {dimensions.width * 0.15}px; background: white; padding: {dimensions.width * 0.01}px; border-radius: {dimensions.width * 0.02}px; margin: 0 auto {dimensions.width * 0.02}px;" />
					{/if}
					<p style="font-size: {dimensions.width * 0.04}px; font-weight: 600;">
						zaur.app/{profile?.username}
					</p>
				</div>
			</div>
		{:else if selectedTemplate === 'testimonial'}
			<!-- Testimonial Template -->
			<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: center;">
				<div style="font-size: {dimensions.width * 0.15}px; margin-bottom: {dimensions.width * 0.04}px;">
					⭐⭐⭐⭐⭐
				</div>
				<p style="font-size: {dimensions.width * 0.055}px; font-style: italic; line-height: 1.4; margin: 0 0 {dimensions.width * 0.04}px 0;">
					"An absolutely amazing experience! The tour guide was knowledgeable and friendly. Highly recommend!"
				</p>
				<p style="font-size: {dimensions.width * 0.04}px; opacity: 0.8; margin-bottom: {dimensions.width * 0.06}px;">
					- Happy Customer
				</p>
				
				<div>
					<p style="font-size: {dimensions.width * 0.045}px; font-weight: 700; margin-bottom: {dimensions.width * 0.02}px;">
						{profile?.businessName || profile?.name}
					</p>
					{#if includeQR && qrCodeURL}
						<img src={qrCodeURL} alt="QR Code" style="width: {dimensions.width * 0.15}px; height: {dimensions.width * 0.15}px; background: white; padding: {dimensions.width * 0.01}px; border-radius: {dimensions.width * 0.02}px; margin: {dimensions.width * 0.03}px auto;" />
					{/if}
					<p style="font-size: {dimensions.width * 0.04}px;">
						Book your tour: zaur.app/{profile?.username}
					</p>
				</div>
			</div>
		{/if}
		
		<!-- Watermark -->
		<div style="position: absolute; bottom: {dimensions.width * 0.03}px; right: {dimensions.width * 0.03}px; font-size: {dimensions.width * 0.025}px; opacity: 0.5;">
			Created with Zaur
		</div>
	</div>
</div>

<style>
	.hidden {
		display: none !important;
	}
</style> 