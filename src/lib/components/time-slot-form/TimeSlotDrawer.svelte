<script lang="ts">
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import Drawer from '$lib/components/Drawer.svelte';
	import TimeSlotForm from './TimeSlotForm.svelte';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Plus from 'lucide-svelte/icons/plus';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	interface Props {
		isOpen: boolean;
		tourId: string;
		tourName?: string;
		slotId?: string;
		preselectedDate?: string;
		onClose?: () => void;
		onSuccess?: (result?: any) => void;
	}

	let {
		isOpen = $bindable(false),
		tourId,
		tourName,
		slotId,
		preselectedDate,
		onClose,
		onSuccess
	}: Props = $props();

	let formComponent = $state<any>();
	let isSubmitting = $state(false);
	let showSuccess = $state(false);
	let createdCount = $state(0);
	let lastCreatedSlotData = $state<any>(null);
	let isEditMode = $derived(!!slotId);

	function handleClose() {
		if (isSubmitting) return;
		
		// Reset states
		showSuccess = false;
		createdCount = 0;
		
		isOpen = false;
		onClose?.();
	}

	function handleSuccess(result: any) {
		createdCount = result?.slots?.length || 1;
		showSuccess = true;
		isSubmitting = false;
		
		// Store the form data for success display
		if (formComponent && formComponent.getFormData) {
			lastCreatedSlotData = formComponent.getFormData();
		}
		
		// Don't auto-close - let user decide what to do next
	}
	
	function handleCreateAnother() {
		// Reset success state and go back to form
		showSuccess = false;
		createdCount = 0;
		
		// Reset the form component if we can access it
		if (formComponent && formComponent.resetForm) {
			formComponent.resetForm();
		}
	}
	
	function handleFinish() {
		// Call the success callback to close drawer and refresh data
		onSuccess?.();
	}
</script>

<Drawer
	bind:isOpen={isOpen}
	title={isEditMode ? 'Edit Time Slot' : 'Add Time Slots'}
	subtitle={isEditMode ? `Modify the time slot for ${tourName}` : `Create new available times for ${tourName}`}
	onClose={handleClose}
	closeOnClickOutside={!isSubmitting}
	closeOnEscape={!isSubmitting}
	class="time-slot-drawer"
>
	{#if showSuccess}
		<!-- Success State -->
		<div class="success-content" transition:fly={{ y: 20, duration: 300 }}>
			<div class="success-icon">
				<CheckCircle class="h-12 w-12" />
			</div>
			<h3 class="success-title">
				{#if createdCount > 1}
					{createdCount} Time Slots Created!
				{:else}
					Time Slot Created!
				{/if}
			</h3>
			<p class="success-message">
				{#if createdCount > 1}
					Your recurring schedule has been added successfully.
				{:else}
					Your new time slot is now available for bookings.
				{/if}
			</p>
			
			{#if lastCreatedSlotData}
				<div class="success-details">
					<div class="detail-item">
						<Calendar class="h-4 w-4" />
						<span>
							{#if createdCount > 1}
								Starting {lastCreatedSlotData.date}
							{:else}
								{lastCreatedSlotData.date} at {lastCreatedSlotData.startTime}
							{/if}
						</span>
					</div>
					<div class="detail-item">
						<Clock class="h-4 w-4" />
						<span>Ready for bookings</span>
					</div>
				</div>
			{/if}
			
			<!-- Action buttons -->
			<div class="success-actions">
				<button 
					onclick={handleCreateAnother}
					class="button-primary button--gap"
				>
					<Plus class="h-4 w-4" />
					Create Another
				</button>
				<button 
					onclick={handleFinish}
					class="button-secondary"
				>
					<CheckCircle class="h-4 w-4" />
					Finish
				</button>
			</div>
		</div>
	{:else}
		<!-- Form Content -->
		<div class="form-content">
			<TimeSlotForm 
				bind:this={formComponent}
				{tourId}
				{slotId}
				{preselectedDate}
				mode="drawer"
				onSuccess={handleSuccess}
				onCancel={handleClose}
				onSubmissionStart={() => isSubmitting = true}
				onSubmissionEnd={() => isSubmitting = false}
			/>
		</div>
	{/if}
</Drawer>

<style>
	.success-content {
		text-align: center;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}
	
	.success-icon {
		color: var(--color-success-600);
		background: var(--color-success-50);
		border-radius: 50%;
		padding: 1rem;
		border: 2px solid var(--color-success-200);
	}
	
	.success-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	
	.success-message {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0;
		max-width: 20rem;
		line-height: 1.5;
	}
	
	.success-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.success-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
		flex-direction: column;
		width: 100%;
		max-width: 16rem;
	}
	
	.form-content {
		/* Ensure form takes full available space */
		min-height: 0;
		flex: 1;
	}
	
	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		.success-content {
			padding: 1.5rem 0.5rem;
			gap: 1.25rem;
		}
		
		.success-icon {
			padding: 0.75rem;
		}
		
		.success-title {
			font-size: 1.125rem;
		}
		
		.success-actions {
			gap: 0.5rem;
		}
	}
	
	/* Desktop adjustments */
	@media (min-width: 768px) {
		.success-actions {
			flex-direction: row;
			justify-content: center;
		}
	}
</style> 