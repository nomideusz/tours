<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Eye from 'lucide-svelte/icons/eye';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Printer from 'lucide-svelte/icons/printer';
	
	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});
	
	let showCopied = $state(false);
	let generating = $state(false);
	
	function copyURL() {
		navigator.clipboard.writeText('https://zaur.app/auth/register?ref=sticker');
		showCopied = true;
		setTimeout(() => showCopied = false, 2000);
	}
	
	async function generatePDF() {
		generating = true;
		try {
			const response = await fetch('/api/admin/generate-stickers', {
				method: 'POST'
			});
			
			if (response.ok) {
				const contentType = response.headers.get('content-type');
				const isFallback = response.headers.get('X-PDF-Fallback');
				
				if (contentType?.includes('application/pdf')) {
					// Successfully generated PDF
					const pdfBlob = await response.blob();
					
					// Create download link
					const url = window.URL.createObjectURL(pdfBlob);
					const link = document.createElement('a');
					link.href = url;
					link.download = 'zaur-promotional-stickers.pdf';
					document.body.appendChild(link);
					link.click();
					
					// Cleanup
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					
				} else if (isFallback) {
					// Fallback to browser printing
					const htmlContent = await response.text();
					const printWindow = window.open('', '_blank');
					if (printWindow) {
						printWindow.document.write(htmlContent);
						printWindow.document.close();
						
						// Add instructions for manual printing
						printWindow.onload = () => {
							setTimeout(() => {
								if (confirm('PDF generation failed. Use browser printing instead?\n\n1. Press Ctrl+P (or Cmd+P)\n2. Select "Save as PDF"\n3. Enable "Background graphics"\n4. Click Save')) {
									printWindow.print();
								}
							}, 1000);
						};
					}
				} else {
					throw new Error('Unexpected response format');
				}
			} else {
				console.error('Failed to generate stickers');
				alert('Failed to generate PDF. Please try again.');
			}
		} catch (error) {
			console.error('Error generating stickers:', error);
			alert('Error generating PDF. Please try again.');
		} finally {
			generating = false;
		}
	}
	
	function previewHTML() {
		window.open('/admin/stickers/preview', '_blank');
	}
</script>

