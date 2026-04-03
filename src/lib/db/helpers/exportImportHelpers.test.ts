import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '$lib/db/dexie';
import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
import { photoHelpers } from '$lib/db/helpers/photoHelpers';
import type { Photo } from '$lib/types';
import {
	exportImportHelpers,
	validateExportSchema,
	arrayBufferToBase64,
	base64ToArrayBuffer,
	type ExportData
} from '$lib/db/helpers/exportImportHelpers';
import { PropositionStatus } from '$lib/types';
import type { Proposition } from '$lib/types';

// ─── Test data ────────────────────────────────────────────────────────────────

function createTestProposition(
	overrides: Partial<Proposition> = {}
): Omit<Proposition, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		agencyId: 'agency-1',
		gestionnaireId: 'gest-1',
		status: PropositionStatus.Finalized,
		bien: {
			proprietairePrenom: 'Jean',
			proprietaireNom: 'Dupont',
			proprietaireEmail: 'jean@dupont.fr',
			rue: '12 rue de la Paix',
			codePostal: '75002',
			ville: 'Paris',
			adresse: '12 rue de la Paix, 75002 Paris',
			typeLogement: 'Appartement',
			surface: 65,
			nbPieces: 3,
			loyerHC: 1200,
			equipements: [],
			description: 'Bel appartement'
		},
		simulation: {
			charges: 150,
			tauxGestion: 7.8,
			tauxGLI: 3.0,
			tmi: 30,
			honorairesLocation: 0,
			honorairesEtatLieux: 0,
			bigNumbers: {
				loyerBrutAnnuel: 14400,
				honorairesTTC: 1123,
				primeGLI: 432,
				revenuNetTMI: 9000
			}
		},
		...overrides
	};
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
	await db.propositions.clear();
	await db.photos.clear();
});

// ─── arrayBufferToBase64 / base64ToArrayBuffer round-trip (AC2) ─────────────

describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
	it('round-trips correctly for simple data', () => {
		const original = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
		const base64 = arrayBufferToBase64(original);
		const result = base64ToArrayBuffer(base64);
		expect(new Uint8Array(result)).toEqual(new Uint8Array(original));
	});

	it('round-trips correctly for binary data', () => {
		const original = new Uint8Array([0, 1, 255, 128, 64, 32]).buffer;
		const base64 = arrayBufferToBase64(original);
		const result = base64ToArrayBuffer(base64);
		expect(new Uint8Array(result)).toEqual(new Uint8Array(original));
	});

	it('handles empty buffer', () => {
		const original = new ArrayBuffer(0);
		const base64 = arrayBufferToBase64(original);
		const result = base64ToArrayBuffer(base64);
		expect(result.byteLength).toBe(0);
	});
});

// ─── validateExportSchema ───────────────────────────────────────────────────

