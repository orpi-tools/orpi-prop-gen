import { writable } from 'svelte/store';
import type { Agency } from '$lib/types';

const STORAGE_KEY = 'orpi.activeAgencyId';

export const agencyStore = writable<Agency | null>(null);

export function getPersistedAgencyId(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(STORAGE_KEY);
}

export function persistAgencyId(id: string | null): void {
	if (typeof localStorage === 'undefined') return;
	if (id) localStorage.setItem(STORAGE_KEY, id);
	else localStorage.removeItem(STORAGE_KEY);
}

agencyStore.subscribe((agency) => {
	persistAgencyId(agency?.id ?? null);
});
