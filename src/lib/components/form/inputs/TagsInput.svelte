<!--
	Tags Input Component
	A flexible input component for adding and managing tags with validation
-->

<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	
	interface Props {
		value?: string[];
		placeholder?: string;
		maxTags?: number;
		minLength?: number;
		maxLength?: number;
		validateTag?: (tag: string) => string | null; // Return error message or null
		disabled?: boolean;
		allowDuplicates?: boolean;
		onChange?: (tags: string[]) => void;
	}
	
	let {
		value = $bindable([]),
		placeholder = 'Add tag...',
		maxTags = Infinity,
		minLength = 1,
		maxLength = 50,
		validateTag,
		disabled = false,
		allowDuplicates = false,
		onChange
	}: Props = $props();
	
	let inputValue = $state('');
	let validationError = $state<string | null>(null);
	
	// Validate input in real-time
	$effect(() => {
		if (!inputValue.trim()) {
			validationError = null;
			return;
		}
		
		const trimmed = inputValue.trim();
		
		// Length validation
		if (trimmed.length < minLength) {
			validationError = `Minimum ${minLength} characters`;
			return;
		}
		
		if (trimmed.length > maxLength) {
			validationError = `Maximum ${maxLength} characters`;
			return;
		}
		
		// Duplicate check
		if (!allowDuplicates && value.some(tag => tag.toLowerCase() === trimmed.toLowerCase())) {
			validationError = 'Already exists';
			return;
		}
		
		// Custom validation
		if (validateTag) {
			validationError = validateTag(trimmed);
			return;
		}
		
		validationError = null;
	});
	
	function addTag() {
		const trimmed = inputValue.trim();
		
		if (!trimmed || validationError || value.length >= maxTags) return;
		
		value = [...value, trimmed];
		inputValue = '';
		onChange?.(value);
	}
	
	function removeTag(index: number) {
		value = value.filter((_, i) => i !== index);
		onChange?.(value);
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		} else if (e.key === 'Escape') {
			inputValue = '';
		}
	}
</script>

<div class="tags-input-wrapper">
	<div 
		class="tags-input"
		class:disabled
		role="textbox"
		tabindex="0"
		onclick={() => (document.querySelector('.tags-input-field') as HTMLInputElement)?.focus()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				(document.querySelector('.tags-input-field') as HTMLInputElement)?.focus();
			}
		}}
	>
		<!-- Existing tags -->
		{#each value as tag, index}
			<span class="tag">
				{tag}
				{#if !disabled}
					<button
						type="button"
						class="tag-remove"
						onclick={(e) => {
							e.stopPropagation();
							removeTag(index);
						}}
						aria-label="Remove {tag}"
					>
						<X class="w-3 h-3" />
					</button>
				{/if}
			</span>
		{/each}
		
		<!-- Input field -->
		{#if !disabled && value.length < maxTags}
			<div class="tags-input-container">
				<input
					type="text"
					class="tags-input-field"
					class:error={validationError}
					bind:value={inputValue}
					{placeholder}
					onkeydown={handleKeydown}
					autocomplete="off"
					spellcheck="false"
				/>
				{#if inputValue && !validationError}
					<button
						type="button"
						onclick={addTag}
						class="tags-input-add"
						aria-label="Add tag"
					>
						<Plus class="w-3.5 h-3.5" />
					</button>
				{/if}
			</div>
		{/if}
	</div>
	
	<!-- Validation message -->
	{#if validationError && inputValue}
		<p class="text-xs mt-1" style="color: var(--color-error-600);">
			{validationError}
		</p>
	{/if}
	
	<!-- Tag count -->
	{#if maxTags !== Infinity}
		<p class="text-xs mt-1" style="color: var(--text-tertiary);">
			{value.length}/{maxTags} tags
		</p>
	{/if}
</div>

<style>
	.tags-input-wrapper {
		position: relative;
	}
	
	.tags-input {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		min-height: 2.75rem;
		cursor: text;
		transition: all 0.15s;
	}
	
	.tags-input:focus-within {
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.tags-input.disabled {
		background: var(--bg-tertiary);
		cursor: not-allowed;
		opacity: 0.6;
	}
	
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		user-select: none;
	}
	
	.tag-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem;
		border-radius: 0.25rem;
		transition: all 0.15s;
		cursor: pointer;
	}
	
	.tag-remove:hover {
		background: var(--color-primary-200);
	}
	
	.tags-input-container {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex: 1;
		min-width: 120px;
	}
	
	.tags-input-field {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.875rem;
		color: var(--text-primary);
		padding: 0.25rem 0;
		min-width: 80px;
	}
	
	.tags-input-field::placeholder {
		color: var(--text-tertiary);
	}
	
	.tags-input-field.error {
		color: var(--color-error-600);
	}
	
	.tags-input-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border-radius: 0.375rem;
		background: var(--color-primary-500);
		color: white;
		transition: all 0.15s;
		cursor: pointer;
	}
	
	.tags-input-add:hover {
		background: var(--color-primary-600);
	}
</style>