<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import type { Tour } from '$lib/types.js';
	import type { PageData, ActionData } from './$types.js';
	import type { ValidationError } from '$lib/validation.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Eye from 'lucide-svelte/icons/eye';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tour = $state<Tour | null>(null);
	let isLoading = $state(false); // Data is loaded server-side
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let capacityError = $state((form as any)?.capacityError || null);
	let showCancelModal = $state(false);

	let tourId = $derived(data.tour?.id || '');

	// Form data
	let formData = $state({
		name: '',
		description: '',
		price: 0,
		duration: 60,
		capacity: 10,
		status: 'draft' as Tour['status'],
		category: '',
		location: '',
		includedItems: [''],
		requirements: [''],
		cancellationPolicy: ''
	});

	// Image upload state
	let uploadedImages: File[] = $state([]);
	let existingImages: string[] = $state([]);
	let imagesToRemove: string[] = $state([]);

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files);
			uploadedImages = [...uploadedImages, ...newFiles];
		}
	}

	function removeImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
	}

	function removeExistingImage(imageName: string) {
		imagesToRemove = [...imagesToRemove, imageName];
		existingImages = existingImages.filter(img => img !== imageName);
	}

	function getExistingImageUrl(imageName: string): string {
		// Use shared utility for consistency
		return `/api/images/${tourId}/${imageName}?size=medium`;
	}

	onMount(() => {
		if (data.tour) {
			initializeTour();
		}
	});

	function initializeTour() {
		if (data.tour) {
			tour = data.tour as any;
			
			// Populate form data with existing tour data
			formData = {
				name: data.tour.name || '',
				description: data.tour.description || '',
				price: data.tour.price || 0,
				duration: data.tour.duration || 60,
				capacity: data.tour.capacity || 10,
				status: data.tour.status || 'draft',
				category: data.tour.category || '',
				location: data.tour.location || '',
				includedItems: data.tour.includedItems && data.tour.includedItems.length > 0 ? data.tour.includedItems : [''],
				requirements: data.tour.requirements && data.tour.requirements.length > 0 ? data.tour.requirements : [''],
				cancellationPolicy: data.tour.cancellationPolicy || ''
			};

			// Initialize existing images
			existingImages = data.tour.images || [];
		}
	}

	function handleCancel() {
		showCancelModal = true;
	}

	function confirmCancel() {
		goto(`/tours/${tourId}`);
	}

	function handleSave() {
		if (isSubmitting) return;
		
		// Trigger form submission
		const form = document.querySelector('form');
		if (form) {
			form.requestSubmit();
		}
	}

	function getTourStatusInfo() {
		if (!tour) return { color: 'bg-gray-100 text-gray-700', label: 'Unknown' };
		
		switch (tour.status) {
			case 'active':
				return { color: 'bg-green-100 text-green-700', label: 'Active' };
			case 'draft':
				return { color: 'bg-yellow-100 text-yellow-700', label: 'Draft' };
			default:
				return { color: 'bg-gray-100 text-gray-700', label: 'Unknown' };
		}
	}
</script>

