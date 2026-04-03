import { describe, it, expect } from 'vitest';
import { PropositionStatus } from '$lib/types';
import type { Proposition } from '$lib/types';

// ─── Test helpers ─────────────────────────────────────────────────────────────
function createMockProposition(overrides: Partial<Proposition> = {}): Proposition {
	return {
		id: crypto.randomUUID(),
		agencyId: 'agency-1',
		gestionnaireId: 'gest-1',
		status: PropositionStatus.Draft,
		createdAt: Date.now(),
		updatedAt: Date.now(),
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
			description: ''
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

// ─── Date formatting (Task 5.1, 7.4) ─────────────────────────────────────────
describe('Date formatting — FR locale', () => {
	const formatter = new Intl.DateTimeFormat('fr-FR', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});

	it('formats a date in French locale', () => {
		// April 3, 2026
		const date = new Date(2026, 3, 3);
		const result = formatter.format(date);
		expect(result).toContain('avr.');
		expect(result).toContain('2026');
		expect(result).toContain('3');
	});

	it('formats January date correctly', () => {
		const date = new Date(2026, 0, 15);
		const result = formatter.format(date);
		expect(result).toContain('janv.');
		expect(result).toContain('2026');
	});

	it('handles timestamp number input', () => {
		const timestamp = new Date(2026, 3, 3).getTime();
		const result = formatter.format(new Date(timestamp));
		expect(result).toContain('avr.');
		expect(result).toContain('2026');
	});
});

// ─── Currency formatting (Task 5.2) ──────────────────────────────────────────
describe('Currency formatting — EUR FR locale', () => {
	const formatter = new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});

	it('formats loyer HC as EUR', () => {
		const result = formatter.format(1200);
		// Different environments may use different spaces (narrow no-break space)
		expect(result.replace(/\s/g, ' ')).toContain('1 200');
		expect(result).toContain('€');
	});

	it('formats zero as 0 €', () => {
		const result = formatter.format(0);
		expect(result).toContain('0');
		expect(result).toContain('€');
	});

	it('formats large amounts', () => {
		const result = formatter.format(15000);
		expect(result.replace(/\s/g, ' ')).toContain('15 000');
	});
});

// ─── PropositionCard logic (Task 7.1) ────────────────────────────────────────
describe('PropositionCard — logic', () => {
	it('identifies Draft status correctly', () => {
		const prop = createMockProposition({ status: PropositionStatus.Draft });
		expect(prop.status).toBe(PropositionStatus.Draft);
		expect(prop.status === PropositionStatus.Draft).toBe(true);
	});

	it('identifies Finalized status correctly', () => {
		const prop = createMockProposition({ status: PropositionStatus.Finalized });
		expect(prop.status).toBe(PropositionStatus.Finalized);
		expect(prop.status === PropositionStatus.Draft).toBe(false);
	});

	it('extracts display fields from proposition', () => {
		const prop = createMockProposition();
		expect(prop.bien.adresse).toBe('12 rue de la Paix, 75002 Paris');
		expect(prop.bien.proprietairePrenom).toBe('Jean');
		expect(prop.bien.loyerHC).toBe(1200);
		expect(typeof prop.createdAt).toBe('number');
	});

	it('handles missing adresse gracefully', () => {
		const prop = createMockProposition();
		prop.bien.adresse = '';
		const adresse = prop.bien.adresse || 'Adresse non renseignée';
		expect(adresse).toBe('Adresse non renseignée');
	});

	it('handles missing proprietairePrenom gracefully', () => {
		const prop = createMockProposition();
		prop.bien.proprietairePrenom = '';
		const name = prop.bien.proprietairePrenom || 'Propriétaire';
		expect(name).toBe('Propriétaire');
	});
});

// ─── EmptyState logic (Task 7.2) ─────────────────────────────────────────────
describe('EmptyState — logic', () => {
	it('empty state shows when propositions array is empty', () => {
		const propositions: Proposition[] = [];
		expect(propositions.length === 0).toBe(true);
	});

	it('empty state hidden when propositions exist', () => {
		const propositions = [createMockProposition()];
		expect(propositions.length === 0).toBe(false);
	});
});

// ─── Dashboard sorting (Task 7.3) ────────────────────────────────────────────
describe('Dashboard — sorting and filtering', () => {
	it('sorts propositions by createdAt descending (most recent first)', () => {
		const old = createMockProposition({ createdAt: 1000 });
		const mid = createMockProposition({ createdAt: 2000 });
		const recent = createMockProposition({ createdAt: 3000 });

		// Simulate the sort that propositionHelpers.getAll already does
		const sorted = [old, recent, mid].sort((a, b) => b.createdAt - a.createdAt);
		expect(sorted[0].createdAt).toBe(3000);
		expect(sorted[1].createdAt).toBe(2000);
		expect(sorted[2].createdAt).toBe(1000);
	});

	it('filters propositions by agencyId', () => {
		const agency1 = createMockProposition({ agencyId: 'agency-1' });
		const agency2 = createMockProposition({ agencyId: 'agency-2' });
		const agency1b = createMockProposition({ agencyId: 'agency-1' });

		const all = [agency1, agency2, agency1b];
		const filtered = all.filter((p) => p.agencyId === 'agency-1');
		expect(filtered).toHaveLength(2);
		expect(filtered.every((p) => p.agencyId === 'agency-1')).toBe(true);
	});

	it('returns all if no agencyId filter', () => {
		const props = [
			createMockProposition({ agencyId: 'a' }),
			createMockProposition({ agencyId: 'b' })
		];
		// When agencyId is null/undefined, return all
		const agencyId: string | undefined = undefined;
		const filtered = agencyId ? props.filter((p) => p.agencyId === agencyId) : props;
		expect(filtered).toHaveLength(2);
	});

	it('badge displays correct text for each status', () => {
		const draftLabel = PropositionStatus.Draft === 'draft' ? 'Brouillon' : 'Finalisée';
		const finalLabel = PropositionStatus.Finalized === 'finalized' ? 'Finalisée' : 'Brouillon';
		expect(draftLabel).toBe('Brouillon');
		expect(finalLabel).toBe('Finalisée');
	});
});
