import { writable } from 'svelte/store';
import type { Gestionnaire } from '$lib/types';

const STORAGE_KEY = 'orpi.activeGestionnaireId';

export const userStore = writable<Gestionnaire | null>(null);

export function getPersistedGestionnaireId(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(STORAGE_KEY);
}

export function persistGestionnaireId(id: string | null): void {
	if (typeof localStorage === 'undefined') return;
	if (id) localStorage.setItem(STORAGE_KEY, id);
	else localStorage.removeItem(STORAGE_KEY);
}

userStore.subscribe((user) => {
	persistGestionnaireId(user?.id ?? null);
});
