/**
 * Utility functions for handling markdown text
 */

/**
 * Strip markdown formatting from text for plain text display (e.g., in cards, previews)
 */
export function stripMarkdown(text: string): string {
	if (!text) return '';
	
	return text
		// Remove headers
		.replace(/^#{1,6}\s+/gm, '')
		// Remove bold/italic
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/\*(.*?)\*/g, '$1')
		.replace(/__(.*?)__/g, '$1')
		.replace(/_(.*?)_/g, '$1')
		// Remove list markers
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/^\s*\d+\.\s+/gm, '')
		// Collapse multiple whitespace/newlines
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Count visible characters in markdown text (excluding formatting syntax and excessive whitespace)
 */
export function countMarkdownChars(text: string): number {
	if (!text) return 0;
	return stripMarkdown(text).length;
}

/**
 * Truncate markdown text for previews while preserving word boundaries
 */
export function truncateMarkdown(text: string, maxLength: number = 120): string {
	const stripped = stripMarkdown(text);
	
	if (stripped.length <= maxLength) {
		return stripped;
	}
	
	// Find the last space before maxLength
	const truncated = stripped.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	
	if (lastSpace > maxLength * 0.8) {
		return truncated.substring(0, lastSpace) + '...';
	}
	
	return truncated + '...';
}