describe('validateExportSchema', () => {
	it('accepts valid export data', () => {
		const data = {
			version: '1',
			exportedAt: '2026-04-03T12:00:00.000Z',
			propositions: [{ id: '1', agencyId: 'a', gestionnaireId: 'g', status: 'draft', bien: {}, simulation: {}, createdAt: 1, updatedAt: 1 }]
		};
		expect(validateExportSchema(data)).toBe(true);
	});

	it('rejects missing exportedAt', () => {
		const data = { version: '1', propositions: [{ id: '1', agencyId: 'a', gestionnaireId: 'g', status: 'draft', bien: {}, simulation: {}, createdAt: 1, updatedAt: 1 }] };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects proposition missing gestionnaireId', () => {
		const data = { version: '1', exportedAt: '2026', propositions: [{ id: '1', agencyId: 'a', status: 'draft', bien: {}, simulation: {}, createdAt: 1, updatedAt: 1 }] };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects proposition missing simulation', () => {
		const data = { version: '1', exportedAt: '2026', propositions: [{ id: '1', agencyId: 'a', gestionnaireId: 'g', status: 'draft', bien: {}, createdAt: 1, updatedAt: 1 }] };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects null', () => {
		expect(validateExportSchema(null)).toBe(false);
	});

	it('rejects non-object', () => {
		expect(validateExportSchema('string')).toBe(false);
	});

	it('rejects missing version', () => {
		const data = { exportedAt: '2026', propositions: [{ id: '1', agencyId: 'a', status: 'draft', bien: {} }] };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects wrong version', () => {
		const data = { version: '2', propositions: [{ id: '1', agencyId: 'a', status: 'draft', bien: {} }] };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects missing propositions', () => {
		const data = { version: '1', exportedAt: '2026' };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects non-array propositions', () => {
		const data = { version: '1', propositions: 'not-array' };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('rejects proposition missing required fields', () => {
		const data = { version: '1', exportedAt: '2026', propositions: [{ id: '1' }] };
		expect(validateExportSchema(data)).toBe(false);
	});

	it('accepts empty propositions array', () => {
		const data = { version: '1', exportedAt: '2026', propositions: [] };
		expect(validateExportSchema(data)).toBe(true);
	});
});

// ─── buildExportData (AC1, AC2) ─────────────────────────────────────────────

describe('exportImportHelpers.buildExportData', () => {
	it('builds correct export structure with version and exportedAt', async () => {
		const prop = await propositionHelpers.create(createTestProposition());

		const data: ExportData = await exportImportHelpers.buildExportData('agency-1');

		expect(data.version).toBe('1');
		expect(data.exportedAt).toBeDefined();
		expect(data.propositions).toHaveLength(1);
		expect(data.propositions[0].id).toBe(prop.id);
		expect(data.propositions[0].photos).toEqual([]);
	});

	it('includes photos as base64 dataUrl', async () => {
		const prop = await propositionHelpers.create(createTestProposition());
		const testBlob = new Uint8Array([1, 2, 3, 4]).buffer;
		await photoHelpers.add({
			propositionId: prop.id,
			ordre: 1,
			blob: testBlob,
			mimeType: 'image/jpeg'
		});

		const data = await exportImportHelpers.buildExportData('agency-1');

		expect(data.propositions[0].photos).toHaveLength(1);
		expect(data.propositions[0].photos[0].dataUrl).toMatch(/^data:image\/jpeg;base64,/);
		expect(data.propositions[0].photos[0].propositionId).toBe(prop.id);
		expect(data.propositions[0].photos[0].ordre).toBe(1);
	});

	it('returns empty propositions array when DB is empty', async () => {
		const data = await exportImportHelpers.buildExportData('agency-1');
		expect(data.propositions).toHaveLength(0);
		expect(data.version).toBe('1');
	});

	it('filters by agencyId', async () => {
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-1' } as Partial<Proposition>));
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-2' } as Partial<Proposition>));

		const data = await exportImportHelpers.buildExportData('agency-1');
		expect(data.propositions).toHaveLength(1);
		expect(data.propositions[0].agencyId).toBe('agency-1');
	});
});

// ─── importFromFile (AC3, AC4, AC5, AC6) ────────────────────────────────────

describe('exportImportHelpers.importFromFile', () => {
	function createJsonFile(data: unknown): File {
		const json = JSON.stringify(data);
		return new File([json], 'test.json', { type: 'application/json' });
	}

	it('imports valid propositions into database', async () => {
		const exportData = {
			version: '1',
			exportedAt: '2026-04-03T12:00:00.000Z',
			propositions: [
				{
					id: 'test-id-1',
					agencyId: 'agency-1',
					gestionnaireId: 'gest-1',
					status: 'draft',
					createdAt: Date.now(),
					updatedAt: Date.now(),
					bien: {
						proprietairePrenom: 'Jean',
						proprietaireNom: 'Dupont',
						proprietaireEmail: 'jean@dupont.fr',
						rue: '12 rue',
						codePostal: '75002',
						ville: 'Paris',
						adresse: '12 rue, 75002 Paris',
						typeLogement: 'Appartement',
						surface: 65,
						nbPieces: 3,
						loyerHC: 1200,
						equipements: [],
						description: ''
					},
					simulation: {
						charges: 150,
						tauxGestion: 7.8,
						tauxGLI: 3.0,
						tmi: 30,
						honorairesLocation: 0,
						honorairesEtatLieux: 0,
						bigNumbers: { loyerBrutAnnuel: 14400, honorairesTTC: 1123, primeGLI: 432, revenuNetTMI: 9000 }
					},
					photos: []
				}
			]
		};

		const file = createJsonFile(exportData);
		const count = await exportImportHelpers.importFromFile(file);

		expect(count).toBe(1);
		const fetched = await propositionHelpers.getById('test-id-1');
		expect(fetched).toBeDefined();
		expect(fetched!.bien.proprietairePrenom).toBe('Jean');
	});

	it('imports photos and deserializes base64 to ArrayBuffer', async () => {
		const testBuffer = new Uint8Array([10, 20, 30]).buffer;
		const base64 = btoa(String.fromCharCode(...new Uint8Array(testBuffer)));
		const dataUrl = `data:image/png;base64,${base64}`;

		const exportData = {
			version: '1',
			exportedAt: '2026-04-03T12:00:00.000Z',
			propositions: [
				{
					id: 'prop-photo-test',
					agencyId: 'agency-1',
					gestionnaireId: 'gest-1',
					status: 'draft',
					createdAt: Date.now(),
					updatedAt: Date.now(),
					bien: {
						proprietairePrenom: 'Marie',
						proprietaireNom: 'Martin',
						proprietaireEmail: 'marie@martin.fr',
						rue: '5 avenue',
						codePostal: '75008',
						ville: 'Paris',
						adresse: '5 avenue, 75008 Paris',
						typeLogement: 'Appartement',
						surface: 80,
						nbPieces: 4,
						loyerHC: 1500,
						equipements: [],
						description: ''
					},
					simulation: {
						charges: 200,
						tauxGestion: 7.8,
						tauxGLI: 3.0,
						tmi: 30,
						honorairesLocation: 0,
						honorairesEtatLieux: 0,
						bigNumbers: { loyerBrutAnnuel: 18000, honorairesTTC: 1404, primeGLI: 540, revenuNetTMI: 11250 }
					},
					photos: [
						{
							id: 'photo-1',
							propositionId: 'prop-photo-test',
							ordre: 1,
							dataUrl
						}
					]
				}
			]
		};

		const file = createJsonFile(exportData);
		await exportImportHelpers.importFromFile(file);

		const photos = await photoHelpers.getByProposition('prop-photo-test');
		expect(photos).toHaveLength(1);
		expect(photos[0].mimeType).toBe('image/png');
		expect(new Uint8Array(photos[0].blob)).toEqual(new Uint8Array(testBuffer));
	});

	it('upserts existing proposition (AC4)', async () => {
		const original = await propositionHelpers.create(createTestProposition());

		const exportData = {
			version: '1',
			exportedAt: '2026-04-03T12:00:00.000Z',
			propositions: [
				{
					...original,
					bien: { ...original.bien, proprietairePrenom: 'Pierre' },
					photos: []
				}
			]
		};

		const file = createJsonFile(exportData);
		await exportImportHelpers.importFromFile(file);

		const fetched = await propositionHelpers.getById(original.id);
		expect(fetched!.bien.proprietairePrenom).toBe('Pierre');
	});

	it('deletes existing photos on upsert (P10)', async () => {
		// Create a proposition with a photo
		const prop = await propositionHelpers.create(createTestProposition());
		await photoHelpers.add({ propositionId: prop.id, ordre: 1, blob: new Uint8Array([1]).buffer, mimeType: 'image/jpeg' });

		// Verify photo exists
		let photos = await photoHelpers.getByProposition(prop.id);
		expect(photos).toHaveLength(1);
		const oldPhotoId = photos[0].id;

		// Import same proposition with a different photo
		const newBase64 = btoa(String.fromCharCode(99));
		const exportData = {
			version: '1',
			exportedAt: '2026-04-03T12:00:00.000Z',
			propositions: [{
				...prop,
				photos: [{ id: 'new-photo-id', propositionId: prop.id, ordre: 1, dataUrl: `data:image/png;base64,${newBase64}` }]
			}]
		};
		await exportImportHelpers.importFromFile(createJsonFile(exportData));

		// Old photo should be gone, new photo should exist
		photos = await photoHelpers.getByProposition(prop.id);
		expect(photos).toHaveLength(1);
		expect(photos[0].id).toBe('new-photo-id');
		expect(photos[0].id).not.toBe(oldPhotoId);
	});

	it('throws on invalid dataUrl in photo', async () => {
		const exportData = {
			version: '1',
			exportedAt: '2026-04-03T12:00:00.000Z',
			propositions: [{
				id: 'prop-bad-photo',
				agencyId: 'agency-1',
				gestionnaireId: 'gest-1',
				status: 'draft',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				bien: { proprietairePrenom: 'Test', proprietaireNom: 'Test', proprietaireEmail: 't@t.fr', rue: '1', codePostal: '75001', ville: 'Paris', adresse: '1, 75001 Paris', typeLogement: 'Appartement', surface: 50, nbPieces: 2, loyerHC: 800, equipements: [], description: '' },
				simulation: { charges: 100, tauxGestion: 7.8, tauxGLI: 3.0, tmi: 30, honorairesLocation: 0, honorairesEtatLieux: 0, bigNumbers: { loyerBrutAnnuel: 9600, honorairesTTC: 749, primeGLI: 288, revenuNetTMI: 6000 } },
				photos: [{ id: 'bad-photo', propositionId: 'prop-bad-photo', ordre: 1, dataUrl: 'corrupted-no-comma' }]
			}]
		};
		const file = createJsonFile(exportData);
		await expect(exportImportHelpers.importFromFile(file)).rejects.toThrow('Invalid dataUrl format');
	});

	it('returns 0 for empty propositions array (AC6)', async () => {
		const exportData = { version: '1', exportedAt: '2026', propositions: [] };
		const file = createJsonFile(exportData);
		const count = await exportImportHelpers.importFromFile(file);
		expect(count).toBe(0);
	});

	it('throws on invalid JSON (AC5)', async () => {
		const file = new File(['not valid json {{{'], 'bad.json', { type: 'application/json' });
		await expect(exportImportHelpers.importFromFile(file)).rejects.toThrow('Invalid JSON');
	});

	it('throws on invalid schema (AC5)', async () => {
		const file = createJsonFile({ version: '99', propositions: 'bad' });
		await expect(exportImportHelpers.importFromFile(file)).rejects.toThrow('Invalid export schema');
	});
});
