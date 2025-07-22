<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Eye from 'lucide-svelte/icons/eye';
	import FileText from 'lucide-svelte/icons/file-text';
	import Palette from 'lucide-svelte/icons/palette';
	import User from 'lucide-svelte/icons/user';
	import Image from 'lucide-svelte/icons/image';
	import Type from 'lucide-svelte/icons/type';
	import Layout from 'lucide-svelte/icons/layout';
	
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
	
	async function generatePDF() {
		if (!profile?.username) {
			alert('Please complete your profile first');
			return;
		}
		
		if (selectedLayout === 'single' && !selectedTourId) {
			alert('Please select a tour for single tour flyer');
			return;
		}
		
		generating = true;
		try {
			const response = await fetch('/api/marketing/generate-flyers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					layout: selectedLayout,
					style: selectedStyle,
					tourId: selectedTourId,
					tours: selectedLayout === 'multi' ? activeTours.slice(0, 4) : activeTours,
					profile,
					headline,
					includeContact,
					includeQR
				})
			});
			
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${profile.username}-flyer-${selectedLayout}-${new Date().toISOString().split('T')[0]}.pdf`;
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				const errorText = await response.text();
				console.error('Failed to generate flyer PDF:', errorText);
				
				if (response.status === 503) {
					alert('The PDF generation service is temporarily unavailable. Please try again in a few moments.');
				} else {
					alert('Failed to generate PDF. Please try again.');
				}
			}
		} catch (error) {
			console.error('Error generating flyer:', error);
			alert('Error generating PDF. Please try again.');
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