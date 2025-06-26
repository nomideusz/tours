<script lang="ts">
	let { class: className = "" } = $props<{ class?: string }>();

	// Current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<!-- Minimal App Footer -->
<footer class="{className}" style="background: var(--bg-primary); border-top: 1px solid var(--border-primary);">
	<div class="px-6 py-3">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
			<!-- Left: Legal links -->
			<div class="flex items-center gap-4 text-xs">
				<a 
					href="/privacy"
					class="transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
				>
					Privacy
				</a>
				<a 
					href="/terms"
					class="transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
				>
					Terms
				</a>
				<a 
					href="/cookies"
					class="transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
				>
					Cookies
				</a>
			</div>

			<!-- Right: Copyright -->
			<div class="text-xs" style="color: var(--text-tertiary);">
				© {currentYear} Zaur
			</div>
		</div>
	</div>
</footer> 