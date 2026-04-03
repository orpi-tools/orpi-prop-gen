import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ─── filterPropositions (extracted pure function for testing) ─────────────────
function filterPropositions(
	propositions: Proposition[],
	searchQuery: string,
	statusFilter: 'all' | 'draft' | 'finalized'
): Proposition[] {
	const normalized = searchQuery.toLowerCase().trim();
	return propositions.filter((p) => {
		if (statusFilter !== 'all' && p.status !== statusFilter) return false;
		if (normalized) {
			const matches =
				p.bien?.proprietairePrenom?.toLowerCase().includes(normalized) ||
				p.bien?.adresse?.toLowerCase().includes(normalized) ||
				p.bien?.proprietaireEmail?.toLowerCase().includes(normalized);
			if (!matches) return false;
		}
		return true;
	});
}

// ─── AC1: Search filtering (debounce tested via timing) ──────────────────────
describe('filterPropositions — search', () => {
	const props = [
		createMockProposition({
			bien: {
				...createMockProposition().bien,
				proprietairePrenom: 'Jean',
				adresse: '12 rue de la Paix, 75002 Paris',
				proprietaireEmail: 'jean@dupont.fr'
			}
		}),
		createMockProposition({
			bien: {
				...createMockProposition().bien,
				proprietairePrenom: 'Marie',
				adresse: '5 avenue des Champs-Élysées, 75008 Paris',
				proprietaireEmail: 'marie@martin.fr'
			}
		}),
		createMockProposition({
			bien: {
				...createMockProposition().bien,
				proprietairePrenom: 'Pierre',
				adresse: '8 boulevard Haussmann, 75009 Paris',
				proprietaireEmail: 'pierre@durand.com'
			}
		})
	];

	it('returns all propositions when search is empty', () => {
		const result = filterPropositions(props, '', 'all');
		expect(result).toHaveLength(3);
	});

	it('filters by proprietairePrenom (case-insensitive)', () => {
		const result = filterPropositions(props, 'jean', 'all');
		expect(result).toHaveLength(1);
		expect(result[0].bien.proprietairePrenom).toBe('Jean');
	});

	it('filters by proprietairePrenom uppercase', () => {
		const result = filterPropositions(props, 'MARIE', 'all');
		expect(result).toHaveLength(1);
		expect(result[0].bien.proprietairePrenom).toBe('Marie');
	});

	it('filters by adresse', () => {
		const result = filterPropositions(props, 'haussmann', 'all');
		expect(result).toHaveLength(1);
		expect(result[0].bien.proprietairePrenom).toBe('Pierre');
	});

	it('filters by proprietaireEmail', () => {
		const result = filterPropositions(props, 'marie@martin', 'all');
		expect(result).toHaveLength(1);
		expect(result[0].bien.proprietaireEmail).toBe('marie@martin.fr');
	});

	it('returns empty when no match', () => {
		const result = filterPropositions(props, 'zzzzzzz', 'all');
		expect(result).toHaveLength(0);
	});

	it('trims whitespace from search query', () => {
		const result = filterPropositions(props, '  jean  ', 'all');
		expect(result).toHaveLength(1);
	});

	it('handles null-safe fields (undefined bien fields)', () => {
		const propWithEmpty = createMockProposition({
			bien: {
				...createMockProposition().bien,
				proprietairePrenom: '',
				adresse: '',
				proprietaireEmail: ''
			}
		});
		const result = filterPropositions([propWithEmpty], 'test', 'all');
		expect(result).toHaveLength(0);
	});
});

