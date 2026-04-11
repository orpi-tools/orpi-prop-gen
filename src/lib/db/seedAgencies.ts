import { db } from '$lib/db/dexie';
import type { Agency } from '$lib/types';
import seedData from '$lib/assets/agencies.json';

/**
 * Synchronise les agences hardcodées avec la DB.
 * - Crée UNIQUEMENT les agences manquantes (par id).
 * - Ne touche JAMAIS aux agences existantes (ni leurs modifs, ni leurs gestionnaires/propositions).
 * - Ne supprime JAMAIS d'agences, même si elles ne sont plus dans le JSON :
 *   cela préserve les données utilisateurs créées avec d'anciennes versions.
 */
export async function seedAgencies(): Promise<void> {
	const seed = seedData as Agency[];
	const existing = await db.agencies.toArray();
	const existingIds = new Set(existing.map((a) => a.id));

	const toAdd = seed.filter((a) => !existingIds.has(a.id));
	if (toAdd.length > 0) {
		await db.agencies.bulkAdd(toAdd);
	}
}
