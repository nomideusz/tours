<script lang="ts">
	import type { PageData } from './$types.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { auth } from '$lib/stores/auth.js';
	import { createPublicProfileQuery } from '$lib/queries/public-queries.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { getMapService } from '$lib/utils/map-integration.js';
	import { env } from '$env/dynamic/public';
	import { browser } from '$app/environment';
	import TourCard from '$lib/components/TourCard.svelte';
	import TourLocationMap from '$lib/components/booking/TourLocationMap.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Check from 'lucide-svelte/icons/check';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import FileQuestion from 'lucide-svelte/icons/file-question';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import { formatShortAddress } from '$lib/utils/location.js';
	
	let { data }: { data: PageData } = $props();
	
	// Use TanStack Query for real-time data
	let profileQuery = $derived(createPublicProfileQuery(data.username));
	
	// Get data from TanStack Query
	let profile = $derived($profileQuery.data?.profile || null);
	let rawTours = $derived($profileQuery.data?.tours || []);
	let totalTours = $derived($profileQuery.data?.totalTours || 0);
	let isLoading = $derived($profileQuery.isLoading);
	let queryError = $derived($profileQuery.error);
	
	// Check if current user is viewing their own profile
	let isOwnProfile = $derived($auth.user?.username === data.username);
	
	// Filter tours based on who's viewing
	let filteredTours = $derived.by(() => {
		if (isOwnProfile) {
			// Guide sees all their tours
			return rawTours;
		} else {
			// Public visitors only see active tours that are not explicitly unlisted
			// Tours are public by default unless explicitly set to false
			return rawTours.filter((tour: any) => {
				// Check the property - use whichever one exists
				const publicListingValue = tour.publicListing !== undefined ? tour.publicListing : tour.public_listing;
				// Only hide if explicitly set to false (null, undefined, true all mean public)
				const isUnlisted = publicListingValue === false;
				return tour.status === 'active' && !isUnlisted;
			});
		}
	});
	
	// Count of tours visible to public (for guide info)
	let publicToursCount = $derived(rawTours.filter((tour: any) => {
		const publicListingValue = tour.publicListing !== undefined ? tour.publicListing : tour.public_listing;
		const isUnlisted = publicListingValue === false;
		return tour.status === 'active' && !isUnlisted;
	}).length);
	
	// Enhance tours with operator data for TourCard component
	let allTours = $derived(filteredTours.map((tour: any) => ({
		...tour,
		operator: {
			currency: profile?.currency || 'EUR'
		}
	})));
	
	// Pagination calculations
	let totalPages = $derived(Math.ceil(allTours.length / toursPerPage));
	let tours = $derived.by(() => {
		const startIndex = (currentPage - 1) * toursPerPage;
		const endIndex = startIndex + toursPerPage;
		return allTours.slice(startIndex, endIndex);
	});
	
	// Reset to page 1 when filters change
	$effect(() => {
		if (allTours.length) {
			currentPage = 1;
		}
	});
	
	// Pagination handler
	function handlePageChange(page: number) {
		currentPage = page;
	}
	
	// Profile URL and QR code
	let profileURL = $derived(profile?.username ? `https://zaur.app/${profile.username}` : '');
	let qrCodeURL = $derived(profileURL ? generateQRImageURL(profileURL, { 
		size: 200, 
		color: '4B5563', // Subtle gray instead of blue
		style: 'modern'
	}) : '');
	
	// Copy state
	let urlCopied = $state(false);
	
	// Map visibility state
	let showMap = $state(false);
	
	// Pagination state
	let currentPage = $state(1);
	const toursPerPage = 12;
	
	// Location coordinates for map
	let locationCoordinates = $state<{ lat: number; lng: number } | null>(null);
	let isGeocodingLocation = $state(false);
	let geocodingAttempted = $state<string | null>(null);
	
	// Geocode profile location for map (only when map is opened)
	$effect(() => {
		if (showMap &&
		    profile?.location && 
		    !locationCoordinates && 
		    !isGeocodingLocation && 
		    geocodingAttempted !== profile.location && 
		    browser && 
		    env.PUBLIC_GOOGLE_MAPS_API_KEY) {
			
			isGeocodingLocation = true;
			geocodingAttempted = profile.location;
			
			const mapService = getMapService(env.PUBLIC_GOOGLE_MAPS_API_KEY);
			mapService.searchLocations(profile.location)
				.then((results) => {
					if (results.length > 0) {
						locationCoordinates = results[0].coordinates;
						console.log('📍 Geocoded profile location:', profile.location, '→', locationCoordinates);
					}
				})
				.catch((error) => {
					console.warn('Failed to geocode profile location:', error);
				})
				.finally(() => {
					isGeocodingLocation = false;
				});
		}
	});
	
	// Toggle map visibility
	function toggleMap() {
		showMap = !showMap;
	}
	
	// Set tour owner in store for header to use
	$effect(() => {
		if (profile?.username && profile?.name) {
			tourOwnerStore.set({
				username: profile.username,
				name: profile.name
			});
		}
		
		// Clean up when component is destroyed
		return () => {
			tourOwnerStore.set(null);
		};
	});
	
	function getBookingPageURL(qrCode: string) {
		return `/book/${qrCode}`;
	}
	
	// Get tour visibility status
	function getTourStatus(tour: any): { type: 'draft' | 'unlisted' | 'active', label: string, icon: any } | null {
		if (!isOwnProfile) return null;
		
		if (tour.status === 'draft') {
			return { type: 'draft', label: 'Draft', icon: FileQuestion };
		}
		// Check if tour is explicitly unlisted
		const publicListingValue = tour.publicListing !== undefined ? tour.publicListing : tour.public_listing;
		if (publicListingValue === false && tour.status === 'active') {
			return { type: 'unlisted', label: 'Unlisted', icon: EyeOff };
		}
		if (tour.status === 'active') {
			return { type: 'active', label: 'Active', icon: Eye };
		}
		return null;
	}
	
	// Copy URL to clipboard
	async function copyProfileURL() {
		if (!profileURL) return;
		
		try {
			await navigator.clipboard.writeText(profileURL);
			urlCopied = true;
			setTimeout(() => {
				urlCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}
</script>

<svelte:head>
	<title>Book Tours with {profile?.name || data.username} (@{data.username})</title>
	<meta name="description" content="Book tours with {profile?.name || data.username}. {profile?.description || `Professional tour guide offering ${totalTours} tours.`}" />
</svelte:head>

<div class="profile-page">
	<div class="profile-container">
		{#if isLoading}
			<!-- Loading State -->
			<div class="loading-state">
				<Loader2 class="w-12 h-12 animate-spin icon-primary" />
				<p class="loading-title">Loading profile...</p>
				<p class="loading-subtitle">Please wait while we fetch the latest tour information</p>
			</div>
		{:else if queryError || !profile}
			<!-- Error State -->
			<div class="error-state">
				<div class="error-icon-wrapper">
					<AlertCircle class="w-10 h-10 icon-danger" />
				</div>
				<h1 class="error-title">Profile Not Found</h1>
				<p class="error-text">
					The profile @{data.username} could not be found or is not available.
				</p>
				<button 
					onclick={() => $profileQuery.refetch()}
					class="button-primary"
				>
					Try Again
				</button>
			</div>
		{:else}
			<!-- Profile Header -->
			<div class="profile-header">
				<div class="profile-header-content {isOwnProfile ? 'profile-header-with-qr' : ''}">
					<div class="profile-main">
						<!-- Avatar -->
						<div class="profile-avatar-wrapper">
							{#if profile.avatar}
								<img 
									src={profile.avatar} 
									alt={profile.name}
									class="profile-avatar-image"
								/>
							{:else}
								<div class="profile-avatar-placeholder">
									<User class="avatar-icon" />
								</div>
							{/if}
						</div>
						
						<!-- Profile Info -->
						<div class="profile-info">
							<div class="profile-name-section">
								<h1 class="profile-name">{profile.name}</h1>
								<p class="profile-username">@{profile.username}</p>
							</div>
							
							{#if profile.description}
								<p class="profile-description">
									{profile.description}
								</p>
							{/if}
							
							<!-- Info badges (business name and website) -->
							{#if profile.businessName || profile.website}
								<div class="profile-badges">
									{#if profile.businessName}
										<div class="profile-badge">
											<Building class="badge-icon" />
											<span>{profile.businessName}</span>
										</div>
									{/if}
									{#if profile.website}
										<a 
											href={profile.website}
											target="_blank"
											rel="noopener noreferrer"
											class="profile-badge profile-badge-link no-underline"
										>
											<Globe class="badge-icon" />
											<span>{profile.website.replace(/^https?:\/\//, '')}</span>
											<ExternalLink class="w-3 h-3" />
										</a>
									{/if}
								</div>
							{/if}
							
							<!-- Location badge (separate, full width with map reveal) -->
							{#if profile.location}
								<div class="location-section">
									{#if env.PUBLIC_GOOGLE_MAPS_API_KEY}
										<!-- Clickable location badge to reveal map -->
										<button 
											onclick={toggleMap}
											class="profile-badge profile-badge-clickable profile-badge-full-width"
											title="Click to {showMap ? 'hide' : 'show'} map"
										>
											<MapPin class="badge-icon" />
											<span>{formatShortAddress(profile.location)}</span>
											{#if showMap}
												<ChevronUp class="w-3.5 h-3.5 ml-auto" />
											{:else}
												<ChevronDown class="w-3.5 h-3.5 ml-auto" />
											{/if}
										</button>
									{:else}
										<!-- Non-clickable location badge if no maps API key -->
										<div class="profile-badge profile-badge-full-width">
											<MapPin class="badge-icon" />
											<span>{formatShortAddress(profile.location)}</span>
										</div>
									{/if}
									
									<!-- Map reveals here -->
									{#if showMap && locationCoordinates && env.PUBLIC_GOOGLE_MAPS_API_KEY}
										<div class="location-map-reveal">
											{#if isGeocodingLocation}
												<div class="map-loading">
													<Loader2 class="w-6 h-6 animate-spin" />
													<span>Loading map...</span>
												</div>
											{:else}
												<TourLocationMap 
													coordinates={locationCoordinates}
													locationName={profile.location}
													googleMapsApiKey={env.PUBLIC_GOOGLE_MAPS_API_KEY}
												/>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
					
					<!-- QR Code & URL Section (only for guide viewing own profile) -->
					{#if isOwnProfile}
						<div class="profile-qr-section">
							<h3 class="qr-section-title">Share Profile</h3>
							<div class="qr-code-wrapper">
								{#if qrCodeURL}
									<img 
										src={qrCodeURL} 
										alt="Profile QR Code"
										class="qr-code-image"
									/>
								{/if}
							</div>
							<div class="url-section">
								<div class="url-display">
									<span class="url-text">{profileURL}</span>
								</div>
								<button 
									onclick={copyProfileURL}
									class="button-secondary button-small"
									title="Copy profile URL"
								>
									{#if urlCopied}
										<CheckCircle class="w-4 h-4" />
										Copied!
									{:else}
										<Copy class="w-4 h-4" />
										Copy
									{/if}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Tours Section -->
			<div class="tours-section">
				<div class="tours-header">
					<h2 class="tours-title">Available Tours</h2>
					<span class="tours-count-badge">
						{#if isOwnProfile}
							{publicToursCount}/{totalTours} Public
						{:else}
							{allTours.length} {allTours.length === 1 ? 'Tour' : 'Tours'}
						{/if}
					</span>
				</div>
				
				<!-- Guide View Info Banner -->
				{#if isOwnProfile && rawTours.length > 0}
					<div class="guide-info-banner">
						<Eye class="w-4 h-4" />
						<div class="guide-info-content">
							<p class="guide-info-text">
								<strong>Guide View:</strong> You're viewing your profile as it appears to you. 
								{#if publicToursCount < rawTours.length}
									Visitors only see {publicToursCount} of your {rawTours.length} tours (active & public tours).
								{:else}
									All your tours are visible to visitors.
								{/if}
							</p>
						</div>
					</div>
				{/if}
				
				{#if allTours.length > 0}
					<div class="tours-grid">
						{#each tours as tour}
							<div class="tour-card-wrapper">
								<TourCard 
									{tour} 
									href={getBookingPageURL(tour.qrCode)}
									showCategories={true}
								/>
								
								<!-- Status Badge for Guide View -->
								{#if isOwnProfile}
									{@const status = getTourStatus(tour)}
									{#if status}
										{@const Icon = status.icon}
										<div class="tour-status-badge tour-status-{status.type}">
											<Icon class="w-3.5 h-3.5" />
											<span>{status.label}</span>
										</div>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
					
					<!-- Pagination -->
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
					/>
				{:else}
					<div class="empty-state">
						<Calendar class="empty-icon" />
						{#if isOwnProfile}
							<p class="empty-text">You don't have any tours yet</p>
							<a href="/tours" class="button-primary" style="margin-top: 1rem;">
								Create Your First Tour
							</a>
						{:else}
							<p class="empty-text">No tours available at the moment</p>
						{/if}
					</div>
				{/if}
			</div>
			
		{/if}
	</div>
</div>

<style>
	.profile-page {
		min-height: 100vh;
		background: var(--bg-primary);
		position: relative;
	}
	
	/* Striped background pattern */
	.profile-page::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
		z-index: 0;
	}
	
	:global([data-theme="dark"]) .profile-page::before {
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(255, 255, 255, 0.02) 40px,
			rgba(255, 255, 255, 0.02) 41px
		);
	}
	
	.profile-container {
		max-width: 1536px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		position: relative;
		z-index: 1;
	}
	
	@media (min-width: 640px) {
		.profile-container {
			padding: 2rem 2rem;
		}
	}
	
	@media (min-width: 1024px) {
		.profile-container {
			padding: 3rem 3rem;
		}
	}
	
	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 600px;
		text-align: center;
	}
	
	.loading-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-top: 1rem;
	}
	
	.loading-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
	}
	
	/* Error State */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 600px;
		text-align: center;
		max-width: 500px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	
	.error-icon-wrapper {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: var(--color-danger-50);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}
	
	.error-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.error-text {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}
	
	/* Profile Header */
	.profile-header {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 1.5rem;
		padding: 2rem;
		margin-bottom: 3rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}
	
	.profile-header-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	/* When viewing public profile (no QR code) - center the content */
	.profile-header-content:not(.profile-header-with-qr) {
		align-items: center;
		justify-content: center;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	/* When viewing own profile (with QR code) - side by side on desktop */
	@media (min-width: 1024px) {
		.profile-header-content.profile-header-with-qr {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-start;
			gap: 3rem;
		}
	}
	
	.profile-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
		flex: 1;
		min-width: 0;
	}
	
	@media (min-width: 640px) {
		.profile-main {
			flex-direction: row;
			text-align: left;
			align-items: flex-start;
		}
	}
	
	/* Center content when no QR section */
	.profile-header-content:not(.profile-header-with-qr) .profile-main {
		max-width: 100%;
	}
	
	.profile-avatar-wrapper {
		flex-shrink: 0;
	}
	
	.profile-avatar-image {
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--border-primary);
	}
	
	@media (min-width: 640px) {
		.profile-avatar-image {
			width: 7rem;
			height: 7rem;
		}
	}
	
	.profile-avatar-placeholder {
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		background: var(--bg-secondary);
		border: 3px solid var(--border-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	@media (min-width: 640px) {
		.profile-avatar-placeholder {
			width: 7rem;
			height: 7rem;
		}
	}
	
	:global(.avatar-icon) {
		width: 3rem;
		height: 3rem;
		color: var(--text-tertiary);
	}
	
	@media (min-width: 640px) {
		:global(.avatar-icon) {
			width: 3.5rem;
			height: 3.5rem;
		}
	}
	
	.profile-info {
		flex: 1;
		width: 100%;
		min-width: 0;
	}
	
	.profile-name-section {
		margin-bottom: 1rem;
	}
	
	.profile-name {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.profile-username {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	.profile-description {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}
	
	.profile-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}
	
	@media (min-width: 640px) {
		.profile-badges {
			justify-content: flex-start;
		}
	}
	
	.profile-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		transition: all 0.2s ease;
	}
	
	.profile-badge-full-width {
		width: 100%;
		justify-content: flex-start;
	}
	
	.profile-badge-link {
		text-decoration: none !important;
		cursor: pointer;
	}
	
	.profile-badge-link:hover {
		background: var(--bg-tertiary);
		border-color: var(--color-primary-300);
		text-decoration: none !important;
	}
	
	.profile-badge-clickable {
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	.profile-badge-clickable:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-300);
		transform: translateY(-1px);
	}
	
	.profile-badge-clickable:active {
		transform: translateY(0);
	}
	
	:global([data-theme="dark"]) .profile-badge-clickable:hover {
		background: var(--color-primary-900);
		border-color: var(--color-primary-700);
	}
	
	:global(.badge-icon) {
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
	
	/* Location Section */
	.location-section {
		width: 100%;
		margin-top: 0.5rem;
	}
	
	/* Map Reveal */
	.location-map-reveal {
		margin-top: 1rem;
		border-radius: 0.75rem;
		overflow: hidden;
		animation: slideDown 0.3s ease-out;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.map-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		gap: 1rem;
		color: var(--text-secondary);
		background: var(--bg-primary);
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* QR Code Section */
	.profile-qr-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		min-width: 240px;
		max-width: 280px;
		flex-shrink: 0;
	}
	
	@media (min-width: 640px) {
		.profile-qr-section {
			min-width: 260px;
		}
	}
	
	.qr-section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		align-self: flex-start;
		width: 100%;
		text-align: center;
	}
	
	.qr-code-wrapper {
		background: white;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	.qr-code-image {
		width: 180px;
		height: 180px;
		display: block;
	}
	
	.url-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}
	
	.url-display {
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.url-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		word-break: break-all;
		display: block;
		font-family: 'Courier New', monospace;
	}
	
	/* Tours Section */
	.tours-section {
		background: var(--bg-primary);
		overflow: hidden;
	}
	
	.tours-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0 2rem 0;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.tours-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.tours-count-badge {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary-50);
		color: var(--color-primary-600);
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	:global([data-theme="dark"]) .tours-count-badge {
		background: var(--color-primary-900);
		color: var(--color-primary-300);
	}
	
	/* Guide Info Banner */
	.guide-info-banner {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.75rem;
		margin-bottom: 2rem;
		color: var(--color-primary-700);
	}
	
	:global([data-theme="dark"]) .guide-info-banner {
		background: var(--color-primary-900);
		border-color: var(--color-primary-700);
		color: var(--color-primary-300);
	}
	
	.guide-info-content {
		flex: 1;
	}
	
	.guide-info-text {
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0;
	}
	
	/* Tours Grid - Fixed 3 columns like explore page */
	.tours-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}
	
	@media (max-width: 1200px) {
		.tours-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	
	@media (max-width: 768px) {
		.tours-grid {
			grid-template-columns: 1fr;
		}
	}
	
	/* Tour Card Wrapper */
	.tour-card-wrapper {
		position: relative;
	}
	
	/* Tour Status Badges */
	.tour-status-badge {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	
	.tour-status-draft {
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border: 1px solid var(--color-warning-300);
	}
	
	:global([data-theme="dark"]) .tour-status-draft {
		background: var(--color-warning-900);
		color: var(--color-warning-300);
		border-color: var(--color-warning-700);
	}
	
	.tour-status-unlisted {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}
	
	.tour-status-active {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-300);
	}
	
	:global([data-theme="dark"]) .tour-status-active {
		background: var(--color-success-900);
		color: var(--color-success-300);
		border-color: var(--color-success-700);
	}
	
	/* Empty State */
	.empty-state {
		padding: 4rem 0;
		text-align: center;
	}
	
	:global(.empty-icon) {
		width: 3rem;
		height: 3rem;
		color: var(--text-tertiary);
		margin: 0 auto 1rem;
	}
	
	.empty-text {
		color: var(--text-secondary);
	}
	
	/* Icon Colors */
	:global(.icon-primary) {
		color: var(--color-primary-600);
	}
	
	:global(.icon-danger) {
		color: var(--color-danger-600);
	}
	
	/* Animation */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.profile-header {
			padding: 1.5rem;
		}
		
		.map-loading {
			padding: 2rem 1rem;
		}
		
		.location-map-reveal {
			margin-top: 0.75rem;
		}
		
		.tours-header {
			padding: 0 0 1.5rem 0;
			margin-bottom: 1rem;
		}
		
		.tours-title {
			font-size: 1.25rem;
		}
		
		.tours-grid {
			gap: 1.5rem;
		}
		
		.qr-code-image {
			width: 150px;
			height: 150px;
		}
		
		.profile-qr-section {
			min-width: auto;
			max-width: 100%;
			width: 100%;
		}
		
		.profile-main {
			width: 100%;
		}
	}
</style>

