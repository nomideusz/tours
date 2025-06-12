/**
 * Simple toast notification utilities
 */

/**
 * Shows a success toast notification
 * @param message The message to display
 */
export function toastSuccess(message: string): void {
  console.log('Success:', message);
  // Implementation would connect to a toast notification system
  // For now we'll just log to console
}

/**
 * Shows an error toast notification
 * @param message The error message to display
 */
export function toastError(message: string): void {
  console.error('Error:', message);
  // Implementation would connect to a toast notification system
  // For now we'll just log to console
} 