// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const container = readFileSync(resolve(__dirname, './ToastContainer.svelte'), 'utf-8');

describe('ToastContainer.svelte structure (Story 6.3)', () => {
	it('limits visible toasts with slice(-MAX_VISIBLE) or slice(-3)', () => {
		expect(container).toMatch(/slice\(-(?:MAX_VISIBLE|3)\)/);
	});

	it('defines MAX_VISIBLE = 3', () => {
		expect(container).toContain('MAX_VISIBLE = 3');
	});

	it('uses in:fly animation for toast entry', () => {
		expect(container).toMatch(/in:fly=\{\{.*x:\s*64.*duration:\s*200/);
	});

	it('uses out:fly animation for toast exit', () => {
		expect(container).toMatch(/out:fly=\{\{.*x:\s*64.*duration:\s*150/);
	});

	it('has z-[60] to render above modals (z-50)', () => {
		expect(container).toContain('z-[60]');
	});

	it('has role="region" for accessibility', () => {
		expect(container).toContain('role="region"');
	});

	it('has aria-label for notifications region', () => {
		expect(container).toContain('aria-label=');
	});

	it('has aria-live for accessibility announcements', () => {
		expect(container).toContain('aria-live=');
	});

	it('uses pointer-events-none on container and pointer-events-auto on items', () => {
		expect(container).toContain('pointer-events-none');
		expect(container).toContain('pointer-events-auto');
	});

	it('uses flex-col-reverse for bottom-up stacking', () => {
		expect(container).toContain('flex-col-reverse');
	});

	it('is positioned fixed at bottom-right', () => {
		expect(container).toContain('fixed');
		expect(container).toContain('right-0');
		expect(container).toContain('bottom-0');
	});
});
