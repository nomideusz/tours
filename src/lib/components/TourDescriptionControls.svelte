<script lang="ts">
	import type { Editor } from '@tiptap/core';
	
	// Icons
	import Bold from 'lucide-svelte/icons/bold';
	import Italic from 'lucide-svelte/icons/italic';
	import Heading2 from 'lucide-svelte/icons/heading-2';
	import Heading3 from 'lucide-svelte/icons/heading-3';
	import List from 'lucide-svelte/icons/list';
	import ListOrdered from 'lucide-svelte/icons/list-ordered';
	import Link2 from 'lucide-svelte/icons/link-2';
	import Unlink from 'lucide-svelte/icons/unlink';
	import Minus from 'lucide-svelte/icons/minus';
	
	interface Props {
		tipex: Editor;
	}
	
	let { tipex }: Props = $props();
	
	// Reactive active states using runes
	let isBoldActive = $derived(tipex?.isActive('bold') ?? false);
	let isItalicActive = $derived(tipex?.isActive('italic') ?? false);
	let isH2Active = $derived(tipex?.isActive('heading', { level: 2 }) ?? false);
	let isH3Active = $derived(tipex?.isActive('heading', { level: 3 }) ?? false);
	let isBulletListActive = $derived(tipex?.isActive('bulletList') ?? false);
	let isOrderedListActive = $derived(tipex?.isActive('orderedList') ?? false);
	let isLinkActive = $derived(tipex?.isActive('link') ?? false);
	
	// Check if commands can execute
	let canExecute = $derived((command: string) => tipex?.can()[command as keyof ReturnType<typeof tipex.can>]() ?? false);
	
	function toggleBold(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		tipex?.chain().focus().toggleBold().run();
	}
	
	function toggleItalic(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		tipex?.chain().focus().toggleItalic().run();
	}
	
	function toggleH2(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		tipex?.chain().focus().toggleHeading({ level: 2 }).run();
	}
	
	function toggleH3(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		tipex?.chain().focus().toggleHeading({ level: 3 }).run();
	}
	
	function toggleBulletList(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		tipex?.chain().focus().toggleBulletList().run();
	}
	
	function toggleOrderedList(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		tipex?.chain().focus().toggleOrderedList().run();
	}
	
	function setLink(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		if (isLinkActive) {
			// Remove link
			tipex?.chain().focus().unsetLink().run();
			return;
		}
		
		// Get URL from user
		const url = window.prompt('Enter URL:');
		if (url) {
			tipex?.chain().focus().setLink({ href: url, target: '_blank' }).run();
		}
	}
	
	function insertHorizontalRule(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		// Use TipTap's built-in setHorizontalRule command from StarterKit
		tipex?.chain().focus().setHorizontalRule().run();
	}
</script>

