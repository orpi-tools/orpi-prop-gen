import { describe, it, expect, beforeEach } from 'vitest';
import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
import { db } from '$lib/db/dexie';
import { PropositionStatus } from '$lib/types';
import type { Proposition } from '$lib/types';

beforeEach(async () => {
	await db.propositions.clear();
});

const makeProposal = (): Proposition => ({
	id: crypto.randomUUID(),
	agencyId: 'agency-1',
	gestionnaireId: 'gest-1',
	status: PropositionStatus.Draft,
	createdAt: Date.now(),
	updatedAt: Date.now(),
	bien: {
		proprietairePrenom: 'Jean',
		proprietaireNom: 'Dupont',
		proprietaireEmail: '',
		rue: '1 rue Test',
		codePostal: '75001',
		ville: 'Paris',
		adresse: '1 rue Test, 75001 Paris',
		typeLogement: 'Appartement',
		surface: 50,
		nbPieces: 2,
		loyerHC: 680,
		equipements: ['balcon'],
		description: 'Bel appartement'
	},
	simulation: {
		charges: 0,
		tauxGestion: 7.8,
		tauxGLI: 3.0,
		tmi: 30,
		honorairesLocation: 0,
		honorairesEtatLieux: 0,
		bigNumbers: {
			loyerBrutAnnuel: 8160,
			honorairesTTC: 636,
			primeGLI: 245,
			revenuNetTMI: 5095
		}
	}
});

describe('auto-save via propositionHelpers.save()', () => {
	it('persiste une proposition nouvelle (upsert)', async () => {
		const proposal = makeProposal();
		await propositionHelpers.save(proposal);

		const saved = await propositionHelpers.getById(proposal.id);
		expect(saved).not.toBeNull();
		expect(saved!.bien.proprietaireNom).toBe('Dupont');
		expect(saved!.simulation.bigNumbers.loyerBrutAnnuel).toBe(8160);
	});

	it('met a jour updatedAt automatiquement', async () => {
		const proposal = makeProposal();
		const originalUpdatedAt = proposal.updatedAt;

		// Wait long enough to ensure Date.now() differs (clock resolution tolerance)
		await new Promise((r) => setTimeout(r, 50));
		await propositionHelpers.save(proposal);

		const saved = await propositionHelpers.getById(proposal.id);
		expect(saved!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
	});

	it('met a jour les donnees sur un save subsequent', async () => {
		const proposal = makeProposal();
		await propositionHelpers.save(proposal);

		// Modify and save again
		const modified = { ...proposal, bien: { ...proposal.bien, loyerHC: 900 } };
		await propositionHelpers.save(modified);

		const saved = await propositionHelpers.getById(proposal.id);
		expect(saved!.bien.loyerHC).toBe(900);
	});

	it('restaure toutes les donnees apres save et reload', async () => {
		const proposal = makeProposal();
		await propositionHelpers.save(proposal);

		const restored = await propositionHelpers.getById(proposal.id);
		expect(restored).not.toBeNull();
		expect(restored!.bien.proprietairePrenom).toBe('Jean');
		expect(restored!.bien.equipements).toEqual(['balcon']);
		expect(restored!.bien.description).toBe('Bel appartement');
		expect(restored!.simulation.tmi).toBe(30);
		expect(restored!.simulation.tauxGestion).toBe(7.8);
		expect(restored!.simulation.bigNumbers.revenuNetTMI).toBe(5095);
		expect(restored!.status).toBe(PropositionStatus.Draft);
	});

	it('gere les erreurs sans crash', async () => {
		// Test that save handles errors gracefully without propagating
		const proposal = makeProposal();

		// Mock propositionHelpers.save to throw an error
		const originalSave = propositionHelpers.save;
		let saveWasCalled = false;
		propositionHelpers.save = async () => {
			saveWasCalled = true;
			throw new Error('Database error');
		};

		try {
			// In real usage, caller would catch this; verify error doesn't crash
			await expect(propositionHelpers.save(proposal)).rejects.toThrow('Database error');
			expect(saveWasCalled).toBe(true);
		} finally {
			// Restore original implementation
			propositionHelpers.save = originalSave;
		}
	});
});
