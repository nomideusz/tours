/**
 * Mobile keyboard detection store
 * Simple and reliable approach: just track input focus state
 * Hide sticky elements whenever user is typing in an input field
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isKeyboardVisible = writable(false);

if (browser) {
	// Track input focus state
	const handleFocusIn = (e: FocusEvent) => {
		const target = e.target as HTMLElement;
		if (!target) return;
		
		// Check if target is a form input that would trigger the keyboard
		const isFormInput = (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable
		);
		
		// Don't hide for certain input types that don't show keyboard
		const isNonKeyboardInput = target instanceof HTMLInputElement && (
			target.type === 'checkbox' ||
			target.type === 'radio' ||
			target.type === 'submit' ||
			target.type === 'button' ||
			target.type === 'file'
		);
		
		if (isFormInput && !isNonKeyboardInput) {
			// Mobile devices only (screen width < 768px)
			if (window.innerWidth < 768) {
				isKeyboardVisible.set(true);
			}
		}
	};
	
	const handleFocusOut = (e: FocusEvent) => {
		const target = e.target as HTMLElement;
		if (!target) return;
		
		const isFormInput = (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable
		);
		
		if (isFormInput) {
			// Add small delay to allow keyboard close animation
			setTimeout(() => {
				isKeyboardVisible.set(false);
			}, 150);
		}
	};
	
	// Listen to focus events at document level (captures all focus events)
	document.addEventListener('focusin', handleFocusIn, true);
	document.addEventListener('focusout', handleFocusOut, true);
	
	// Reset on window blur (user switches apps)
	window.addEventListener('blur', () => {
		isKeyboardVisible.set(false);
	});
	
	// Reset on orientation change
	window.addEventListener('orientationchange', () => {
		isKeyboardVisible.set(false);
	});
}

