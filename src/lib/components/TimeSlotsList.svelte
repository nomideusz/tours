<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Edit from 'lucide-svelte/icons/edit';
	import type { TimeSlot } from '$lib/types.js';

	interface Props {
		slots: TimeSlot[];
		onEditSlot?: (slot: TimeSlot) => void;
		selectedDate?: Date;
	}

	let { slots, onEditSlot, selectedDate }: Props = $props();

	// Filter slots for selected date if provided
	const filteredSlots = $derived.by(() => {
		if (!selectedDate) return slots;
		
		const dateKey = formatDateKey(selectedDate);
		return slots.filter(slot => {
			const slotDate = new Date(slot.startTime);
			const slotKey = formatDateKey(slotDate);
			return slotKey === dateKey;
		});
	});

	// Group slots by date
	const slotsByDate = $derived.by(() => {
		const groups: Record<string, TimeSlot[]> = {};
		
		filteredSlots.forEach(slot => {
			const date = new Date(slot.startTime);
			const dateKey = formatDate(slot.startTime);
			if (!groups[dateKey]) groups[dateKey] = [];
			groups[dateKey].push(slot);
		});
		
		// Sort groups by date
		const sortedGroups = Object.entries(groups).sort((a, b) => {
			const dateA = new Date(a[1][0].startTime);
			const dateB = new Date(b[1][0].startTime);
			return dateA.getTime() - dateB.getTime();
		});
		
		return sortedGroups;
	});

	function formatDateKey(date: Date): string {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getSlotStatus(slot: TimeSlot) {
		if (slot.status === 'cancelled') return { text: 'Cancelled', color: 'var(--text-tertiary)' };
		if (slot.availableSpots === 0) return { text: 'Full', color: 'var(--color-danger-500)' };
		if (slot.bookedSpots > 0) return { text: `${slot.bookedSpots} booked`, color: 'var(--color-success-600)' };
		return { text: 'Available', color: 'var(--color-primary-600)' };
	}

	function getCapacityDisplay(slot: TimeSlot) {
		const total = slot.availableSpots + slot.bookedSpots;
		return `${slot.bookedSpots}/${total}`;
	}
</script>

<div class="time-slots-list">
	{#if slotsByDate.length === 0}
		<div class="empty-state">
			<Clock class="empty-icon" />
			<p class="empty-text">No time slots scheduled</p>
			{#if selectedDate}
				<p class="empty-subtext">No slots on {formatDate(selectedDate.toISOString())}</p>
			{/if}
		</div>
	{:else}
		{#each slotsByDate as [dateKey, dateSlots]}
			<div class="date-group">
				<h4 class="date-header">{dateKey}</h4>
				<div class="slots-grid">
					{#each dateSlots as slot}
						{@const status = getSlotStatus(slot)}
						<div class="slot-card" class:cancelled={slot.status === 'cancelled'}>
							<div class="slot-time">
								<Clock class="slot-icon" />
								<span>{formatSlotTimeRange(slot.startTime, slot.endTime)}</span>
							</div>
							
							<div class="slot-info">
								<div class="slot-capacity">
									<Users class="slot-icon" />
									<span>{getCapacityDisplay(slot)}</span>
								</div>
								
								<div class="slot-status" style="color: {status.color}">
									{status.text}
								</div>
							</div>
							
							{#if onEditSlot && slot.status !== 'cancelled'}
								<button
									type="button"
									onclick={() => onEditSlot(slot)}
									class="slot-edit-btn"
									aria-label="Edit time slot"
								>
									<Edit class="w-4 h-4" />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.time-slots-list {
		background: var(--bg-primary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
		padding: 1.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
	}

	.empty-icon {
		width: 3rem;
		height: 3rem;
		color: var(--text-tertiary);
		margin: 0 auto 1rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-subtext {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin: 0.5rem 0 0;
	}

	.date-group {
		margin-bottom: 2rem;
	}

	.date-group:last-child {
		margin-bottom: 0;
	}

	.date-header {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		margin: 0 0 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.slots-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.slot-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.15s ease;
		position: relative;
	}

	.slot-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.slot-card.cancelled {
		opacity: 0.6;
	}

	.slot-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
		min-width: 120px;
	}

	.slot-info {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex: 1;
	}

	.slot-capacity {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.slot-status {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.slot-icon {
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
	}

	.slot-edit-btn {
		padding: 0.5rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.slot-edit-btn:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
	}

	/* Single column layout - slots displayed one under another */
	/* Removed responsive multi-column grid to keep slots vertical */

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.time-slots-list {
			padding: 1rem;
		}

		.slot-card {
			padding: 0.75rem;
			flex-wrap: wrap;
		}

		.slot-time {
			min-width: unset;
			width: 100%;
			margin-bottom: 0.5rem;
		}

		.slot-info {
			width: 100%;
			justify-content: space-between;
		}

		.slot-edit-btn {
			position: absolute;
			top: 0.75rem;
			right: 0.75rem;
		}
	}
</style> 