import Dexie, { type EntityTable } from 'dexie';
import type { Agency, Gestionnaire, Proposition, Photo } from '$lib/types';

class OrpiDB extends Dexie {
	agencies!: EntityTable<Agency, 'id'>;
	gestionnaires!: EntityTable<Gestionnaire, 'id'>;
	propositions!: EntityTable<Proposition, 'id'>;
	photos!: EntityTable<Photo, 'id'>;

	constructor() {
		super('OrpiDatabase');

		this.version(1).stores({
			// 'id' = clé primaire string (UUID). On indexe les FK pour les queries.
			agencies: 'id, name',
			gestionnaires: 'id, agencyId',
			propositions: 'id, agencyId, gestionnaireId, status, createdAt',
			photos: 'id, propositionId, ordre'
		});
	}
}

export const db = new OrpiDB();
