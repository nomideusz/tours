<script lang="ts">
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/stores/auth.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Printer from 'lucide-svelte/icons/printer';
	import Palette from 'lucide-svelte/icons/palette';
	import User from 'lucide-svelte/icons/user';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	// @ts-ignore
	import jsPDF from 'jspdf';
	
	// Components
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	
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
	let generating = $state(false);
	let selectedDesign = $state<'professional' | 'colorful' | 'minimal'>('professional');
	let customTagline = $state('');
	
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
		
		const colors = {
			professional: '1f2937',
			colorful: 'ffffff', 
			minimal: '000000'
		};
		
		return generateQRImageURL(personalizedURL, { 
			size: 200, 
			color: colors[selectedDesign],
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
	
	async function generatePDF() {
		if (!profile?.username || !browser) {
			alert('Please complete your profile first');
			return;
		}
		
		generating = true;
		try {
			// Get the stickers container
			const container = document.querySelector('.stickers-print-container');
			if (!container) {
				throw new Error('Stickers container not found');
			}
			
			// Show the container temporarily for capture
			container.classList.remove('hidden');
			
			// Wait for images to load
			await new Promise(resolve => setTimeout(resolve, 500));
			
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
			
			// Create PDF
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});
			
			// Calculate dimensions
			const imgWidth = 210; // A4 width in mm
			const imgHeight = 297; // A4 height in mm
			
			// Add image to PDF
			const imgData = canvas.toDataURL('image/png');
			pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
			
			// Download PDF
			pdf.save(`${profile.username}-promotional-stickers-${new Date().toISOString().split('T')[0]}.pdf`);
		} catch (error) {
			console.error('Error generating stickers:', error);
			alert('Failed to generate PDF. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Promotional Stickers - Marketing - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader title="Promotional Stickers" />
	
	<MarketingNav />
	
	{#if $profileQuery.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if !profile?.username}
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">You need to set up your username to generate personalized stickers</p>
			<a href="/profile" class="button button--primary">
				Go to Profile
			</a>
		</div>
	{:else}
		<!-- Design Selection -->
		<div class="professional-card mb-8">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Palette class="w-5 h-5" />
				Choose Your Design
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer {selectedDesign === 'professional' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedDesign = 'professional'}
				>
					<h3 class="font-semibold text-primary mb-2">Professional</h3>
					<p class="text-sm text-secondary">Clean design with your business branding</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer {selectedDesign === 'colorful' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedDesign = 'colorful'}
				>
					<h3 class="font-semibold text-primary mb-2">Colorful</h3>
					<p class="text-sm text-secondary">Eye-catching design with vibrant colors</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer {selectedDesign === 'minimal' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedDesign = 'minimal'}
				>
					<h3 class="font-semibold text-primary mb-2">Minimal</h3>
					<p class="text-sm text-secondary">Simple and elegant design</p>
				</button>
			</div>
		</div>
		
		<!-- Customization Options -->
		<div class="professional-card mb-8">
			<h2 class="text-lg font-semibold text-primary mb-4">Customize Your Stickers</h2>
			<div class="space-y-4">
				<div>
					<label for="tagline" class="block text-sm font-medium text-secondary mb-2">
						Custom Tagline (optional)
					</label>
					<input
						id="tagline"
						type="text"
						bind:value={customTagline}
						placeholder={defaultTagline}
						maxlength="30"
						class="w-full max-w-md"
					/>
					<p class="text-xs text-secondary mt-1">Leave empty to use default: "{defaultTagline}"</p>
				</div>
			</div>
		</div>
		
		<!-- Quick Actions -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
			<button
				class="professional-card hover:border-coral-200 transition-colors cursor-pointer text-left"
				onclick={generatePDF}
				disabled={generating}
			>
				<div class="flex items-center gap-3 mb-3">
					<div class="professional-icon professional-icon--coral">
						{#if generating}
							<div class="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						{:else}
							<Download class="w-5 h-5" strokeWidth={2} />
						{/if}
					</div>
					<h3 class="text-lg font-semibold text-primary">
						{generating ? 'Generating...' : 'Generate PDF'}
					</h3>
				</div>
				<p class="text-secondary text-sm">Download your personalized stickers (6 per A4 page)</p>
			</button>
			
			<button
				class="professional-card hover:border-coral-200 transition-colors cursor-pointer text-left"
				onclick={copyURL}
				disabled={!personalizedURL}
			>
				<div class="flex items-center gap-3 mb-3">
					<div class="professional-icon professional-icon--orange">
						{#if showCopied}
							<Check class="w-5 h-5" strokeWidth={2} />
						{:else}
							<Copy class="w-5 h-5" strokeWidth={2} />
						{/if}
					</div>
					<h3 class="text-lg font-semibold text-primary">
						{showCopied ? 'Copied!' : 'Copy Your URL'}
					</h3>
				</div>
				<p class="text-secondary text-sm">Copy your personalized booking URL</p>
			</button>
		</div>
		
		<!-- Preview Section -->
		<div class="professional-card mb-8">
			<h2 class="text-lg font-semibold text-primary mb-4">Preview</h2>
			<div class="flex justify-center">
				<div class="sticker-preview sticker-preview--{selectedDesign}">
					<div class="sticker-content">
						<div class="business-name">{profile.businessName || profile.name}</div>
						<div class="tagline">{tagline}</div>
						<div class="qr-placeholder">
							{#if qrCodeURL}
								<img src={qrCodeURL} alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
							{:else}
								<QrCode class="w-10 h-10" style="color: #374151;" />
							{/if}
						</div>
						<div class="website-url">zaur.app/{profile.username}</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Technical Specifications -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="professional-card">
				<h3 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
					<Printer class="w-5 h-5" />
					Print Specifications
				</h3>
				<div class="space-y-3 text-sm">
					<div class="flex justify-between">
						<span class="text-secondary">Size per sticker:</span>
						<span class="font-medium text-primary">85mm × 85mm (3.3" × 3.3")</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Format:</span>
						<span class="font-medium text-primary">A4 page, 6 stickers</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Paper type:</span>
						<span class="font-medium text-primary">Adhesive sticker paper</span>
					</div>
				</div>
			</div>
			
			<div class="professional-card">
				<h3 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
					<QrCode class="w-5 h-5" />
					Your QR Code
				</h3>
				<div class="space-y-3 text-sm">
					<div class="flex justify-between">
						<span class="text-secondary">Links to:</span>
						<span class="font-medium text-primary break-all">zaur.app/{profile.username}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Tracking:</span>
						<span class="font-medium text-primary">?ref=sticker</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Shows:</span>
						<span class="font-medium text-primary">Your profile & tours</span>
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
			<div class="print-sticker print-sticker--{selectedDesign}" style="width: 80mm; height: 80mm; border-radius: 12mm; padding: 8mm; display: flex; flex-direction: column; justify-content: space-between; {selectedDesign === 'professional' ? 'background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%); border: 2px solid #e5e7eb;' : selectedDesign === 'colorful' ? 'background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);' : 'background: #ffffff; border: 2px solid #000000;'}">
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
					<div style="font-size: 11pt; font-weight: 700; {selectedDesign === 'professional' ? 'color: #f97316;' : selectedDesign === 'colorful' ? 'color: #ffffff;' : 'color: #000000;'}">zaur.app/{profile?.username}</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Ensure icon containers have proper colors */
	.professional-icon svg {
		color: white !important;
	}
	
	/* Ensure preview section has proper contrast */
	.qr-placeholder svg {
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
		width: 200px;
		height: 200px;
		padding: 1rem;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.sticker-preview--professional {
		background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
		border: 2px solid #e5e7eb;
	}
	
	.sticker-preview--colorful {
		background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
	}
	
	.sticker-preview--minimal {
		background: #ffffff;
		border: 2px solid #000000;
	}
	
	.sticker-content {
		text-align: center;
	}
	
	.business-name {
		font-size: 1.125rem;
		font-weight: 800;
		margin-bottom: 0.25rem;
	}
	
	.sticker-preview--professional .business-name,
	.sticker-preview--minimal .business-name {
		color: #1f2937;
	}
	
	.sticker-preview--colorful .business-name {
		color: #ffffff;
	}
	
	.tagline {
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}
	
	.sticker-preview--professional .tagline,
	.sticker-preview--minimal .tagline {
		color: #6b7280;
	}
	
	.sticker-preview--colorful .tagline {
		color: rgba(255, 255, 255, 0.9);
	}
	
	.qr-placeholder {
		width: 2.5rem;
		height: 2.5rem;
		margin: 1rem auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.website-url {
		font-size: 0.875rem;
		font-weight: 700;
	}
	
	.sticker-preview--professional .website-url {
		color: #f97316;
	}
	
	.sticker-preview--colorful .website-url {
		color: #ffffff;
	}
	
	.sticker-preview--minimal .website-url {
		color: #000000;
	}
</style> 