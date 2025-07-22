<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Palette from 'lucide-svelte/icons/palette';
	import Type from 'lucide-svelte/icons/type';
	import Image from 'lucide-svelte/icons/image';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	// @ts-ignore
	import jsPDF from 'jspdf';
	
	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});
	
	let generating = $state(false);
	let selectedTemplate = $state<'modern' | 'classic' | 'minimal'>('modern');
	let selectedColor = $state<'brand' | 'professional' | 'elegant'>('brand');
	let includeTagline = $state(true);
	
	// Generate QR code for registration
	let qrCodeURL = $derived.by(() => {
		const url = 'https://zaur.app/auth/register?ref=card';
		const color = selectedColor === 'elegant' ? '7C3AED' : '1f2937';
		return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&color=${color}&bgcolor=FFFFFF&margin=2&ecc=M`;
	});
	
	// Template configurations
	const templates = {
		modern: {
			name: 'Modern',
			description: 'Clean design with QR code emphasis'
		},
		classic: {
			name: 'Classic',
			description: 'Traditional layout with all contact info'
		},
		minimal: {
			name: 'Minimal',
			description: 'Simple and elegant design'
		}
	};
	
	// Color schemes
	const colorSchemes = {
		brand: {
			name: 'Brand Colors',
			primary: '#FA6B5D',
			secondary: '#1F2937',
			accent: '#F97316'
		},
		professional: {
			name: 'Professional',
			primary: '#1E40AF',
			secondary: '#1F2937',
			accent: '#3B82F6'
		},
		elegant: {
			name: 'Elegant',
			primary: '#7C3AED',
			secondary: '#1F2937',
			accent: '#8B5CF6'
		}
	};
	
	async function generateBusinessCards() {
		generating = true;
		try {
			// Get the container
			const container = document.querySelector('.business-cards-container');
			if (!container) {
				throw new Error('Business cards container not found');
			}
			
			// Show the container
			container.classList.remove('hidden');
			
			// Wait for rendering
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Generate canvas
			const html2canvas = (await import('html2canvas')).default as any;
			const canvas = await html2canvas(container as HTMLElement, {
				backgroundColor: '#ffffff',
				scale: 3,
				useCORS: true,
				allowTaint: true,
				logging: false
			});
			
			// Hide the container
			container.classList.add('hidden');
			
			// Create PDF (A4 size)
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});
			
			// Add the canvas to PDF
			const imgData = canvas.toDataURL('image/png');
			pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
			
			// Download
			pdf.save(`zaur-business-cards-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.pdf`);
			
		} catch (error) {
			console.error('Error generating business cards:', error);
			alert('Failed to generate business cards. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Business Cards Generator - Admin - Zaur</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !$authLoading && $isAdmin}
	<div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
		<PageHeader 
			title="Business Cards Generator"
			subtitle="Create professional business cards for Zaur platform promotion"
		>
			<a href="/admin" class="button-secondary button--gap">
				<ArrowLeft class="h-4 w-4" />
				Back to Admin
			</a>
		</PageHeader>
		
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
			<!-- Configuration Panel -->
			<div class="space-y-6">
				<!-- Template Selection -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Type class="w-5 h-5" />
						Card Template
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
						Color Scheme
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
								<div class="flex gap-2">
									<div class="w-6 h-6 rounded" style="background-color: {scheme.primary}"></div>
									<div class="w-6 h-6 rounded" style="background-color: {scheme.secondary}"></div>
									<div class="w-6 h-6 rounded" style="background-color: {scheme.accent}"></div>
								</div>
								<span class="font-medium">{scheme.name}</span>
							</label>
						{/each}
					</div>
				</div>
				
				<!-- Options -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4">Options</h3>
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeTagline}
							class="rounded"
						/>
						<span>Include marketing tagline</span>
					</label>
				</div>
				
				<!-- Generate Button -->
				<button
					onclick={generateBusinessCards}
					disabled={generating}
					class="button button--primary button--large w-full flex items-center justify-center gap-2"
				>
					{#if generating}
						<div class="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						Generating...
					{:else}
						<Download class="w-5 h-5" />
						Generate Business Cards
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
						<!-- Business card preview -->
						<div class="max-w-md mx-auto">
							<div class="aspect-[3.5/2] bg-white rounded-lg shadow-xl p-4 text-black">
								{#if selectedTemplate === 'modern'}
									<div class="h-full flex">
										<div class="flex-1 flex flex-direction: column; justify-content: space-between;">
											<div>
												<h1 class="text-xl font-bold" style="color: {colorSchemes[selectedColor].primary};">Zaur</h1>
												{#if includeTagline}
													<p class="text-xs opacity-75" style="color: {colorSchemes[selectedColor].secondary};">Tour Platform</p>
												{/if}
											</div>
											<div class="text-xs" style="color: {colorSchemes[selectedColor].secondary};">
												<p>zaur.app</p>
												<p>hello@zaur.app</p>
											</div>
										</div>
										<div class="text-center ml-4">
											<img src={qrCodeURL} alt="QR Code" class="w-12 h-12 mx-auto mb-1" />
											<p class="text-xs opacity-75" style="color: {colorSchemes[selectedColor].secondary};">Scan to join</p>
										</div>
									</div>
								{:else if selectedTemplate === 'classic'}
									<div class="h-full flex justify-between items-start">
										<div class="flex-1">
											<h1 class="text-lg font-serif font-bold" style="color: {colorSchemes[selectedColor].primary};">ZAUR</h1>
											{#if includeTagline}
												<p class="text-xs mt-1 uppercase tracking-wide opacity-75" style="color: {colorSchemes[selectedColor].secondary};">Tour Platform</p>
											{/if}
											<div class="mt-4 text-xs" style="color: {colorSchemes[selectedColor].secondary};">
												<p>zaur.app</p>
												<p>hello@zaur.app</p>
											</div>
										</div>
										<img src={qrCodeURL} alt="QR Code" class="w-8 h-8" />
									</div>
								{:else}
									<div class="text-center h-full flex flex-col justify-center">
										<h1 class="text-lg font-light tracking-widest" style="color: {colorSchemes[selectedColor].primary};">ZAUR</h1>
										{#if includeTagline}
											<p class="text-xs mt-1 tracking-wide opacity-75" style="color: {colorSchemes[selectedColor].secondary};">TOUR PLATFORM</p>
										{/if}
										<div class="mt-3">
											<img src={qrCodeURL} alt="QR Code" class="w-10 h-10 mx-auto" />
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Hidden container for PDF generation -->
	<div class="business-cards-container hidden" style="position: absolute; left: -9999px; width: 210mm; height: 297mm; background: white;">
		<!-- A4 page with 10 business cards (2x5 grid) -->
		<div style="padding: 10mm; display: grid; grid-template-columns: repeat(2, 85mm); grid-template-rows: repeat(5, 54mm); gap: 10mm;">
			{#each Array(10) as _, i}
				<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 8mm; display: flex; flex-direction: column; justify-content: space-between; background: white;">
					<!-- Card content based on selected template -->
					{#if selectedTemplate === 'modern'}
						<div>
							<h1 style="font-size: 20px; font-weight: 800; color: {colorSchemes[selectedColor].primary}; margin: 0;">Zaur</h1>
							<p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">Tour QR Ticket Platform</p>
						</div>
						<div style="text-align: center; margin: 8px 0;">
							<img src={qrCodeURL} alt="QR Code" style="width: 60px; height: 60px; margin: 0 auto;" />
							<p style="font-size: 9px; color: #6b7280; margin: 4px 0 0 0;">Scan to join</p>
						</div>
						{#if includeTagline}
							<p style="font-size: 10px; color: {colorSchemes[selectedColor].secondary}; text-align: center; margin: 0;">
								"No booking fees, ever!"
							</p>
						{/if}
					{:else if selectedTemplate === 'classic'}
						<div>
							<h1 style="font-size: 18px; font-weight: 700; color: {colorSchemes[selectedColor].primary}; margin: 0;">Zaur</h1>
							<p style="font-size: 10px; color: #6b7280; margin: 2px 0 0 0;">Tour QR Ticket Platform</p>
						</div>
						<div style="margin: 8px 0;">
							<p style="font-size: 10px; color: {colorSchemes[selectedColor].secondary}; margin: 2px 0;">🌐 zaur.app</p>
							<p style="font-size: 10px; color: {colorSchemes[selectedColor].secondary}; margin: 2px 0;">✉️ hello@zaur.app</p>
							{#if includeTagline}
								<p style="font-size: 9px; color: #6b7280; margin: 8px 0 0 0; font-style: italic;">
									"Empowering tour guides worldwide"
								</p>
							{/if}
						</div>
						<img src={qrCodeURL} alt="QR Code" style="width: 40px; height: 40px;" />
					{:else}
						<div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
							<h1 style="font-size: 24px; font-weight: 300; color: {colorSchemes[selectedColor].primary}; margin: 0; letter-spacing: 2px;">ZAUR</h1>
							{#if includeTagline}
								<p style="font-size: 9px; color: #9ca3af; margin: 8px 0 0 0; letter-spacing: 1px;">TOUR PLATFORM</p>
							{/if}
							<div style="margin-top: 16px;">
								<img src={qrCodeURL} alt="QR Code" style="width: 50px; height: 50px; margin: 0 auto;" />
							</div>
						</div>
					{/if}
				</div>
			{/each}
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