<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	// State for calendar navigation
	let currentDate = $state(new Date());
	let showAddModal = $state(false);
	let selectedDate = $state('');
	let isCreating = $state(false);
	let deletingSlotId = $state<string | null>(null);
	
	// Form state
	let newSlot = $state({
		startTime: '10:00',
		endTime: '12:00',
		availableSpots: data.tour.capacity
	});
	
	// Calendar helpers
	function getCalendarDays() {
		const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
		const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
		const startDate = new Date(startOfMonth);
		startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
		
		const days = [];
		const currentDay = new Date(startDate);
		
		// Generate 42 days (6 weeks)
		for (let i = 0; i < 42; i++) {
			const dayInfo = {
				date: new Date(currentDay),
				isCurrentMonth: currentDay.getMonth() === currentDate.getMonth(),
				isToday: isToday(currentDay),
				isSelectable: currentDay >= new Date(),
				timeSlots: getTimeSlotsForDate(currentDay)
			};
			days.push(dayInfo);
			currentDay.setDate(currentDay.getDate() + 1);
		}
		
		return days;
	}
	
	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}
	
	function getTimeSlotsForDate(date: Date) {
		const dateStr = date.toISOString().split('T')[0];
		return data.timeSlots.filter(slot => {
			const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
			return slotDate === dateStr;
		});
	}
	
	function formatTime(datetime: string): string {
		return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	
	function formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}
	
	function previousMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
	}
	
	function nextMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
	}
	
	function openAddModal(date?: Date) {
		if (date) {
			selectedDate = formatDate(date);
		} else {
			selectedDate = formatDate(new Date());
		}
		showAddModal = true;
	}
	
	function closeAddModal() {
		showAddModal = false;
		selectedDate = '';
		newSlot = {
			startTime: '10:00',
			endTime: '12:00',
			availableSpots: data.tour.capacity
		};
	}
	
	function deleteTimeSlot(slotId: string) {
		if (!confirm('Are you sure you want to delete this time slot?')) return;
		deletingSlotId = slotId;
		const form = document.getElementById(`delete-slot-${slotId}`) as HTMLFormElement;
		form?.requestSubmit();
	}
	
	function getStatusColor(slot: any) {
		if (slot.bookedSpots >= slot.availableSpots) {
			return 'bg-red-100 text-red-700 border-red-200';
		} else if (slot.bookedSpots > 0) {
			return 'bg-orange-100 text-orange-700 border-orange-200';
		}
		return 'bg-green-100 text-green-700 border-green-200';
	}
	
	// Update form state on form results
	$effect(() => {
		if (form?.success) {
			closeAddModal();
			invalidateAll();
		}
		if (form?.error) {
			isCreating = false;
			deletingSlotId = null;
		}
	});
</script>

