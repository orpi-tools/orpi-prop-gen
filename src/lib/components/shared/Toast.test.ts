// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const toast = readFileSync(resolve(__dirname, './Toast.svelte'), 'utf-8');

describe('Toast.svelte structure (Story 6.3)', () => {
	it('uses border-l-4 pattern for left border design', () => {
		expect(toast).toContain('border-l-4');
	});

	it('has border-l-green-600 for success type', () => {
		expect(toast).toContain('border-l-green-600');
	});

	it('has border-l-red-600 for error type', () => {
		expect(toast).toContain('border-l-red-600');
	});

	it('has border-l color for info type using orpi-navy', () => {
		expect(toast).toContain('border-l-[var(--color-orpi-navy)]');
	});

	it('has border-l-yellow-500 for warning type', () => {
		expect(toast).toContain('border-l-yellow-500');
	});

	it('uses aria-live attribute for accessibility', () => {
		expect(toast).toContain('aria-live');
	});

	it('uses aria-live="assertive" for error type', () => {
		expect(toast).toContain('assertive');
	});

	it('uses aria-live="polite" for non-error types', () => {
		expect(toast).toContain('polite');
	});

	it('does NOT use !dark: syntax (broken in Tailwind v4)', () => {
		expect(toast).not.toContain('!dark:');
	});

	it('uses proper dark: classes for dark mode', () => {
		expect(toast).toContain('dark:bg-gray-800');
		expect(toast).toContain('dark:text-gray-50');
	});

	it('has close button with aria-label', () => {
		expect(toast).toContain('aria-label="Fermer la notification"');
	});

	it('has SVG icons instead of text glyphs', () => {
		expect(toast).toContain('<svg');
		expect(toast).not.toMatch(/aria-hidden="true">\s*[✓✕ℹ⚠]/);
	});

	it('has min-w-72 and max-w-sm for width constraints', () => {
		expect(toast).toContain('min-w-72');
		expect(toast).toContain('max-w-sm');
	});

	it('uses role="alert" for screen reader announcement', () => {
		expect(toast).toContain('role="alert"');
	});
});
