<!--
================================================================================
STATUS & VISIBILITY SECTION COMPONENT
================================================================================

Displays and manages tour status and visibility settings (edit mode only):
- Current status (Active/Draft) display
- Public listing toggle (show/hide in search)
- Different layouts for mobile and desktop
- Hidden inputs for form submission

Extracted from TourForm.svelte to improve maintainability.
================================================================================
-->

<script lang="ts">
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import FileText from 'lucide-svelte/icons/file-text';
	import Globe from 'lucide-svelte/icons/globe';

	interface Props {
		formData: {
			status: 'active' | 'draft';
			publicListing?: boolean;
		};
		hideStatusField?: boolean;
	}

	let {
		formData = $bindable(),
		hideStatusField = false
	}: Props = $props();
</script>

<!-- Mobile: Combined compact view -->
<div class="sm:hidden px-4">
	<div class="space-y-3">
		<!-- Status display -->
		{#if !hideStatusField}
			<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
				<div class="flex items-center gap-2">
					{#if formData.status === 'active'}
						<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
					{:else}
						<FileText class="w-4 h-4" style="color: var(--color-warning-600);" />
					{/if}
					<div>
						<p class="text-sm font-semibold" style="color: var(--text-primary);">
							{formData.status === 'active' ? 'Active' : 'Draft'}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">
							{formData.status === 'active' ? 'Live & accepting bookings' : 'Not visible to customers'}
						</p>
					</div>
				</div>
				<!-- Hidden input -->
				<input type="hidden" name="status" bind:value={formData.status} />
			</div>
		{/if}

		<!-- Show in Search toggle (only when Active) -->
		{#if formData.status === 'active'}
			<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
				<div class="flex items-center gap-2">
					<Globe class="w-4 h-4" style="color: var(--text-accent);" />
					<div>
						<p class="text-sm font-semibold" style="color: var(--text-primary);">Show in Search</p>
						<p class="text-xs" style="color: var(--text-secondary);">
							{formData.publicListing ? 'Listed' : 'Unlisted'}
						</p>
					</div>
				</div>
				<div>
					<input type="hidden" name="publicListing" value={formData.publicListing ? 'true' : 'false'} />
					<label class="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							bind:checked={formData.publicListing}
							class="sr-only peer"
						/>
						<div class="toggle-switch w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
					</label>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Desktop: Separate cards -->
<div class="hidden sm:block space-y-6">
	<!-- Current Status -->
	{#if !hideStatusField}
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-4 py-4 sm:p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">Current Status</h3>
			</div>
			<div class="px-4 py-4 sm:p-4">
				<div class="flex items-center gap-3 p-4 rounded-lg" style="background: var(--bg-secondary);">
					<div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
						style="background: {formData.status === 'active' ? 'var(--color-success-100)' : 'var(--color-warning-100)'};"
					>
						{#if formData.status === 'active'}
							<CheckCircle class="w-5 h-5 flex-shrink-0" style="color: var(--color-success-600);" />
						{:else}
							<FileText class="w-5 h-5 flex-shrink-0" style="color: var(--color-warning-600);" />
						{/if}
					</div>
					<div class="flex-1">
						<h3 class="font-medium" style="color: var(--text-primary);">
							{formData.status === 'active' ? 'Active' : 'Draft'}
						</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							{formData.status === 'active'
								? 'Tour is live and accepting bookings'
								: 'Not visible to customers'}
						</p>
					</div>
				</div>
				<!-- Hidden input to send the actual status value -->
				<input type="hidden" name="status" bind:value={formData.status} />
			</div>
		</div>
	{/if}

	<!-- Search Visibility (only shown when Active) -->
	{#if formData.status === 'active'}
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-4 py-4 sm:p-4">
				<div class="flex items-center justify-between gap-4">
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<Globe class="h-5 w-5" style="color: var(--text-accent);" />
							<h3 class="font-semibold" style="color: var(--text-primary);">Show in Search</h3>
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">
							{formData.publicListing
								? 'Listed - visible in public browse & search'
								: 'Unlisted - accessible only via QR code or direct link'}
						</p>
					</div>

					<div class="flex items-center gap-3 flex-shrink-0">
						<!-- Hidden input to send the actual publicListing value -->
						<input type="hidden" name="publicListing" value={formData.publicListing ? 'true' : 'false'} />
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={formData.publicListing}
								class="sr-only peer"
							/>
							<div class="toggle-switch w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
							<span class="ml-3 text-sm font-medium whitespace-nowrap" style="color: var(--text-primary);">
								{formData.publicListing ? 'Listed' : 'Unlisted'}
							</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Hidden input for draft tours - preserve current publicListing setting -->
		<input type="hidden" name="publicListing" value={formData.publicListing ? 'true' : 'false'} />
	{/if}
</div>

<style>
	.toggle-switch {
		background-color: var(--color-gray-300);
		transition: background-color 0.2s ease;
	}

	.toggle-switch::after {
		background-color: white;
		border-color: var(--color-gray-300);
	}

	input:checked ~ .toggle-switch {
		background-color: var(--color-primary-600);
	}

	input:checked ~ .toggle-switch::after {
		border-color: var(--color-primary-600);
	}

	input:focus ~ .toggle-switch {
		box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
	}
</style>