<div class="tour-editor-controls">
	<div class="controls-group">
		<!-- Text formatting -->
		<button
			type="button"
			class="control-btn"
			class:active={isBoldActive}
			onclick={toggleBold}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Bold"
			title="Bold (Ctrl+B)"
		>
			<Bold class="w-4 h-4" />
		</button>
		
		<button
			type="button"
			class="control-btn"
			class:active={isItalicActive}
			onclick={toggleItalic}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Italic"
			title="Italic (Ctrl+I)"
		>
			<Italic class="w-4 h-4" />
		</button>
	</div>
	
	<div class="controls-divider"></div>
	
	<div class="controls-group">
		<!-- Headings -->
		<button
			type="button"
			class="control-btn"
			class:active={isH2Active}
			onclick={toggleH2}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Heading 2"
			title="Heading 2"
		>
			<Heading2 class="w-4 h-4" />
		</button>
		
		<button
			type="button"
			class="control-btn"
			class:active={isH3Active}
			onclick={toggleH3}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Heading 3"
			title="Heading 3"
		>
			<Heading3 class="w-4 h-4" />
		</button>
	</div>
	
	<div class="controls-divider"></div>
	
	<div class="controls-group">
		<!-- Lists -->
		<button
			type="button"
			class="control-btn"
			class:active={isBulletListActive}
			onclick={toggleBulletList}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Bullet List"
			title="Bullet List"
		>
			<List class="w-4 h-4" />
		</button>
		
		<button
			type="button"
			class="control-btn"
			class:active={isOrderedListActive}
			onclick={toggleOrderedList}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Numbered List"
			title="Numbered List"
		>
			<ListOrdered class="w-4 h-4" />
		</button>
	</div>
	
	<div class="controls-divider"></div>
	
	<div class="controls-group">
		<!-- Link -->
		<button
			type="button"
			class="control-btn"
			class:active={isLinkActive}
			onclick={setLink}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label={isLinkActive ? 'Remove Link' : 'Add Link'}
			title={isLinkActive ? 'Remove Link' : 'Add Link'}
		>
			{#if isLinkActive}
				<Unlink class="w-4 h-4" />
			{:else}
				<Link2 class="w-4 h-4" />
			{/if}
		</button>
	</div>
	
	<div class="controls-divider"></div>
	
	<div class="controls-group">
		<!-- Horizontal Rule -->
		<button
			type="button"
			class="control-btn"
			onclick={insertHorizontalRule}
			onmousedown={(e) => e.preventDefault()}
			ontouchstart={(e) => e.preventDefault()}
			aria-label="Horizontal Line"
			title="Insert Horizontal Line"
		>
			<Minus class="w-4 h-4" />
		</button>
	</div>
</div>

<style>
	.tour-editor-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
		flex-wrap: wrap;
		position: sticky;
		top: 0;
		z-index: 10;
		user-select: none;
		-webkit-user-select: none;
	}
	
	/* Override Tipex's default 2px border-bottom if it exists */
	:global(.tipex-description-editor .tour-editor-controls) {
		border-bottom: 1px solid var(--border-primary) !important;
	}
	
	.controls-group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.controls-divider {
		width: 1px;
		height: 1.25rem;
		background: var(--border-primary);
		margin: 0 0.25rem;
	}
	
	.control-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0.375rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}
	
	.control-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}
	
	.control-btn:focus {
		outline: none;
		border-color: var(--color-accent-500);
		box-shadow: 0 0 0 2px var(--color-accent-200);
	}
	
	.control-btn.active {
		background: var(--color-accent-100);
		color: var(--color-accent-700);
		border-color: var(--color-accent-300);
	}
	
	.control-btn.active:focus {
		box-shadow: 0 0 0 2px var(--color-accent-300);
	}
	
	.control-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	/* Dark mode support */
	:global([data-theme="dark"]) .control-btn.active {
		background: var(--color-accent-900);
		color: var(--color-accent-300);
		border-color: var(--color-accent-700);
	}
	
	/* Mobile adjustments */
	@media (max-width: 767px) {
		.tour-editor-controls {
			padding: 0.5rem 0.375rem;
			gap: 0.25rem;
			justify-content: center;
			overflow-x: auto;
			overflow-y: hidden;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none; /* Firefox */
			overscroll-behavior-x: contain;
		}
		
		.tour-editor-controls::-webkit-scrollbar {
			display: none; /* Chrome, Safari, Edge */
		}
		
		.controls-group {
			gap: 0.125rem;
		}
		
		.control-btn {
			width: 2.25rem;
			height: 2.25rem;
			min-width: 2.25rem;
			padding: 0.375rem;
			/* Prevent text selection and improve touch response */
			-webkit-touch-callout: none;
			flex-shrink: 0;
		}
		
		.control-btn :global(svg) {
			width: 1rem;
			height: 1rem;
			/* Prevent pointer events on SVG children to ensure button gets the event */
			pointer-events: none;
		}
		
		.controls-divider {
			height: 1.25rem;
			margin: 0 0.125rem;
			flex-shrink: 0;
		}
	}
	
	/* Very small mobile devices */
	@media (max-width: 430px) {
		.tour-editor-controls {
			padding: 0.5rem 0.25rem;
			gap: 0.125rem;
		}
		
		.control-btn {
			width: 2rem;
			height: 2rem;
			min-width: 2rem;
			padding: 0.25rem;
		}
		
		.control-btn :global(svg) {
			width: 0.875rem;
			height: 0.875rem;
		}
		
		.controls-divider {
			height: 1rem;
			margin: 0 0.125rem;
		}
		
		.controls-group {
			gap: 0.125rem;
		}
	}
</style>

