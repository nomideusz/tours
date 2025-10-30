<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import Globe from 'lucide-svelte/icons/globe';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import { LANGUAGES, getLanguageName, getLanguageFlag } from '$lib/utils/languages.js';
	
	interface Props {
		selectedLanguages: string[];
		onchange?: (languages: string[]) => void;
		error?: boolean;
	}
	
	let { selectedLanguages = $bindable([]), onchange, error = false }: Props = $props();
	
	let showDropdown = $state(false);
	
	function toggleLanguage(code: string) {
		if (selectedLanguages.includes(code)) {
			selectedLanguages = selectedLanguages.filter(l => l !== code);
		} else {
			selectedLanguages = [...selectedLanguages, code];
		}
		if (onchange) onchange(selectedLanguages);
	}
	
	function removeLanguage(code: string, event: MouseEvent) {
		event.stopPropagation();
		selectedLanguages = selectedLanguages.filter(l => l !== code);
		if (onchange) onchange(selectedLanguages);
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-selector')) {
			showDropdown = false;
		}
	}
	
	// Get unselected languages for dropdown
	let unselectedLanguages = $derived(
		LANGUAGES.filter(lang => !selectedLanguages.includes(lang.code))
	);
	
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (showDropdown) {
				document.addEventListener('click', handleClickOutside);
				return () => document.removeEventListener('click', handleClickOutside);
			}
		}
	});
</script>

<div class="language-selector {error ? 'error' : ''}">
	<!-- Container for selected languages and add button -->
	<div class="language-container">
		{#if selectedLanguages.length === 0}
			<!-- Empty state -->
			<button
				type="button"
				class="empty-state-button"
				onclick={() => showDropdown = !showDropdown}
			>
				<Globe class="w-4 h-4" style="color: var(--text-tertiary);" />
				<span>Select languages</span>
			</button>
		{:else}
			<!-- Selected language chips -->
			<div class="selected-languages">
				{#each selectedLanguages as langCode}
					<div class="language-chip">
						<span class="chip-flag">{getLanguageFlag(langCode)}</span>
						<span class="chip-name">{getLanguageName(langCode)}</span>
						<button
							type="button"
							class="chip-remove"
							onclick={(e) => removeLanguage(langCode, e)}
							title="Remove {getLanguageName(langCode)}"
						>
							<X class="w-3 h-3" />
						</button>
					</div>
				{/each}
				
				{#if unselectedLanguages.length > 0}
					<!-- Add language button -->
					<button
						type="button"
						class="add-language-button"
						onclick={() => showDropdown = !showDropdown}
					>
						<Plus class="w-4 h-4" />
						<span>Add</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>
	
	<!-- Dropdown (only unselected languages) -->
	{#if showDropdown && unselectedLanguages.length > 0}
		<div class="language-dropdown">
			<div class="dropdown-header">
				<span class="text-xs font-medium" style="color: var(--text-secondary);">
					Add languages
				</span>
			</div>
			<div class="language-list">
				{#each unselectedLanguages as language}
					<button
						type="button"
						class="language-option"
						onclick={() => {
							toggleLanguage(language.code);
							showDropdown = false;
						}}
					>
						<span class="language-flag">{language.flag}</span>
						<span class="language-name">{language.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.language-selector {
		position: relative;
		width: 100%;
	}
	
	.language-selector.error .language-container {
		border-color: var(--color-error-500);
		background: var(--color-danger-light);
	}
	
	.language-container {
		min-height: 42px;
		padding: 0.375rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s;
	}
	
	.language-container:hover {
		border-color: var(--border-secondary);
	}
	
	/* Empty state button */
	.empty-state-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color 0.2s;
	}
	
	.empty-state-button:hover {
		color: var(--text-primary);
	}
	
	/* Selected languages container */
	.selected-languages {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}
	
	/* Language chip */
	.language-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.375rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		transition: all 0.15s;
	}
	
	.language-chip:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}
	
	.chip-flag {
		font-size: 1.125rem;
		line-height: 1;
		flex-shrink: 0;
	}
	
	.chip-name {
		line-height: 1.2;
	}
	
	.chip-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		margin: -0.125rem -0.125rem -0.125rem 0.125rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	
	.chip-remove:hover {
		background: var(--bg-tertiary);
		color: var(--color-error-600);
	}
	
	/* Add language button */
	.add-language-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		background: transparent;
		border: 1px dashed var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-tertiary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.add-language-button:hover {
		border-color: var(--color-primary-400);
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		border-style: solid;
	}
	
	/* Dropdown */
	.language-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		min-width: 200px;
		max-width: 300px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 50;
		max-height: 320px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.dropdown-header {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		flex-shrink: 0;
	}
	
	.language-list {
		padding: 0.375rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.language-option {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}
	
	.language-option:hover {
		background: var(--bg-secondary);
	}
	
	.language-flag {
		font-size: 1.375rem;
		line-height: 1;
		flex-shrink: 0;
	}
	
	.language-name {
		flex: 1;
	}
	
	/* Responsive adjustments */
	@media (max-width: 640px) {
		.language-dropdown {
			left: 0;
			right: 0;
			max-width: none;
			max-height: 280px;
		}
		
		.selected-languages {
			gap: 0.5rem;
		}
		
		.language-chip {
			padding: 0.375rem 0.5rem;
		}
		
		.add-language-button {
			padding: 0.375rem 0.75rem;
		}
	}
	
	/* Focus styles */
	.language-container:has(:focus-visible) {
		outline: none;
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
</style>

