import { describe, it, expect, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
	it('should delay function execution', async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);

		debounced();
		expect(fn).not.toHaveBeenCalled();

		await new Promise((r) => setTimeout(r, 150));
		expect(fn).toHaveBeenCalledOnce();
	});

	it('should cancel previous call when called again within delay', async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);

		debounced();
		debounced();
		debounced();

		await new Promise((r) => setTimeout(r, 150));
		expect(fn).toHaveBeenCalledOnce();
	});

	it('should pass arguments to the debounced function', async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);

		debounced('hello', 42);

		await new Promise((r) => setTimeout(r, 100));
		expect(fn).toHaveBeenCalledWith('hello', 42);
	});

	it('should use the latest arguments when called multiple times', async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);

		debounced('first');
		debounced('second');
		debounced('third');

		await new Promise((r) => setTimeout(r, 100));
		expect(fn).toHaveBeenCalledOnce();
		expect(fn).toHaveBeenCalledWith('third');
	});
});
