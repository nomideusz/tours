<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/layout/MobilePageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import FileText from 'lucide-svelte/icons/file-text';
	import User from 'lucide-svelte/icons/user';
	import Image from 'lucide-svelte/icons/image';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Layout from 'lucide-svelte/icons/layout';
	import Type from 'lucide-svelte/icons/type';
	// @ts-ignore
	import html2canvas from 'html2canvas';
	// @ts-ignore
	import jsPDF from 'jspdf';
	
	// Components
	import MarketingNav from '$lib/components/layout/MarketingNav.svelte';
	
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

<div class="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile Header -->
	<MobilePageHeader
		title="Promotional Flyers"
		secondaryInfo={profile && activeTours.length > 0 ? `${selectedLayout} layout • ${selectedStyle} style` : activeTours.length === 0 ? 'No active tours' : 'Set up your profile first'}
		primaryAction={{
			label: "Generate PDF",
			icon: Download,
			onclick: generatePDF,
			disabled: generating || (selectedLayout === 'single' && !selectedTourId),
			variant: "primary"
		}}
	/>
	
	<!-- Desktop Header -->
	<div class="hidden sm:block">
		<PageHeader title="Promotional Flyers" />
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
			<p class="text-secondary mb-4">Set up your username to create flyers</p>
			<button onclick={() => goto('/profile')} class="button-primary">
				Complete Profile
			</button>
		</div>
	{:else if activeTours.length === 0}
		<div class="professional-card max-w-md mx-auto text-center py-8">
			<FileText class="w-8 h-8 mx-auto mb-3 text-secondary" />
			<h2 class="text-lg font-semibold text-primary mb-2">No Active Tours</h2>
			<p class="text-secondary mb-4">Create at least one active tour first</p>
			<button onclick={() => goto('/tours/new')} class="button-primary">
				Create Tour
			</button>
		</div>
	{:else}
		<!-- Mobile Layout -->
		<div class="sm:hidden space-y-4">
			<!-- Flyer Preview -->
			<div class="professional-card">
				<div class="p-4">
					<div class="aspect-[210/297] max-w-[280px] mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-border">
						{#if selectedLayout === 'single' && selectedTour}
							<!-- Mobile Single Tour Preview -->
							<div class="p-3 h-full flex flex-col">
								<div class="text-center mb-2">
									<h2 class="text-lg font-bold text-primary">{headline}</h2>
									{#if profile?.businessName}
										<p class="text-secondary mt-1 text-xs">by {profile.businessName}</p>
									{/if}
								</div>
								<div class="flex-1 bg-secondary rounded-lg mb-3 flex items-center justify-center">
									<Image class="w-8 h-8 text-tertiary" />
								</div>
								<div class="space-y-1">
									<h3 class="font-semibold text-sm">{selectedTour.name}</h3>
									<p class="text-xs text-secondary line-clamp-2">{selectedTour.description}</p>
									<p class="font-bold text-sm text-primary">{formatCurrency(selectedTour.price, selectedTour.currency)}</p>
								</div>
								{#if includeQR && profileQRCode}
									<div class="mt-3 flex justify-center">
										<div class="w-12 h-12 bg-secondary rounded flex items-center justify-center">
											<QrCode class="w-8 h-8 text-tertiary" />
										</div>
									</div>
								{/if}
							</div>
						{:else if selectedLayout === 'multi'}
							<!-- Mobile Multi Tour Preview -->
							<div class="p-3 h-full flex flex-col">
								<div class="text-center mb-2">
									<h2 class="text-lg font-bold text-primary">{headline}</h2>
									{#if profile?.businessName}
										<p class="text-secondary mt-1 text-xs">by {profile.businessName}</p>
									{/if}
								</div>
								<div class="grid grid-cols-2 gap-2 flex-1">
									{#each activeTours.slice(0, 4) as tour}
										<div class="bg-secondary rounded p-2">
											<h4 class="font-medium text-xs mb-1">{tour.name}</h4>
											<p class="text-xs text-secondary">{formatCurrency(tour.price, tour.currency)}</p>
										</div>
									{/each}
								</div>
							</div>
						{:else if selectedLayout === 'list'}
							<!-- Mobile List Preview -->
							<div class="p-3 h-full flex flex-col">
								<div class="text-center mb-2">
									<h2 class="text-lg font-bold text-primary">{headline}</h2>
									{#if profile?.businessName}
										<p class="text-secondary mt-1 text-xs">by {profile.businessName}</p>
									{/if}
								</div>
								<div class="space-y-1 flex-1">
									{#each activeTours.slice(0, 6) as tour}
										<div class="flex justify-between items-center py-0.5 border-b border-border">
											<span class="text-xs">{tour.name}</span>
											<span class="text-xs font-medium">{formatCurrency(tour.price, tour.currency)}</span>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<!-- No tour selected -->
							<div class="h-full flex items-center justify-center">
								<div class="text-center">
									<FileText class="w-8 h-8 mx-auto mb-2 text-tertiary" />
									<p class="text-secondary text-xs">Select options</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Design Options -->
			<div class="professional-card">
				<div class="p-4 border-b border-border">
					<h3 class="font-semibold text-primary">Design Options</h3>
				</div>
				<div class="p-4 space-y-4">
					<!-- Layout Selection -->
					<div>
						<div class="text-sm font-medium text-primary mb-3">Flyer Layout</div>
						<div class="space-y-2">
							<button
								onclick={() => selectedLayout = 'single'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedLayout === 'single' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								Single Tour
							</button>
							<button
								onclick={() => selectedLayout = 'multi'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedLayout === 'multi' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								Multi Tour
							</button>
							<button
								onclick={() => selectedLayout = 'list'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedLayout === 'list' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								Tour List
							</button>
						</div>
					</div>
					
					<!-- Style Selection -->
					<div>
						<div class="text-sm font-medium text-primary mb-3">Visual Style</div>
						<div class="space-y-2">
							{#each ['modern', 'classic', 'bold'] as style}
								<button
									onclick={() => selectedStyle = style as 'modern' | 'classic' | 'bold'}
									class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedStyle === style 
										? 'bg-secondary text-primary font-medium' 
										: 'text-secondary hover:bg-tertiary hover:text-primary'}"
								>
									{style.charAt(0).toUpperCase() + style.slice(1)}
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Tour Selection -->
					{#if selectedLayout === 'single'}
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
					
					<!-- Headline -->
					<div>
						<label for="headline" class="text-sm font-medium text-primary mb-2 block">
							Custom Headline
						</label>
						<input
							id="headline"
							type="text"
							bind:value={customHeadline}
							placeholder={defaultHeadline}
							maxlength="60"
							class="form-input"
						/>
						<p class="text-xs text-secondary mt-1">Default: "{defaultHeadline}"</p>
					</div>
					
					<!-- Options -->
					<div class="space-y-2">
						<label class="flex items-center gap-2 cursor-pointer text-sm">
							<input
								type="checkbox"
								bind:checked={includeContact}
								class="rounded"
							/>
							<span class="text-primary">Include contact info</span>
						</label>
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
		</div>

		<!-- Desktop Layout -->
		<div class="hidden sm:grid gap-6 lg:grid-cols-[300px_1fr]">
			<!-- Options Sidebar -->
			<div class="professional-card h-fit">
				<div class="p-4 border-b border-border">
					<h3 class="font-semibold text-primary">Design Options</h3>
				</div>
				<div class="p-4 space-y-6">
					<!-- Layout Selection -->
					<div>
						<div class="text-sm font-medium text-primary mb-3">Flyer Layout</div>
						<div class="space-y-2">
							<button
								onclick={() => selectedLayout = 'single'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedLayout === 'single' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								Single Tour
							</button>
							<button
								onclick={() => selectedLayout = 'multi'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedLayout === 'multi' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								Multi Tour
							</button>
							<button
								onclick={() => selectedLayout = 'list'}
								class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedLayout === 'list' 
									? 'bg-secondary text-primary font-medium' 
									: 'text-secondary hover:bg-tertiary hover:text-primary'}"
							>
								Tour List
							</button>
						</div>
					</div>
					
					<!-- Style Selection -->
					<div>
						<div class="text-sm font-medium text-primary mb-3">Visual Style</div>
						<div class="space-y-2">
							{#each ['modern', 'classic', 'bold'] as style}
								<button
									onclick={() => selectedStyle = style as 'modern' | 'classic' | 'bold'}
									class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedStyle === style 
										? 'bg-secondary text-primary font-medium' 
										: 'text-secondary hover:bg-tertiary hover:text-primary'}"
								>
									{style.charAt(0).toUpperCase() + style.slice(1)}
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Tour Selection -->
					{#if selectedLayout === 'single'}
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
					
					<!-- Headline -->
					<div>
						<label for="headline" class="text-sm font-medium text-primary mb-2 block">
							Custom Headline
						</label>
						<input
							id="headline"
							type="text"
							bind:value={customHeadline}
							placeholder={defaultHeadline}
							maxlength="60"
							class="form-input"
						/>
						<p class="text-xs text-secondary mt-1">Default: "{defaultHeadline}"</p>
					</div>
					
					<!-- Options -->
					<div class="space-y-2">
						<label class="flex items-center gap-2 cursor-pointer text-sm">
							<input
								type="checkbox"
								bind:checked={includeContact}
								class="rounded"
							/>
							<span class="text-primary">Include contact info</span>
						</label>
						
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
						onclick={generatePDF}
						class="button-primary button-small"
						disabled={generating || (selectedLayout === 'single' && !selectedTourId)}
					>
						{#if generating}
							<div class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
							Generating...
						{:else}
							<Download class="w-4 h-4" />
							Generate PDF
						{/if}
					</button>
				</div>
				
				<div class="p-6">
					<!-- Desktop Flyer Preview -->
					<div class="aspect-[210/297] max-w-[400px] mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-border">
						{#if selectedLayout === 'single' && selectedTour}
							<!-- Desktop Single Tour Preview -->
							<div class="p-6 h-full flex flex-col">
								<div class="text-center mb-4">
									<h2 class="text-2xl font-bold text-primary">{headline}</h2>
									{#if profile?.businessName}
										<p class="text-secondary mt-1">by {profile.businessName}</p>
									{/if}
								</div>
								
								<div class="flex-1 bg-secondary rounded-lg mb-4 flex items-center justify-center">
									<Image class="w-12 h-12 text-tertiary" />
								</div>
								
								<div class="space-y-2">
									<h3 class="font-semibold text-lg">{selectedTour.name}</h3>
									<p class="text-sm text-secondary line-clamp-3">{selectedTour.description}</p>
									<p class="font-bold text-lg text-primary">{formatCurrency(selectedTour.price, selectedTour.currency)}</p>
								</div>
								
								{#if includeQR && profileQRCode}
									<div class="mt-4 flex justify-center">
										<div class="w-16 h-16 bg-secondary rounded flex items-center justify-center">
											<QrCode class="w-10 h-10 text-tertiary" />
										</div>
									</div>
								{/if}
							</div>
						{:else if selectedLayout === 'multi'}
							<!-- Multi Tour Preview -->
							<div class="p-6 h-full flex flex-col">
								<div class="text-center mb-4">
									<h2 class="text-2xl font-bold text-primary">{headline}</h2>
									{#if profile?.businessName}
										<p class="text-secondary mt-1">by {profile.businessName}</p>
									{/if}
								</div>
								
								<div class="grid grid-cols-2 gap-3 flex-1">
									{#each activeTours.slice(0, 4) as tour}
										<div class="bg-secondary rounded p-3">
											<h4 class="font-medium text-sm mb-1">{tour.name}</h4>
											<p class="text-xs text-secondary">{formatCurrency(tour.price, tour.currency)}</p>
										</div>
									{/each}
								</div>
							</div>
						{:else if selectedLayout === 'list'}
							<!-- List Preview -->
							<div class="p-6 h-full flex flex-col">
								<div class="text-center mb-4">
									<h2 class="text-2xl font-bold text-primary">{headline}</h2>
									{#if profile?.businessName}
										<p class="text-secondary mt-1">by {profile.businessName}</p>
									{/if}
								</div>
								
								<div class="space-y-2 flex-1">
									{#each activeTours.slice(0, 8) as tour}
										<div class="flex justify-between items-center py-1 border-b border-border">
											<span class="text-sm">{tour.name}</span>
											<span class="text-sm font-medium">{formatCurrency(tour.price, tour.currency)}</span>
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<!-- No tour selected -->
							<div class="h-full flex items-center justify-center">
								<div class="text-center">
									<FileText class="w-12 h-12 mx-auto mb-3 text-tertiary" />
									<p class="text-secondary">Select options to preview</p>
								</div>
							</div>
						{/if}
					</div>
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