<svelte:head>
	<title>Promotional Stickers - Admin - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader title="Promotional Stickers" />
	
	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<button
			class="professional-card hover:border-coral-200 transition-colors cursor-pointer text-left"
			onclick={previewHTML}
		>
			<div class="flex items-center gap-3 mb-3">
				<div class="professional-icon professional-icon--teal">
					<Eye class="w-5 h-5" strokeWidth={2} />
				</div>
				<h3 class="text-lg font-semibold text-primary">Preview Design</h3>
			</div>
			<p class="text-secondary text-sm">View the sticker designs in your browser before printing</p>
		</button>
		
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
					{generating ? 'Generating...' : 'Download PDF'}
				</h3>
			</div>
			<p class="text-secondary text-sm">Generate and download high-quality PDF with 6 stickers per A4 page</p>
		</button>
		
		<button
			class="professional-card hover:border-coral-200 transition-colors cursor-pointer text-left"
			onclick={copyURL}
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
					{showCopied ? 'Copied!' : 'Copy QR URL'}
				</h3>
			</div>
			<p class="text-secondary text-sm">Copy the registration URL used in the QR codes</p>
		</button>
	</div>
	
	<!-- Design Preview -->
	<div class="professional-card mb-8">
		<h2 class="text-xl font-semibold text-primary mb-6">Clean Sticker Designs</h2>
		<p class="text-secondary text-sm mb-6">Simplified design with minimal text, prominent QR code, and key value proposition.</p>
		
		<div class="flex flex-col md:flex-row gap-6 justify-center items-center max-w-6xl mx-auto p-6">
			<!-- Clean White Version -->
			<div class="sticker-preview sticker-preview--white">
				<div class="sticker-header">
					<div class="brand-name">ZAUR</div>
					<div class="tagline">Tour Guide Platform</div>
				</div>
				
				<div class="qr-section">
					<div class="qr-placeholder">
						<QrCode class="w-12 h-12 text-secondary" />
					</div>
				</div>
				
				<div class="value-prop">
					Zero Commission
				</div>
				
				<div class="website">
					<div class="website-url">zaur.app</div>
				</div>
			</div>
			
			<!-- Clean Orange Version -->
			<div class="sticker-preview sticker-preview--orange">
				<div class="sticker-header">
					<div class="brand-name">ZAUR</div>
					<div class="tagline">QR Bookings</div>
				</div>
				
				<div class="qr-section">
					<div class="qr-placeholder qr-placeholder--orange">
						<QrCode class="w-12 h-12 text-orange-600" />
					</div>
				</div>
				
				<div class="value-prop">
					Keep 100% Revenue
				</div>
				
				<div class="website">
					<div class="website-url">zaur.app</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- PDF Generation Status -->
	<div class="professional-card mb-8">
		<h3 class="text-lg font-semibold text-primary mb-4">PDF Generation Methods</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
			<div class="p-3 bg-green-50 border border-green-200 rounded-lg">
				<h4 class="font-medium text-green-800 mb-1">Primary: Puppeteer</h4>
				<p class="text-green-600">High-quality server-side PDF generation</p>
			</div>
			<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
				<h4 class="font-medium text-blue-800 mb-1">Backup: html-pdf-node</h4>
				<p class="text-blue-600">Lightweight fallback method</p>
			</div>
			<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
				<h4 class="font-medium text-orange-800 mb-1">Final: Browser Print</h4>
				<p class="text-orange-600">Manual printing if needed</p>
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
					<span class="text-secondary">Resolution:</span>
					<span class="font-medium text-primary">300 DPI recommended</span>
				</div>
				<div class="flex justify-between">
					<span class="text-secondary">Paper type:</span>
					<span class="font-medium text-primary">Adhesive sticker paper</span>
				</div>
				<div class="flex justify-between">
					<span class="text-secondary">Cutting:</span>
					<span class="font-medium text-primary">Rounded corners, 2-3mm margin</span>
				</div>
			</div>
		</div>
		
		<div class="professional-card">
			<h3 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<QrCode class="w-5 h-5" />
				QR Code Details
			</h3>
			<div class="space-y-3 text-sm">
				<div class="flex justify-between">
					<span class="text-secondary">Target URL:</span>
					<span class="font-medium text-primary break-all">zaur.app/auth/register</span>
				</div>
				<div class="flex justify-between">
					<span class="text-secondary">Tracking parameter:</span>
					<span class="font-medium text-primary">?ref=sticker</span>
				</div>
				<div class="flex justify-between">
					<span class="text-secondary">Error correction:</span>
					<span class="font-medium text-primary">Medium level</span>
				</div>
				<div class="flex justify-between">
					<span class="text-secondary">QR size:</span>
					<span class="font-medium text-primary">25mm × 25mm</span>
				</div>
				<div class="flex justify-between">
					<span class="text-secondary">Format:</span>
					<span class="font-medium text-primary">SVG (crisp scaling)</span>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Marketing Tips -->
	<div class="professional-card mt-8">
		<h3 class="text-lg font-semibold text-primary mb-4">Marketing Distribution Ideas</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
			<div class="p-4 bg-bg-secondary rounded-lg">
				<h4 class="font-medium text-primary mb-2">Tourism Events</h4>
				<p class="text-secondary">Trade shows, conferences, travel meetups</p>
			</div>
			<div class="p-4 bg-bg-secondary rounded-lg">
				<h4 class="font-medium text-primary mb-2">Partner Locations</h4>
				<p class="text-secondary">Hotels, tourist centers, travel agencies</p>
			</div>
			<div class="p-4 bg-bg-secondary rounded-lg">
				<h4 class="font-medium text-primary mb-2">Professional Networks</h4>
				<p class="text-secondary">Tour guide associations, coworking spaces</p>
			</div>
		</div>
	</div>
</div>

<style>
	.sticker-preview {
		width: 200px;
		height: 200px;
		border-radius: 12px;
		padding: 14px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}
	
	.sticker-preview--white {
		background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
		border: 2px solid #e5e7eb;
	}
	
	.sticker-preview--orange {
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		color: white;
	}
	
	.sticker-header {
		text-align: center;
		margin-bottom: 20px;
	}
	
	.brand-name {
		font-size: 24px;
		font-weight: 800;
		margin-bottom: 4px;
		letter-spacing: -0.5px;
	}
	
	.sticker-preview--white .brand-name {
		color: #1f2937;
	}
	
	.tagline {
		font-size: 12px;
		font-weight: 500;
	}
	
	.sticker-preview--white .tagline {
		color: #6b7280;
	}
	
	.sticker-preview--orange .tagline {
		color: rgba(255, 255, 255, 0.9);
	}
	
	.qr-section {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 20px;
	}
	
	.qr-placeholder {
		width: 70px;
		height: 70px;
		background: #ffffff;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.qr-placeholder--orange {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(255, 255, 255, 0.3);
	}
	
	.value-prop {
		font-size: 14px;
		font-weight: 700;
		text-align: center;
		margin-bottom: 20px;
	}
	
	.sticker-preview--white .value-prop {
		color: #f97316;
	}
	
	.website {
		text-align: center;
	}
	
	.website-url {
		font-size: 15px;
		font-weight: 700;
	}
	
	.sticker-preview--white .website-url {
		color: #1f2937;
	}
</style> 