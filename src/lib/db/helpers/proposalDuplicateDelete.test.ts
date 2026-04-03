import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/dexie';
import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
import { photoHelpers } from '$lib/db/helpers/photoHelpers';
import { PropositionStatus } from '$lib/types';
import type { Proposition } from '$lib/types';

// ─── Test data ────────────────────────────────────────────────────────────────
function createTestProposition(overrides: Partial<Proposition> = {}): Omit<Proposition, 'id' | 'createdAt' | 'updatedAt'> {
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

// ─── AC8: Duplicate ──────────────────────────────────────────────────────────
describe('propositionHelpers.duplicate', () => {
	it('creates a copy with new UUID', async () => {
		const original = await propositionHelpers.create(createTestProposition());
		const copy = await propositionHelpers.duplicate(original.id);

		expect(copy.id).not.toBe(original.id);
		expect(copy.id).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('sets status to draft', async () => {
		const original = await propositionHelpers.create(
			createTestProposition({ status: PropositionStatus.Finalized })
		);
		const copy = await propositionHelpers.duplicate(original.id);

		expect(copy.status).toBe(PropositionStatus.Draft);
	});

	it('resets createdAt and updatedAt timestamps', async () => {
		const original = await propositionHelpers.create(createTestProposition());
		// Wait a tiny bit so timestamps differ
		await new Promise((resolve) => setTimeout(resolve, 10));
		const copy = await propositionHelpers.duplicate(original.id);

		expect(copy.createdAt).toBeGreaterThanOrEqual(original.createdAt);
		expect(copy.updatedAt).toBeGreaterThanOrEqual(original.updatedAt);
	});

	it('appends " (copie)" to proprietairePrenom', async () => {
		const original = await propositionHelpers.create(createTestProposition());
		const copy = await propositionHelpers.duplicate(original.id);

		expect(copy.bien.proprietairePrenom).toBe('Jean (copie)');
	});

	it('preserves other bien data', async () => {
		const original = await propositionHelpers.create(createTestProposition());
		const copy = await propositionHelpers.duplicate(original.id);

		expect(copy.bien.adresse).toBe(original.bien.adresse);
		expect(copy.bien.proprietaireEmail).toBe(original.bien.proprietaireEmail);
		expect(copy.bien.loyerHC).toBe(original.bien.loyerHC);
		expect(copy.agencyId).toBe(original.agencyId);
		expect(copy.gestionnaireId).toBe(original.gestionnaireId);
	});

	it('persists the copy in the database', async () => {
		const original = await propositionHelpers.create(createTestProposition());
		const copy = await propositionHelpers.duplicate(original.id);

		const fetched = await propositionHelpers.getById(copy.id);
		expect(fetched).toBeDefined();
		expect(fetched!.id).toBe(copy.id);
	});

	it('throws if original not found', async () => {
		await expect(propositionHelpers.duplicate('non-existent-id')).rejects.toThrow();
	});
});

// ─── AC9: Delete ─────────────────────────────────────────────────────────────
describe('propositionHelpers.delete', () => {
	it('removes the proposition from database', async () => {
		const prop = await propositionHelpers.create(createTestProposition());
		await propositionHelpers.delete(prop.id);

		const fetched = await propositionHelpers.getById(prop.id);
		expect(fetched).toBeUndefined();
	});

	it('removes associated photos', async () => {
		const prop = await propositionHelpers.create(createTestProposition());
		await photoHelpers.add({
			propositionId: prop.id,
			ordre: 1,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await photoHelpers.add({
			propositionId: prop.id,
			ordre: 2,
			blob: new ArrayBuffer(8),
			mimeType: 'image/png'
		});

		const photosBefore = await photoHelpers.getByProposition(prop.id);
		expect(photosBefore).toHaveLength(2);

		await propositionHelpers.delete(prop.id);

		const photosAfter = await photoHelpers.getByProposition(prop.id);
		expect(photosAfter).toHaveLength(0);
	});

	it('does not affect other propositions', async () => {
		const prop1 = await propositionHelpers.create(createTestProposition());
		const prop2 = await propositionHelpers.create(createTestProposition());

		await propositionHelpers.delete(prop1.id);

		const fetched = await propositionHelpers.getById(prop2.id);
		expect(fetched).toBeDefined();
	});

	it('returns empty after deletion', async () => {
		const prop = await propositionHelpers.create(createTestProposition());
		await propositionHelpers.delete(prop.id);

		const all = await propositionHelpers.getAll();
		const found = all.find((p) => p.id === prop.id);
		expect(found).toBeUndefined();
	});
});
