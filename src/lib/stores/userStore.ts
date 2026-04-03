import { writable } from 'svelte/store';
import type { Gestionnaire } from '$lib/types';

export const userStore = writable<Gestionnaire | null>(null);
