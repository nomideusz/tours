<script lang="ts">
	import { getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	import CategorySelector from '../form/inputs/CategorySelector.svelte';
	import LanguageSelector from '../form/inputs/LanguageSelector.svelte';
	import ChipInput from '../form/inputs/ChipInput.svelte';

	// Icons
	import Palette from 'lucide-svelte/icons/palette';
	import Globe from 'lucide-svelte/icons/globe';
	import Package from 'lucide-svelte/icons/package';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	interface Props {
		formData: {
			categories: string[];
			languages: string[];
			includedItems: string[];
			requirements: string[];
		};
		allErrors: ValidationError[];
		hideLabels?: boolean;
		includedItemsSuggestions?: string[];
		requirementsSuggestions?: string[];
		shouldShowError: (field: string) => boolean;
		mode?: 'all' | 'categories-only' | 'languages-only' | 'included-only' | 'requirements-only';
	}

	let {
		formData = $bindable(),
		allErrors = [],
		hideLabels = true,
		includedItemsSuggestions = [],
		requirementsSuggestions = [],
		shouldShowError,
		mode = 'all'
	}: Props = $props();
</script>

{#if mode === 'all' || mode === 'categories-only'}
<!-- Categories -->
<div>
	{#if !hideLabels}
		<label for="categories" class="form-label flex items-center gap-2">
			<Palette class="w-4 h-4" style="color: var(--text-tertiary);" />
			<span>Categories</span>
		</label>
	{/if}
	<div class="form-field-wrapper">
		<CategorySelector
			bind:selectedCategories={formData.categories}
			error={hasFieldError(allErrors, 'categories') && shouldShowError('categories')}
		/>
		<div class="form-field-helper">
			{#if getFieldError(allErrors, 'categories') && shouldShowError('categories')}
				<span class="form-error-message">{getFieldError(allErrors, 'categories')}</span>
			{:else}
				<span class="form-field-spacer"></span>
			{/if}
		</div>
		<!-- Hidden input for form submission -->
		<input type="hidden" name="categories" value={JSON.stringify(formData.categories || [])} />
	</div>
</div>
{/if}

{#if mode === 'all' || mode === 'languages-only'}
<!-- Languages -->
<div>
	{#if !hideLabels}
		<label for="languages" class="form-label flex items-center gap-2">
			<Globe class="w-4 h-4" style="color: var(--text-tertiary);" />
			<span>Languages Offered *</span>
		</label>
	{/if}
	<div class="form-field-wrapper languages-field-wrapper">
		<LanguageSelector
			bind:selectedLanguages={formData.languages}
			error={hasFieldError(allErrors, 'languages') && shouldShowError('languages')}
		/>
		<div class="form-field-helper">
			{#if getFieldError(allErrors, 'languages') && shouldShowError('languages')}
				<span class="form-error-message">{getFieldError(allErrors, 'languages')}</span>
			{:else}
				<span class="form-field-spacer"></span>
			{/if}
		</div>
		<!-- Hidden input for form submission -->
		<input type="hidden" name="languages" value={JSON.stringify(formData.languages || [])} />
	</div>
</div>
{/if}

{#if mode === 'all' || mode === 'included-only'}
<!-- What's Included -->
<div>
	{#if !hideLabels}
		<label class="form-label flex items-center gap-2">
			<Package class="w-4 h-4" style="color: var(--text-tertiary);" />
			<span>What's Included</span>
		</label>
	{/if}
	<div class="form-field-wrapper">
		<ChipInput
			bind:items={formData.includedItems}
			suggestions={includedItemsSuggestions}
			placeholder="Add included items..."
			addButtonText="Add"
		/>
		<div class="form-field-helper">
			<span class="form-field-spacer"></span>
		</div>
		<!-- Hidden inputs for form submission -->
		{#each formData.includedItems.filter(item => item.trim()) as item}
			<input type="hidden" name="includedItems" value={item} />
		{/each}
	</div>
</div>
{/if}

{#if mode === 'all' || mode === 'requirements-only'}
<!-- Requirements -->
<div>
	{#if !hideLabels}
		<label class="form-label flex items-center gap-2">
			<AlertCircle class="w-4 h-4" style="color: var(--text-tertiary);" />
			<span>Requirements</span>
		</label>
	{/if}
	<div class="form-field-wrapper">
		<ChipInput
			bind:items={formData.requirements}
			suggestions={requirementsSuggestions}
			placeholder="Add requirements..."
			addButtonText="Add"
		/>
		<div class="form-field-helper">
			<span class="form-field-spacer"></span>
		</div>
		<!-- Hidden inputs for form submission -->
		{#each formData.requirements.filter(req => req.trim()) as requirement}
			<input type="hidden" name="requirements" value={requirement} />
		{/each}
	</div>
</div>
{/if}
