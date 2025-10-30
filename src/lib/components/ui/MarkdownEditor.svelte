<script lang="ts">
	import Markdown from './Markdown.svelte';
	import Eye from 'lucide-svelte/icons/eye';
	import Bold from 'lucide-svelte/icons/bold';
	import Italic from 'lucide-svelte/icons/italic';
	import List from 'lucide-svelte/icons/list';
	import ListOrdered from 'lucide-svelte/icons/list-ordered';
	import Heading2 from 'lucide-svelte/icons/heading-2';
	import Heading3 from 'lucide-svelte/icons/heading-3';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	
	interface Props {
		value: string;
		placeholder?: string;
		maxlength?: number;
		class?: string;
		oninput?: (event: Event) => void;
		onblur?: (event: Event) => void;
		name?: string;
		id?: string;
		rows?: number;
		error?: boolean;
	}
	
	let {
		value = $bindable(''),
		placeholder = 'Enter description...',
		maxlength = 2000,
		class: className = '',
		oninput,
		onblur,
		name,
		id,
		rows = 6,
		error = false
	}: Props = $props();
	
	let showPreview = $state(false);
	let showHelp = $state(false);
	let textareaRef = $state<HTMLTextAreaElement>();
	
	// Count only visible characters (excluding excessive whitespace)
	function countVisibleChars(text: string): number {
		if (!text) return 0;
		// Replace multiple spaces/newlines with single space, then count
		return text.replace(/\s+/g, ' ').trim().length;
	}
	
	let visibleCharCount = $derived(countVisibleChars(value));
	let charCountColor = $derived(
		error ? 'var(--color-error-500)' : 
		visibleCharCount > maxlength * 0.9 ? 'var(--color-warning-600)' : 
		'var(--text-tertiary)'
	);
	
	function insertMarkdown(before: string, after: string = '') {
		if (!textareaRef) return;
		const textarea = textareaRef;
		
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = value.substring(start, end);
		const beforeText = value.substring(0, start);
		const afterText = value.substring(end);
		
		// Insert markdown syntax
		const newText = beforeText + before + selectedText + after + afterText;
		value = newText;
		
		// Restore focus and set cursor position
		textarea.focus();
		const newCursorPos = start + before.length + selectedText.length;
		setTimeout(() => {
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
		
		// Trigger input event for parent component
		if (oninput) {
			const event = new Event('input', { bubbles: true });
			Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
			oninput(event);
		}
	}
	
	function handleBold() {
		insertMarkdown('**', '**');
	}
	
	function handleItalic() {
		insertMarkdown('*', '*');
	}
	
	function handleHeading2() {
		if (!textareaRef) return;
		const textarea = textareaRef;
		
		const start = textarea.selectionStart;
		const beforeText = value.substring(0, start);
		const lineStart = beforeText.lastIndexOf('\n') + 1;
		const beforeLine = value.substring(0, lineStart);
		const afterLine = value.substring(lineStart);
		
		value = beforeLine + '## ' + afterLine;
		textarea.focus();
		
		if (oninput) {
			const event = new Event('input', { bubbles: true });
			Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
			oninput(event);
		}
	}
	
	function handleHeading3() {
		if (!textareaRef) return;
		const textarea = textareaRef;
		
		const start = textarea.selectionStart;
		const beforeText = value.substring(0, start);
		const lineStart = beforeText.lastIndexOf('\n') + 1;
		const beforeLine = value.substring(0, lineStart);
		const afterLine = value.substring(lineStart);
		
		value = beforeLine + '### ' + afterLine;
		textarea.focus();
		
		if (oninput) {
			const event = new Event('input', { bubbles: true });
			Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
			oninput(event);
		}
	}
	
	function handleBulletList() {
		insertMarkdown('- ');
	}
	
	function handleNumberedList() {
		if (!textareaRef) return;
		
		const start = textareaRef.selectionStart;
		const beforeText = value.substring(0, start);
		const lineStart = beforeText.lastIndexOf('\n') + 1;
		
		// Check if previous line has a numbered list item
		const previousLineEnd = lineStart - 1;
		if (previousLineEnd > 0) {
			const previousLineStart = beforeText.substring(0, previousLineEnd).lastIndexOf('\n') + 1;
			const previousLine = beforeText.substring(previousLineStart, previousLineEnd).trim();
			
			// Match numbered list pattern (e.g., "1. ", "2. ", "12. ")
			const match = previousLine.match(/^(\d+)\.\s/);
			if (match) {
				// Increment the number from previous line
				const nextNum = parseInt(match[1]) + 1;
				insertMarkdown(`${nextNum}. `);
				return;
			}
		}
		
		// Default to starting a new list with 1.
		insertMarkdown('1. ');
	}
	
	function togglePreview() {
		showPreview = !showPreview;
	}
	
	function toggleHelp() {
		showHelp = !showHelp;
	}
	
	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key.toLowerCase()) {
				case 'b':
					event.preventDefault();
					handleBold();
					break;
				case 'i':
					event.preventDefault();
					handleItalic();
					break;
			}
		}
	}
