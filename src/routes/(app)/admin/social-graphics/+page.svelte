<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Image from 'lucide-svelte/icons/image';
	import Instagram from 'lucide-svelte/icons/instagram';
	import Facebook from 'lucide-svelte/icons/facebook';
	import Twitter from 'lucide-svelte/icons/twitter';
	import Linkedin from 'lucide-svelte/icons/linkedin';
	import Type from 'lucide-svelte/icons/type';
	import Palette from 'lucide-svelte/icons/palette';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	
	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});
	
	let generating = $state(false);
	let selectedPlatform = $state<'instagram-post' | 'instagram-story' | 'facebook' | 'twitter' | 'linkedin'>('instagram-post');
	let selectedTemplate = $state<'promo' | 'stats' | 'feature'>('promo');
	let selectedColor = $state<'brand' | 'vibrant' | 'minimal'>('brand');
	
	// Platform dimensions
	const platformDimensions = {
		'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
		'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
		'facebook': { width: 1200, height: 630, name: 'Facebook Post' },
		'twitter': { width: 1200, height: 675, name: 'Twitter Post' },
		'linkedin': { width: 1200, height: 627, name: 'LinkedIn Post' }
	};
	
	// Template configurations
	const templates = {
		promo: {
			name: 'Platform Promo',
			description: 'Promote Zaur platform features'
		},
		stats: {
			name: 'Success Stats',
			description: 'Show platform achievements'
		},
		feature: {
			name: 'Feature Focus',
			description: 'Highlight specific features'
		}
	};
	
	// Color schemes
	const colorSchemes = {
		brand: {
			name: 'Brand Colors',
			background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
			text: '#FFFFFF',
			accent: '#FED7AA'
		},
		vibrant: {
			name: 'Vibrant',
			background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
			text: '#FFFFFF',
			accent: '#FDF4FF'
		},
		minimal: {
			name: 'Minimal',
			background: '#FFFFFF',
			text: '#1F2937',
			accent: '#E5E7EB'
		}
	};
	
	let dimensions = $derived(platformDimensions[selectedPlatform]);
	let colorScheme = $derived(colorSchemes[selectedColor]);
	
	async function generateGraphic() {
		generating = true;
		try {
			// Get the container
			const container = document.querySelector('.social-graphic-container');
			if (!container) {
				throw new Error('Social graphic container not found');
			}
			
			// Show the container
			container.classList.remove('hidden');
			
			// Wait for rendering
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Generate canvas
			const html2canvas = (await import('html2canvas')).default as any;
			const canvas = await html2canvas(container as HTMLElement, {
				backgroundColor: null,
				scale: 1,
				useCORS: true,
				allowTaint: true,
				logging: false,
				width: dimensions.width,
				height: dimensions.height
			});
			
			// Hide the container
			container.classList.add('hidden');
			
			// Convert to blob and download
			canvas.toBlob((blob: Blob | null) => {
				if (!blob) {
					throw new Error('Failed to generate image');
				}
				
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `zaur-${selectedPlatform}-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.png`;
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
	<title>Social Media Graphics Generator - Admin - Zaur</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !$authLoading && $isAdmin}
	<div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
		<PageHeader 
			title="Social Media Graphics Generator"
			subtitle="Create eye-catching graphics for social media promotion"
		>
			<a href="/admin" class="button-secondary button--gap">
				<ArrowLeft class="h-4 w-4" />
				Back to Admin
			</a>
		</PageHeader>
		
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
			<!-- Configuration Panel -->
			<div class="space-y-6">
				<!-- Platform Selection -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Image class="w-5 h-5" />
						Platform
					</h3>
					<div class="space-y-2">
						{#each Object.entries(platformDimensions) as [key, platform]}
							<label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all hover:bg-secondary {selectedPlatform === key ? 'border-primary bg-secondary' : 'border-border'}">
								<input
									type="radio"
									name="platform"
									value={key}
									checked={selectedPlatform === key}
									onchange={() => selectedPlatform = key as typeof selectedPlatform}
									class="hidden"
								/>
								<span class="font-medium">{platform.name}</span>
								<span class="text-xs text-secondary ml-auto">{platform.width}×{platform.height}</span>
							</label>
						{/each}
					</div>
				</div>
				
				<!-- Template Selection -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Type class="w-5 h-5" />
						Content Template
					</h3>
					<div class="space-y-3">
						{#each Object.entries(templates) as [key, template]}
							<label class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all hover:bg-secondary {selectedTemplate === key ? 'border-primary bg-secondary' : 'border-border'}">
								<input
									type="radio"
									name="template"
									value={key}
									checked={selectedTemplate === key}
									onchange={() => selectedTemplate = key as typeof selectedTemplate}
									class="mt-0.5"
								/>
								<div>
									<h4 class="font-medium">{template.name}</h4>
									<p class="text-sm text-secondary">{template.description}</p>
								</div>
							</label>
						{/each}
					</div>
				</div>
				
				<!-- Color Scheme -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Palette class="w-5 h-5" />
						Color Theme
					</h3>
					<div class="space-y-3">
						{#each Object.entries(colorSchemes) as [key, scheme]}
							<label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all hover:bg-secondary {selectedColor === key ? 'border-primary bg-secondary' : 'border-border'}">
								<input
									type="radio"
									name="color"
									value={key}
									checked={selectedColor === key}
									onchange={() => selectedColor = key as typeof selectedColor}
									class="hidden"
								/>
								<div class="w-8 h-8 rounded" style="background: {key === 'minimal' ? '#f3f4f6' : scheme.background}; border: 1px solid #e5e7eb;"></div>
								<span class="font-medium">{scheme.name}</span>
							</label>
						{/each}
					</div>
				</div>
				
				<!-- Generate Button -->
				<button
					onclick={generateGraphic}
					disabled={generating}
					class="button button--primary button--large w-full flex items-center justify-center gap-2"
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
			
			<!-- Preview -->
			<div class="lg:col-span-2">
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Image class="w-5 h-5" />
						Preview
					</h3>
					<div class="bg-secondary rounded-lg p-8">
						<!-- Social media graphic preview -->
						<div style="aspect-ratio: {dimensions.width}/{dimensions.height}; max-width: 400px; margin: 0 auto;">
							<div class="w-full h-full rounded-lg shadow-xl overflow-hidden" style="background: {colorSchemes[selectedColor].background}; color: {colorSchemes[selectedColor].text};">
								{#if selectedTemplate === 'promo'}
									<div class="h-full flex flex-col justify-center text-center p-6">
										<h1 class="text-2xl font-bold mb-2 leading-tight">
											Join 1000+ Tour Guides
										</h1>
										<p class="text-sm opacity-90 mb-4">
											Use Zaur's QR ticketing platform
										</p>
										<div class="space-y-2 text-sm">
											<div class="flex justify-center items-center gap-2">
												<span>✓</span> No Commission Fees
											</div>
											<div class="flex justify-center items-center gap-2">
												<span>✓</span> QR Digital Tickets
											</div>
											<div class="flex justify-center items-center gap-2">
												<span>✓</span> Real-time Bookings
											</div>
										</div>
										<div class="mt-6 text-lg font-semibold">
											zaur.app
										</div>
									</div>
								{:else if selectedTemplate === 'stats'}
									<div class="h-full flex flex-col justify-center text-center p-6">
										<h1 class="text-xl font-bold mb-4">
											Zaur Platform Growth
										</h1>
										<div class="grid grid-cols-2 gap-4 mb-4">
											<div>
												<div class="text-xl font-bold">1000+</div>
												<div class="text-xs opacity-80">Tour Guides</div>
											</div>
											<div>
												<div class="text-xl font-bold">50K+</div>
												<div class="text-xs opacity-80">Bookings</div>
											</div>
											<div>
												<div class="text-xl font-bold">25+</div>
												<div class="text-xs opacity-80">Countries</div>
											</div>
											<div>
												<div class="text-xl font-bold">0%</div>
												<div class="text-xs opacity-80">Commission</div>
											</div>
										</div>
										<p class="text-sm mt-auto">
											Join the revolution at zaur.app
										</p>
									</div>
								{:else}
									<div class="h-full flex flex-col justify-center p-6">
										<div class="text-sm font-bold mb-3">
											NEW FEATURE
										</div>
										<h1 class="text-xl font-bold mb-3 leading-tight">
											QR Code Marketing Materials
										</h1>
										<p class="text-sm opacity-90 leading-relaxed mb-4">
											Generate professional business cards, flyers, and social media graphics with built-in QR codes.
										</p>
										<div class="bg-white bg-opacity-20 p-3 rounded mb-4">
											<p class="text-xs margin-0">
												Boost your tour bookings with instant promotional materials
											</p>
										</div>
										<p class="text-sm font-semibold mt-auto">
											Start creating at zaur.app
										</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Hidden container for graphic generation -->
	<div class="social-graphic-container hidden" style="position: absolute; left: -9999px;">
		<div 
			style="width: {dimensions.width}px; height: {dimensions.height}px; background: {colorScheme.background}; color: {colorScheme.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; overflow: hidden;"
		>
			{#if selectedTemplate === 'promo'}
				<!-- Platform Promo Template -->
				<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: center;">
					<h1 style="font-size: {dimensions.width * 0.08}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.03}px 0; line-height: 1.2;">
						Tour QR Ticket Platform
					</h1>
					<p style="font-size: {dimensions.width * 0.04}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.05}px 0;">
						Empower Tour Guides Worldwide
					</p>
					
					<div style="margin: {dimensions.width * 0.04}px 0;">
						<div style="font-size: {dimensions.width * 0.045}px; line-height: 1.8;">
							✓ No Booking Fees<br />
							✓ Digital QR Tickets<br />
							✓ Real-time Management<br />
							✓ Marketing Tools
						</div>
					</div>
					
					<div style="margin-top: auto;">
						<div style="font-size: {dimensions.width * 0.06}px; font-weight: 700; margin-bottom: {dimensions.width * 0.02}px;">
							ZAUR
						</div>
						<p style="font-size: {dimensions.width * 0.035}px; opacity: 0.8;">
							zaur.app
						</p>
					</div>
				</div>
			{:else if selectedTemplate === 'stats'}
				<!-- Success Stats Template -->
				<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: center;">
					<h1 style="font-size: {dimensions.width * 0.1}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.02}px 0;">
						ZAUR
					</h1>
					<p style="font-size: {dimensions.width * 0.04}px; opacity: 0.9; margin: 0 0 {dimensions.width * 0.06}px 0;">
						Platform Success
					</p>
					
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: {dimensions.width * 0.04}px; margin: {dimensions.width * 0.04}px 0;">
						<div>
							<div style="font-size: {dimensions.width * 0.08}px; font-weight: 700;">1000+</div>
							<div style="font-size: {dimensions.width * 0.03}px; opacity: 0.8;">Tour Guides</div>
						</div>
						<div>
							<div style="font-size: {dimensions.width * 0.08}px; font-weight: 700;">50K+</div>
							<div style="font-size: {dimensions.width * 0.03}px; opacity: 0.8;">Bookings</div>
						</div>
						<div>
							<div style="font-size: {dimensions.width * 0.08}px; font-weight: 700;">25+</div>
							<div style="font-size: {dimensions.width * 0.03}px; opacity: 0.8;">Countries</div>
						</div>
						<div>
							<div style="font-size: {dimensions.width * 0.08}px; font-weight: 700;">0%</div>
							<div style="font-size: {dimensions.width * 0.03}px; opacity: 0.8;">Commission</div>
						</div>
					</div>
					
					<p style="font-size: {dimensions.width * 0.04}px; margin-top: auto;">
						Join the Revolution
					</p>
				</div>
			{:else}
				<!-- Feature Focus Template -->
				<div style="padding: {dimensions.width * 0.08}px; height: 100%; display: flex; flex-direction: column; justify-content: center;">
					<div style="font-size: {dimensions.width * 0.06}px; font-weight: 700; margin-bottom: {dimensions.width * 0.04}px;">
						ZAUR
					</div>
					
					<h1 style="font-size: {dimensions.width * 0.07}px; font-weight: 800; margin: 0 0 {dimensions.width * 0.04}px 0; line-height: 1.3;">
						No Booking Fees.<br />
						Ever.
					</h1>
					
					<p style="font-size: {dimensions.width * 0.04}px; opacity: 0.9; line-height: 1.6; margin-bottom: {dimensions.width * 0.05}px;">
						Keep 100% of your tour revenue. We believe in empowering tour guides, not taking from them.
					</p>
					
					<div style="background: {colorScheme.accent}; padding: {dimensions.width * 0.03}px; border-radius: {dimensions.width * 0.02}px; margin-bottom: {dimensions.width * 0.04}px;">
						<p style="font-size: {dimensions.width * 0.035}px; margin: 0; color: {selectedColor === 'minimal' ? '#1f2937' : colorScheme.text};">
							"The only platform that truly cares about tour guides"
						</p>
					</div>
					
					<p style="font-size: {dimensions.width * 0.04}px; font-weight: 600; margin-top: auto;">
						Start Free at zaur.app
					</p>
				</div>
			{/if}
			
			<!-- Watermark -->
			<div style="position: absolute; bottom: {dimensions.width * 0.03}px; right: {dimensions.width * 0.03}px; font-size: {dimensions.width * 0.025}px; opacity: 0.5;">
				Created with Zaur
			</div>
		</div>
	</div>
{/if}

<style>
	.professional-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	
	.bg-secondary {
		background: var(--bg-secondary);
	}
	
	.border-primary {
		border-color: var(--color-primary-500) !important;
	}
	
	.border-border {
		border-color: var(--border-primary);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.hidden {
		display: none !important;
	}
</style> 