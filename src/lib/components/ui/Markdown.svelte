<script lang="ts">
	interface Props {
		content: string;
		class?: string;
	}
	
	let { content, class: className = '' }: Props = $props();
	
	// Simple markdown parsing for common elements
	function parseMarkdown(text: string): string {
		if (!text) return '';
		
		// Escape HTML first
		let html = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		
		// Headers
		html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
		html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
		html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
		
		// Bold
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
		
		// Italic
		html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
		html = html.replace(/_(.*?)_/g, '<em>$1</em>');
		
		// Lists
		html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
		html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
		html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
		
		// Wrap consecutive list items
		html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
			const isOrdered = match.includes('1.');
			return isOrdered ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
		});
		
		// Line breaks and paragraphs
		const lines = html.split('\n');
		const processedLines = [];
		let inBlock = false;
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			
			if (line === '') {
				if (inBlock) {
					processedLines.push('</p>');
					inBlock = false;
				}
				continue;
			}
			
			// Skip if already wrapped in tags
			if (line.startsWith('<h') || line.startsWith('<ul>') || line.startsWith('<ol>') || line.startsWith('<li>')) {
				if (inBlock) {
					processedLines.push('</p>');
					inBlock = false;
				}
				processedLines.push(line);
			} else {
				if (!inBlock) {
					processedLines.push('<p>');
					inBlock = true;
				}
				processedLines.push(line);
			}
		}
		
		if (inBlock) {
			processedLines.push('</p>');
		}
		
		return processedLines.join('\n');
	}
	
	let html = $derived(parseMarkdown(content));
</script>

<div class="markdown-content {className}">
	{@html html}
</div>

<style>
	.markdown-content {
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3) {
		color: var(--text-primary);
		font-weight: 600;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}
	
	.markdown-content :global(h1) {
		font-size: 1.5rem;
	}
	
	.markdown-content :global(h2) {
		font-size: 1.25rem;
	}
	
	.markdown-content :global(h3) {
		font-size: 1.125rem;
	}
	
	.markdown-content :global(p) {
		margin-bottom: 1em;
	}
	
	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}
	
	.markdown-content :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}
	
	.markdown-content :global(em) {
		font-style: italic;
	}
	
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: 1em 0;
		padding-left: 2em;
	}
	
	.markdown-content :global(li) {
		margin-bottom: 0.5em;
	}
	
	.markdown-content :global(ul li) {
		list-style-type: disc;
	}
	
	.markdown-content :global(ol li) {
		list-style-type: decimal;
	}
</style>