<svelte:head>
	<title>Schedule - {data.tour?.name || 'Tour'} - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if form?.error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={form.error} />
		</div>
	{/if}

	<!-- Page Header -->
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="Schedule"
			subtitle={`Manage time slots for ${data.tour.name}`}
			backUrl={`/tours/${data.tour.id}`}
			breadcrumbs={[
				{ label: 'Tours', href: '/tours' },
				{ label: data.tour.name, href: `/tours/${data.tour.id}` },
				{ label: 'Schedule' }
			]}
		>
			<button
				onclick={() => openAddModal()}
				class="button-primary button--gap button--small"
			>
				<Plus class="h-4 w-4" />
				Add Time Slot
			</button>
		</PageHeader>
	</div>

	<!-- Calendar Controls -->
	<div class="mb-6">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-4">
				<button
					onclick={previousMonth}
					class="button-secondary button--small p-2"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				<h2 class="text-xl font-semibold" style="color: var(--text-primary);">
					{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
				</h2>
				<button
					onclick={nextMonth}
					class="button-secondary button--small p-2"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
			
			<button
				onclick={() => openAddModal()}
				class="button-primary button--gap button--small sm:hidden"
			>
				<Plus class="h-4 w-4" />
				Add
			</button>
		</div>
	</div>

	<!-- Calendar Grid -->
	<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<!-- Calendar Header -->
		<div class="grid grid-cols-7 gap-px" style="background: var(--border-primary);">
			{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
				<div class="p-3 text-center text-sm font-medium" style="background: var(--bg-secondary); color: var(--text-secondary);">
					{day}
				</div>
			{/each}
		</div>
		
		<!-- Calendar Body -->
		<div class="grid grid-cols-7 gap-px" style="background: var(--border-primary);">
			{#each getCalendarDays() as dayInfo}
				<div 
					class="min-h-24 sm:min-h-32 p-2 flex flex-col" 
					style="background: var(--bg-primary);"
					class:opacity-40={!dayInfo.isCurrentMonth}
				>
					<!-- Date Header -->
					<div class="flex items-center justify-between mb-2">
						<span 
							class="text-sm font-medium"
							class:text-blue-600={dayInfo.isToday}
							style="color: {dayInfo.isToday ? 'var(--primary)' : 'var(--text-primary)'}"
						>
							{dayInfo.date.getDate()}
						</span>
						
						{#if dayInfo.isSelectable && dayInfo.isCurrentMonth}
							<button
								onclick={() => openAddModal(dayInfo.date)}
								class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all"
								style="color: var(--text-tertiary);"
							>
								<Plus class="h-3 w-3" />
							</button>
						{/if}
					</div>
					
					<!-- Time Slots -->
					<div class="flex-1 space-y-1">
						{#each dayInfo.timeSlots as slot}
							<div 
								class="px-2 py-1 rounded text-xs border cursor-pointer group relative {getStatusColor(slot)}"
								onclick={() => {/* TODO: Edit slot */}}
							>
								<div class="flex items-center justify-between gap-1">
									<span class="font-medium">
										{formatTime(slot.startTime)}
									</span>
									<span class="text-xs">
										{slot.bookedSpots}/{slot.availableSpots}
									</span>
								</div>
								
								{#if slot.bookedSpots === 0}
									<form 
										id="delete-slot-{slot.id}"
										method="POST" 
										action="?/delete" 
										class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100"
										use:enhance={() => {
											deletingSlotId = slot.id;
											return async ({ result }) => {
												deletingSlotId = null;
												if (result.type === 'success') {
													await invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="slotId" value={slot.id} />
										<button
											type="button"
											onclick={(e) => { e.stopPropagation(); deleteTimeSlot(slot.id); }}
											disabled={deletingSlotId === slot.id}
											class="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
										>
											{#if deletingSlotId === slot.id}
												<div class="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
											{:else}
												<Trash2 class="h-2 w-2" />
											{/if}
										</button>
									</form>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Empty State for No Time Slots -->
	{#if data.timeSlots.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={Calendar}
				title="No Time Slots Scheduled"
				description="Start by adding your first time slot to make your tour bookable."
				actionText="Add First Time Slot"
				onAction={() => openAddModal()}
			/>
		</div>
	{/if}
</div>

<!-- Add Time Slot Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl w-full max-w-md" style="background: var(--bg-primary);">
			<form 
				method="POST" 
				action="?/create"
				use:enhance={() => {
					isCreating = true;
					return async ({ result }) => {
						isCreating = false;
						if (result.type === 'success') {
							closeAddModal();
							await invalidateAll();
						}
					};
				}}
			>
				<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Add Time Slot</h3>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">
						Create a new bookable time slot for your tour
					</p>
				</div>
				
				<div class="p-6 space-y-4">
					<!-- Date -->
					<div class="form-field">
						<label for="startDate" class="form-label">Date</label>
						<input
							type="date"
							id="startDate"
							name="startDate"
							bind:value={selectedDate}
							min={formatDate(new Date())}
							required
							class="form-input"
						/>
					</div>
					
					<!-- Time Range -->
					<div class="grid grid-cols-2 gap-4">
						<div class="form-field">
							<label for="startTime" class="form-label">Start Time</label>
							<input
								type="time"
								id="startTime"
								name="startTime"
								bind:value={newSlot.startTime}
								required
								class="form-input"
							/>
						</div>
						<div class="form-field">
							<label for="endTime" class="form-label">End Time</label>
							<input
								type="time"
								id="endTime"
								name="endTime"
								bind:value={newSlot.endTime}
								required
								class="form-input"
							/>
						</div>
					</div>
					
					<!-- Available Spots -->
					<div class="form-field">
						<label for="availableSpots" class="form-label">Available Spots</label>
						<input
							type="number"
							id="availableSpots"
							name="availableSpots"
							bind:value={newSlot.availableSpots}
							min="1"
							max="100"
							required
							class="form-input"
						/>
						<p class="form-help">Maximum capacity for this time slot</p>
					</div>
				</div>
				
				<div class="p-6 flex items-center justify-end gap-3" style="border-top: 1px solid var(--border-primary);">
					<button
						type="button"
						onclick={closeAddModal}
						class="button-secondary"
						disabled={isCreating}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="button-primary button--gap"
						disabled={isCreating}
					>
						{#if isCreating}
							<div class="form-spinner"></div>
						{:else}
							<Clock class="h-4 w-4" />
						{/if}
						Create Time Slot
					</button>
				</div>
			</form>
		</div>
	</div>
{/if} 