<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	
	// Icons
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Download from 'lucide-svelte/icons/download';
	import Printer from 'lucide-svelte/icons/printer';
	import FileText from 'lucide-svelte/icons/file-text';
	import Palette from 'lucide-svelte/icons/palette';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import User from 'lucide-svelte/icons/user';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Sticker from 'lucide-svelte/icons/sticker';
	import Image from 'lucide-svelte/icons/image';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	
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

	// Tours data query for statistics
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
	let isLoading = $derived($profileQuery.isLoading || $toursQuery.isLoading);
	let error = $derived($profileQuery.error || $toursQuery.error);
	let activeTours = $derived(tours.filter((tour: any) => tour.status === 'active'));

	const materials = [
		{
			title: 'Business Cards',
			description: 'Professional business cards with your QR code and contact details',
			href: '/marketing/business-cards',
			icon: CreditCard,
			color: 'primary',
			features: ['Multiple templates', 'Custom color schemes', 'Print-ready quality', 'QR code integration']
		},
		{
			title: 'Promotional Stickers',
			description: 'Personalized stickers with your profile QR code for marketing campaigns',
			href: '/marketing/stickers',
			icon: Sticker,
			color: 'orange',
			features: ['3 design styles', 'Custom taglines', '6 per A4 page', 'Easy distribution']
		},
		{
			title: 'Promotional Flyers',
			description: 'A4 flyers to showcase your tours at events and partner locations',
			href: '/marketing/flyers',
			icon: FileText,
			color: 'teal',
			features: ['Single/multi tour layouts', '3 visual styles', 'Tour details included', 'Contact information']
		},
		{
			title: 'Social Media Graphics',
			description: 'Eye-catching graphics for Instagram, Facebook, and other platforms',
			href: '/marketing/social',
			icon: Image,
			color: 'purple',
			features: ['5 platform formats', '4 content templates', 'Multiple color themes', 'Optimized dimensions']
		}
	];
</script>

