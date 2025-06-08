<script lang="ts">
	import type { PageData } from './$types.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MessageCircle from 'lucide-svelte/icons/message-circle';

	let { data }: { data: PageData } = $props();

	const { profile } = data;
</script>

<svelte:head>
	<title>{profile.name} (@{profile.username}) - Zaur</title>
	<meta name="description" content="{profile.name}'s tour guide profile{profile.description ? ` - ${profile.description}` : ''}" />
	<meta property="og:title" content="{profile.name} - Tour Guide" />
	<meta property="og:description" content="{profile.description || `${profile.name} is a professional tour guide`}" />
	<meta property="og:url" content="https://zaur.app/{profile.username}" />
	<meta property="og:type" content="profile" />
	{#if profile.avatar}
		<meta property="og:image" content="{profile.avatar}" />
	{/if}
</svelte:head>

<div class="bg-gray-50">
	<!-- Main Profile Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Profile Card -->
		<div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
			<!-- Cover/Header Section -->
			<div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 sm:px-8 sm:py-12">
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
					<!-- Avatar -->
					<div class="flex-shrink-0">
						{#if profile.avatar}
							<img 
								src={profile.avatar} 
								alt={profile.name}
								class="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg"
							/>
						{:else}
							<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
								<User class="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
							</div>
						{/if}
					</div>
					
					<!-- Profile Info -->
					<div class="flex-1 text-white">
						<h1 class="text-3xl sm:text-4xl font-bold mb-2">{profile.name}</h1>
						<p class="text-blue-100 text-lg mb-1">@{profile.username}</p>
						{#if profile.businessName}
							<div class="flex items-center gap-2 mb-3">
								<Building class="w-5 h-5 text-blue-200" />
								<span class="text-blue-100">{profile.businessName}</span>
							</div>
						{/if}
						{#if profile.location}
							<div class="flex items-center gap-2">
								<MapPin class="w-5 h-5 text-blue-200" />
								<span class="text-blue-100">{profile.location}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Profile Details -->
			<div class="px-6 py-6 sm:px-8 sm:py-8">
				{#if profile.description}
					<div class="mb-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-3">About</h2>
						<p class="text-gray-700 leading-relaxed">{profile.description}</p>
					</div>
				{/if}

				<!-- Contact Information -->
				<div class="border-t border-gray-200 pt-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#if profile.website}
							<a 
								href={profile.website}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
							>
								<Globe class="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
								<div>
									<div class="font-medium text-gray-900 group-hover:text-blue-900">Visit Website</div>
									<div class="text-sm text-gray-600">{profile.website.replace(/^https?:\/\//, '')}</div>
								</div>
							</a>
						{/if}
						
						<!-- Placeholder for booking action -->
						<div class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
							<MessageCircle class="w-5 h-5 text-gray-400" />
							<div>
								<div class="font-medium text-gray-600">Book a Tour</div>
								<div class="text-sm text-gray-500">Scan QR code to book</div>
							</div>
						</div>
					</div>
				</div>

				<!-- CTA Section -->
				<div class="border-t border-gray-200 pt-6 mt-6">
					<div class="text-center">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Ready to explore?</h3>
						<p class="text-gray-600 mb-4">Scan a QR code from {profile.name} to book your tour instantly!</p>
						<div class="text-sm text-gray-500">
							Powered by <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">Zaur</a> - 
							<a href="/auth/register" class="text-blue-600 hover:text-blue-800">Create your own profile</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 