<script lang="ts">
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
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
	let tours = $derived($toursQuery.data?.tours || []);
	let activeTours = $derived(tours.filter((tour: any) => tour.status === 'active'));
	
	let generating = $state(false);
	let selectedPlatform = $state<'instagram-post' | 'instagram-story' | 'facebook' | 'twitter' | 'linkedin'>('instagram-post');
	let selectedTemplate = $state<'tour-promo' | 'profile-intro' | 'schedule' | 'testimonial'>('tour-promo');
	let selectedTourId = $state<string>('');
	let customText = $state('');
	let includeQR = $state(true);
	let selectedColor = $state<'brand' | 'vibrant' | 'minimal' | 'dark'>('brand');
	
	let selectedTour = $derived(
		selectedTourId ? tours.find((t: any) => t.id === selectedTourId) : null
	);
	
	// Platform dimensions
	const platformDimensions = {
		'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
		'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
		'facebook': { width: 1200, height: 630, name: 'Facebook Post' },
		'twitter': { width: 1200, height: 675, name: 'Twitter Post' },
		'linkedin': { width: 1200, height: 627, name: 'LinkedIn Post' }
	};
	
	// Default text based on template
	let defaultText = $derived(
		selectedTemplate === 'tour-promo' && selectedTour
			? `Join us for ${selectedTour.name}! 🌟\n\nBook now at zaur.app/${profile?.username}`
			: selectedTemplate === 'profile-intro'
			? `Discover amazing tours with ${profile?.businessName || profile?.name} 🗺️\n\nExplore at zaur.app/${profile?.username}`
			: selectedTemplate === 'schedule'
			? `Check out our upcoming tours! 📅\n\nFull schedule at zaur.app/${profile?.username}`
			: `"Amazing experience!" - Happy Customer ⭐⭐⭐⭐⭐\n\nBook your tour at zaur.app/${profile?.username}`
	);
	
	let text = $derived(customText || defaultText);
	
	async function generateGraphic() {
		if (!profile?.username) {
			alert('Please complete your profile first');
			return;
		}
		
		if (selectedTemplate === 'tour-promo' && !selectedTourId) {
			alert('Please select a tour for tour promotion graphic');
			return;
		}
		
		generating = true;
		try {
			const response = await fetch('/api/marketing/generate-social', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					platform: selectedPlatform,
					template: selectedTemplate,
					tourId: selectedTourId,
					tour: selectedTour,
					profile,
					text,
					includeQR,
					color: selectedColor
				})
			});
			
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${profile.username}-${selectedPlatform}-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.png`;
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				console.error('Failed to generate social media graphic');
				alert('Failed to generate graphic. Please try again.');
			}
		} catch (error) {
			console.error('Error generating social media graphic:', error);
			alert('Error generating graphic. Please try again.');
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
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'instagram-post' ? 'border-purple-200 bg-purple-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'instagram-post'}
				>
					<Instagram class="w-6 h-6 mx-auto mb-2 {selectedPlatform === 'instagram-post' ? 'text-purple-600' : 'text-secondary'}" />
					<h3 class="text-sm font-medium text-primary">Instagram</h3>
					<p class="text-xs text-secondary">Square Post</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'instagram-story' ? 'border-purple-200 bg-purple-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'instagram-story'}
				>
					<Instagram class="w-6 h-6 mx-auto mb-2 {selectedPlatform === 'instagram-story' ? 'text-purple-600' : 'text-secondary'}" />
					<h3 class="text-sm font-medium text-primary">IG Story</h3>
					<p class="text-xs text-secondary">9:16 Vertical</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'facebook' ? 'border-blue-200 bg-blue-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'facebook'}
				>
					<Facebook class="w-6 h-6 mx-auto mb-2 {selectedPlatform === 'facebook' ? 'text-blue-600' : 'text-secondary'}" />
					<h3 class="text-sm font-medium text-primary">Facebook</h3>
					<p class="text-xs text-secondary">Link Post</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'twitter' ? 'border-sky-200 bg-sky-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'twitter'}
				>
					<Twitter class="w-6 h-6 mx-auto mb-2 {selectedPlatform === 'twitter' ? 'text-sky-600' : 'text-secondary'}" />
					<h3 class="text-sm font-medium text-primary">Twitter</h3>
					<p class="text-xs text-secondary">Tweet Image</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedPlatform === 'linkedin' ? 'border-blue-200 bg-blue-50' : 'border-border'}"
					onclick={() => selectedPlatform = 'linkedin'}
				>
					<Linkedin class="w-6 h-6 mx-auto mb-2 {selectedPlatform === 'linkedin' ? 'text-blue-700' : 'text-secondary'}" />
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
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'tour-promo' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'tour-promo'}
				>
					<h3 class="font-semibold text-primary mb-1">Tour Promotion</h3>
					<p class="text-sm text-secondary">Highlight a specific tour</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'profile-intro' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'profile-intro'}
				>
					<h3 class="font-semibold text-primary mb-1">Profile Introduction</h3>
					<p class="text-sm text-secondary">Introduce your business</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'schedule' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'schedule'}
				>
					<h3 class="font-semibold text-primary mb-1">Tour Schedule</h3>
					<p class="text-sm text-secondary">Show upcoming tours</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-left {selectedTemplate === 'testimonial' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedTemplate = 'testimonial'}
				>
					<h3 class="font-semibold text-primary mb-1">Testimonial</h3>
					<p class="text-sm text-secondary">Customer review template</p>
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
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'brand' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'brand'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-br from-orange-400 to-coral-500"></div>
					<h3 class="text-sm font-medium text-primary">Brand Colors</h3>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'vibrant' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'vibrant'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-br from-purple-500 to-pink-500"></div>
					<h3 class="text-sm font-medium text-primary">Vibrant</h3>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'minimal' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'minimal'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gray-100 border-2 border-gray-300"></div>
					<h3 class="text-sm font-medium text-primary">Minimal</h3>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer text-center {selectedColor === 'dark' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedColor = 'dark'}
				>
					<div class="w-12 h-12 rounded-full mx-auto mb-2 bg-gray-900"></div>
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
						placeholder={defaultText}
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