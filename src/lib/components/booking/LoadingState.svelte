<script lang="ts">
	import Loader2 from 'lucide-svelte/icons/loader-2';
</script>

<div class="flex items-center justify-center min-h-[400px]">
	<div class="text-center">
		<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
		<p class="text-lg font-medium" style="color: var(--text-primary);">Loading tour details...</p>
		<p class="text-sm" style="color: var(--text-secondary);">Please wait while we fetch the latest information</p>
	</div>
</div>

