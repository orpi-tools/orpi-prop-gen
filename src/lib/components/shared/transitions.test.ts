// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readComponent(relativePath: string): string {
	return readFileSync(resolve(__dirname, relativePath), 'utf-8');
}

describe('Route transitions (AC1)', () => {
	const layout = readComponent('../../../routes/+layout.svelte');

	it('imports onNavigate from $app/navigation', () => {
		expect(layout).toContain("onNavigate");
		expect(layout).toMatch(/import\s*\{[^}]*onNavigate[^}]*\}\s*from\s*'\$app\/navigation'/);
	});

	it('calls onNavigate with document.startViewTransition', () => {
		expect(layout).toContain('onNavigate(');
		expect(layout).toContain('document.startViewTransition');
	});

	it('returns a Promise from onNavigate callback', () => {
		expect(layout).toContain('return new Promise');
		expect(layout).toContain('await navigation.complete');
	});

	it('gracefully handles missing startViewTransition (fallback)', () => {
		expect(layout).toContain('if (!document.startViewTransition) return');
	});

	it('has View Transition CSS with fade-in/fade-out keyframes', () => {
		expect(layout).toContain('@keyframes fade-in');
		expect(layout).toContain('@keyframes fade-out');
		expect(layout).toContain('::view-transition-old(root)');
		expect(layout).toContain('::view-transition-new(root)');
		expect(layout).toContain('200ms');
	});

	it('does NOT have transition:fade on the main content container', () => {
		expect(layout).not.toMatch(/transition:fade.*children/s);
		expect(layout).not.toContain('transition:fade={{ duration: 150 }}');
	});
});

describe('Stagger animation cards dashboard (AC2)', () => {
	const dashboard = readComponent('../../../routes/+page.svelte');

	it('imports fly from svelte/transition', () => {
		expect(dashboard).toMatch(/import\s*\{[^}]*fly[^}]*\}\s*from\s*'svelte\/transition'/);
	});

	it('uses in:fly with correct stagger params on cards', () => {
		expect(dashboard).toContain('in:fly=');
		expect(dashboard).toMatch(/in:fly=\{\{.*y:\s*20/);
		expect(dashboard).toMatch(/duration:\s*400/);
	});

	it('caps delay to 600ms max', () => {
		expect(dashboard).toContain('Math.min(i * 100, 600)');
	});

	it('uses in:fly only (not transition:fly)', () => {
		expect(dashboard).toContain('in:fly=');
		expect(dashboard).not.toMatch(/transition:fly/);
	});
});

describe('Toast animation (AC6)', () => {
	const layout = readComponent('../../../routes/+layout.svelte');

	it('uses in:fly with x: 64 on toasts', () => {
		expect(layout).toMatch(/in:fly=\{\{.*x:\s*64.*duration:\s*200/);
	});

	it('uses out:fly with x: 64 on toasts', () => {
		expect(layout).toMatch(/out:fly=\{\{.*x:\s*64.*duration:\s*150/);
	});

	it('does NOT have the old slide-in keyframe', () => {
		expect(layout).not.toContain('@keyframes slide-in');
		expect(layout).not.toContain('animate-slide-in');
	});
});

describe('Slide dropdowns (AC4)', () => {
	it('ProfileSwitcher uses transition:slide', () => {
		const switcher = readComponent('./ProfileSwitcher.svelte');
		expect(switcher).toMatch(/import\s*\{[^}]*slide[^}]*\}\s*from\s*'svelte\/transition'/);
		expect(switcher).toMatch(/transition:slide=\{\{.*duration:\s*200/);
	});

	it('PropositionCardMenu uses transition:slide', () => {
		const menu = readComponent('../dashboard/PropositionCardMenu.svelte');
		expect(menu).toMatch(/import\s*\{[^}]*slide[^}]*\}\s*from\s*'svelte\/transition'/);
		expect(menu).toMatch(/transition:slide=\{\{.*duration:\s*200/);
	});
});

describe('Hover states (AC5)', () => {
	it('StatsPanel KPI cards have transition-all hover:shadow-md', () => {
		const stats = readComponent('../dashboard/StatsPanel.svelte');
		expect(stats).toContain('transition-all');
		expect(stats).toContain('hover:shadow-md');
	});

	it('Step3Recap CTA button has hover:brightness-95', () => {
		const recap = readComponent('../wizard/Step3Recap.svelte');
		expect(recap).toContain('hover:brightness-95');
	});

	it('Dashboard new proposal button has hover:brightness-95', () => {
		const dashboard = readComponent('../../../routes/+page.svelte');
		expect(dashboard).toContain('hover:brightness-95');
	});

	it('ProfileCreator CTA button has hover:brightness-95', () => {
		const creator = readComponent('../onboarding/ProfileCreator.svelte');
		expect(creator).toContain('hover:brightness-95');
	});
});
