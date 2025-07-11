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
	let isMobile = $state(false);
	let isEditMode = $derived(!!slotId);

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

	function handleClose() {
		if (isSubmitting) return;
		
		isOpen = false;
		onClose?.();
	}

	function handleSuccess(result: any) {
		// Reset all states and directly close the modal
		isSubmitting = false;
		
		// Close the modal immediately
		isOpen = false;
		onClose?.();
		
		// Call the success callback to refresh data
		onSuccess?.();
	}
</script>

<Drawer
	bind:isOpen={isOpen}
	title=""
	subtitle=""
	onClose={handleClose}
	closeOnClickOutside={false}
	closeOnEscape={!isSubmitting}
	showCloseButton={false}
	class="time-slot-overlay"
>
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
</Drawer>

<style>
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