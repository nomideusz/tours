/**
 * Mobile keyboard detection store
 * Detects when the mobile keyboard is visible using multiple methods
 * and provides a reactive store to hide/show sticky bottom elements
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isKeyboardVisible = writable(false);

if (browser) {
	let initialHeight = window.innerHeight;
	let isInputFocused = false;
	
	// Threshold: if viewport shrinks by more than 150px, keyboard is likely open
	const KEYBOARD_THRESHOLD = 150;
	
	const checkKeyboard = () => {
		// Method 1: Visual Viewport API (most reliable for modern browsers)
		if (window.visualViewport) {
			const viewportHeight = window.visualViewport.height;
			const windowHeight = window.innerHeight;
			const heightDiff = windowHeight - viewportHeight;
			
			// Keyboard is open if viewport is significantly smaller AND an input is focused
			const keyboardOpen = heightDiff > KEYBOARD_THRESHOLD && isInputFocused;
			
			isKeyboardVisible.set(keyboardOpen);
			return;
		}
		
		// Method 2: Fallback - compare current window height to initial
		const currentHeight = window.innerHeight;
		const heightDiff = initialHeight - currentHeight;
		const keyboardOpen = heightDiff > KEYBOARD_THRESHOLD && isInputFocused;
		
		isKeyboardVisible.set(keyboardOpen);
	};
	
	// Track input focus state
	const handleFocusIn = (e: FocusEvent) => {
		const target = e.target as HTMLElement;
		if (target && (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable
		)) {
			isInputFocused = true;
			// Small delay to let keyboard animation start
			setTimeout(checkKeyboard, 100);
		}
	};
	
	const handleFocusOut = () => {
		isInputFocused = false;
		// Small delay to let keyboard close
		setTimeout(checkKeyboard, 100);
	};
	
	// Listen to focus events
	document.addEventListener('focusin', handleFocusIn);
	document.addEventListener('focusout', handleFocusOut);
	
	// Listen to viewport changes
	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', checkKeyboard);
	} else {
		window.addEventListener('resize', checkKeyboard);
	}
	
	// Update initial height on orientation change
	window.addEventListener('orientationchange', () => {
		setTimeout(() => {
			initialHeight = window.innerHeight;
			checkKeyboard();
		}, 100);
	});
}

