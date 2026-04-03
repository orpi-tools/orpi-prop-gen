import { db } from '$lib/db/dexie';
import { photoHelpers } from '$lib/db/helpers/photoHelpers';
import type { Proposition, Photo } from '$lib/types';

// ─── Export/Import Types ─────────────────────────────────────────────────────

export interface ExportedPhoto {
	id: string;
	propositionId: string;
	ordre: number;
	dataUrl: string;
}

export interface ExportedProposition extends Proposition {
	photos: ExportedPhoto[];
}

export interface ExportData {
	version: '1';
	exportedAt: string;
	propositions: ExportedProposition[];
}

// ─── Serialization helpers ───────────────────────────────────────────────────

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	const CHUNK_SIZE = 8192;
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
		const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.byteLength));
		binary += String.fromCharCode(...chunk);
	}
	return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

function photoToDataUrl(photo: Photo): string {
	return `data:${photo.mimeType};base64,${arrayBufferToBase64(photo.blob)}`;
}

function dataUrlToPhotoData(dataUrl: string): { blob: ArrayBuffer; mimeType: string } {
	if (!dataUrl || !dataUrl.includes(',')) {
		throw new Error('Invalid dataUrl format');
	}
	const [header, data] = dataUrl.split(',');
	const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
	return { blob: base64ToArrayBuffer(data), mimeType };
}

// ─── Schema validation ───────────────────────────────────────────────────────

export function validateExportSchema(data: unknown): data is ExportData {
	if (!data || typeof data !== 'object') return false;
	const d = data as Record<string, unknown>;
	if (d.version !== '1') return false;
	if (typeof d.exportedAt !== 'string') return false;
	if (!Array.isArray(d.propositions)) return false;
	return d.propositions.every(
		(p) =>
			p &&
			typeof p === 'object' &&
			'id' in p &&
			'agencyId' in p &&
			'gestionnaireId' in p &&
			'status' in p &&
			'bien' in p &&
			'simulation' in p &&
			'createdAt' in p &&
			'updatedAt' in p
	);
}

// ─── Download helper ─────────────────────────────────────────────────────────

function downloadJson(data: object, filename: string): void {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getExportFilename(): string {
	const date = new Date().toISOString().slice(0, 10);
	return `orpi-propositions-${date}.json`;
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export const exportImportHelpers = {
	/**
	 * Build export data object (testable without DOM).
	 */
	async buildExportData(agencyId: string): Promise<ExportData> {
		const propositions = await db.propositions.where('agencyId').equals(agencyId).toArray();

		const exportedPropositions: ExportedProposition[] = await Promise.all(
			propositions.map(async (prop) => {
				const photos = await photoHelpers.getByProposition(prop.id);
				const exportedPhotos: ExportedPhoto[] = photos.map((photo) => ({
					id: photo.id,
					propositionId: photo.propositionId,
					ordre: photo.ordre,
					dataUrl: photoToDataUrl(photo)
				}));
				return { ...prop, photos: exportedPhotos };
			})
		);

		return {
			version: '1',
			exportedAt: new Date().toISOString(),
			propositions: exportedPropositions
		};
	},

	/**
	 * Export all propositions with their photos as a JSON file download.
	 * Returns the number of propositions exported.
	 */
	async exportAll(agencyId: string): Promise<number> {
		const exportData = await this.buildExportData(agencyId);
		downloadJson(exportData, getExportFilename());
		return exportData.propositions.length;
	},

	/**
	 * Import propositions from a JSON file.
	 * Returns the number of propositions imported.
	 * Throws on invalid JSON or schema.
	 */
	async importFromFile(file: File): Promise<number> {
		const text = await file.text();

		let data: unknown;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error('Invalid JSON');
		}

		if (!validateExportSchema(data)) {
			throw new Error('Invalid export schema');
		}

		if (data.propositions.length === 0) {
			return 0;
		}

		await db.transaction('rw', db.propositions, db.photos, async () => {
			const propositionsToInsert: Proposition[] = [];
			const photosToInsert: Photo[] = [];

			for (const exported of data.propositions) {
				// Separate photos from proposition data
				const { photos: exportedPhotos, ...propositionData } = exported;
				propositionsToInsert.push(propositionData);

				if (exportedPhotos && Array.isArray(exportedPhotos)) {
					for (const exportedPhoto of exportedPhotos) {
						const { blob, mimeType } = dataUrlToPhotoData(exportedPhoto.dataUrl);
						photosToInsert.push({
							id: exportedPhoto.id,
							propositionId: exportedPhoto.propositionId,
							ordre: exportedPhoto.ordre,
							blob,
							mimeType
						});
					}
				}
			}

			// Delete existing photos for propositions being upserted
			for (const prop of propositionsToInsert) {
				await db.photos.where('propositionId').equals(prop.id).delete();
			}

			await db.propositions.bulkPut(propositionsToInsert);
			if (photosToInsert.length > 0) {
				await db.photos.bulkPut(photosToInsert);
			}
		});

		return data.propositions.length;
	}
};
