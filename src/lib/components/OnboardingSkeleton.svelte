<div class="mb-8">
	<div class="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
		<!-- Onboarding Step Skeletons -->
		{#each Array(4) as _}
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-start gap-4">
					<div class="w-8 h-8 rounded-full animate-pulse" style="background: var(--bg-tertiary);"></div>
					<div class="flex-1 space-y-3">
						<div class="h-5 w-24 rounded animate-pulse" style="background: var(--bg-tertiary);"></div>
						<div class="h-4 w-full rounded animate-pulse" style="background: var(--bg-tertiary);"></div>
						<div class="h-4 w-3/4 rounded animate-pulse" style="background: var(--bg-tertiary);"></div>
						<div class="h-8 w-20 rounded animate-pulse" style="background: var(--bg-tertiary);"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Progress Bar Skeleton -->
	<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="flex items-center justify-between mb-4">
			<div class="h-5 w-32 rounded animate-pulse" style="background: var(--bg-tertiary);"></div>
			<div class="h-4 w-16 rounded animate-pulse" style="background: var(--bg-tertiary);"></div>
		</div>
		<div class="w-full h-3 rounded-full" style="background: var(--bg-secondary);">
			<div class="h-3 w-1/2 rounded-full animate-pulse" style="background: var(--bg-tertiary);"></div>
		</div>
	</div>
</div> 