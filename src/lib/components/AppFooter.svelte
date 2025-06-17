<script lang="ts">
	import { page } from '$app/stores';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import Mail from 'lucide-svelte/icons/mail';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	let { class: className = "" } = $props<{ class?: string }>();

	// Current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<!-- Minimal App Footer -->
<footer class="bg-white border-t border-gray-200 {className}">
	<div class="px-4 py-3">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
			<!-- Left: Quick help links -->
			<div class="flex items-center gap-4 text-sm">
				<Tooltip text="Get help and documentation" position="top-right">
					<a 
						href="/help"
						title=""
						class="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
					>
						<CircleHelp class="h-4 w-4" />
						Help Center
					</a>
				</Tooltip>
				
				<Tooltip text="Contact our support team" position="top">
					<a 
						href="mailto:support@zaur.app"
						title=""
						class="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
					>
						<Mail class="h-4 w-4" />
						Support
					</a>
				</Tooltip>
			</div>

			<!-- Right: Copyright and version -->
			<div class="flex items-center gap-4 text-xs text-gray-400">
				<span>© {currentYear} <Tooltip text="Zaur" position="top"><a href="https://zaur.app" target="_blank" title="">Zaur</a></Tooltip></span>
				<span class="hidden sm:block">•</span>
				<span class="hidden sm:block">Dashboard v2.0</span>
			</div>
		</div>
	</div>
</footer> 