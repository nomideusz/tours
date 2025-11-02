<script lang="ts">
	interface Props {
		content: string;
		class?: string;
	}
	
	let { content, class: className = '' }: Props = $props();
	
	// Check if content is already HTML (from rich text editor like Tipex)
	function isHTML(text: string): boolean {
		if (!text) return false;
		// Check for common HTML tags
		return /<\/?[a-z][\s\S]*>/i.test(text);
	}
	
	// Simple markdown parsing for common elements
	function parseMarkdown(text: string): string {
		if (!text) return '';
		
		// If content is already HTML, return it as-is (sanitized by browser)
		if (isHTML(text)) {
			return text;
		}
		
		// Escape HTML first (only for markdown content)
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
		
		// Lists - process line by line to properly group ordered and unordered lists
		const listLines = html.split('\n');
		const processedListLines: string[] = [];
		let currentListType: 'ol' | 'ul' | null = null;
		let listItems: string[] = [];
		
		for (const line of listLines) {
			const trimmedLine = line.trim();
			
			// Check for numbered list
			const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
			if (numberedMatch) {
				if (currentListType !== 'ol') {
					// Close previous list if different type
					if (currentListType && listItems.length > 0) {
						processedListLines.push(`<${currentListType}>${listItems.join('')}</${currentListType}>`);
						listItems = [];
					}
					currentListType = 'ol';
				}
				listItems.push(`<li>${numberedMatch[2]}</li>`);
				continue;
			}
			
			// Check for bullet list
			const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.+)$/);
			if (bulletMatch) {
				if (currentListType !== 'ul') {
					// Close previous list if different type
					if (currentListType && listItems.length > 0) {
						processedListLines.push(`<${currentListType}>${listItems.join('')}</${currentListType}>`);
						listItems = [];
					}
					currentListType = 'ul';
				}
				listItems.push(`<li>${bulletMatch[1]}</li>`);
				continue;
			}
			
			// Not a list item - close any open list
			if (currentListType && listItems.length > 0) {
				processedListLines.push(`<${currentListType}>${listItems.join('')}</${currentListType}>`);
				listItems = [];
				currentListType = null;
			}
			processedListLines.push(line);
		}
		
		// Close any remaining list
		if (currentListType && listItems.length > 0) {
			processedListLines.push(`<${currentListType}>${listItems.join('')}</${currentListType}>`);
		}
		
		html = processedListLines.join('\n');
		
		// Line breaks and paragraphs
		const lines = html.split('\n');
		const processedLines = [];
		let inBlock = false;
		let blockLines: string[] = [];
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			
			if (line === '') {
				// Empty line - close current block if any
				if (inBlock) {
					// Join lines in block with <br> for single line breaks
					processedLines.push('<p>');
					processedLines.push(blockLines.join('<br>\n'));
					processedLines.push('</p>');
					blockLines = [];
					inBlock = false;
				}
				continue;
			}
			
			// Skip if already wrapped in tags
			if (line.startsWith('<h') || line.startsWith('<ul>') || line.startsWith('<ol>') || line.startsWith('<li>')) {
				if (inBlock) {
					processedLines.push('<p>');
					processedLines.push(blockLines.join('<br>\n'));
					processedLines.push('</p>');
					blockLines = [];
					inBlock = false;
				}
				processedLines.push(line);
			} else {
				// Regular text line - add to current block
				if (!inBlock) {
					inBlock = true;
				}
				blockLines.push(line);
			}
		}
		
		// Close any remaining block
		if (inBlock && blockLines.length > 0) {
			processedLines.push('<p>');
			processedLines.push(blockLines.join('<br>\n'));
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
