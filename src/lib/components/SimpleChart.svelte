<script lang="ts">
	import { formatCurrency } from '$lib/utils/currency.js';
	
	interface ChartDataPoint {
		date: string;
		value: number;
	}
	
	interface Props {
		data: ChartDataPoint[];
		type?: 'line' | 'bar';
		height?: number;
		showCurrency?: boolean;
		label?: string;
		color?: string;
	}
	
	let { 
		data = [], 
		type = 'line',
		height = 200,
		showCurrency = false,
		label = '',
		color = '#3B82F6'
	}: Props = $props();
	
	// Hover state for tooltips
	let hoveredPoint = $state<number | null>(null);
	
	// Calculate chart dimensions and scale
	let hasData = $derived(data.length > 0 && data.some(d => d.value > 0));
	let maxValue = $derived(Math.max(...data.map(d => d.value), 1));
	let minValue = $derived(0); // Always start from 0 for better visualization
	let valueRange = $derived(maxValue - minValue || 1);
	let padding = $derived(valueRange * 0.1); // 10% padding
	let chartMax = $derived(maxValue + padding);
	let chartMin = $derived(minValue);
	let chartRange = $derived(chartMax - chartMin || 1);
	
	// Generate Y-axis labels
	let yAxisSteps = $derived((() => {
		const labels = [];
		const steps = 4;
		for (let i = 0; i <= steps; i++) {
			const value = chartMin + (chartRange / steps) * i;
			labels.push({
				value,
				label: showCurrency ? formatCurrency(value) : formatNumber(value)
			});
		}
		return labels;
	})());
	
	let yAxisLabels = $derived(yAxisSteps.slice().reverse());
	
	// Format number helper
	function formatNumber(value: number): string {
		if (value >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`;
		} else if (value >= 1000) {
			return `${(value / 1000).toFixed(1)}k`;
		}
		return value.toFixed(0);
	}
	
	// Calculate point positions
	let points = $derived(
		data.length > 0 ? data.map((point, index) => {
			const xPos = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
			const yPos = chartRange > 0 ? ((chartMax - point.value) / chartRange) * 100 : 50;
			return {
				x: xPos,
				y: Math.max(0, Math.min(100, yPos)), // Clamp between 0 and 100
				value: point.value,
				date: point.date,
			};
		}) : []
	);
	
	// Generate SVG path for line chart
	let linePath = $derived(
		points.length > 0 
			? points.map((point, index) => 
				`${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
			).join(' ')
			: ''
	);
	
	// Format date for display
	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		
		if (dateStr.length === 7) { // YYYY-MM format
			return date.toLocaleDateString('en', { month: 'short', year: 'numeric' });
		}
		return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
	}
	
	// Tooltip formatting
	function getTooltipText(point: any): string {
		const value = showCurrency ? formatCurrency(point.value) : point.value;
		const date = formatDate(point.date);
		return `${value} - ${date}`;
	}
</script>