</script>

<div class="markdown-editor">
	<!-- Toolbar -->
	<div class="editor-toolbar">
		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				onclick={handleBold}
				title="Bold (Ctrl+B)"
				aria-label="Bold"
			>
				<Bold class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={handleItalic}
				title="Italic (Ctrl+I)"
				aria-label="Italic"
			>
				<Italic class="w-4 h-4" />
			</button>
		</div>
		
		<div class="toolbar-divider"></div>
		
		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				onclick={handleHeading2}
				title="Heading 2"
				aria-label="Heading 2"
			>
				<Heading2 class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={handleHeading3}
				title="Heading 3"
				aria-label="Heading 3"
			>
				<Heading3 class="w-4 h-4" />
			</button>
		</div>
		
		<div class="toolbar-divider"></div>
		
		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				onclick={handleBulletList}
				title="Bullet List"
				aria-label="Bullet List"
			>
				<List class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={handleNumberedList}
				title="Numbered List"
				aria-label="Numbered List"
			>
				<ListOrdered class="w-4 h-4" />
			</button>
		</div>
		
		<div class="toolbar-spacer"></div>
		
		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn toolbar-btn--help"
				onclick={toggleHelp}
				title="Formatting Help"
				aria-label="Formatting Help"
			>
				<HelpCircle class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="toolbar-btn {showPreview ? 'toolbar-btn--active' : ''}"
				onclick={togglePreview}
				title={showPreview ? 'Hide Preview Panel' : 'Show Live Preview'}
				aria-label={showPreview ? 'Hide Preview Panel' : 'Show Live Preview'}
			>
				<Eye class="w-4 h-4" />
			</button>
		</div>
	</div>
	
	<!-- Help Panel -->
	{#if showHelp}
		<div class="help-panel">
			<div class="help-content">
				<div class="help-compact">
					<code>**bold**</code>
					<code>*italic*</code>
					<code>## heading</code>
					<code>- list</code>
					<code>1. numbered</code>
				</div>
				<div class="help-tip-compact">
					💡 Enter once = line break, twice = paragraph • Ctrl+B/I for bold/italic
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Editor Area -->
	<div class="editor-content {showPreview ? 'split-view' : ''}">
		<!-- Editor Side -->
		<div class="editor-side">
			<textarea
				bind:this={textareaRef}
				{id}
				{name}
				bind:value
				{placeholder}
				{rows}
				class="editor-textarea {className} {error ? 'error' : ''}"
				{oninput}
				{onblur}
				onkeydown={handleKeydown}
				maxlength={maxlength * 2}
			></textarea>
		</div>
		
		<!-- Preview Side (conditionally shown) -->
		{#if showPreview}
			<div class="preview-side">
				<div class="preview-label">Preview</div>
				<div class="preview-content">
					<Markdown content={value} />
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Character Counter -->
	<div class="editor-footer">
		<span class="char-counter" style="color: {charCountColor}">
			{visibleCharCount}/{maxlength} characters
			{#if visibleCharCount > maxlength}
				<span class="counter-warning">• Please shorten your description</span>
			{/if}
		</span>
	</div>
</div>

<style>
	.markdown-editor {
		display: flex;
		flex-direction: column;
		gap: 0;
		border-radius: 0.5rem;
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		overflow: hidden;
		transition: border-color 0.2s;
	}
	
	.markdown-editor:focus-within {
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.editor-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
		flex-wrap: wrap;
	}
	
	.toolbar-group {
		display: flex;
		gap: 0.25rem;
	}
	
	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		background: var(--border-secondary);
	}
	
	.toolbar-spacer {
		flex: 1;
		min-width: 0.5rem;
	}
	
	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.toolbar-btn:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.toolbar-btn:active {
		transform: scale(0.95);
	}
	
	.toolbar-btn--active {
		background: var(--color-primary-100);
		color: var(--color-primary-700);
	}
	
	.toolbar-btn--help {
		color: var(--color-primary-600);
	}
	
	.toolbar-btn--help:hover {
		background: var(--color-primary-50);
		color: var(--color-primary-700);
	}
	
	.help-panel {
		padding: 0.625rem 0.75rem;
		background: var(--color-primary-50);
		border-bottom: 1px solid var(--color-primary-200);
		animation: slideDown 0.2s ease-out;
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.help-content {
		max-width: 100%;
	}
	
	.help-compact {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.help-compact code {
		background: var(--bg-primary);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.6875rem;
		color: var(--color-primary-700);
		border: 1px solid var(--color-primary-200);
		white-space: nowrap;
	}
	
	.help-tip-compact {
		font-size: 0.6875rem;
		color: var(--color-primary-700);
		line-height: 1.4;
	}
	
	.editor-content {
		position: relative;
		min-height: 150px;
		display: flex;
		flex-direction: column;
	}
	
	.editor-content.split-view {
		flex-direction: row;
		gap: 0;
	}
	
	.editor-side {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 150px;
	}
	
	.split-view .editor-side {
		border-right: 1px solid var(--border-primary);
		max-width: 50%;
	}
	
	.editor-textarea {
		flex: 1;
		width: 100%;
		padding: 0.75rem;
		border: none;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.6;
		resize: vertical;
		outline: none;
		min-height: 150px;
	}
	
	.split-view .editor-textarea {
		resize: none;
		height: 100%;
	}
	
	.editor-textarea.error {
		background: var(--color-danger-light);
	}
	
	.editor-textarea::placeholder {
		color: var(--text-tertiary);
	}
	
	.preview-side {
		flex: 1;
		padding: 0.75rem;
		min-height: 150px;
		overflow-y: auto;
		background: var(--bg-secondary);
	}
	
	.preview-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.preview-content {
		color: var(--text-primary);
		line-height: 1.6;
	}
	
	/* Mobile: Stack vertically */
	@media (max-width: 768px) {
		.editor-content.split-view {
			flex-direction: column;
		}
		
		.split-view .editor-side {
			border-right: none;
			border-bottom: 1px solid var(--border-primary);
			max-width: 100%;
		}
		
		.split-view .editor-textarea {
			resize: vertical;
			height: auto;
		}
	}
	
	.editor-footer {
		display: flex;
		justify-content: flex-end;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
	}
	
	.char-counter {
		font-size: 0.75rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.counter-warning {
		color: var(--color-error-600);
		font-weight: 600;
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.help-grid {
			grid-template-columns: 1fr;
		}
		
		.toolbar-btn {
			padding: 0.375rem;
		}
	}
</style>

