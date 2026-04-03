// ─── Enum ────────────────────────────────────────────────────────────────────

export enum PropositionStatus {
	Draft = 'draft',
	Finalized = 'finalized'
}

// ─── Types sous-domaines (placeholders — enrichis dans Epic 3) ───────────────

export interface BienData {
	proprietairePrenom: string;
	proprietaireNom: string;
	proprietaireEmail: string;
	rue: string;
	codePostal: string;
	ville: string;
	adresse: string;
	typeLogement: string;
	surface: number;
	nbPieces: number;
	loyerHC: number;
	etage?: number;
	exposition?: string;
	equipements: string[];
	description: string;
}

export interface BigNumbers {
	loyerBrutAnnuel: number;
	honorairesTTC: number;
	primeGLI: number;
	revenuNetTMI: number;
}

export const TMI_RATES = [0, 11, 30, 41, 45] as const;
export type TmiRate = (typeof TMI_RATES)[number];

export interface SimulationData {
	charges: number;
	tauxGestion: number;
	tauxGLI: number;
	tmi: TmiRate;
	honorairesLocation: number;
	honorairesEtatLieux: number;
	bigNumbers: BigNumbers;
}

// ─── Interfaces entités ──────────────────────────────────────────────────────

export interface Agency {
	id: string;
	name: string;
	address: string;
	phone: string;
	email: string;
	logo?: Blob;
	logoFilename?: string; // nom du fichier dans static/logos/ (pour agences préconfigurées)
	tauxGestion: number; // défaut 7.8
	tauxGLI: number; // défaut 3.0
	photoAgence?: Blob;
	mentionsLegales?: string;
}

export interface Gestionnaire {
	id: string;
	agencyId: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	photo?: Blob;
	initiales: string; // ex: "JD" pour Jean Dupont
	poste?: string; // ex: "Responsable gestion locative"
}

export interface Proposition {
	id: string;
	agencyId: string;
	gestionnaireId: string;
	status: PropositionStatus;
	createdAt: number; // Date.now()
	updatedAt: number; // Date.now()
	bien: BienData;
	simulation: SimulationData;
	pdfGeneratedAt?: number;
}

export interface Photo {
	id: string;
	propositionId: string;
	ordre: number;
	blob: ArrayBuffer;
	mimeType: string;
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type ToastMessage = {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration: number; // ms
	createdAt: number; // Date.now()
};
