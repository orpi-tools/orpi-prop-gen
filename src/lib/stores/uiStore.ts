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

export function addToast(options: {
	message: string;
	type?: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}) {
	const { message, type = 'info', duration = 3000 } = options;
	const id = crypto.randomUUID();
	const toast: ToastMessage = { id, message, type, duration };

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
	// Clear any pending timeout for this toast
	const timeoutId = toastTimeouts.get(id);
	if (timeoutId) {
		clearTimeout(timeoutId);
		toastTimeouts.delete(id);
	}

	uiStore.update((state) => ({
		...state,
		toasts: state.toasts.filter((t) => t.id !== id)
	}));
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
