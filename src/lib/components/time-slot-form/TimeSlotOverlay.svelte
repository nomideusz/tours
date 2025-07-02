<script lang="ts">
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import Drawer from '$lib/components/Drawer.svelte';
	import TimeSlotForm from './TimeSlotForm.svelte';
	
	// Icons
	import X from 'lucide-svelte/icons/x';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Repeat from 'lucide-svelte/icons/repeat';

	interface Props {
		isOpen: boolean;
		tourId: string;
		tourName?: string;
		slotId?: string;
		preselectedDate?: string;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let {
		isOpen = $bindable(false),
		tourId,
		tourName = 'Tour',
		slotId,
		preselectedDate,
		onClose,
		onSuccess
	}: Props = $props();

	let formComponent = $state<any>();
	let isSubmitting = $state(false);
	let justCreated = $state(false);
	let createdCount = $state(0);
	let showSuccess = $state(false);
	let lastCreatedSlotData = $state<any>(null);
	let isEditMode = $derived(!!slotId);
	let isMobile = $state(false);

	// Check if mobile on mount and window resize
	$effect(() => {
		if (browser) {
			const checkMobile = () => {
				isMobile = window.innerWidth < 768;
			};
			
			checkMobile();
			window.addEventListener('resize', checkMobile);
			
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	// Reset states when opening
	$effect(() => {
		if (isOpen && !isEditMode) {
			// Reset success states when opening for new slot creation
			justCreated = false;
			showSuccess = false;
			createdCount = 0;
			isSubmitting = false;
			lastCreatedSlotData = null;
		}
	});

	function handleClose() {
		if (isSubmitting) return;
		
		// Reset states
		justCreated = false;
		showSuccess = false;
		createdCount = 0;
		
		isOpen = false;
		onClose?.();
	}

	function handleSuccess(result: any) {
		createdCount = result?.slots?.length || 1;
		justCreated = true;
		showSuccess = true;
		isSubmitting = false;
		
		// Store the form data for "Create Similar" functionality
		if (formComponent && formComponent.getFormData) {
			lastCreatedSlotData = formComponent.getFormData();
		}
		
		// Don't auto-close - let user decide what to do next
	}
	
	function handleCreateAnother() {
		// Reset success state and go back to form
		justCreated = false;
		showSuccess = false;
		createdCount = 0;
		
		// Reset the form component if we can access it
		if (formComponent && formComponent.resetForm) {
			formComponent.resetForm();
		}
	}
	
	function handleCreateSimilar() {
		// Reset success state and go back to form with pre-filled data
		justCreated = false;
		showSuccess = false;
		createdCount = 0;
		
		// Pre-fill form with similar data but advance the date by 1 day
		if (formComponent && formComponent.setFormData && lastCreatedSlotData) {
			const nextDay = new Date(lastCreatedSlotData.date);
			nextDay.setDate(nextDay.getDate() + 1);
			
			formComponent.setFormData({
				...lastCreatedSlotData,
				date: nextDay.toISOString().split('T')[0],
				recurring: false, // Reset recurring to avoid confusion
				recurringEnd: '',
				recurringCount: 2
			});
		}
	}
	
	function handleFinish() {
		// Call the success callback to close modal and refresh data
		onSuccess?.();
	}
</script>

<Drawer
	bind:isOpen={isOpen}
	title=""
	subtitle=""
	onClose={handleClose}
	closeOnClickOutside={!isSubmitting}
	closeOnEscape={!isSubmitting}
	showCloseButton={false}
	class="time-slot-overlay"
>
	{#if showSuccess}
		<!-- Success State -->
		<div 
			class="success-content"
			class:mobile={isMobile}
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="success-icon">
				<CheckCircle class="{isMobile ? 'h-12 w-12' : 'h-16 w-16'}" />
			</div>
			<h2 class="success-title">
				{#if createdCount > 1}
					{createdCount} Time Slots Created!
				{:else}
					Time Slot Created!
				{/if}
			</h2>
			<p class="success-message">
				{#if createdCount > 1}
					Your recurring schedule has been added successfully.
				{:else}
					Your new time slot is now available for bookings.
				{/if}
			</p>
			<div class="success-stats">
				<div class="stat-item">
					<Calendar class="h-5 w-5" />
					<span>{createdCount} slot{createdCount > 1 ? 's' : ''}</span>
				</div>
				<div class="stat-item">
					<Clock class="h-5 w-5" />
					<span>Ready for bookings</span>
				</div>
				{#if lastCreatedSlotData}
					<div class="stat-item">
						<span class="created-date">
							{#if createdCount > 1}
								Starting {lastCreatedSlotData.date}
							{:else}
								{lastCreatedSlotData.date} at {lastCreatedSlotData.startTime}
							{/if}
						</span>
					</div>
				{/if}
			</div>
			
			<!-- Action buttons -->
			<div class="success-actions" class:mobile={isMobile}>
				<button 
					onclick={handleCreateAnother}
					class="success-button success-button--primary"
				>
					<div class="button-main">
						<Plus class="h-4 w-4" />
						<span>Create Another</span>
					</div>
				</button>
				{#if !isMobile}
					<button 
						onclick={handleCreateSimilar}
						class="success-button success-button--secondary"
					>
						<div class="button-main">
							<Repeat class="h-4 w-4" />
							<span>Create Similar</span>
						</div>
					</button>
				{/if}
				<button 
					onclick={handleFinish}
					class="success-button success-button--secondary"
				>
					<div class="button-main">
						<CheckCircle class="h-4 w-4" />
						<span>Finish</span>
					</div>
				</button>
			</div>
		</div>
	{:else}
		<!-- Form Content -->
		<div class="form-content">
			<!-- Header -->
			<div class="overlay-header">
				<div class="header-content">
					<div class="header-icon">
						{#if isEditMode}
							<Clock class="h-6 w-6" />
						{:else}
							<Plus class="h-6 w-6" />
						{/if}
					</div>
					<div class="header-text">
						<h2 class="overlay-title">
							{isEditMode ? 'Edit Time Slot' : 'Add Time Slots'}
						</h2>
						<p class="overlay-subtitle">
							{isEditMode ? `Modify the time slot for ${tourName}` : `Create new available times for ${tourName}`}
						</p>
					</div>
				</div>
				
				<button 
					onclick={handleClose}
					class="close-button"
					disabled={isSubmitting}
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
			
			<!-- Form -->
			<div class="form-wrapper">
				<TimeSlotForm 
					bind:this={formComponent}
					{tourId}
					{slotId}
					{preselectedDate}
					mode={isMobile ? 'drawer' : 'modal'}
					onSuccess={handleSuccess}
					onCancel={handleClose}
					onSubmissionStart={() => isSubmitting = true}
					onSubmissionEnd={() => isSubmitting = false}
				/>
			</div>
		</div>
	{/if}
</Drawer>

<style>
	.success-content {
		text-align: center;
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}
	
	.success-content.mobile {
		padding: 1.5rem 0.5rem;
		gap: 1.25rem;
	}
	
	.success-icon {
		color: var(--color-success-600);
		background: var(--color-success-50);
		border-radius: 50%;
		padding: 1rem;
		border: 2px solid var(--color-success-200);
	}
	
	.mobile .success-icon {
		padding: 0.75rem;
	}
	
	.success-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	
	.mobile .success-title {
		font-size: 1.125rem;
	}
	
	.success-message {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0;
		max-width: 24rem;
	}
	
	.mobile .success-message {
		font-size: 0.875rem;
		max-width: 20rem;
		line-height: 1.5;
	}
	
	.success-stats {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	
	.mobile .success-stats {
		gap: 0.75rem;
		flex-direction: column;
		align-items: center;
	}
	
	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.created-date {
		font-weight: 600;
		color: var(--color-primary-700);
		background: var(--color-primary-50);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid var(--color-primary-200);
	}
	
	.success-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 2rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.success-actions.mobile {
		flex-direction: column;
		width: 100%;
		max-width: 16rem;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	
	.success-button {
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		min-width: 7rem;
	}
	
	.mobile .success-button {
		width: 100%;
		padding: 0.875rem 1rem;
	}
	
	.success-button .button-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.success-button--primary {
		background: var(--color-primary-500);
		color: white;
	}
	
	.success-button--primary:hover {
		background: var(--color-primary-600);
		transform: translateY(-1px);
	}
	
	.mobile .success-button--primary:hover {
		transform: none;
	}
	
	.success-button--secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
	}
	
	.success-button--secondary:hover {
		background: var(--bg-tertiary);
		transform: translateY(-1px);
	}
	
	.mobile .success-button--secondary:hover {
		transform: none;
	}
	
	.form-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin: -1.5rem;
	}
	
	.overlay-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}
	
	.mobile .overlay-header {
		padding: 1rem 1.5rem;
	}
	
	.header-content {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}
	
	.header-icon {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		background: var(--color-primary-100);
		color: var(--color-primary-600);
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 0.125rem;
	}
	
	.mobile .header-icon {
		width: 2rem;
		height: 2rem;
	}
	
	.header-text {
		flex: 1;
		min-width: 0;
	}
	
	.overlay-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}
	
	.mobile .overlay-title {
		font-size: 1.125rem;
	}
	
	.overlay-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}
	
	.close-button {
		flex-shrink: 0;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s ease;
		margin: -0.5rem -0.5rem 0 0;
	}
	
	.close-button:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	.close-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.form-wrapper {
		padding: 0 2rem 2rem;
		flex: 1;
		min-height: 0;
	}
	
	.mobile .form-wrapper {
		padding: 0 1.5rem 1.5rem;
	}
</style> 