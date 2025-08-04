<script lang="ts">
	const timelineEvents = [
		{
			date: 'August 2025',
			title: 'Beta Applications Open',
			description: 'Accepting 50 tour guides for early access',
			status: 'active'
		},
		{
			date: 'September 2025',
			title: 'Beta Testing Begins',
			description: 'Core functionality testing with selected guides',
			status: 'upcoming'
		},
		{
			date: 'November 2025',
			title: 'Expanded Beta',
			description: 'Opening registration to more users & enhanced features',
			status: 'upcoming'
		},
		{
			date: 'March 2026',
			title: 'Public Launch',
			description: 'Full platform available to all tour guides',
			status: 'upcoming'
		}
	];
</script>

<div class="py-16 sm:py-20">
	<div class="text-center mb-12 sm:mb-16">
		<h2 class="marketing-heading marketing-heading-lg mb-4">
			Roadmap
		</h2>
	</div>
	
	<!-- Timeline Container -->
	<div class="mx-auto">
		<!-- Mobile Layout -->
		<div class="sm:hidden">
			{#each timelineEvents as event, index}
				<div class="relative flex items-start group">
					<!-- Vertical line segment -->
					{#if index !== timelineEvents.length - 1}
						<div 
							class="absolute left-[11px] top-8 bottom-0 w-[2px]" 
							style="background: var(--border-primary);"
						></div>
					{/if}
					
					<!-- Dot -->
					<div class="flex-shrink-0 relative z-10">
						<div 
							class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
							style="background: {event.status === 'active' ? 'var(--color-primary)' : 'var(--bg-primary)'};
									border: 2px solid {event.status === 'active' ? 'var(--color-primary)' : 'var(--border-primary)'};"
						>
							{#if event.status === 'active'}
								<div class="w-2 h-2 rounded-full" style="background: var(--color-primary);"></div>
							{/if}
						</div>
					</div>
					
					<!-- Content -->
					<div class="ml-6 pb-8 flex-1">
						<div class="p-3 -ml-3 rounded-lg transition-all duration-300 hover:bg-[var(--bg-secondary)] group-hover:translate-x-1">
							<div 
								class="text-sm font-semibold mb-1"
								style="color: {event.status === 'active' ? 'var(--color-primary)' : 'var(--text-tertiary)'};"
							>
								{event.date}
							</div>
							<h3 class="text-lg font-semibold mb-1 leading-tight group-hover:text-primary transition-colors duration-300" style="color: var(--text-primary);">
								{event.title}
							</h3>
							<p class="text-sm" style="color: var(--text-secondary);">
								{event.description}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Desktop Layout -->
		<div class="hidden sm:block relative">
			<!-- Central vertical line -->
			<div 
				class="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2" 
				style="background: var(--border-primary);"
			></div>
			
			{#each timelineEvents as event, index}
				<div class="relative group">
					<!-- Event Container -->
					<div class="flex items-center justify-between mb-8">
						{#if index % 2 === 0}
							<!-- Left side content -->
							<div class="w-[calc(50%-1rem)] text-right pr-4">
								<div class="inline-block text-right w-full ml-auto p-4 rounded-lg transition-all duration-300 group-hover:-translate-x-2 hover:bg-[var(--bg-secondary)]">
									<div 
										class="text-sm font-semibold mb-1"
										style="color: {event.status === 'active' ? 'var(--color-primary)' : 'var(--text-tertiary)'};"
									>
										{event.date}
									</div>
									<h3 class="text-xl font-semibold mb-2 leading-tight group-hover:text-primary transition-colors duration-300" style="color: var(--text-primary);">
										{event.title}
									</h3>
									<p class="text-base" style="color: var(--text-secondary);">
										{event.description}
									</p>
								</div>
							</div>
							
							<!-- Center dot -->
							<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
								<div 
									class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
									style="background: {event.status === 'active' ? 'var(--color-primary)' : 'var(--bg-primary)'};
											border: 3px solid {event.status === 'active' ? 'var(--color-primary)' : 'var(--border-primary)'};"
								>
									{#if event.status === 'active'}
										<div class="w-3 h-3 rounded-full animate-pulse" style="background: var(--color-primary);"></div>
									{/if}
								</div>
							</div>
							
							<!-- Right side empty -->
							<div class="w-[calc(50%-1rem)]"></div>
						{:else}
							<!-- Left side empty -->
							<div class="w-[calc(50%-1rem)]"></div>
							
							<!-- Center dot -->
							<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
								<div 
									class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
									style="background: {event.status === 'active' ? 'var(--color-primary)' : 'var(--bg-primary)'};
											border: 3px solid {event.status === 'active' ? 'var(--color-primary)' : 'var(--border-primary)'};"
								>
									{#if event.status === 'active'}
										<div class="w-3 h-3 rounded-full animate-pulse" style="background: var(--color-primary);"></div>
									{/if}
								</div>
							</div>
							
							<!-- Right side content -->
							<div class="w-[calc(50%-1rem)] text-left pl-4">
								<div class="inline-block w-full p-4 rounded-lg transition-all duration-300 group-hover:translate-x-2 hover:bg-[var(--bg-secondary)]">
									<div 
										class="text-sm font-semibold mb-1"
										style="color: {event.status === 'active' ? 'var(--color-primary)' : 'var(--text-tertiary)'};"
									>
										{event.date}
									</div>
									<h3 class="text-xl font-semibold mb-2 leading-tight group-hover:text-primary transition-colors duration-300" style="color: var(--text-primary);">
										{event.title}
									</h3>
									<p class="text-base" style="color: var(--text-secondary);">
										{event.description}
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(1.1);
		}
	}
	
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	
	/* Hover text color changes */
	.group:hover .group-hover\:text-primary {
		color: var(--color-primary) !important;
	}
</style>