<svelte:head>
	<title>Edit {tour?.name || 'Tour'} - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<!-- Mobile Loading Header -->
		<div class="mb-6 sm:mb-8">
			<MobilePageHeader
				title="Edit Tour"
				secondaryInfo="Loading..."
				quickActions={[]}
				infoItems={[]}
			/>
			
			<!-- Desktop Loading Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Edit Tour"
					subtitle="Loading tour details..."
				/>
			</div>
		</div>
		
		<div class="rounded-xl p-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex flex-col items-center justify-center py-12">
				<div class="form-spinner mb-4"></div>
				<p class="text-center" style="color: var(--text-secondary);">Loading tour details...</p>
			</div>
		</div>
	{:else}
		<!-- Mobile-First Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Compact Header -->
			<MobilePageHeader
				title="Edit {tour?.name || 'Tour'}"
				secondaryInfo={getTourStatusInfo().label}
				quickActions={[
					{
						label: 'Save',
						icon: Save,
						onclick: handleSave,
						variant: 'primary'
					},
					{
						label: 'Cancel',
						icon: X,
						onclick: handleCancel,
						variant: 'secondary'
					},
					...(tour?.status === 'active' ? [{
						label: 'Preview',
						icon: ExternalLink,
						onclick: () => window.open(`/book/${tour?.qrCode}`, '_blank'),
						variant: 'secondary' as const,
						size: 'icon' as const
					}] : [])
				]}
				infoItems={[
					{
						icon: Eye,
						label: 'Price',
						value: `€${tour?.price || 0}`
					},
					{
						icon: AlertCircle,
						label: 'Duration',
						value: `${tour?.duration || 0}min`
					},
					{
						icon: Eye,
						label: 'Capacity',
						value: `${tour?.capacity || 0} max`
					},
					{
						icon: AlertCircle,
						label: 'Status',
						value: getTourStatusInfo().label
					}
				]}
			/>

			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Edit Tour"
					subtitle="Update your tour details and settings"
					breadcrumbs={[
						{ label: 'Tours', href: '/tours' },
						{ label: tour?.name || 'Tour', href: `/tours/${tourId}` },
						{ label: 'Edit' }
					]}
				>
					<div class="hidden sm:flex gap-3">
						<button onclick={handleCancel} class="button-secondary button--gap">
							<X class="h-4 w-4" />
							Cancel
						</button>
						<button onclick={handleSave} class="button-primary button--gap">
							<Save class="h-4 w-4" />
							Save Changes
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-xl p-4" style="background: rgb(254 226 226); border: 1px solid rgb(252 165 165);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-red-800">Error</p>
						<p class="text-sm text-red-700 mt-1">{error}</p>
						{#if capacityError}
							<p class="text-sm text-red-700 mt-2">
								<strong>Capacity Issue:</strong> You tried to set capacity to {capacityError.attempted}, 
								but you need at least {capacityError.minimum} spots due to existing bookings.
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Capacity Warning (if bookings exist) -->
		{#if data.bookingConstraints?.maxBookedSpots > 0}
			<div class="mb-6 rounded-xl p-4" style="background: rgb(254 243 199); border: 1px solid rgb(252 211 77);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-amber-800">Capacity Constraints</p>
						<p class="text-sm text-amber-700 mt-1">
							You have <strong>{data.bookingConstraints.maxBookedSpots} people booked</strong> in your busiest time slot.
							You can only reduce capacity to <strong>{data.bookingConstraints.maxBookedSpots} or higher</strong>.
						</p>
						{#if !data.bookingConstraints.canReduceCapacity}
							<p class="text-sm text-amber-700 mt-1">
								<em>Your tour is at maximum booking capacity. You can increase capacity but cannot reduce it.</em>
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Current Status & Save Actions -->
		<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">Current Status & Save Options</h3>
			
			<!-- Current Status -->
			<div class="mb-6 p-4 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {tour?.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}">
						<span class="text-sm font-medium {tour?.status === 'active' ? 'text-green-600' : 'text-amber-600'}">
							{tour?.status === 'active' ? '✓' : '📝'}
						</span>
					</div>
					<div>
						<p class="font-semibold" style="color: var(--text-primary);">
							Currently: {tour?.status === 'active' ? 'Active' : 'Draft'}
						</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{tour?.status === 'active' ? 'Your tour is live and accepting bookings' : 'Your tour is saved but not visible to customers'}
						</p>
					</div>
				</div>
			</div>

			<!-- Save Actions Explanation -->
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
						<span class="text-xs font-medium text-blue-600">💾</span>
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Save Changes</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{tour?.status === 'active' ? 'Keep your tour active with the updated information' : 'Keep your tour as draft with the updated information'}
						</p>
					</div>
				</div>
				{#if tour?.status === 'draft'}
					<div class="flex items-start gap-3">
						<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
							<span class="text-xs font-medium text-green-600">🚀</span>
						</div>
						<div>
							<p class="font-medium" style="color: var(--text-primary);">Want to go live?</p>
							<p class="text-sm" style="color: var(--text-secondary);">
								Save your changes, then use the status button in the header to activate your tour.
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Form Container -->
		<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-6" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
						</svg>
					</div>
					<div>
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Tour Information</h2>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Update your tour details and make it even better</p>
					</div>
				</div>
			</div>
			
			<div class="p-6 sm:p-8">
				<form method="POST" enctype="multipart/form-data" use:enhance={() => {
					isSubmitting = true;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'redirect') {
							goto(result.location);
						}
					};
				}}>
					<!-- Hidden input for images to remove -->
					{#each imagesToRemove as imageToRemove}
						<input type="hidden" name="removeImages" value={imageToRemove} />
					{/each}

					<TourForm
						bind:formData
						bind:uploadedImages
						{isSubmitting}
						isEdit={true}
						onCancel={handleCancel}
						onImageUpload={handleImageUpload}
						onImageRemove={removeImage}
						{existingImages}
						onExistingImageRemove={removeExistingImage}
						{getExistingImageUrl}
						serverErrors={validationErrors}
						bookingConstraints={data.bookingConstraints}
					/>
				</form>
			</div>
		</div>
	{/if}
</div>

<!-- Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showCancelModal}
	title="Cancel editing?"
	message="Are you sure you want to cancel editing this tour? Your unsaved changes will be lost."
	confirmText="Yes, cancel"
	cancelText="Keep editing"
	variant="warning"
	onConfirm={confirmCancel}
	onCancel={() => {}}
	onClose={() => {}}
/> 