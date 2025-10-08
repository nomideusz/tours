<!--
Demo component to showcase the improved Per Person pricing UI
Shows both the advanced and simplified versions
-->

<script lang="ts">
	import type { ParticipantCategory } from '$lib/types.js';
	import ParticipantCategories from './ParticipantCategories.svelte';
	import SimpleParticipantCategories from './SimpleParticipantCategories.svelte';
	
	let showSimplified = $state(true);
	
	// Start with empty categories to show the full onboarding flow
	let categories = $state<ParticipantCategory[]>([]);
	
	function handleUpdate(updatedCategories: ParticipantCategory[]) {
		categories = updatedCategories;
		console.log('Categories updated:', categories);
	}
</script>

<div class="demo-container">
	<h2>Improved Per Person Pricing UI</h2>
	
	<div class="version-toggle">
		<button 
			class="toggle-btn" 
			class:active={showSimplified}
			onclick={() => showSimplified = true}
		>
			Simplified Version ✨
		</button>
		<button 
			class="toggle-btn" 
			class:active={!showSimplified}
			onclick={() => showSimplified = false}
		>
			Advanced Version
		</button>
	</div>
	
	{#if showSimplified}
		<div class="feature-list simplified">
			<h3>Simplified Version with Progressive Disclosure:</h3>
			<ul>
				<li>🎯 <strong>Quick category presets</strong> - Adult, Senior, Student, Child, Infant</li>
				<li>🎯 <strong>Simple discount buttons</strong> - Full Price, 20% off, 50% off, Free</li>
				<li>🎯 <strong>Smart defaults</strong> - Starts with Adult & Child, infants hidden by default</li>
				<li>👶 <strong>Infant notice</strong> - Helpful info that "infants typically go free" with one-click add</li>
				<li>🎯 <strong>Progressive disclosure</strong> - Advanced options hidden in "⚙️ Advanced options" section</li>
				<li>✨ <strong>Custom discount %</strong> - Enter exact percentage when needed (in advanced)</li>
				<li>✨ <strong>Age range inputs</strong> - Set min/max ages for each category (in advanced)</li>
				<li>✨ <strong>Capacity control</strong> - Only shown for infants (in advanced)</li>
				<li>✨ <strong>Additional notes</strong> - Add requirements like "Valid ID required" (in advanced)</li>
			</ul>
		</div>
	{:else}
		<div class="feature-list">
			<h3>Advanced Version Features:</h3>
			<ul>
				<li>✅ Child prices auto-recalculate when adult price changes</li>
				<li>✅ Custom discount percentage input</li>
				<li>✅ Full age range selector with validation</li>
				<li>✅ Adult category can't be removed</li>
				<li>✅ Age conflict detection</li>
				<li>✅ More granular control</li>
			</ul>
		</div>
	{/if}
	
	<div class="pricing-demo">
		{#if showSimplified}
			<SimpleParticipantCategories
				bind:categories
				currencySymbol="$"
				onUpdate={handleUpdate}
			/>
		{:else}
			<ParticipantCategories
				bind:categories
				currencySymbol="$"
				onUpdate={handleUpdate}
			/>
		{/if}
	</div>
	
	<div class="current-data">
		<h3>Current Configuration:</h3>
		<pre>{JSON.stringify(categories, null, 2)}</pre>
	</div>
</div>

<style>
	.demo-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		background: var(--bg-primary);
		border-radius: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	h2 {
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 1.5rem;
		font-weight: 600;
	}
	
	h3 {
		color: var(--text-secondary);
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 500;
	}
	
	.feature-list {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 0.75rem;
		margin-bottom: 2rem;
		border: 1px solid var(--border-primary);
	}
	
	.feature-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.feature-list li {
		color: var(--text-primary);
		font-size: 0.875rem;
		line-height: 1.5;
	}
	
	.pricing-demo {
		margin-bottom: 2rem;
	}
	
	.current-data {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	pre {
		background: var(--bg-primary);
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: 'Consolas', 'Monaco', monospace;
		line-height: 1.5;
		border: 1px solid var(--border-secondary);
	}
	
	.version-toggle {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding: 0.25rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}
	
	.toggle-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.toggle-btn:hover {
		background: var(--bg-primary);
	}
	
	.toggle-btn.active {
		color: var(--text-primary);
		background: var(--bg-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		font-weight: 600;
	}
	
	.feature-list.simplified {
		background: var(--color-success-50);
		border-color: var(--color-success-200);
	}
	
	.feature-list.simplified h3 {
		color: var(--color-success-800);
	}
	
	.feature-list.simplified li {
		color: var(--color-success-700);
	}
</style>
