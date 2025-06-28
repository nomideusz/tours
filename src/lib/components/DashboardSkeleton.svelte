<div class="animate-pulse space-y-6">
	<!-- Header Skeleton -->
	<div class="mb-6">
		<!-- Mobile Header Skeleton -->
		<div class="sm:hidden rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="space-y-3">
				<div class="h-6 w-48 rounded" style="background: var(--bg-tertiary);"></div>
				<div class="h-4 w-32 rounded" style="background: var(--bg-tertiary);"></div>
				<div class="flex gap-2 mt-4">
					<div class="h-8 w-20 rounded" style="background: var(--bg-tertiary);"></div>
					<div class="h-8 w-24 rounded" style="background: var(--bg-tertiary);"></div>
				</div>
			</div>
		</div>
		
		<!-- Desktop Header Skeleton -->
		<div class="hidden sm:block">
			<div class="flex items-center justify-between">
				<div class="space-y-2">
					<div class="h-8 w-64 rounded" style="background: var(--bg-tertiary);"></div>
					<div class="h-5 w-96 rounded" style="background: var(--bg-tertiary);"></div>
				</div>
				<div class="h-10 w-32 rounded" style="background: var(--bg-tertiary);"></div>
			</div>
		</div>
	</div>

<!-- Tour Timeline Skeleton -->
	<div class="rounded-xl mb-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<div class="h-6 w-40 rounded" style="background: var(--bg-tertiary);"></div>
				<div class="flex gap-2">
					<div class="h-8 w-16 rounded" style="background: var(--bg-tertiary);"></div>
					<div class="h-8 w-16 rounded" style="background: var(--bg-tertiary);"></div>
					<div class="h-8 w-20 rounded" style="background: var(--bg-tertiary);"></div>
				</div>
			</div>
		</div>
		<div class="p-6">
			<div class="grid grid-cols-7 gap-2 mb-6">
				{#each Array(7) as _}
					<div class="h-6 w-full rounded" style="background: var(--bg-tertiary);"></div>
				{/each}
			</div>
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="flex items-center gap-4 p-3 rounded-lg" style="background: var(--bg-secondary);">
						<div class="w-12 h-12 rounded-lg" style="background: var(--bg-tertiary);"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-32 rounded" style="background: var(--bg-tertiary);"></div>
							<div class="h-3 w-48 rounded" style="background: var(--bg-tertiary);"></div>
						</div>
						<div class="h-6 w-16 rounded" style="background: var(--bg-tertiary);"></div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Recent Bookings Skeleton -->
	<div class="rounded-lg mb-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="border-b p-4" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<div class="h-5 w-36 rounded" style="background: var(--bg-tertiary);"></div>
				<div class="h-8 w-20 rounded" style="background: var(--bg-tertiary);"></div>
			</div>
		</div>
		<div class="divide-y" style="border-color: var(--border-primary);">
			{#each Array(4) as _}
				<div class="p-4">
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1 space-y-2">
							<div class="flex items-center gap-2">
								<div class="h-4 w-32 rounded" style="background: var(--bg-tertiary);"></div>
								<div class="h-5 w-20 rounded-full" style="background: var(--bg-tertiary);"></div>
								<div class="h-5 w-16 rounded-full" style="background: var(--bg-tertiary);"></div>
							</div>
							<div class="h-3 w-48 rounded" style="background: var(--bg-tertiary);"></div>
							<div class="h-3 w-40 rounded" style="background: var(--bg-tertiary);"></div>
						</div>
						<div class="w-8 h-8 rounded" style="background: var(--bg-tertiary);"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Quick Actions Skeleton -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each Array(4) as _}
			<div class="rounded-lg p-6 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="w-5 h-5 mx-auto mb-2 rounded" style="background: var(--bg-tertiary);"></div>
				<div class="h-4 w-24 mx-auto rounded" style="background: var(--bg-tertiary);"></div>
			</div>
		{/each}
	</div>
</div> 