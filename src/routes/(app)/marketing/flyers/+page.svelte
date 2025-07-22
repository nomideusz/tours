<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Eye from 'lucide-svelte/icons/eye';
	import FileText from 'lucide-svelte/icons/file-text';
	import Palette from 'lucide-svelte/icons/palette';
	import User from 'lucide-svelte/icons/user';
	import Image from 'lucide-svelte/icons/image';
	import Type from 'lucide-svelte/icons/type';
	import Layout from 'lucide-svelte/icons/layout';
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
	let selectedLayout = $state<'single' | 'multi' | 'list'>('single');
	let selectedStyle = $state<'modern' | 'classic' | 'bold'>('modern');
	let selectedTourId = $state<string>('');
	let includeContact = $state(true);
	let includeQR = $state(true);
	let customHeadline = $state('');
	
	let selectedTour = $derived(
		selectedTourId ? tours.find((t: any) => t.id === selectedTourId) : null
	);
	
	// Default headlines based on layout
	let defaultHeadline = $derived(
		selectedLayout === 'single' && selectedTour
			? selectedTour.name
			: selectedLayout === 'multi'
			? 'Discover Our Tours'
			: 'Tour Schedule'
	);
	
	let headline = $derived(customHeadline || defaultHeadline);
	
	// Generate QR code for profile
	let profileQRCode = $derived.by(() => {
		if (!profile?.username) return '';
		const url = `https://zaur.app/${profile.username}`;
		return generateQRImageURL(url, { 
			size: 150, 
			color: '1f2937',
			style: 'modern'
		});
	});
	
	async function generatePDF() {
		if (!profile?.username || !browser) {
			alert('Please complete your profile first');
			return;
		}
		
		if (selectedLayout === 'single' && !selectedTourId) {
			alert('Please select a tour for single tour flyer');
			return;
		}
		
		generating = true;
		try {
			// Get the flyer container
			const container = document.querySelector('.flyer-print-container');
			if (!container) {
				throw new Error('Flyer container not found');
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
			pdf.save(`${profile.username}-flyer-${selectedLayout}-${new Date().toISOString().split('T')[0]}.pdf`);
		} catch (error) {
			console.error('Error generating flyer:', error);
			alert('Failed to generate PDF. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Promotional Flyers - Marketing - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader title="Promotional Flyers" />
	
	<MarketingNav />
	
	{#if $profileQuery.isLoading || $toursQuery.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if !profile?.username}
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">You need to set up your username to generate flyers</p>
			<a href="/profile" class="button button--primary">
				Go to Profile
			</a>
		</div>
	{:else if activeTours.length === 0}
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<FileText class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">No Active Tours</h2>
			<p class="text-secondary mb-6">You need at least one active tour to create flyers</p>
			<a href="/tours/new" class="button button--primary">
				Create Tour
			</a>
		</div>
	{:else}
		<!-- Layout Selection -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Layout class="w-5 h-5" />
				Choose Flyer Layout
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedLayout === 'single' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedLayout = 'single'}
				>
					<h3 class="font-semibold text-primary mb-2">Single Tour</h3>
					<p class="text-sm text-secondary">Feature one tour with detailed information</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedLayout === 'multi' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedLayout = 'multi'}
				>
					<h3 class="font-semibold text-primary mb-2">Multi Tour</h3>
					<p class="text-sm text-secondary">Showcase up to 4 tours in a grid</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedLayout === 'list' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedLayout = 'list'}
				>
					<h3 class="font-semibold text-primary mb-2">Tour List</h3>
					<p class="text-sm text-secondary">Simple list of all your active tours</p>
				</button>
			</div>
		</div>
		
		<!-- Style Selection -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Palette class="w-5 h-5" />
				Visual Style
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedStyle === 'modern' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedStyle = 'modern'}
				>
					<h3 class="font-semibold text-primary mb-2">Modern</h3>
					<p class="text-sm text-secondary">Clean design with subtle colors</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedStyle === 'classic' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedStyle = 'classic'}
				>
					<h3 class="font-semibold text-primary mb-2">Classic</h3>
					<p class="text-sm text-secondary">Traditional layout with borders</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedStyle === 'bold' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedStyle = 'bold'}
				>
					<h3 class="font-semibold text-primary mb-2">Bold</h3>
					<p class="text-sm text-secondary">Eye-catching with strong colors</p>
				</button>
			</div>
		</div>
		
		<!-- Configuration -->
		<div class="professional-card mb-6">
			<h2 class="text-lg font-semibold text-primary mb-4">Configuration</h2>
			<div class="space-y-4">
				{#if selectedLayout === 'single'}
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
					<label for="headline" class="block text-sm font-medium text-secondary mb-2">
						Custom Headline (optional)
					</label>
					<input
						id="headline"
						type="text"
						bind:value={customHeadline}
						placeholder={defaultHeadline}
						maxlength="60"
						class="w-full max-w-md"
					/>
					<p class="text-xs text-secondary mt-1">Leave empty to use default: "{defaultHeadline}"</p>
				</div>
				
				<div class="flex flex-col gap-3 max-w-md">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeContact}
							class="rounded"
						/>
						<span class="text-sm text-primary">Include contact information</span>
					</label>
					
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
				onclick={generatePDF}
				disabled={generating || (selectedLayout === 'single' && !selectedTourId)}
			>
				{#if generating}
					<div class="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
					Generating...
				{:else}
					<Download class="w-5 h-5" />
					Generate Flyer
				{/if}
			</button>
		</div>
		
		<!-- Preview Info -->
		<div class="professional-card mt-8">
			<h3 class="text-lg font-semibold text-primary mb-4">What's Included</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
				<div>
					<h4 class="font-medium text-primary mb-2">All Flyers Include:</h4>
					<ul class="space-y-1 text-secondary">
						<li>• Your business name and branding</li>
						<li>• Tour descriptions and pricing</li>
						<li>• Professional layout optimized for print</li>
						<li>• A4 size PDF ready for printing</li>
					</ul>
				</div>
				<div>
					<h4 class="font-medium text-primary mb-2">Optional Elements:</h4>
					<ul class="space-y-1 text-secondary">
						<li>• QR code linking to your profile</li>
						<li>• Contact information (phone, email, website)</li>
						<li>• Custom headlines and taglines</li>
						<li>• Tour images (if available)</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Hidden Print Container -->
<div class="flyer-print-container hidden" style="position: absolute; left: -9999px; background: white;">
	<div class="print-page" style="width: 210mm; height: 297mm; padding: 15mm; background: white; font-family: Arial, sans-serif;">
		<!-- Single Tour Layout -->
		{#if selectedLayout === 'single' && selectedTour}
			<div class="flyer-single">
				<!-- Header -->
				<div style="text-align: center; margin-bottom: 30px;">
					<h1 style="font-size: 36pt; font-weight: bold; margin: 0; color: #1f2937;">{headline}</h1>
					{#if profile?.businessName}
						<p style="font-size: 16pt; color: #6b7280; margin-top: 10px;">by {profile.businessName}</p>
					{/if}
				</div>

				<!-- Tour Image placeholder -->
				<div style="height: 200px; background: #f3f4f6; border-radius: 12px; margin-bottom: 30px; display: flex; align-items: center; justify-content: center;">
					<span style="color: #9ca3af; font-size: 14pt;">Tour Image</span>
				</div>

				<!-- Tour Details -->
				<div style="margin-bottom: 30px;">
					<h2 style="font-size: 24pt; font-weight: bold; color: #1f2937; margin-bottom: 15px;">Tour Details</h2>
					<p style="font-size: 14pt; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">{selectedTour.description || 'Join us for an unforgettable experience!'}</p>
					
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
						<div>
							<p style="font-size: 12pt; color: #6b7280; margin: 0;">Duration</p>
							<p style="font-size: 16pt; font-weight: bold; color: #1f2937; margin: 0;">{selectedTour.duration || 60} minutes</p>
						</div>
						<div>
							<p style="font-size: 12pt; color: #6b7280; margin: 0;">Price</p>
							<p style="font-size: 16pt; font-weight: bold; color: #1f2937; margin: 0;">{formatCurrency(selectedTour.price, selectedTour.currency)}</p>
						</div>
					</div>

					{#if selectedTour.location}
						<div>
							<p style="font-size: 12pt; color: #6b7280; margin: 0;">Meeting Point</p>
							<p style="font-size: 14pt; color: #1f2937; margin: 0;">{selectedTour.location}</p>
						</div>
					{/if}
				</div>

				<!-- Footer with QR and Contact -->
				<div style="border-top: 2px solid #e5e7eb; padding-top: 30px; display: flex; justify-content: space-between; align-items: center;">
					{#if includeQR && profileQRCode}
						<div style="text-align: center;">
							<img src={profileQRCode} alt="QR Code" style="width: 120px; height: 120px;" />
							<p style="font-size: 10pt; color: #6b7280; margin-top: 5px;">Scan to book</p>
						</div>
					{/if}
					
					{#if includeContact}
						<div style="text-align: right;">
							<p style="font-size: 14pt; font-weight: bold; color: #1f2937; margin: 0;">Contact Us</p>
							{#if profile?.phone}
								<p style="font-size: 12pt; color: #4b5563; margin: 5px 0;">{profile.phone}</p>
							{/if}
							{#if profile?.email}
								<p style="font-size: 12pt; color: #4b5563; margin: 5px 0;">{profile.email}</p>
							{/if}
							{#if profile?.website}
								<p style="font-size: 12pt; color: #4b5563; margin: 5px 0;">{profile.website}</p>
							{/if}
							<p style="font-size: 12pt; color: #2563eb; margin: 5px 0;">zaur.app/{profile?.username}</p>
						</div>
					{/if}
				</div>
			</div>
		{:else if selectedLayout === 'multi'}
			<!-- Multi Tour Layout -->
			<div class="flyer-multi">
				<!-- Header -->
				<div style="text-align: center; margin-bottom: 30px;">
					<h1 style="font-size: 32pt; font-weight: bold; margin: 0; color: #1f2937;">{headline}</h1>
					{#if profile?.businessName}
						<p style="font-size: 16pt; color: #6b7280; margin-top: 10px;">{profile.businessName}</p>
					{/if}
				</div>

				<!-- Tours Grid -->
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
					{#each activeTours.slice(0, 4) as tour}
						<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
							<h3 style="font-size: 16pt; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">{tour.name}</h3>
							<p style="font-size: 11pt; color: #6b7280; margin: 0 0 15px 0; height: 40px; overflow: hidden;">{tour.description || 'Amazing experience'}</p>
							<div style="display: flex; justify-content: space-between; align-items: center;">
								<span style="font-size: 14pt; font-weight: bold; color: #2563eb;">{formatCurrency(tour.price, tour.currency)}</span>
								<span style="font-size: 11pt; color: #6b7280;">{tour.duration || 60} min</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Footer -->
				<div style="border-top: 2px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
					{#if includeQR && profileQRCode}
						<div style="text-align: center;">
							<img src={profileQRCode} alt="QR Code" style="width: 100px; height: 100px;" />
							<p style="font-size: 9pt; color: #6b7280; margin-top: 5px;">Scan for all tours</p>
						</div>
					{/if}
					
					<div style="text-align: center; flex: 1;">
						<p style="font-size: 14pt; font-weight: bold; color: #2563eb; margin: 0;">Book Online</p>
						<p style="font-size: 12pt; color: #4b5563; margin: 5px 0;">zaur.app/{profile?.username}</p>
					</div>
					
					{#if includeContact}
						<div style="text-align: right;">
							{#if profile?.phone}
								<p style="font-size: 11pt; color: #4b5563; margin: 3px 0;">{profile.phone}</p>
							{/if}
							{#if profile?.email}
								<p style="font-size: 11pt; color: #4b5563; margin: 3px 0;">{profile.email}</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{:else if selectedLayout === 'list'}
			<!-- List Layout -->
			<div class="flyer-list">
				<!-- Header -->
				<div style="text-align: center; margin-bottom: 30px;">
					<h1 style="font-size: 28pt; font-weight: bold; margin: 0; color: #1f2937;">{headline}</h1>
					{#if profile?.businessName}
						<p style="font-size: 14pt; color: #6b7280; margin-top: 10px;">{profile.businessName}</p>
					{/if}
				</div>

				<!-- Tours List -->
				<div style="margin-bottom: 30px;">
					{#each activeTours as tour, i}
						<div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0;">
							<div style="display: flex; justify-content: space-between; align-items: start;">
								<div style="flex: 1;">
									<h3 style="font-size: 14pt; font-weight: bold; color: #1f2937; margin: 0 0 5px 0;">{tour.name}</h3>
									<p style="font-size: 11pt; color: #6b7280; margin: 0;">{tour.description || 'Join us for an amazing experience'}</p>
								</div>
								<div style="text-align: right; margin-left: 20px;">
									<p style="font-size: 14pt; font-weight: bold; color: #2563eb; margin: 0;">{formatCurrency(tour.price, tour.currency)}</p>
									<p style="font-size: 10pt; color: #6b7280; margin: 0;">{tour.duration || 60} minutes</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Footer -->
				<div style="display: flex; justify-content: space-between; align-items: center;">
					{#if includeQR && profileQRCode}
						<div>
							<img src={profileQRCode} alt="QR Code" style="width: 80px; height: 80px;" />
						</div>
					{/if}
					
					<div style="text-align: center; flex: 1;">
						<p style="font-size: 12pt; font-weight: bold; color: #1f2937; margin: 0;">Book Your Tour Today!</p>
						<p style="font-size: 14pt; color: #2563eb; margin: 5px 0;">zaur.app/{profile?.username}</p>
					</div>
					
					{#if includeContact && profile}
						<div style="text-align: right;">
							<p style="font-size: 10pt; color: #4b5563; margin: 2px 0;">{profile.phone || ''}</p>
							<p style="font-size: 10pt; color: #4b5563; margin: 2px 0;">{profile.email || ''}</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.hidden {
		display: none !important;
	}
</style> 