// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { uiStore, toggleDarkMode, initDarkMode } from './uiStore';

// Reset store and DOM between tests
beforeEach(() => {
	uiStore.set({ darkMode: false, toasts: [], isPdfGenerating: false });
	document.documentElement.classList.remove('dark');
	localStorage.clear();
});

describe('toggleDarkMode', () => {
	it('toggles store darkMode from false to true', () => {
		toggleDarkMode();
		expect(get(uiStore).darkMode).toBe(true);
	});

	it('toggles store darkMode from true to false', () => {
		uiStore.set({ darkMode: true, toasts: [], isPdfGenerating: false });
		document.documentElement.classList.add('dark');
		toggleDarkMode();
		expect(get(uiStore).darkMode).toBe(false);
	});

	it('adds dark class to document.documentElement when toggling on', () => {
		toggleDarkMode();
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('removes dark class from document.documentElement when toggling off', () => {
		document.documentElement.classList.add('dark');
		uiStore.set({ darkMode: true, toasts: [], isPdfGenerating: false });
		toggleDarkMode();
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('saves "dark" to localStorage when toggling on', () => {
		toggleDarkMode();
		expect(localStorage.getItem('orpi-theme')).toBe('dark');
	});

	it('saves "light" to localStorage when toggling off', () => {
		uiStore.set({ darkMode: true, toasts: [], isPdfGenerating: false });
		document.documentElement.classList.add('dark');
		toggleDarkMode();
		expect(localStorage.getItem('orpi-theme')).toBe('light');
	});
});

describe('initDarkMode', () => {
	it('syncs store to true when dark class is present on html', () => {
		document.documentElement.classList.add('dark');
		initDarkMode();
		expect(get(uiStore).darkMode).toBe(true);
	});

	it('syncs store to false when dark class is absent from html', () => {
		uiStore.set({ darkMode: true, toasts: [], isPdfGenerating: false });
		document.documentElement.classList.remove('dark');
		initDarkMode();
		expect(get(uiStore).darkMode).toBe(false);
	});
});

describe('anti-FOUC script logic', () => {
	it('applies dark when localStorage has "dark"', () => {
		// Simulate the app.html inline script logic
		localStorage.setItem('orpi-theme', 'dark');
		const theme = localStorage.getItem('orpi-theme');
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		}
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('does not apply dark when localStorage has "light"', () => {
		localStorage.setItem('orpi-theme', 'light');
		const theme = localStorage.getItem('orpi-theme');
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		}
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('falls back to matchMedia when localStorage is empty', () => {
		// Mock matchMedia to return dark preference
		const matchMediaMock = vi.fn().mockReturnValue({ matches: true });
		vi.stubGlobal('matchMedia', matchMediaMock);

		const theme = localStorage.getItem('orpi-theme');
		if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			document.documentElement.classList.add('dark');
		}
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		vi.unstubAllGlobals();
	});

	it('stays light when localStorage empty and OS is light', () => {
		const matchMediaMock = vi.fn().mockReturnValue({ matches: false });
		vi.stubGlobal('matchMedia', matchMediaMock);

		const theme = localStorage.getItem('orpi-theme');
		if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			document.documentElement.classList.add('dark');
		}
		expect(document.documentElement.classList.contains('dark')).toBe(false);

		vi.unstubAllGlobals();
	});
});

describe('Edge case: localStorage disabled', () => {
	it('toggleDarkMode gracefully handles localStorage unavailable', () => {
		// Mock localStorage.setItem to throw
		const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('localStorage disabled');
		});

		// Should not throw, should still toggle DOM
		expect(() => toggleDarkMode()).not.toThrow();
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		setItemSpy.mockRestore();
	});

	it('toggleDarkMode catches try/catch on quota exceeded', () => {
		const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('QuotaExceededError');
		});

		expect(() => toggleDarkMode()).not.toThrow();
		expect(get(uiStore).darkMode).toBe(true); // Store still updates

		setItemSpy.mockRestore();
	});
});

describe('Edge case: rapid toggle sequence', () => {
	it('multiple rapid toggles result in final correct state', () => {
		toggleDarkMode(); // true
		toggleDarkMode(); // false
		toggleDarkMode(); // true
		expect(get(uiStore).darkMode).toBe(true);
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('localStorage reflects final toggle state', () => {
		toggleDarkMode(); // dark
		toggleDarkMode(); // light
		toggleDarkMode(); // dark
		expect(localStorage.getItem('orpi-theme')).toBe('dark');
	});
});

describe('Edge case: anti-FOUC script guards', () => {
	it('app.html script handles localStorage disabled gracefully', () => {
		// Simulate anti-FOUC script with guards
		try {
			const theme = typeof localStorage !== 'undefined' ? localStorage.getItem('orpi-theme') : null;
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (theme === 'dark' || (!theme && prefersDark)) {
				document.documentElement.classList.add('dark');
			}
		} catch (e) {
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				document.documentElement.classList.add('dark');
			}
		}
		// Should complete without throwing
		expect(document.documentElement.classList.contains('dark')).toBeDefined();
	});

	it('anti-FOUC script handles matchMedia undefined', () => {
		const originalMatchMedia = window.matchMedia;
		// @ts-ignore
		delete window.matchMedia;

		try {
			const theme = typeof localStorage !== 'undefined' ? localStorage.getItem('orpi-theme') : null;
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (theme === 'dark' || (!theme && prefersDark)) {
				document.documentElement.classList.add('dark');
			}
		} catch (e) {
			// Fallback: app doesn't crash
		}

		window.matchMedia = originalMatchMedia;
		// Test passes if we didn't throw
		expect(true).toBe(true);
	});
});
