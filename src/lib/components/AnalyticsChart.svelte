<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		Chart as ChartJS, 
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		LineController,
		BarController,
		Title,
		Tooltip,
		Legend,
		Filler
	} from 'chart.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	
	// Register Chart.js components explicitly
	ChartJS.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		LineController,
		BarController,
		Title,
		Tooltip,
		Legend,
		Filler
	);
	
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
	
	let canvas: HTMLCanvasElement;
	let chart: ChartJS | null = null;
	
	// Reactive chart update when data changes
	$effect(() => {
		if (chart && data) {
			updateChart();
		}
	});
	
	onMount(() => {
		console.log('Chart component mounted, data:', data);
		if (canvas) {
			createChart();
		}
		
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
	
	function createChart() {
		if (!canvas) {
			console.error('Canvas not available');
			return;
		}
		
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.error('Canvas context not available');
			return;
		}
		
		console.log('Creating chart with:', { type, dataLength: data.length, color });
		
		// Simple hardcoded configuration to test
		const chartData = {
			labels: data.map(d => d.date),
			datasets: [{
				label: label || 'Value',
				data: data.map(d => d.value),
				borderColor: '#3B82F6',
				backgroundColor: type === 'line' ? 'rgba(59, 130, 246, 0.1)' : '#3B82F6',
				borderWidth: 2,
				fill: type === 'line',
				tension: 0.3,
			}]
		};
		
		console.log('Chart data:', chartData);
		
		try {
			chart = new ChartJS(ctx, {
				type: type,
				data: chartData,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							backgroundColor: '#1F2937',
							titleColor: '#F9FAFB',
							bodyColor: '#F9FAFB',
							borderColor: '#374151',
							borderWidth: 1,
							callbacks: {
								label: (context) => {
									const value = context.parsed.y;
									return showCurrency ? formatCurrency(value) : value.toLocaleString();
								}
							}
						}
					},
					scales: {
						x: {
							grid: {
								display: false,
							},
							ticks: {
								color: '#6B7280',
							}
						},
						y: {
							beginAtZero: true,
							grid: {
								color: '#E5E7EB',
							},
							ticks: {
								color: '#6B7280',
								callback: function(value) {
									if (showCurrency) {
										return formatCurrency(Number(value));
									}
									
									const num = Number(value);
									if (num >= 1000000) {
										return `${(num / 1000000).toFixed(1)}M`;
									} else if (num >= 1000) {
										return `${(num / 1000).toFixed(1)}k`;
									}
									return num.toFixed(0);
								}
							}
						}
					}
				}
			});
			
			console.log('Chart created successfully:', chart);
		} catch (error) {
			console.error('Error creating chart:', error);
		}
	}
	
	function updateChart() {
		if (!chart) return;
		
		chart.data.labels = data.map(d => d.date);
		chart.data.datasets[0].data = data.map(d => d.value);
		chart.update('none');
	}
</script>

<div class="chart-container" style="height: {height}px;">
	{#if data.length === 0 || !data.some(d => d.value > 0)}
		<div class="empty-state">No data available</div>
	{:else}
		<canvas bind:this={canvas}></canvas>
	{/if}
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		background: white; /* Test with white background */
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid #E5E7EB; /* Add border to see container */
	}
	
	canvas {
		width: 100% !important;
		height: 100% !important;
	}
	
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-tertiary);
		font-size: 0.875rem;
	}
</style> 