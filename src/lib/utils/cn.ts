/**
 * Utility for merging class names
 * Simple implementation for className merging without external dependencies
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}
