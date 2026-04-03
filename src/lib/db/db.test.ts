import { describe, it, expect, beforeEach } from 'vitest';
import { agencyHelpers } from '$lib/db/helpers/agencyHelpers';
import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
import { photoHelpers } from '$lib/db/helpers/photoHelpers';
import { PropositionStatus } from '$lib/types';
import { db } from '$lib/db/dexie';

beforeEach(async () => {
	await db.agencies.clear();
	await db.gestionnaires.clear();
	await db.propositions.clear();
	await db.photos.clear();
});

const makeBien = () => ({
	proprietairePrenom: 'Jean',
	proprietaireNom: 'Dupont',
	proprietaireEmail: '',
	rue: '1 rue Test',
	codePostal: '75001',
	ville: 'Paris',
	adresse: '1 rue Test, 75001 Paris',
	typeLogement: 'appartement',
	surface: 50,
	nbPieces: 2,
	loyerHC: 800,
	equipements: [],
	description: ''
});

const makeSimulation = (): import('$lib/types').SimulationData => ({
	charges: 100,
	tauxGestion: 7.8,
	tauxGLI: 3.0,
	tmi: 30,
	honorairesLocation: 0,
	honorairesEtatLieux: 0,
	bigNumbers: {
		loyerBrutAnnuel: 0,
		honorairesTTC: 0,
		primeGLI: 0,
		revenuNetTMI: 0
	}
});

