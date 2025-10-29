<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
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
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `zaur-promotional-stickers-${new Date().toISOString().split('T')[0]}.pdf`;
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				console.error('Failed to generate stickers PDF');
				alert('Failed to generate PDF. Please try again.');
			}
		} catch (error) {
			console.error('Error generating stickers:', error);
			alert('Error generating PDF. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Promotional Stickers - Admin - Zaur</title>
</svelte:head>

<div class="w-full px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader title="Promotional Stickers" />
	
	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
		<button
			class="professional-card hover:border-primary-200 transition-colors cursor-pointer text-left"
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
			<p class="text-secondary text-sm">Download print-ready PDF with 6 stickers per A4 page</p>
		</button>
		
		<button
			class="professional-card hover:border-primary-200 transition-colors cursor-pointer text-left"
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
</style> 