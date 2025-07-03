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
	
	let canvas = $state<HTMLCanvasElement>();
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
		
		// Listen for theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleThemeChange = () => {
			if (chart) {
				chart.destroy();
				chart = null;
				createChart();
			}
		};
		
		mediaQuery.addEventListener('change', handleThemeChange);
		
		// Also listen for manual theme changes via class toggle
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
					if (chart) {
						chart.destroy();
						chart = null;
						createChart();
					}
				}
			});
		});
		
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		
		return () => {
			if (chart) {
				chart.destroy();
			}
			mediaQuery.removeEventListener('change', handleThemeChange);
			observer.disconnect();
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
		
		// Force theme detection with explicit checks
		const isDarkMode = document.documentElement.classList.contains('dark') || 
						 window.matchMedia('(prefers-color-scheme: dark)').matches;
		
		console.log('Creating chart - Dark mode:', isDarkMode);
		console.log('Document classes:', document.documentElement.className);
		
		// Explicit color values
		const chartColor = isDarkMode ? '#60A5FA' : '#3B82F6';
		const textColor = isDarkMode ? '#D1D5DB' : '#6B7280';
		const gridColor = isDarkMode ? '#374151' : '#F3F4F6';
		const backgroundColor = isDarkMode ? '#1F2937' : '#FFFFFF';
		const borderColor = isDarkMode ? '#4B5563' : '#E5E7EB';
		
		console.log('Chart colors:', { chartColor, textColor, gridColor });
		
		const chartData = {
			labels: data.map(d => d.date),
			datasets: [{
				label: label || 'Value',
				data: data.map(d => d.value),
				borderColor: chartColor,
				backgroundColor: type === 'line' ? 
					(isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.1)') : 
					chartColor,
				borderWidth: 3, // Thicker for visibility
				fill: type === 'line',
				tension: 0.3,
				pointRadius: type === 'line' ? 6 : 0, // Larger points for visibility
				pointHoverRadius: type === 'line' ? 8 : 0,
				pointBackgroundColor: type === 'line' ? backgroundColor : undefined,
				pointBorderColor: type === 'line' ? chartColor : undefined,
				pointBorderWidth: type === 'line' ? 3 : 0,
			}]
		};
		
		console.log('Dataset colors:', chartData.datasets[0].borderColor, chartData.datasets[0].backgroundColor);
		
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
							backgroundColor: backgroundColor,
							titleColor: isDarkMode ? '#F9FAFB' : '#111827',
							bodyColor: textColor,
							borderColor: borderColor,
							borderWidth: 1,
							cornerRadius: 8,
							padding: 12,
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
							border: {
								color: borderColor,
							},
							grid: {
								display: false,
							},
							ticks: {
								color: textColor,
								maxRotation: 0,
								maxTicksLimit: 6,
							}
						},
						y: {
							beginAtZero: true,
							border: {
								color: borderColor,
							},
							grid: {
								color: gridColor,
								lineWidth: 1,
							},
							ticks: {
								color: textColor,
								maxTicksLimit: 6,
								precision: 0,
								stepSize: 1,
								callback: function(value) {
									// Only show integer values for counts
									const num = Number(value);
									if (!Number.isInteger(num)) {
										return null; // Hide non-integer ticks
									}
									
									if (showCurrency) {
										return formatCurrency(num);
									}
									
									// Format large numbers
									if (num >= 1000000) {
										return `${(num / 1000000).toFixed(1)}M`;
									} else if (num >= 1000) {
										return `${(num / 1000).toFixed(1)}k`;
									}
									return num.toString();
								}
							}
						}
					}
				}
			});
			
			console.log('Chart created - final chart object:', chart);
			console.log('Chart dataset after creation:', chart.data.datasets[0]);
			
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

<div class="chart-container">
	{#if data.length === 0 || !data.some(d => d.value > 0)}
		<div class="empty-state">No data available</div>
	{:else}
		<canvas bind:this={canvas} width="400" height="200"></canvas>
	{/if}
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 300px;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid var(--border-primary);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	canvas {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}
	
	.empty-state {
		color: var(--text-secondary);
		font-size: 0.875rem;
		text-align: center;
	}
</style> 