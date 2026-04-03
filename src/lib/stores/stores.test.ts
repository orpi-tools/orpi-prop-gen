import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { agencyStore } from './agencyStore';
import { userStore } from './userStore';
import { proposalStore } from './proposalStore';
import { uiStore, addToast, removeToast } from './uiStore';
import { PropositionStatus } from '$lib/types';

// Reset stores between tests
beforeEach(() => {
	agencyStore.set(null);
	userStore.set(null);
	proposalStore.update((s) => ({
		...s,
		bien: {
			proprietairePrenom: '',
			proprietaireNom: '',
			proprietaireEmail: '',
			rue: '',
			codePostal: '',
			ville: '',
			adresse: '',
			typeLogement: '',
			surface: 0,
			nbPieces: 0,
			loyerHC: 0,
			equipements: [],
			description: ''
		}
	}));
	uiStore.set({ darkMode: false, toasts: [], isPdfGenerating: false });
});

describe('agencyStore', () => {
	it('initializes to null', () => {
		expect(get(agencyStore)).toBe(null);
	});

	it('can be set to an Agency', () => {
		const agency = {
			id: 'agency-1',
			name: 'Orpi Test',
			address: '1 rue Test',
			phone: '0600000000',
			email: 'test@orpi.fr',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		};
		agencyStore.set(agency);
		expect(get(agencyStore)).toEqual(agency);
	});

	it('can be reset to null', () => {
		agencyStore.set({
			id: 'a',
			name: 'A',
			address: '',
			phone: '',
			email: '',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		agencyStore.set(null);
		expect(get(agencyStore)).toBe(null);
	});
});

describe('userStore', () => {
	it('initializes to null', () => {
		expect(get(userStore)).toBe(null);
	});

	it('can be set to a Gestionnaire', () => {
		const gestionnaire = {
			id: 'gest-1',
			agencyId: 'agency-1',
			firstName: 'Jean',
			lastName: 'Dupont',
			email: 'jean.dupont@orpi.fr',
			phone: '0600000001',
			initiales: 'JD'
		};
		userStore.set(gestionnaire);
		expect(get(userStore)).toEqual(gestionnaire);
		expect(get(userStore)?.initiales).toBe('JD');
	});
});

describe('proposalStore', () => {
	it('initializes with Draft status', () => {
		expect(get(proposalStore).status).toBe(PropositionStatus.Draft);
	});

	it('initializes with default simulation values', () => {
		const state = get(proposalStore);
		expect(state.simulation.tauxGestion).toBe(7.8);
		expect(state.simulation.tauxGLI).toBe(3.0);
		expect(state.simulation.tmi).toBe(30);
	});

	it('allows immutable update of bien.adresse', () => {
		proposalStore.update((s) => ({ ...s, bien: { ...s.bien, adresse: '123 rue Test' } }));
		expect(get(proposalStore).bien.adresse).toBe('123 rue Test');
	});

	it('allows immutable update of simulation field', () => {
		proposalStore.update((s) => ({
			...s,
			simulation: { ...s.simulation, tauxGestion: 8.5 }
		}));
		expect(get(proposalStore).simulation.tauxGestion).toBe(8.5);
	});
});

describe('uiStore', () => {
	it('initializes with empty toasts', () => {
		expect(get(uiStore).toasts).toEqual([]);
	});

	it('initializes with darkMode false', () => {
		expect(get(uiStore).darkMode).toBe(false);
	});

	it('addToast adds a toast with correct message and type', () => {
		addToast({ message: 'Bonjour', type: 'success', duration: 60000 });
		const state = get(uiStore);
		expect(state.toasts).toHaveLength(1);
		expect(state.toasts[0].message).toBe('Bonjour');
		expect(state.toasts[0].type).toBe('success');
		expect(typeof state.toasts[0].id).toBe('string');
	});

	it('addToast auto-dismisses after duration', async () => {
		addToast({ message: 'Auto-dismiss', type: 'info', duration: 50 });
		expect(get(uiStore).toasts).toHaveLength(1);
		await new Promise((r) => setTimeout(r, 100));
		expect(get(uiStore).toasts).toHaveLength(0);
	});

	it('addToast defaults to info type', () => {
		addToast({ message: 'Default type' });
		expect(get(uiStore).toasts[0].type).toBe('info');
	});

	it('removeToast removes toast by id', () => {
		addToast({ message: 'To remove', type: 'warning', duration: 60000 });
		const id = get(uiStore).toasts[0].id;
		removeToast(id);
		expect(get(uiStore).toasts).toHaveLength(0);
	});

	// toggleDarkMode DOM integration tests are in darkMode.test.ts (jsdom environment)

	it('multiple toasts stack correctly', () => {
		addToast({ message: 'T1', type: 'success', duration: 60000 });
		addToast({ message: 'T2', type: 'error', duration: 60000 });
		addToast({ message: 'T3', type: 'info', duration: 60000 });
		expect(get(uiStore).toasts).toHaveLength(3);
	});
});
