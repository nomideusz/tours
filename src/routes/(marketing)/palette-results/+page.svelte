<script lang="ts">
	import { onMount } from 'svelte';
	
	let results = $state<any>(null);
	let loading = $state(true);
	
	const paletteNames: Record<string, string> = {
		current: 'Current (Coral)',
		oceanAdventure: 'Ocean Adventure',
		tropicalTeal: 'Tropical Teal',
		deepBlue: 'Deep Blue Trust',
		adventureGreen: 'Adventure Green'
	};
	
	onMount(async () => {
		try {
			const response = await fetch('/api/palette-results');
			results = await response.json();
		} catch (error) {
			console.error('Failed to fetch results:', error);
		} finally {
			loading = false;
		}
		
		// Auto-refresh every 10 seconds
		const interval = setInterval(async () => {
			try {
				const response = await fetch('/api/palette-results');
				results = await response.json();
			} catch (error) {
				console.error('Failed to refresh results:', error);
			}
		}, 10000);
		
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Color Palette Voting Results - Zaur</title>
</svelte:head>

<div class="results-page">
	<div class="max-w-4xl mx-auto px-4 py-12">
		<h1 class="page-title">🎨 Color Palette Voting Results</h1>
		<p class="page-subtitle">Beta tester preferences • Updates every 10 seconds</p>
		
		{#if loading}
			<div class="loading">Loading results...</div>
		{:else if results?.message}
			<div class="no-votes">
				<p>No votes yet. Share the palette switcher (Ctrl+Shift+P) with beta testers!</p>
			</div>
		{:else}
			<!-- Summary Stats -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">{results.total}</div>
					<div class="stat-label">Total Votes</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{Object.keys(results.votes).length}</div>
					<div class="stat-label">Palettes Tested</div>
				</div>
				<div class="stat-card stat-card-highlight">
					<div class="stat-value">{results.sorted[0]?.palette ? paletteNames[results.sorted[0].palette] || results.sorted[0].palette : 'N/A'}</div>
					<div class="stat-label">Leading Palette</div>
				</div>
			</div>
			
			<!-- Vote Breakdown -->
			<div class="results-section">
				<h2>Vote Breakdown</h2>
				<div class="votes-list">
					{#each results.sorted as { palette, count }}
						{@const percentage = ((count / results.total) * 100).toFixed(1)}
						<div class="vote-row">
							<div class="vote-info">
								<span class="palette-name">{paletteNames[palette] || palette}</span>
								<span class="vote-count">{count} vote{count !== 1 ? 's' : ''}</span>
							</div>
							<div class="vote-bar-container">
								<div class="vote-bar" style="width: {percentage}%"></div>
								<span class="percentage">{percentage}%</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Recent Votes -->
			{#if results.recentVotes?.length > 0}
				<div class="results-section">
					<h2>Recent Votes (Last 10)</h2>
					<div class="recent-votes">
						{#each results.recentVotes as vote}
							<div class="recent-vote">
								<span class="recent-palette">{paletteNames[vote.palette] || vote.palette}</span>
								<span class="recent-time">{new Date(vote.timestamp).toLocaleString()}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.results-page {
		min-height: 100vh;
		background: linear-gradient(180deg, var(--bg-primary), var(--bg-secondary));
		padding: 2rem 0;
	}
	
	.page-title {
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		text-align: center;
	}
	
	.page-subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.loading,
	.no-votes {
		text-align: center;
		padding: 3rem;
		font-size: 1.125rem;
		color: var(--text-secondary);
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-bottom: 3rem;
	}
	
	.stat-card {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
	}
	
	.stat-card-highlight {
		background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.05));
		border-color: var(--primary);
	}
	
	.stat-value {
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--primary);
		margin-bottom: 0.5rem;
	}
	
	.stat-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.results-section {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}
	
	.results-section h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}
	
	.votes-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	
	.vote-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.vote-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.palette-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.vote-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.vote-bar-container {
		position: relative;
		height: 2rem;
		background: var(--bg-primary);
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid var(--border-primary);
	}
	
	.vote-bar {
		height: 100%;
		background: var(--primary);
		transition: width 0.5s ease;
		display: flex;
		align-items: center;
		padding-left: 0.75rem;
	}
	
	.percentage {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.recent-votes {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.recent-vote {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
	}
	
	.recent-palette {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.recent-time {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
		
		.page-title {
			font-size: 1.75rem;
		}
	}
</style>

