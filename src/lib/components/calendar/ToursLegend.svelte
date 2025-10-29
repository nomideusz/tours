<script lang="ts">
	import { goto } from '$app/navigation';
	import Plus from 'lucide-svelte/icons/plus';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Settings from 'lucide-svelte/icons/settings';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import { getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	import type { Tour } from '$lib/types.js';

	// Props
	let {
		tours = [],
		highlightedTourId = ''
	}: {
		tours?: Tour[];
		highlightedTourId?: string;
	} = $props();

	// Collapse state
	let isCollapsed = $state(true); // Start collapsed by default to save space

	// Generate color for tour based on tour ID/name (same algorithm as TourTimeline)
	function getTourCalendarColor(tourId: string | undefined, tourName: string | undefined): string {
		if (!tourId || !tourName) {
			// Fallback color if data is missing
			return '#3B82F6';
		}
		
		// Use a hash function to generate consistent colors
		let hash = 0;
		const str = tourId + tourName;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		// Generate HSL values
		const hue = Math.abs(hash) % 360;
		const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
		const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
		
		// Convert HSL to RGB for better browser compatibility
		const h = hue / 360;
		const s = saturation / 100;
		const l = lightness / 100;
		
		let r, g, b;
		
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			};
			
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		
		// Convert to hex
		const toHex = (x: number) => {
			const hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
</script>

{#if tours && tours.length > 0}
	<div class="tours-legend-section">
		<div class="tours-legend-header">
			<div class="tours-legend-header-content">
				<h2 class="tours-legend-title">
					<span class="hidden sm:inline">Tour Calendar Legend</span>
					<span class="sm:hidden">Tours ({tours.length})</span>
				</h2>
				<!-- Collapse toggle -->
				<button 
					onclick={() => isCollapsed = !isCollapsed}
					class="collapse-toggle"
					aria-label="{isCollapsed ? 'Show' : 'Hide'} tours"
				>
					{#if isCollapsed}
						<ChevronDown class="h-4 w-4" />
					{:else}
						<ChevronUp class="h-4 w-4" />
					{/if}
				</button>
			</div>
			<button onclick={() => goto('/tours/new')} class="button-primary button-small button-gap">
				<Plus class="h-4 w-4" />
				<span class="hidden sm:inline">Create Tour</span>
			</button>
		</div>
		
		<div class="tours-legend-table {isCollapsed ? 'collapsed' : ''}">
			<div class="table-wrapper">
				<table class="tours-table">
				<thead>
					<tr>
						<th class="table-header-color"></th>
						<th class="table-header-name">Tour Name</th>
						<th class="table-header-location hidden sm:table-cell">Location</th>
						<th class="table-header-price hidden md:table-cell">Price</th>
						<th class="table-header-stats">Upcoming</th>
						<th class="table-header-actions"></th>
					</tr>
				</thead>
				<tbody>
					{#each tours as tour}
						<tr 
							class="tour-row {tour.status === 'draft' ? 'tour-row--draft' : ''} {highlightedTourId === tour.id ? 'tour-row--highlighted' : ''}"
							id="tour-row-{tour.id}"
						>
							<td class="table-cell-color">
								<div 
									style="display: inline-block; width: 24px; height: 24px; background-color: {getTourCalendarColor(tour.id, tour.name)}; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px;"
									title="Calendar color for {tour.name}"
								></div>
							</td>
							<td class="table-cell-name">
								<button 
									onclick={() => goto(`/tours/${tour.id}`)}
									class="tour-name-link"
								>
									<span class="tour-name-text">{tour.name}</span>
									{#if tour.status === 'draft'}
										<span class="tour-badge-draft">Draft</span>
									{/if}
								</button>
							</td>
							<td class="table-cell-location hidden sm:table-cell">
								{#if tour.location}
									<div class="tour-location">
										<MapPin class="h-3 w-3" />
										<span>{tour.location}</span>
									</div>
								{:else}
									<span class="text-muted">—</span>
								{/if}
							</td>
							<td class="table-cell-price hidden md:table-cell">
								<span class="tour-price">
									{getTourDisplayPriceFormatted(tour)}
								</span>
							</td>
							<td class="table-cell-stats">
								<div class="tour-stats-compact">
									<span class="stat-value">{tour.upcomingSlots || 0}</span>
									<span class="stat-label">slots</span>
								</div>
							</td>
							<td class="table-cell-actions">
								<button 
									onclick={() => goto(`/tours/${tour.id}`)}
									class="button-icon-small"
									title="Manage tour"
								>
									<Settings class="h-4 w-4" />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			</div>
			
			{#if tours.length === 0}
				<div class="empty-state">
					<p>No tours yet. Create your first tour to see it here.</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Tours Legend Section */
	.tours-legend-section {
		margin-top: 2rem;
	}
	
	.tours-legend-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}
	
	.tours-legend-header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.tours-legend-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	/* Collapse toggle button */
	.collapse-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.collapse-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}
	
	.tours-legend-table {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
	}
	
	/* Collapsed state */
	.tours-legend-table.collapsed {
		display: none;
	}
	
	.table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	
	.tours-table {
		width: 100%;
		min-width: 320px;
		border-collapse: collapse;
		table-layout: fixed;
	}
	
	.tours-table thead {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}
	
	.tours-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
	}
	
	.table-header-color {
		width: 3rem;
	}
	
	.table-header-actions {
		width: 3rem;
		text-align: center;
	}
	
	.table-header-stats {
		width: 5rem;
		text-align: center;
	}
	
	/* Mobile column widths */
	@media (max-width: 640px) {
		.table-header-color {
			width: 2.5rem;
		}
		
		.table-header-name {
			width: auto; /* Takes remaining space */
		}
		
		.table-header-stats {
			width: 4rem;
		}
		
		.table-header-actions {
			width: 2.5rem;
		}
	}
	
	.tours-table tbody tr {
		border-bottom: 1px solid var(--border-primary);
		transition: background-color 0.2s;
	}
	
	.tours-table tbody tr:last-child {
		border-bottom: none;
	}
	
	.tours-table tbody tr:hover {
		background: var(--bg-secondary);
	}
	
	.tour-row--draft {
		opacity: 0.7;
	}
	
	.tour-row--highlighted {
		animation: highlightPulse 2s ease-in-out;
		background: var(--color-primary-100) !important;
	}
	
	@keyframes highlightPulse {
		0% {
			background: var(--bg-primary);
		}
		20% {
			background: var(--color-primary-100);
			box-shadow: 0 0 0 2px var(--color-primary-200);
		}
		80% {
			background: var(--color-primary-100);
			box-shadow: 0 0 0 2px var(--color-primary-200);
		}
		100% {
			background: var(--bg-primary);
			box-shadow: none;
		}
	}
	
	.tours-table td {
		padding: 0.75rem 1rem;
		vertical-align: middle;
	}
	
	.table-cell-color {
		width: 3rem;
		padding: 0.75rem 0.5rem 0.75rem 1rem;
	}
	
	.table-cell-name {
		font-weight: 500;
	}
	
	.tour-name-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		color: var(--text-primary);
		font-weight: 500;
		transition: color 0.2s;
	}
	
	.tour-name-link:hover .tour-name-text {
		color: var(--color-primary-600);
		text-decoration: underline;
	}
	
	.tour-badge-draft {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.table-cell-location {
		color: var(--text-secondary);
	}
	
	.tour-location {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
	}
	
	.text-muted {
		color: var(--text-tertiary);
	}
	
	.table-cell-price {
		font-weight: 600;
		color: var(--color-primary-600);
	}
	
	.table-cell-stats {
		text-align: center;
	}
	
	.tour-stats-compact {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}
	
	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.stat-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
	}
	
	.tours-table .table-cell-actions {
		width: 3rem;
		padding: 0.75rem 1rem 0.75rem 0.5rem !important;
		text-align: center;
	}
	
	.button-icon-small {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.button-icon-small:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}
	
	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary);
	}
	
	/* Responsive adjustments */
	@media (max-width: 640px) {
		/* Mobile header adjustments */
		.tours-legend-section {
			margin-top: 1rem;
		}
		
		.tours-legend-header {
			margin-bottom: 0.75rem;
		}
		
		.tours-legend-title {
			font-size: 1rem;
		}
		
		
		.tours-table th,
		.tours-table td {
			padding: 0.5rem 0.25rem;
			font-size: 0.875rem;
		}
		
		.table-header-color,
		.table-cell-color {
			width: 2.5rem;
			padding-left: 0.5rem;
			padding-right: 0.25rem;
		}
		
		.table-cell-name {
			padding-left: 0.5rem;
			padding-right: 0.25rem;
		}
		
		.table-cell-stats {
			padding-left: 0.25rem;
			padding-right: 0.25rem;
			text-align: center;
		}
		
		.tours-table .table-cell-actions {
			padding: 0.5rem 0.5rem 0.5rem 0.25rem !important;
		}
		
		.tour-name-text {
			font-size: 0.875rem;
			line-height: 1.25;
		}
		
		.tour-badge-draft {
			font-size: 0.625rem;
			padding: 0.125rem 0.375rem;
		}
	}
</style>
