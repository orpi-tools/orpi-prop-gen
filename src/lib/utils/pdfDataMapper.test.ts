import { describe, it, expect, beforeEach } from 'vitest';
import { proposalStore } from '$lib/stores/proposalStore';
import { agencyStore } from '$lib/stores/agencyStore';
import { userStore } from '$lib/stores/userStore';
import { PropositionStatus } from '$lib/types';
import { buildPdfData } from './pdfDataMapper';

describe('pdfDataMapper', () => {
	beforeEach(() => {
		// Reset stores to known state
		proposalStore.set({
			id: 'test-id-123',
			agencyId: 'agency-1',
			gestionnaireId: 'gest-1',
			status: PropositionStatus.Draft,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			bien: {
				proprietairePrenom: 'Jean',
				proprietaireNom: 'Dupont',
				proprietaireEmail: 'jean.dupont@email.com',
				rue: '12 rue de la Paix',
				codePostal: '75002',
				ville: 'Paris',
				adresse: '12 rue de la Paix, 75002 Paris',
				typeLogement: 'Appartement',
				surface: 65,
				nbPieces: 3,
				loyerHC: 950,
				equipements: ['balcon', 'parking'],
				description: 'Bel appartement lumineux'
			},
			simulation: {
				charges: 50,
				tauxGestion: 7.8,
				tauxGLI: 3.0,
				tmi: 30,
				honorairesLocation: 0,
				honorairesEtatLieux: 0,
				bigNumbers: {
					loyerBrutAnnuel: 11400,
					honorairesTTC: 889,
					primeGLI: 342,
					revenuNetTMI: 7118
				}
			}
		});

		agencyStore.set({
			id: 'agency-1',
			name: 'Orpi Paris Centre',
			address: '1 rue Rivoli, 75001 Paris',
			phone: '01 23 45 67 89',
			email: 'contact@orpi-paris.fr',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});

		userStore.set({
			id: 'gest-1',
			agencyId: 'agency-1',
			firstName: 'Sophie',
			lastName: 'Martin',
			email: 'sophie@orpi.fr',
			phone: '06 12 34 56 78',
			initiales: 'SM'
		});
	});

	it('builds PdfData with correct owner info', () => {
		const data = buildPdfData();
		expect(data.owner.firstName).toBe('Jean');
		expect(data.owner.lastName).toBe('Dupont');
		expect(data.owner.fullName).toBe('Jean Dupont');
		expect(data.owner.email).toBe('jean.dupont@email.com');
	});

	it('generates correct filename format', () => {
		const data = buildPdfData();
		// Filename: Orpi_Jean-Dupont_YYYYMMDD.pdf
		expect(data.filename).toMatch(/^Orpi_Jean-Dupont_\d{8}\.pdf$/);
	});

	it('includes proposition ID', () => {
		const data = buildPdfData();
		expect(data.propositionId).toBe('test-id-123');
	});

	it('generates formatted date string', () => {
		const data = buildPdfData();
		// Should be a French locale date like "03 avril 2026"
		expect(data.generatedAt).toBeTruthy();
		expect(typeof data.generatedAt).toBe('string');
	});

	it('handles missing owner name gracefully by including proposalId to prevent collisions', () => {
		proposalStore.update((p) => ({
			...p,
			bien: { ...p.bien, proprietairePrenom: '', proprietaireNom: '' }
		}));
		const data = buildPdfData();
		// When both names are missing, proposalId is included to prevent filename collisions
		expect(data.filename).toMatch(/^Orpi_Proprietaire-Inconnu-[a-zA-Z0-9-]+_\d{8}\.pdf$/);
	});

	it('sanitizes accented characters in filename', () => {
		proposalStore.update((p) => ({
			...p,
			bien: { ...p.bien, proprietairePrenom: 'René', proprietaireNom: 'Château' }
		}));
		const data = buildPdfData();
		expect(data.filename).toMatch(/^Orpi_Rene-Chateau_\d{8}\.pdf$/);
	});

	it('handles empty email', () => {
		proposalStore.update((p) => ({
			...p,
			bien: { ...p.bien, proprietaireEmail: '' }
		}));
		const data = buildPdfData();
		expect(data.owner.email).toBe('');
	});
});
