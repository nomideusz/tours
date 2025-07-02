<script lang="ts">
	import { formatDateTime, formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { getSlotStatusColor } from '$lib/utils/tour-helpers-client.js';
    import Plus from 'lucide-svelte/icons/plus';
    import Calendar from 'lucide-svelte/icons/calendar';
    import Clock from 'lucide-svelte/icons/clock';
    import Users from 'lucide-svelte/icons/users';
    import Trash2 from 'lucide-svelte/icons/trash-2';
    import Edit3 from 'lucide-svelte/icons/edit-3';
    import Save from 'lucide-svelte/icons/save';
    import X from 'lucide-svelte/icons/x';
	import type { TimeSlot } from '$lib/types.js';

	interface Props {
		tourId: string;
		tourCapacity: number;
		existingSlots?: TimeSlot[];
		isLoading?: boolean;
		onSlotCreated?: (slot: Partial<TimeSlot>) => void;
		onSlotUpdated?: (slot: TimeSlot) => void;
		onSlotDeleted?: (slotId: string) => void;
		onBulkCreate?: (slots: Partial<TimeSlot>[]) => void;
	}

	let { 
		tourId, 
		tourCapacity, 
		existingSlots = [], 
		isLoading = false,
		onSlotCreated,
		onSlotUpdated,
		onSlotDeleted,
		onBulkCreate
	}: Props = $props();

	// State
	let showAddForm = $state(false);
	let editingSlot = $state<string | null>(null);
	let bulkMode = $state(false);
	
	// Form data for new slot
	let newSlot = $state({
		date: '',
		startTime: '',
		endTime: '',
		availableSpots: tourCapacity,
		price: '',
		notes: ''
	});

	// Bulk creation state
	let bulkConfig = $state({
		startDate: '',
		endDate: '',
		timeSlots: [{ startTime: '10:00', endTime: '12:00' }],
		daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri by default
		availableSpots: tourCapacity
	});

	// Editing state with date helpers
	let editForm = $state<Partial<TimeSlot> & { date?: string; startTime?: string; endTime?: string }>({});

	// Computed
	let sortedSlots = $derived(
		existingSlots
			.slice()
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
	);

	let upcomingSlots = $derived(
		sortedSlots.filter(slot => new Date(slot.startTime) > new Date())
	);

	let pastSlots = $derived(
		sortedSlots.filter(slot => new Date(slot.startTime) <= new Date())
	);

	// Helper functions
	function resetNewSlot() {
		newSlot = {
			date: '',
			startTime: '',
			endTime: '',
			availableSpots: tourCapacity,
			price: '',
			notes: ''
		};
	}

	function createSlot() {
		if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) return;

		// Parse date components to avoid timezone issues
		const [year, month, day] = newSlot.date.split('-').map(Number);
		const [startHour, startMin] = newSlot.startTime.split(':').map(Number);
		const [endHour, endMin] = newSlot.endTime.split(':').map(Number);

		const startDateTime = new Date(year, month - 1, day, startHour, startMin);
		const endDateTime = new Date(year, month - 1, day, endHour, endMin);

		if (endDateTime <= startDateTime) {
			alert('End time must be after start time');
			return;
		}

		const slot: Partial<TimeSlot> = {
			tourId,
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString(),
			availableSpots: newSlot.availableSpots,
			bookedSpots: 0,
			status: 'available'
		};

		onSlotCreated?.(slot);
		resetNewSlot();
		showAddForm = false;
	}

	function startEdit(slot: TimeSlot) {
		editingSlot = slot.id;
		editForm = {
			...slot,
			// Convert dates for form inputs
			date: new Date(slot.startTime).toISOString().split('T')[0],
			startTime: new Date(slot.startTime).toTimeString().slice(0, 5),
			endTime: new Date(slot.endTime).toTimeString().slice(0, 5)
		};
	}

	function saveEdit() {
		if (!editForm.date || !editForm.startTime || !editForm.endTime || !editingSlot) return;

		// Parse date components to avoid timezone issues
		const [year, month, day] = editForm.date.split('-').map(Number);
		const [startHour, startMin] = editForm.startTime.split(':').map(Number);
		const [endHour, endMin] = editForm.endTime.split(':').map(Number);

		const startDateTime = new Date(year, month - 1, day, startHour, startMin);
		const endDateTime = new Date(year, month - 1, day, endHour, endMin);

		const updatedSlot: TimeSlot = {
			...editForm as TimeSlot,
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString()
		};

		onSlotUpdated?.(updatedSlot);
		editingSlot = null;
		editForm = {};
	}

	function cancelEdit() {
		editingSlot = null;
		editForm = {};
	}

	function deleteSlot(slotId: string) {
		if (confirm('Are you sure you want to delete this time slot?')) {
			onSlotDeleted?.(slotId);
		}
	}

	function generateBulkSlots() {
		if (!bulkConfig.startDate || !bulkConfig.endDate || bulkConfig.timeSlots.length === 0) return;

		const slots: Partial<TimeSlot>[] = [];
		const startDate = new Date(bulkConfig.startDate);
		const endDate = new Date(bulkConfig.endDate);

		for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
			const dayOfWeek = date.getDay();
			
			if (bulkConfig.daysOfWeek.includes(dayOfWeek)) {
				for (const timeSlot of bulkConfig.timeSlots) {
					const startDateTime = new Date(date);
					const [startHour, startMin] = timeSlot.startTime.split(':').map(Number);
					startDateTime.setHours(startHour, startMin, 0, 0);

					const endDateTime = new Date(date);
					const [endHour, endMin] = timeSlot.endTime.split(':').map(Number);
					endDateTime.setHours(endHour, endMin, 0, 0);

					slots.push({
						tourId,
						startTime: startDateTime.toISOString(),
						endTime: endDateTime.toISOString(),
						availableSpots: bulkConfig.availableSpots,
						bookedSpots: 0,
						status: 'available'
					});
				}
			}
		}

		onBulkCreate?.(slots);
		bulkMode = false;
	}

	function addBulkTimeSlot() {
		bulkConfig.timeSlots = [...bulkConfig.timeSlots, { startTime: '10:00', endTime: '12:00' }];
	}

	function removeBulkTimeSlot(index: number) {
		bulkConfig.timeSlots = bulkConfig.timeSlots.filter((_, i) => i !== index);
	}

	function getSlotUtilization(slot: TimeSlot): number {
		return slot.availableSpots > 0 ? (slot.bookedSpots / slot.availableSpots) * 100 : 0;
	}

	function getSlotStatus(slot: TimeSlot): string {
		if (slot.bookedSpots >= slot.availableSpots) return 'full';
		if (slot.status === 'cancelled') return 'cancelled';
		return 'available';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Time Slots</h3>
			<p class="text-sm mt-1" style="color: var(--text-secondary);">
				Manage available booking times for your tour
			</p>
		</div>
		<div class="flex gap-2">
			<button
				onclick={() => bulkMode = !bulkMode}
				class="button-secondary button--small button--gap"
			>
				<Calendar class="h-4 w-4" />
				Bulk Add
			</button>
			<button
				onclick={() => showAddForm = !showAddForm}
				class="button-primary button--small button--gap"
			>
				<Plus class="h-4 w-4" />
				Add Slot
			</button>
		</div>
	</div>

	<!-- Bulk Creation Form -->
	{#if bulkMode}
		<div class="p-6 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h4 class="font-semibold mb-4" style="color: var(--text-primary);">Bulk Create Time Slots</h4>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="form-label" for="bulk-start-date">Start Date</label>
					<input
						id="bulk-start-date"
						type="date"
						bind:value={bulkConfig.startDate}
						class="form-input"
					/>
				</div>
				<div>
					<label class="form-label" for="bulk-end-date">End Date</label>
					<input
						id="bulk-end-date"
						type="date"
						bind:value={bulkConfig.endDate}
						class="form-input"
					/>
				</div>
			</div>

			<div class="mb-4">
				<div class="form-label">Days of Week</div>
				<div class="flex gap-2 flex-wrap">
					{#each [
						{ value: 1, label: 'Mon' },
						{ value: 2, label: 'Tue' },
						{ value: 3, label: 'Wed' },
						{ value: 4, label: 'Thu' },
						{ value: 5, label: 'Fri' },
						{ value: 6, label: 'Sat' },
						{ value: 0, label: 'Sun' }
					] as day}
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:group={bulkConfig.daysOfWeek}
								value={day.value}
								class="form-checkbox"
							/>
							<span class="text-sm">{day.label}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="mb-4">
				<div class="form-label">Time Slots</div>
				{#each bulkConfig.timeSlots as timeSlot, index}
					<div class="flex gap-2 mb-2">
						<input
							type="time"
							bind:value={timeSlot.startTime}
							class="form-input flex-1"
						/>
						<span class="flex items-center px-2">to</span>
						<input
							type="time"
							bind:value={timeSlot.endTime}
							class="form-input flex-1"
						/>
						{#if bulkConfig.timeSlots.length > 1}
							<button
								onclick={() => removeBulkTimeSlot(index)}
								class="button-danger button--small"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						{/if}
					</div>
				{/each}
				<button
					onclick={addBulkTimeSlot}
					class="button-secondary button--small button--gap mt-2"
				>
					<Plus class="h-4 w-4" />
					Add Time Slot
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="form-label" for="bulk-available-spots">Available Spots</label>
					<input
						id="bulk-available-spots"
						type="number"
						bind:value={bulkConfig.availableSpots}
						min="1"
						max={tourCapacity}
						class="form-input"
					/>
				</div>
				<div>
					<!-- Price field removed - not in schema -->
				</div>
			</div>

			<div class="flex gap-2">
				<button
					onclick={generateBulkSlots}
					class="button-primary button--gap"
					disabled={!bulkConfig.startDate || !bulkConfig.endDate}
				>
					<Calendar class="h-4 w-4" />
					Create Slots
				</button>
				<button
					onclick={() => bulkMode = false}
					class="button-secondary"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Single Slot Creation Form -->
	{#if showAddForm}
		<div class="p-6 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h4 class="font-semibold mb-4" style="color: var(--text-primary);">Add New Time Slot</h4>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				<div>
					<label class="form-label" for="new-slot-date">Date</label>
					<input
						id="new-slot-date"
						type="date"
						bind:value={newSlot.date}
						class="form-input"
					/>
				</div>
				<div>
					<label class="form-label" for="new-slot-start-time">Start Time</label>
					<input
						id="new-slot-start-time"
						type="time"
						bind:value={newSlot.startTime}
						class="form-input"
					/>
				</div>
				<div>
					<label class="form-label" for="new-slot-end-time">End Time</label>
					<input
						id="new-slot-end-time"
						type="time"
						bind:value={newSlot.endTime}
						class="form-input"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<label class="form-label" for="new-slot-spots">Available Spots</label>
					<input
						id="new-slot-spots"
						type="number"
						bind:value={newSlot.availableSpots}
						min="1"
						max={tourCapacity}
						class="form-input"
					/>
				</div>
				<div>
					<label class="form-label" for="new-slot-price">Price Override (optional)</label>
					<input
						id="new-slot-price"
						type="number"
						bind:value={newSlot.price}
						step="0.01"
						placeholder="Use tour default price"
						class="form-input"
					/>
				</div>
			</div>

			<div class="mb-4">
				<label class="form-label" for="new-slot-notes">Notes (optional)</label>
				<textarea
					id="new-slot-notes"
					bind:value={newSlot.notes}
					placeholder="Special instructions or notes for this time slot"
					class="form-textarea"
					rows="2"
				></textarea>
			</div>

			<div class="flex gap-2">
				<button
					onclick={createSlot}
					class="button-primary button--gap"
					disabled={!newSlot.date || !newSlot.startTime || !newSlot.endTime}
				>
					<Save class="h-4 w-4" />
					Create Slot
				</button>
				<button
					onclick={() => { showAddForm = false; resetNewSlot(); }}
					class="button-secondary"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Existing Slots -->
	{#if sortedSlots.length > 0}
		<!-- Upcoming Slots -->
		{#if upcomingSlots.length > 0}
			<div>
				<h4 class="font-medium mb-3" style="color: var(--text-primary);">
					Upcoming Slots ({upcomingSlots.length})
				</h4>
				<div class="space-y-3">
					{#each upcomingSlots as slot}
						<div class="p-4 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
							{#if editingSlot === slot.id}
								<!-- Edit Form -->
								<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
									<input
										type="date"
										bind:value={editForm.date}
										class="form-input form-input--small"
									/>
									<input
										type="time"
										bind:value={editForm.startTime}
										class="form-input form-input--small"
									/>
									<input
										type="time"
										bind:value={editForm.endTime}
										class="form-input form-input--small"
									/>
									<input
										type="number"
										bind:value={editForm.availableSpots}
										min="1"
										max={tourCapacity}
										class="form-input form-input--small"
									/>
								</div>
								<div class="flex gap-2">
									<button onclick={saveEdit} class="button-primary button--small button--gap">
										<Save class="h-3 w-3" />
										Save
									</button>
									<button onclick={cancelEdit} class="button-secondary button--small">
										<X class="h-3 w-3" />
										Cancel
									</button>
								</div>
							{:else}
								<!-- Display Mode -->
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<div class="flex items-center gap-2">
												<Calendar class="h-4 w-4" style="color: var(--text-tertiary);" />
												<span class="font-medium" style="color: var(--text-primary);">
													{formatDate(slot.startTime)}
												</span>
											</div>
											<div class="flex items-center gap-2">
												<Clock class="h-4 w-4" style="color: var(--text-tertiary);" />
												<span style="color: var(--text-secondary);">
													{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
												</span>
											</div>
											<span class="px-2 py-1 text-xs font-medium rounded-full border {getSlotStatusColor(getSlotStatus(slot))}">
												{getSlotStatus(slot)}
											</span>
										</div>
										<div class="flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
											<div class="flex items-center gap-1">
												<Users class="h-3 w-3" />
												<span>{slot.bookedSpots} booked, {Math.max(0, slot.availableSpots - slot.bookedSpots)} available</span>
											</div>
											{#if slot.bookedSpots > 0}
												<div class="w-20 h-2 rounded-full" style="background: var(--bg-tertiary);">
													<div 
														class="h-full rounded-full"
														style="background-color: var(--color-primary-500); width: {getSlotUtilization(slot)}%"
													></div>
												</div>
											{/if}

										</div>
									</div>
									<div class="flex gap-2">
										<button
											onclick={() => startEdit(slot)}
											class="button-secondary button--small"
											disabled={slot.bookedSpots > 0}
										>
											<Edit3 class="h-3 w-3" />
										</button>
										<button
											onclick={() => deleteSlot(slot.id)}
											class="button-danger button--small"
											disabled={slot.bookedSpots > 0}
										>
											<Trash2 class="h-3 w-3" />
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Past Slots -->
		{#if pastSlots.length > 0}
			<div>
				<h4 class="font-medium mb-3" style="color: var(--text-primary);">
					Past Slots ({pastSlots.length})
				</h4>
				<div class="space-y-2">
					{#each pastSlots.slice(0, 5) as slot}
						<div class="p-3 rounded-lg opacity-75" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-3">
									<span style="color: var(--text-secondary);">
										{formatDate(slot.startTime)} at {formatTime(slot.startTime)}
									</span>
									<span class="px-2 py-1 text-xs rounded-full" style="background: var(--bg-tertiary); color: var(--text-tertiary);">
										{slot.bookedSpots} booked
									</span>
								</div>
							</div>
						</div>
					{/each}
					{#if pastSlots.length > 5}
						<p class="text-sm text-center" style="color: var(--text-tertiary);">
							... and {pastSlots.length - 5} more past slots
						</p>
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty State -->
		<div class="text-center py-12">
			<Calendar class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
			<h4 class="font-medium mb-2" style="color: var(--text-primary);">No time slots yet</h4>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">
				Create your first time slot to start accepting bookings
			</p>
			<button
				onclick={() => showAddForm = true}
				class="button-primary button--gap"
			>
				<Plus class="h-4 w-4" />
				Add First Slot
			</button>
		</div>
	{/if}
</div> 