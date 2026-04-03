import { writable } from 'svelte/store';
import type { ToastMessage } from '$lib/types';

interface UIState {
	darkMode: boolean;
	toasts: ToastMessage[];
	isPdfGenerating: boolean;
}

const initialState: UIState = {
	darkMode: false,
	toasts: [],
	isPdfGenerating: false
};

export const uiStore = writable<UIState>(initialState);

// Track timeout IDs for cleanup (prevents memory leak and race conditions)
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const DEFAULT_DURATIONS: Record<ToastMessage['type'], number> = {
	success: 3000,
	error: 5000,
	info: 3000,
	warning: 3000
};

export function addToast(options: {
	message: string;
	type?: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}) {
	const { message, type = 'info', duration = DEFAULT_DURATIONS[type] } = options;

	// Validate duration
	if (duration <= 0) {
		throw new Error('Toast duration must be positive (> 0ms)');
	}

	const id = crypto.randomUUID();
	const toast: ToastMessage = { id, message, type, duration, createdAt: Date.now() };

	uiStore.update((state) => ({
		...state,
		toasts: [...state.toasts, toast]
	}));

	// Set auto-dismiss and track the timeout ID
	const timeoutId = setTimeout(() => {
		removeToast(id);
	}, duration);

	toastTimeouts.set(id, timeoutId);
}

export function removeToast(id: string) {
	// Guard against double-removal
	if (!toastTimeouts.has(id)) {
		// Toast already removed or being removed; skip
		return;
	}

	// Clear any pending timeout for this toast
	const timeoutId = toastTimeouts.get(id);
	if (timeoutId) {
		clearTimeout(timeoutId);
		toastTimeouts.delete(id);
	}

	// Add grace period (200ms) to allow out:fly animation to complete
	// before removing the toast from the store. Increased from 150ms to ensure
	// animation completion under load.
	setTimeout(() => {
		try {
			uiStore.update((state) => ({
				...state,
				toasts: state.toasts.filter((t) => t.id !== id)
			}));
		} catch (error) {
			// Silently handle setState after unmount errors
			console.warn('[uiStore] removeToast update failed (component likely unmounted):', error);
		}
	}, 200);
}

export function toggleDarkMode() {
	uiStore.update((state) => {
		const newDark = !state.darkMode;
		document.documentElement.classList.toggle('dark', newDark);
		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('orpi-theme', newDark ? 'dark' : 'light');
			}
		} catch (e) {
			console.warn('[uiStore] localStorage.setItem failed:', e);
		}
		return { ...state, darkMode: newDark };
	});
}

export function initDarkMode() {
	try {
		// Sync store with DOM state (set by anti-FOUC script in app.html)
		const isDark = document.documentElement.classList.contains('dark');
		uiStore.update((state) => ({ ...state, darkMode: isDark }));
	} catch (e) {
		console.warn('[uiStore] initDarkMode failed:', e);
	}
}