<div class="chart-container">
	{#if !hasData}
		<div class="chart-area" style="height: {height}px;">
			<div class="empty-state">No data available</div>
		</div>
	{:else}
		<!-- Y-axis labels -->
		<div class="y-axis">
			{#each yAxisLabels as label}
				<div class="y-label">{label.label}</div>
			{/each}
		</div>
		
		<!-- Chart area -->
		<div class="chart-area" style="height: {height}px;">
			<!-- Grid lines -->
			{#each yAxisLabels as label, index}
				<div 
					class="grid-line" 
					style="top: {(index / (yAxisLabels.length - 1)) * 100}%"
				></div>
			{/each}
			
			{#if type === 'bar'}
				<!-- Bar chart -->
				{#each points as point, index}
					{@const barWidth = Math.max(10, 80 / data.length)}
					{@const barX = point.x - barWidth / 2}
					{@const barHeight = Math.max(0, ((point.value / chartMax) * 100))}
					<div
						class="bar"
						role="button"
						tabindex="0"
						style="
							left: {barX}%;
							width: {barWidth}%;
							height: {barHeight}%;
							background: {color};
						"
						onmouseenter={() => hoveredPoint = index}
						onmouseleave={() => hoveredPoint = null}
					>
						{#if hoveredPoint === index}
							<div class="tooltip" style="left: 50%; bottom: {barHeight}%;">
								<div class="tooltip-value">{showCurrency ? formatCurrency(point.value) : point.value}</div>
								<div class="tooltip-date">{formatDate(point.date)}</div>
							</div>
						{/if}
					</div>
				{/each}
			{:else}
				<!-- Line chart -->
				<!-- Lines and areas -->
				<svg class="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
					{#if points.length > 1}
						<!-- Area under line -->
						<path
							class="area-path"
							d="{linePath} L {points[points.length - 1]?.x || 0} 100 L {points[0]?.x || 0} 100 Z"
							fill={color}
						/>
						
						<!-- Line -->
						<path
							class="line-path"
							d={linePath}
							stroke={color}
						/>
					{/if}
				</svg>
				
				<!-- Data points overlay -->
				{#each points as point, index}
					<div
						class="data-point-container"
						role="button"
						tabindex="0"
						style="
							position: absolute;
							left: {point.x}%;
							top: {point.y}%;
							transform: translate(-50%, -50%);
							width: 8px;
							height: 8px;
							border-radius: 50%;
							background: white;
							border: 2px solid {color};
							cursor: pointer;
							transition: width 0.2s, height 0.2s, border-width 0.2s;
						"
						onmouseenter={() => hoveredPoint = index}
						onmouseleave={() => hoveredPoint = null}
					></div>
				{/each}
				
				<!-- Tooltips for line chart -->
				{#if hoveredPoint !== null && points[hoveredPoint]}
					{@const point = points[hoveredPoint]}
					<div 
						class="tooltip" 
						style="
							left: {point.x}%;
							top: calc({point.y}% * {height / 100}px);
						"
					>
						<div class="tooltip-value">{showCurrency ? formatCurrency(point.value) : point.value}</div>
						<div class="tooltip-date">{formatDate(point.date)}</div>
					</div>
				{/if}
			{/if}
		</div>
		
		<!-- X-axis labels -->
		{#if data.length === 1}
			<div class="x-axis">
				<div class="x-label" style="width: 100%; text-align: center;">{formatDate(data[0].date)}</div>
			</div>
		{:else if data.length <= 7}
			<div class="x-axis">
				{#each data as point}
					<div class="x-label">{formatDate(point.date)}</div>
				{/each}
			</div>
		{:else}
			<!-- Show fewer labels for many data points -->
			<div class="x-axis">
				<div class="x-label">{formatDate(data[0].date)}</div>
				<div class="x-label">{formatDate(data[Math.floor(data.length / 2)].date)}</div>
				<div class="x-label">{formatDate(data[data.length - 1].date)}</div>
			</div>
		{/if}
	{/if}
</div> 

<style>
	.chart-container {
		position: relative;
		width: 100%;
	}
	
	.y-axis {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 60px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	
	.y-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: right;
		padding-right: 0.5rem;
	}
	
	.chart-area {
		margin-left: 60px;
		position: relative;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.grid-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--border-primary);
		opacity: 0.5;
	}
	
	.bar {
		position: absolute;
		bottom: 0;
		background: var(--color-primary-500);
		border-radius: 0.25rem 0.25rem 0 0;
		transition: all 0.2s;
		cursor: pointer;
	}
	
	.bar:hover {
		opacity: 0.8;
		transform: translateY(-2px);
	}
	
	.line-chart {
		width: 100%;
		height: 100%;
	}
	
	.line-path {
		fill: none;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	
	.area-path {
		opacity: 0.1;
	}
	
	.data-point-container:hover {
		width: 12px !important;
		height: 12px !important;
		border-width: 3px !important;
	}
	
	.tooltip {
		position: absolute;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		pointer-events: none;
		z-index: 10;
		white-space: nowrap;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transform: translate(-50%, -100%);
		margin-top: -8px;
	}
	
	.tooltip-value {
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.tooltip-date {
		color: var(--text-secondary);
		font-size: 0.625rem;
		margin-top: 0.125rem;
	}
	
	.x-axis {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		padding: 0 0.5rem;
		margin-left: 60px;
	}
	
	.x-label {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		text-align: center;
	}
	
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-tertiary);
		font-size: 0.875rem;
	}
	
	.no-data-message {
		text-align: center;
		padding: 2rem;
		color: var(--text-tertiary);
	}
</style>