import { db } from '$lib/db/dexie';
import type { Gestionnaire } from '$lib/types';

export const gestionnaireHelpers = {
	async create(data: Omit<Gestionnaire, 'id'>): Promise<Gestionnaire> {
		const gestionnaire: Gestionnaire = { ...data, id: crypto.randomUUID() };
		await db.gestionnaires.add(gestionnaire);
		return gestionnaire;
	},

	async getById(id: string): Promise<Gestionnaire | undefined> {
		return db.gestionnaires.get(id);
	},

	async getByAgency(agencyId: string): Promise<Gestionnaire[]> {
		return db.gestionnaires.where('agencyId').equals(agencyId).toArray();
	},

	async update(id: string, changes: Partial<Omit<Gestionnaire, 'id'>>): Promise<void> {
		await db.gestionnaires.update(id, changes);
	},

	async delete(id: string): Promise<void> {
		await db.transaction('rw', db.gestionnaires, db.propositions, db.photos, async () => {
			// Get all propositions for this gestionnaire
			const propositions = await db.propositions.where('gestionnaireId').equals(id).toArray();
			// Delete photos for all propositions by this gestionnaire
			for (const prop of propositions) {
				await db.photos.where('propositionId').equals(prop.id).delete();
			}
			// Delete propositions by this gestionnaire
			await db.propositions.where('gestionnaireId').equals(id).delete();
			// Delete the gestionnaire itself
			await db.gestionnaires.delete(id);
		});
	}
};
