import { readable, type Readable, type Subscriber } from 'svelte/store';
import { proposalStore } from './proposalStore';
import type { Proposition } from '$lib/types';

/**
 * Derived read-only store from proposalStore with 300ms debounce.
 *
 * @param source - Source store to derive from
 * @param delay - Debounce delay in milliseconds (default 300ms for preview updates)
 * @returns Read-only derived store that emits source values with debounce delay
 *
 * Behavior:
 * - Initial value: emitted synchronously (no delay on first render)
 * - Subsequent values: debounced by delay ms, coalescing rapid updates
 * - Protects low-end agency PCs from lag during rapid typing
 * - Note: Uses setTimeout for debounce; requestAnimationFrame not added to keep store simple
 *
 * @example
 * const previewStore = debouncedDerived(proposalStore, 300);
 * const data = $derived($previewStore); // Read-only, receives updates after 300ms
 */
function debouncedDerived<T>(source: Readable<T>, delay: number): Readable<T> {
	// Validate source
	if (!source) {
		console.error('[previewStore] Source store is null/undefined at initialization');
		// Return empty readable as fallback
		return readable<T>(undefined as unknown as T, () => {
			return () => {};
		});
	}

	let currentValue: T;
	let initialized = false;
	let activeSubscribers = 0;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let sourceUnsubscribed = false;

	return readable<T>(undefined as unknown as T, (set: Subscriber<T>) => {
		activeSubscribers++;
		let unsubscribeSource: (() => void) | null = null;

		try {
			unsubscribeSource = source.subscribe((value: T) => {
				if (sourceUnsubscribed) return;
				currentValue = value;
				if (!initialized) {
					// First value: emit synchronously (no debounce delay)
					initialized = true;
					set(value);
					return;
				}
				// Subsequent values: debounce
				if (timeoutId) clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					// Only emit if there are active subscribers
					if (activeSubscribers > 0) {
						set(currentValue);
					}
				}, delay);
			});
		} catch (error) {
			console.error('[previewStore] Failed to subscribe to source store:', error);
			sourceUnsubscribed = true;
		}

		return () => {
			activeSubscribers--;
			// Guard against double-unsubscribe
			if (unsubscribeSource) {
				if (timeoutId) clearTimeout(timeoutId);
				unsubscribeSource();
				unsubscribeSource = null;
			}
		};
	});
}

export const previewStore: Readable<Proposition> = debouncedDerived(proposalStore, 300);
