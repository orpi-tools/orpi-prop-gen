import { writable } from 'svelte/store';
import type { Agency } from '$lib/types';

export const agencyStore = writable<Agency | null>(null);
