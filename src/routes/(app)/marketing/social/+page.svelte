<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Image from 'lucide-svelte/icons/image';
	import Type from 'lucide-svelte/icons/type';
	import Palette from 'lucide-svelte/icons/palette';
	import User from 'lucide-svelte/icons/user';
	import Instagram from 'lucide-svelte/icons/instagram';
	import Facebook from 'lucide-svelte/icons/facebook';
	import Twitter from 'lucide-svelte/icons/twitter';
	import Linkedin from 'lucide-svelte/icons/linkedin';
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

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader title="Social Media Graphics" />
	
	<MarketingNav />
	
	{#if $profileQuery.isLoading || $toursQuery.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if !profile?.username}
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">You need to set up your username to generate social media graphics</p>
			<a href="/profile" class="button button--primary">
				Go to Profile
			</a>
		</div>
	{:else}
		<!-- Platform Selection -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Image class="w-5 h-5" />
				Choose Platform
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
				<button
					class="platform-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'instagram-post' ? 'border-purple-200 bg-purple-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'instagram-post'}
					data-selected={selectedPlatform === 'instagram-post'}
				>
					<Instagram class="w-6 h-6 mx-auto mb-2" />
					<h3 class="text-sm font-medium text-primary">Instagram</h3>
					<p class="text-xs text-secondary">Square Post</p>
				</button>
				
				<button
					class="platform-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'instagram-story' ? 'border-purple-200 bg-purple-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'instagram-story'}
					data-selected={selectedPlatform === 'instagram-story'}
				>
					<Instagram class="w-6 h-6 mx-auto mb-2" />
					<h3 class="text-sm font-medium text-primary">IG Story</h3>
					<p class="text-xs text-secondary">9:16 Vertical</p>
				</button>
				
				<button
					class="platform-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'facebook' ? 'border-blue-200 bg-blue-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'facebook'}
					data-selected={selectedPlatform === 'facebook'}
				>
					<Facebook class="w-6 h-6 mx-auto mb-2" />
					<h3 class="text-sm font-medium text-primary">Facebook</h3>
					<p class="text-xs text-secondary">Link Post</p>
				</button>
				
				<button
					class="platform-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'twitter' ? 'border-sky-200 bg-sky-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'twitter'}
					data-selected={selectedPlatform === 'twitter'}
				>
					<Twitter class="w-6 h-6 mx-auto mb-2" />
					<h3 class="text-sm font-medium text-primary">Twitter</h3>
					<p class="text-xs text-secondary">Tweet Image</p>
				</button>
				
				<button
					class="platform-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'linkedin' ? 'border-blue-200 bg-blue-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'linkedin'}
					data-selected={selectedPlatform === 'linkedin'}
				>
					<Linkedin class="w-6 h-6 mx-auto mb-2" />
					<h3 class="text-sm font-medium text-primary">LinkedIn</h3>
					<p class="text-xs text-secondary">Feed Post</p>
				</button>
			</div>
		</div>
		
		<!-- Template Selection -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Type class="w-5 h-5" />
				Content Template
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				<button
					class="template-card p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'tour-promo' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'tour-promo'}
					data-selected={selectedTemplate === 'tour-promo'}
				>
					<h3 class="text-sm font-medium text-primary">Tour Promotion</h3>
					<p class="text-xs text-secondary">Highlight a specific tour</p>
				</button>
				
				<button
					class="template-card p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'profile-intro' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'profile-intro'}
					data-selected={selectedTemplate === 'profile-intro'}
				>
					<h3 class="text-sm font-medium text-primary">Profile Intro</h3>
					<p class="text-xs text-secondary">Introduce yourself</p>
				</button>
				
				<button
					class="template-card p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'schedule' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'schedule'}
					data-selected={selectedTemplate === 'schedule'}
				>
					<h3 class="text-sm font-medium text-primary">Tour Schedule</h3>
					<p class="text-xs text-secondary">Weekly tour times</p>
				</button>
				
				<button
					class="template-card p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'testimonial' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'testimonial'}
					data-selected={selectedTemplate === 'testimonial'}
				>
					<h3 class="text-sm font-medium text-primary">Testimonial</h3>
					<p class="text-xs text-secondary">Customer review</p>
				</button>
			</div>
		</div>
		
		<!-- Style Selection -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Palette class="w-5 h-5" />
				Color Theme
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				<button
					class="color-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'brand' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'brand'}
					data-selected={selectedColor === 'brand'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-br from-orange-400 to-coral-500"></div>
					<h3 class="text-sm font-medium text-primary">Brand Colors</h3>
				</button>
				
				<button
					class="color-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'vibrant' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'vibrant'}
					data-selected={selectedColor === 'vibrant'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-br from-purple-500 to-pink-500"></div>
					<h3 class="text-sm font-medium text-primary">Vibrant</h3>
				</button>
				
				<button
					class="color-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'minimal' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'minimal'}
					data-selected={selectedColor === 'minimal'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gray-200 border-2 border-gray-300"></div>
					<h3 class="text-sm font-medium text-primary">Minimal</h3>
				</button>
				
				<button
					class="color-card p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'dark' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'dark'}
					data-selected={selectedColor === 'dark'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-br from-gray-800 to-gray-900"></div>
					<h3 class="text-sm font-medium text-primary">Dark Mode</h3>
				</button>
			</div>
		</div>
		
		<!-- Configuration -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4">Content</h2>
			<div class="space-y-4">
				{#if selectedTemplate === 'tour-promo' && activeTours.length > 0}
					<div>
						<label for="tour-select" class="block text-sm font-medium text-secondary mb-2">
							Select Tour
						</label>
						<select
							id="tour-select"
							bind:value={selectedTourId}
							class="w-full max-w-md"
						>
							<option value="">Choose a tour...</option>
							{#each activeTours as tour}
								<option value={tour.id}>{tour.name}</option>
							{/each}
						</select>
					</div>
				{/if}
				
				<div>
					<label for="custom-text" class="block text-sm font-medium text-secondary mb-2">
						Custom Text (optional)
					</label>
					<textarea
						id="custom-text"
						bind:value={customText}
						placeholder="Add custom text for your graphic"
						rows="4"
						class="w-full max-w-md"
					/>
					<p class="text-xs text-secondary mt-1">Leave empty to use template default</p>
				</div>
				
				<div class="max-w-md">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeQR}
							class="rounded"
						/>
						<span class="text-sm text-primary">Include QR code</span>
					</label>
				</div>
			</div>
		</div>
		
		<!-- Generate Button -->
		<div class="flex justify-center">
			<button
				class="button button--primary button--large flex items-center gap-2"
				onclick={generateGraphic}
				disabled={generating || (selectedTemplate === 'tour-promo' && !selectedTourId)}
			>
				{#if generating}
					<div class="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
					Generating...
				{:else}
					<Download class="w-5 h-5" />
					Generate Graphic
				{/if}
			</button>
		</div>
		
		<!-- Platform Info -->
		<div class="professional-card mt-8">
			<h3 class="text-lg font-semibold text-primary mb-4">Platform Guidelines</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
				<div>
					<h4 class="font-medium text-primary mb-2">Image Dimensions:</h4>
					<ul class="space-y-1 text-secondary">
						<li>• Instagram Post: 1080×1080px (Square)</li>
						<li>• Instagram Story: 1080×1920px (9:16)</li>
						<li>• Facebook: 1200×630px</li>
						<li>• Twitter: 1200×675px</li>
						<li>• LinkedIn: 1200×627px</li>
					</ul>
				</div>
				<div>
					<h4 class="font-medium text-primary mb-2">Best Practices:</h4>
					<ul class="space-y-1 text-secondary">
						<li>• Keep text concise and readable</li>
						<li>• Use high contrast colors</li>
						<li>• Include a clear call-to-action</li>
						<li>• Add your QR code for easy booking</li>
						<li>• Test on mobile devices</li>
					</ul>
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
	
	/* Base styles for all platform/template/color card icons */
	.platform-card svg,
	.template-card svg,
	.color-card svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		width: 1.5rem;
		height: 1.5rem;
	}
	
	/* Platform card icon styles */
	.platform-card svg {
		color: #6B7280;
		transition: color 0.2s;
	}
	
	/* Default unselected state - gray in light mode */
	.platform-card:not([data-selected="true"]) svg {
		color: #6B7280 !important;
	}
	
	/* Selected state icons - use specific colors for each platform */
	.platform-card[data-selected="true"].border-purple-200 svg {
		color: #9333EA !important;
	}
	
	.platform-card[data-selected="true"].border-blue-200 svg {
		color: #2563EB !important;
	}
	
	.platform-card[data-selected="true"].border-sky-200 svg {
		color: #0EA5E9 !important;
	}
	
	/* LinkedIn needs more specific selector since it also has border-blue-200 */
	.platform-card[data-selected="true"].border-blue-200:nth-child(5) svg {
		color: #1E40AF !important;
	}
	
	/* Dark mode overrides for better contrast */
	:global(.dark) .platform-card[data-selected="true"],
	:global(.dark) .template-card[data-selected="true"],
	:global(.dark) .color-card[data-selected="true"] {
		background-color: white !important;
	}
	
	/* Platform icons in dark mode - unselected state */
	:global(.dark) .platform-card:not([data-selected="true"]) svg {
		color: #9CA3AF !important; /* Medium gray for visibility in dark mode */
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
	
	/* Platform text in dark mode - selected state */
	:global(.dark) .platform-card[data-selected="true"] {
		color: #1F2937 !important; /* Dark text on white background */
	}
	
	/* Ensure platform icons remain colored in dark mode when selected */
	:global(.dark) .platform-card[data-selected="true"].border-purple-200 svg {
		color: #9333EA !important;
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
	
	:global(.dark) .platform-card[data-selected="true"].border-blue-200:not(:nth-child(5)) svg {
		color: #2563EB !important;
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
	
	:global(.dark) .platform-card[data-selected="true"].border-sky-200 svg {
		color: #0EA5E9 !important;
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
	
	:global(.dark) .platform-card[data-selected="true"].border-blue-200:nth-child(5) svg {
		color: #1E40AF !important;
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
	
	/* Ensure text has proper contrast in dark mode on white backgrounds */
	:global(.dark) .platform-card[data-selected="true"] h3,
	:global(.dark) .platform-card[data-selected="true"] p,
	:global(.dark) .template-card[data-selected="true"] h3,
	:global(.dark) .template-card[data-selected="true"] p,
	:global(.dark) .color-card[data-selected="true"] h3 {
		color: #1F2937 !important;
	}
	
	/* Fix color theme swatches in dark mode */
	:global(.dark) .color-card[data-selected="true"] .bg-gray-200 {
		background-color: #E5E7EB !important;
		border-color: #9CA3AF !important;
	}
	
	/* Template and color card icon styles */
	.template-card svg,
	.color-card svg {
		color: #6B7280;
	}
	
	/* Template and color cards in dark mode */
	:global(.dark) .template-card:not([data-selected="true"]) svg,
	:global(.dark) .color-card:not([data-selected="true"]) svg {
		color: #9CA3AF !important;
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
	
	:global(.dark) .template-card[data-selected="true"] svg,
	:global(.dark) .color-card[data-selected="true"] svg {
		color: #4B5563 !important;
		opacity: 1 !important;
		fill: none !important;
		stroke: currentColor !important;
	}
</style> 