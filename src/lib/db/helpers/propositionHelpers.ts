import { db } from '$lib/db/dexie';
import type { Proposition } from '$lib/types';

export const propositionHelpers = {
	async create(data: Omit<Proposition, 'id' | 'createdAt' | 'updatedAt'>): Promise<Proposition> {
		const now = Date.now();
		const proposition: Proposition = {
			...data,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now
		};
		await db.propositions.add(proposition);
		return proposition;
	},

	async getById(id: string): Promise<Proposition | undefined> {
		return db.propositions.get(id);
	},

	async getAll(options?: { offset?: number; limit?: number }): Promise<Proposition[]> {
		const { offset = 0, limit = 20 } = options ?? {};
		if (offset < 0 || limit < 0) {
			throw new Error('offset and limit must be >= 0');
		}
		return db.propositions.orderBy('createdAt').reverse().offset(offset).limit(limit).toArray();
	},

	async getByGestionnaire(gestionnaireId: string): Promise<Proposition[]> {
		return db.propositions.where('gestionnaireId').equals(gestionnaireId).toArray();
	},

	async save(proposition: Proposition): Promise<void> {
		const updatedProposition = { ...proposition, updatedAt: Date.now() };
		await db.propositions.put(updatedProposition);
	},

	async delete(id: string): Promise<void> {
		try {
			await db.transaction('rw', db.propositions, db.photos, async () => {
				await db.propositions.delete(id);
				await db.photos.where('propositionId').equals(id).delete();
			});
		} catch (error) {
			console.error(`[propositionHelpers.delete] Failed to delete proposition ${id}:`, error);
			throw error;
		}
	},

	async count(): Promise<number> {
		return db.propositions.count();
	},

	async duplicate(id: string): Promise<Proposition> {
		const original = await db.propositions.get(id);
		if (!original) throw new Error(`Proposition ${id} not found`);

		const now = Date.now();
		const ownerName = original.bien?.proprietairePrenom || 'Propriétaire';
		const copy: Proposition = {
			...original,
			id: crypto.randomUUID(),
			status: 'draft' as Proposition['status'],
			createdAt: now,
			updatedAt: now,
			bien: {
				...original.bien,
				proprietairePrenom: `${ownerName} (copie)`
			}
		};
		await db.propositions.add(copy);
		return copy;
	}
};