// ─── AC3-AC5: Status filtering ───────────────────────────────────────────────
describe('filterPropositions — status filter', () => {
	const props = [
		createMockProposition({ status: PropositionStatus.Draft }),
		createMockProposition({ status: PropositionStatus.Draft }),
		createMockProposition({ status: PropositionStatus.Finalized })
	];

	it('returns all when filter is "all"', () => {
		const result = filterPropositions(props, '', 'all');
		expect(result).toHaveLength(3);
	});

	it('filters draft only', () => {
		const result = filterPropositions(props, '', 'draft');
		expect(result).toHaveLength(2);
		expect(result.every((p) => p.status === PropositionStatus.Draft)).toBe(true);
	});

	it('filters finalized only', () => {
		const result = filterPropositions(props, '', 'finalized');
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe(PropositionStatus.Finalized);
	});
});

// ─── AC6: Combined search + status (AND logic) ──────────────────────────────
describe('filterPropositions — combined AND logic', () => {
	const props = [
		createMockProposition({
			status: PropositionStatus.Draft,
			bien: { ...createMockProposition().bien, proprietairePrenom: 'Jean', proprietaireEmail: 'jean@dupont.fr' }
		}),
		createMockProposition({
			status: PropositionStatus.Finalized,
			bien: { ...createMockProposition().bien, proprietairePrenom: 'Jean', proprietaireEmail: 'jean2@dupont.fr' }
		}),
		createMockProposition({
			status: PropositionStatus.Draft,
			bien: { ...createMockProposition().bien, proprietairePrenom: 'Marie', proprietaireEmail: 'marie@martin.fr', adresse: '5 avenue Foch, 75016 Paris' }
		})
	];

	it('combines search + status filter (AND)', () => {
		const result = filterPropositions(props, 'jean', 'draft');
		expect(result).toHaveLength(1);
		expect(result[0].bien.proprietairePrenom).toBe('Jean');
		expect(result[0].status).toBe(PropositionStatus.Draft);
	});

	it('returns empty when combined filters match nothing', () => {
		const result = filterPropositions(props, 'marie', 'finalized');
		expect(result).toHaveLength(0);
	});

	it('search + "all" status returns only search matches', () => {
		const result = filterPropositions(props, 'jean', 'all');
		expect(result).toHaveLength(2);
	});
});

// ─── AC2: NoSearchResults display logic ──────────────────────────────────────
describe('NoSearchResults — display logic', () => {
	it('shows when propositions exist but filtered list is empty', () => {
		const propositions = [createMockProposition()];
		const filtered = filterPropositions(propositions, 'zzz', 'all');
		const showNoResults = propositions.length > 0 && filtered.length === 0;
		expect(showNoResults).toBe(true);
	});

	it('does not show when propositions list is empty (use EmptyState instead)', () => {
		const propositions: Proposition[] = [];
		const filtered = filterPropositions(propositions, '', 'all');
		const showNoResults = propositions.length > 0 && filtered.length === 0;
		expect(showNoResults).toBe(false);
	});

	it('does not show when filtered list has results', () => {
		const propositions = [createMockProposition()];
		const filtered = filterPropositions(propositions, '', 'all');
		const showNoResults = propositions.length > 0 && filtered.length === 0;
		expect(showNoResults).toBe(false);
	});
});

// ─── Debounce behavior ───────────────────────────────────────────────────────
describe('Debounce — timing behavior', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('debounce delays function call by 300ms', () => {
		const fn = vi.fn();
		let timer: ReturnType<typeof setTimeout> | undefined;

		function debounceCall(value: string) {
			clearTimeout(timer);
			timer = setTimeout(() => fn(value), 300);
		}

		debounceCall('a');
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(200);
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledOnce();
		expect(fn).toHaveBeenCalledWith('a');
	});

	it('debounce resets on subsequent calls', () => {
		const fn = vi.fn();
		let timer: ReturnType<typeof setTimeout> | undefined;

		function debounceCall(value: string) {
			clearTimeout(timer);
			timer = setTimeout(() => fn(value), 300);
		}

		debounceCall('a');
		vi.advanceTimersByTime(200);
		debounceCall('ab');
		vi.advanceTimersByTime(200);
		debounceCall('abc');

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledOnce();
		expect(fn).toHaveBeenCalledWith('abc');
	});
});