<svelte:head>
	<title>Marketing Materials - Zaur</title>
	<meta name="description" content="Create professional marketing materials for your tour business" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="marketing-header-icon w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50">
				<Sparkles class="w-5 h-5 text-primary" />
			</div>
			<h1 class="text-2xl font-bold text-primary">Marketing Materials</h1>
		</div>
		<p class="text-lg text-secondary">
			Create professional marketing materials to promote your tours
		</p>
	</div>

	<MarketingNav />

	{#if isLoading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="text-center">
				<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
				<p class="font-medium text-primary">Loading your data...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="professional-card text-center py-12">
			<AlertCircle class="w-12 h-12 mx-auto mb-4 text-danger" />
			<h3 class="text-lg font-semibold mb-2 text-primary">Unable to Load Data</h3>
			<p class="text-secondary">Please try refreshing the page or check your connection.</p>
		</div>
	{:else if !profile?.username}
		<!-- Setup Required -->
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">Set up your username to start creating marketing materials</p>
			<button onclick={() => goto('/profile')} class="button button--primary">
				Complete Profile
			</button>
		</div>
	{:else}
		<!-- Marketing Materials Overview -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Materials Grid -->
			<div class="lg:col-span-2 space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#each materials as material}
						<div class="professional-card group hover:border-{material.color}-200 transition-all duration-200">
							<div class="p-6">
								<div class="flex items-center gap-3 mb-4">
									<div class="material-icon w-12 h-12 rounded-xl flex items-center justify-center bg-{material.color}-50" data-color={material.color}>
										<svelte:component this={material.icon} class="w-6 h-6 text-{material.color}-600" />
									</div>
									<h3 class="text-xl font-semibold text-primary">{material.title}</h3>
								</div>
								
								<p class="text-secondary mb-4">{material.description}</p>
								
								<ul class="space-y-2 mb-6">
									{#each material.features as feature}
										<li class="flex items-center gap-2 text-sm text-secondary">
											<CheckCircle class="w-4 h-4 text-{material.color}-500 flex-shrink-0" />
											{feature}
										</li>
									{/each}
								</ul>
								
								<button onclick={() => goto(material.href)} class="button button--primary w-full flex items-center justify-center gap-2 group-hover:bg-{material.color}-600">
									Create {material.title}
									<ArrowRight class="w-4 h-4" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Sidebar Info -->
			<div class="space-y-6">
				<!-- Profile Status -->
				<div class="professional-card">
					<div class="p-4 border-b border-border">
						<h3 class="font-semibold text-primary">Profile Status</h3>
					</div>
					<div class="p-4 space-y-4">
						<div class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-success" />
							<span class="text-sm text-primary">Profile completed</span>
						</div>
						<div class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-success" />
							<span class="text-sm text-primary">Username set: {profile.username}</span>
						</div>
						<div class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 {activeTours.length > 0 ? 'text-success' : 'text-secondary'}" />
							<span class="text-sm {activeTours.length > 0 ? 'text-primary' : 'text-secondary'}">
								{activeTours.length} active tour{activeTours.length !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
				</div>
				
				<!-- Quick Links -->
				<div class="professional-card">
					<div class="p-4 border-b border-border">
						<h3 class="font-semibold text-primary">Quick Links</h3>
					</div>
					<div class="p-4 space-y-3">
						<a href="https://zaur.app/{profile.username}" target="_blank" class="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
							<ExternalLink class="w-4 h-4" />
							Your public profile
						</a>
						<a href="/profile" class="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
							<User class="w-4 h-4" />
							Edit profile
						</a>
						<a href="/tours" class="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
							<FileText class="w-4 h-4" />
							Manage tours
						</a>
					</div>
				</div>
				
				<!-- Tips -->
				<div class="professional-card">
					<div class="p-4 border-b border-border">
						<h3 class="font-semibold text-primary">Marketing Tips</h3>
					</div>
					<div class="p-4 space-y-3 text-sm text-secondary">
						<p>• Use QR codes on all materials for easy booking</p>
						<p>• Maintain consistent branding across platforms</p>
						<p>• Include contact info on printed materials</p>
						<p>• Test designs on mobile devices</p>
						<p>• Track performance with analytics</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Icon backgrounds - light mode */
	.marketing-header-icon {
		background-color: rgba(250, 107, 93, 0.1);
	}
	
	.material-icon[data-color="primary"] {
		background-color: rgba(250, 107, 93, 0.1);
	}
	
	.material-icon[data-color="orange"] {
		background-color: rgba(255, 173, 90, 0.1);
	}
	
	.material-icon[data-color="teal"] {
		background-color: rgba(79, 157, 166, 0.1);
	}
	
	.material-icon[data-color="purple"] {
		background-color: rgba(139, 92, 246, 0.1);
	}
	
	/* Icon colors - light mode */
	.marketing-header-icon svg {
		color: #e8523e;
	}
	
	.material-icon[data-color="primary"] svg {
		color: #e8523e;
	}
	
	.material-icon[data-color="orange"] svg {
		color: #dd6b20;
	}
	
	.material-icon[data-color="teal"] svg {
		color: #0d9488;
	}
	
	.material-icon[data-color="purple"] svg {
		color: #7c3aed;
	}
	
	/* Dark mode adjustments */
	[data-theme="dark"] .marketing-header-icon,
	[data-theme="dark"] .material-icon {
		background-color: rgba(255, 255, 255, 0.1) !important;
	}
	
	[data-theme="dark"] .marketing-header-icon svg {
		color: #ff8a73 !important;
	}
	
	[data-theme="dark"] .material-icon[data-color="primary"] svg {
		color: #ff8a73 !important;
	}
	
	[data-theme="dark"] .material-icon[data-color="orange"] svg {
		color: #ffad5a !important;
	}
	
	[data-theme="dark"] .material-icon[data-color="teal"] svg {
		color: #5eead4 !important;
	}
	
	[data-theme="dark"] .material-icon[data-color="purple"] svg {
		color: #a78bfa !important;
	}
</style>