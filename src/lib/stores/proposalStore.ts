import { writable } from 'svelte/store';
import type { Proposition } from '$lib/types';
import { PropositionStatus } from '$lib/types';

const defaultProposal: Proposition = {
	id: '',
	agencyId: '',
	gestionnaireId: '',
	status: PropositionStatus.Draft,
	createdAt: Date.now(),
	updatedAt: Date.now(),
	bien: {
		proprietairePrenom: '',
		proprietaireNom: '',
		proprietaireEmail: '',
		rue: '',
		codePostal: '',
		ville: '',
		adresse: '',
		typeLogement: '',
		surface: 0,
		nbPieces: 0,
		loyerHC: 0,
		equipements: [],
		description: ''
	},
	simulation: {
		charges: 0,
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
	}
};

export const proposalStore = writable<Proposition>(defaultProposal);
