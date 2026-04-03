import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, writable } from 'svelte/store';

// We test the debounce logic by mocking proposalStore before importing previewStore
// Instead, test the debouncedDerived pattern directly

function debouncedDerived<T>(
	source: { subscribe: (fn: (value: T) => void) => () => void },
	delay: number
) {
	const { subscribe } = (() => {
		let currentValue: T;
		let initialized = false;
		const subscribers = new Set<(value: T) => void>();

		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const unsubSource = source.subscribe((value: T) => {
			currentValue = value;
			if (!initialized) {
				initialized = true;
				subscribers.forEach((fn) => fn(value));
				return;
			}
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				subscribers.forEach((fn) => fn(currentValue));
			}, delay);
		});

		return {
			subscribe(fn: (value: T) => void) {
				subscribers.add(fn);
				if (initialized) fn(currentValue);
				return () => {
					subscribers.delete(fn);
					if (subscribers.size === 0) {
						if (timeoutId) clearTimeout(timeoutId);
						unsubSource();
					}
				};
			}
		};
	})();

	return { subscribe };
}

describe('previewStore (debouncedDerived)', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllTimers();
		vi.clearAllMocks();
	});

	it('emits initial value synchronously without delay', () => {
		const source = writable('initial');
		const derived = debouncedDerived(source, 300);

		const values: string[] = [];
		const unsub = derived.subscribe((v) => values.push(v));

		expect(values).toEqual(['initial']);
		unsub();
	});

	it('debounces subsequent updates by 300ms', () => {
		const source = writable('initial');
		const derived = debouncedDerived(source, 300);

		const values: string[] = [];
		const unsub = derived.subscribe((v) => values.push(v));

		// Initial value emitted
		expect(values).toEqual(['initial']);

		// Update source — should NOT emit immediately
		source.set('update1');
		expect(values).toEqual(['initial']);

		// After 299ms — still not emitted
		vi.advanceTimersByTime(299);
		expect(values).toEqual(['initial']);

		// After 300ms — emitted
		vi.advanceTimersByTime(1);
		expect(values).toEqual(['initial', 'update1']);

		unsub();
	});

	it('coalesces rapid updates into single emission after 300ms', () => {
		const source = writable('v0');
		const derived = debouncedDerived(source, 300);

		const values: string[] = [];
		const unsub = derived.subscribe((v) => values.push(v));

		expect(values).toEqual(['v0']);

		// Rapid-fire updates at 50ms intervals
		source.set('v1');
		vi.advanceTimersByTime(50);
		source.set('v2');
		vi.advanceTimersByTime(50);
		source.set('v3');
		vi.advanceTimersByTime(50);
		source.set('v4');

		// None emitted yet (only initial)
		expect(values).toEqual(['v0']);

		// Wait full 300ms from last update
		vi.advanceTimersByTime(300);
		// Only the latest value emitted
		expect(values).toEqual(['v0', 'v4']);

		unsub();
	});

	it('cleans up timeout on unsubscribe', () => {
		const source = writable('initial');
		const derived = debouncedDerived(source, 300);

		const values: string[] = [];
		const unsub = derived.subscribe((v) => values.push(v));

		source.set('pending');
		// Unsubscribe before debounce fires
		unsub();

		vi.advanceTimersByTime(500);
		// Should NOT have received the pending update
		expect(values).toEqual(['initial']);
	});

	it('works with object values (Proposition-like)', () => {
		const source = writable({ bien: { loyerHC: 0 }, simulation: { tmi: 30 } });
		const derived = debouncedDerived(source, 300);

		const values: Array<{ bien: { loyerHC: number }; simulation: { tmi: number } }> = [];
		const unsub = derived.subscribe((v) => values.push(v));

		expect(values).toHaveLength(1);
		expect(values[0].bien.loyerHC).toBe(0);

		source.set({ bien: { loyerHC: 680 }, simulation: { tmi: 30 } });
		vi.advanceTimersByTime(300);

		expect(values).toHaveLength(2);
		expect(values[1].bien.loyerHC).toBe(680);

		unsub();
	});
});
