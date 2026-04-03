import { db } from '$lib/db/dexie';
import type { Agency } from '$lib/types';

export const agencyHelpers = {
	async create(data: Omit<Agency, 'id'>): Promise<Agency> {
		const agency: Agency = { ...data, id: crypto.randomUUID() };
		await db.agencies.add(agency);
		return agency;
	},

	async getById(id: string): Promise<Agency | undefined> {
		return db.agencies.get(id);
	},

	async getAll(): Promise<Agency[]> {
		return db.agencies.toArray();
	},

	async update(id: string, changes: Partial<Omit<Agency, 'id'>>): Promise<void> {
		await db.agencies.update(id, changes);
	},

	async delete(id: string): Promise<void> {
		await db.transaction(
			'rw',
			db.agencies,
			db.gestionnaires,
			db.propositions,
			db.photos,
			async () => {
				// Get all propositions for this agency
				const propositions = await db.propositions.where('agencyId').equals(id).toArray();
				// Delete photos for all propositions in this agency
				for (const prop of propositions) {
					await db.photos.where('propositionId').equals(prop.id).delete();
				}
				// Delete propositions for this agency
				await db.propositions.where('agencyId').equals(id).delete();
				// Delete gestionnaires for this agency
				await db.gestionnaires.where('agencyId').equals(id).delete();
				// Delete the agency itself
				await db.agencies.delete(id);
			}
		);
	}
};
