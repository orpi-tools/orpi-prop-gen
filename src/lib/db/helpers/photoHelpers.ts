import { db } from '$lib/db/dexie';
import type { Photo } from '$lib/types';

export const photoHelpers = {
	async add(data: Omit<Photo, 'id'>): Promise<Photo> {
		const photo: Photo = { ...data, id: crypto.randomUUID() };
		await db.photos.add(photo);
		return photo;
	},

	async getByProposition(propositionId: string): Promise<Photo[]> {
		return db.photos.where('propositionId').equals(propositionId).sortBy('ordre');
	},

	async updateOrdre(id: string, ordre: number): Promise<void> {
		await db.photos.update(id, { ordre });
	},

	async delete(id: string): Promise<void> {
		await db.photos.delete(id);
	},

	async deleteByProposition(propositionId: string): Promise<void> {
		await db.photos.where('propositionId').equals(propositionId).delete();
	}
};