describe('agencyHelpers', () => {
	it('crée une agence avec un ID UUID', async () => {
		const agency = await agencyHelpers.create({
			name: 'Orpi Test',
			address: '1 rue Test',
			phone: '0600000000',
			email: 'test@orpi.fr',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		expect(agency.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
		expect(agency.name).toBe('Orpi Test');
	});

	it('récupère une agence par ID', async () => {
		const created = await agencyHelpers.create({
			name: 'Test',
			address: '',
			phone: '',
			email: '',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		const found = await agencyHelpers.getById(created.id);
		expect(found?.id).toBe(created.id);
	});

	it('retourne undefined pour un ID inexistant', async () => {
		const found = await agencyHelpers.getById('non-existent');
		expect(found).toBeUndefined();
	});

	it('liste toutes les agences', async () => {
		await agencyHelpers.create({
			name: 'A1',
			address: '',
			phone: '',
			email: '',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		await agencyHelpers.create({
			name: 'A2',
			address: '',
			phone: '',
			email: '',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		const all = await agencyHelpers.getAll();
		expect(all).toHaveLength(2);
	});

	it('met à jour une agence', async () => {
		const agency = await agencyHelpers.create({
			name: 'Avant',
			address: '',
			phone: '',
			email: '',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		await agencyHelpers.update(agency.id, { name: 'Après' });
		const updated = await agencyHelpers.getById(agency.id);
		expect(updated?.name).toBe('Après');
	});

	it('supprime une agence', async () => {
		const agency = await agencyHelpers.create({
			name: 'To Delete',
			address: '',
			phone: '',
			email: '',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});
		await agencyHelpers.delete(agency.id);
		const found = await agencyHelpers.getById(agency.id);
		expect(found).toBeUndefined();
	});
});

describe('gestionnaireHelpers', () => {
	it('crée un gestionnaire avec un ID UUID', async () => {
		const g = await gestionnaireHelpers.create({
			agencyId: 'agency-1',
			firstName: 'Jean',
			lastName: 'Dupont',
			email: 'jean@orpi.fr',
			phone: '0600000000',
			initiales: 'JD'
		});
		expect(g.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		expect(g.firstName).toBe('Jean');
	});

	it('récupère les gestionnaires par agence', async () => {
		await gestionnaireHelpers.create({
			agencyId: 'agency-1',
			firstName: 'A',
			lastName: 'B',
			email: '',
			phone: '',
			initiales: 'AB'
		});
		await gestionnaireHelpers.create({
			agencyId: 'agency-1',
			firstName: 'C',
			lastName: 'D',
			email: '',
			phone: '',
			initiales: 'CD'
		});
		await gestionnaireHelpers.create({
			agencyId: 'agency-2',
			firstName: 'E',
			lastName: 'F',
			email: '',
			phone: '',
			initiales: 'EF'
		});
		const gestionnaires = await gestionnaireHelpers.getByAgency('agency-1');
		expect(gestionnaires).toHaveLength(2);
	});
});

describe('propositionHelpers', () => {
	it('crée une proposition avec createdAt et updatedAt en number', async () => {
		const before = Date.now();
		const prop = await propositionHelpers.create({
			agencyId: 'agency-1',
			gestionnaireId: 'gest-1',
			status: PropositionStatus.Draft,
			bien: makeBien(),
			simulation: makeSimulation()
		});
		expect(typeof prop.createdAt).toBe('number');
		expect(prop.createdAt).toBeGreaterThanOrEqual(before);
		expect(prop.updatedAt).toBe(prop.createdAt);
	});

	it('pagine les propositions (limit)', async () => {
		for (let i = 0; i < 5; i++) {
			await propositionHelpers.create({
				agencyId: 'a',
				gestionnaireId: 'g',
				status: PropositionStatus.Draft,
				bien: makeBien(),
				simulation: makeSimulation()
			});
		}
		const page = await propositionHelpers.getAll({ offset: 0, limit: 3 });
		expect(page).toHaveLength(3);
	});

	it('pagine avec offset', async () => {
		for (let i = 0; i < 5; i++) {
			await propositionHelpers.create({
				agencyId: 'a',
				gestionnaireId: 'g',
				status: PropositionStatus.Draft,
				bien: makeBien(),
				simulation: makeSimulation()
			});
		}
		const page = await propositionHelpers.getAll({ offset: 3, limit: 10 });
		expect(page).toHaveLength(2);
	});

	it('save() met à jour updatedAt', async () => {
		const prop = await propositionHelpers.create({
			agencyId: 'a',
			gestionnaireId: 'g',
			status: PropositionStatus.Draft,
			bien: makeBien(),
			simulation: makeSimulation()
		});
		const originalUpdatedAt = prop.updatedAt;
		await new Promise((r) => setTimeout(r, 5));
		await propositionHelpers.save(prop);
		const updated = await propositionHelpers.getById(prop.id);
		expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);
	});

	it('delete() supprime aussi les photos associées', async () => {
		const prop = await propositionHelpers.create({
			agencyId: 'a',
			gestionnaireId: 'g',
			status: PropositionStatus.Draft,
			bien: makeBien(),
			simulation: makeSimulation()
		});
		await photoHelpers.add({
			propositionId: prop.id,
			ordre: 0,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await propositionHelpers.delete(prop.id);
		const photos = await photoHelpers.getByProposition(prop.id);
		expect(photos).toHaveLength(0);
	});

	it('count() retourne le nombre total de propositions', async () => {
		expect(await propositionHelpers.count()).toBe(0);
		await propositionHelpers.create({
			agencyId: 'a',
			gestionnaireId: 'g',
			status: PropositionStatus.Draft,
			bien: makeBien(),
			simulation: makeSimulation()
		});
		await propositionHelpers.create({
			agencyId: 'a',
			gestionnaireId: 'g',
			status: PropositionStatus.Draft,
			bien: makeBien(),
			simulation: makeSimulation()
		});
		expect(await propositionHelpers.count()).toBe(2);
	});
});

describe('photoHelpers', () => {
	it('ajoute une photo avec un ID UUID', async () => {
		const photo = await photoHelpers.add({
			propositionId: 'prop-1',
			ordre: 0,
			blob: new ArrayBuffer(16),
			mimeType: 'image/png'
		});
		expect(photo.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});

	it('récupère les photos triées par ordre', async () => {
		await photoHelpers.add({
			propositionId: 'p1',
			ordre: 2,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await photoHelpers.add({
			propositionId: 'p1',
			ordre: 0,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await photoHelpers.add({
			propositionId: 'p1',
			ordre: 1,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		const photos = await photoHelpers.getByProposition('p1');
		expect(photos.map((p) => p.ordre)).toEqual([0, 1, 2]);
	});

	it("met à jour l'ordre d'une photo", async () => {
		const photo = await photoHelpers.add({
			propositionId: 'p1',
			ordre: 0,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await photoHelpers.updateOrdre(photo.id, 5);
		const photos = await photoHelpers.getByProposition('p1');
		expect(photos[0].ordre).toBe(5);
	});

	it("supprime toutes les photos d'une proposition", async () => {
		await photoHelpers.add({
			propositionId: 'p1',
			ordre: 0,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await photoHelpers.add({
			propositionId: 'p1',
			ordre: 1,
			blob: new ArrayBuffer(8),
			mimeType: 'image/jpeg'
		});
		await photoHelpers.deleteByProposition('p1');
		const photos = await photoHelpers.getByProposition('p1');
		expect(photos).toHaveLength(0);
	});
});
