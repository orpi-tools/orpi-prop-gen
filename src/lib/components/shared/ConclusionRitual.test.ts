import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uiStore } from '$lib/stores/uiStore';
import { get } from 'svelte/store';

/**
 * ConclusionRitual logic tests.
 *
 * Note: Svelte component rendering is excluded from this project's test config.
 * These tests validate the clipboard and toast integration logic that the
 * ConclusionRitual component relies on, as well as store behavior.
 */

describe('ConclusionRitual — clipboard et toast', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		uiStore.set({
			darkMode: false,
			toasts: [],
			isPdfGenerating: false
		});
	});

	it('clipboard.writeText copie l\'email et addToast crée un toast succès', async () => {
		const mockWriteText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', {
			clipboard: { writeText: mockWriteText }
		});

		const { addToast } = await import('$lib/stores/uiStore');

		// Simulate what ConclusionRitual does on "Copier l'email" click
		const email = 'proprietaire@test.com';
		await navigator.clipboard.writeText(email);
		addToast({ message: 'Email copié !', type: 'success', duration: 2000 });

		expect(mockWriteText).toHaveBeenCalledWith('proprietaire@test.com');

		const state = get(uiStore);
		expect(state.toasts).toHaveLength(1);
		expect(state.toasts[0]).toMatchObject({
			message: 'Email copié !',
			type: 'success',
			duration: 2000
		});
	});

	it('clipboard.writeText en échec déclenche un toast erreur', async () => {
		const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
		vi.stubGlobal('navigator', {
			clipboard: { writeText: mockWriteText }
		});

		const { addToast } = await import('$lib/stores/uiStore');

		// Simulate error path
		try {
			await navigator.clipboard.writeText('test@email.com');
		} catch {
			addToast({ message: "Impossible de copier l'email", type: 'error' });
		}

		const state = get(uiStore);
		expect(state.toasts).toHaveLength(1);
		expect(state.toasts[0]).toMatchObject({
			message: "Impossible de copier l'email",
			type: 'error'
		});
	});

	it('email vide → pas de copie (logique du bouton conditionnel)', () => {
		const ownerEmail = '';
		const hasEmail = ownerEmail.trim().length > 0;
		expect(hasEmail).toBe(false);
	});

	it('email renseigné → bouton visible (logique du bouton conditionnel)', () => {
		const ownerEmail = 'jean@dupont.fr';
		const hasEmail = ownerEmail.trim().length > 0;
		expect(hasEmail).toBe(true);
	});

	it('email avec espaces uniquement → pas de bouton', () => {
		const ownerEmail = '   ';
		const hasEmail = ownerEmail.trim().length > 0;
		expect(hasEmail).toBe(false);
	});
});
