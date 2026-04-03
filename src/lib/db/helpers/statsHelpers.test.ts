import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/dexie';
import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
import { statsHelpers } from '$lib/db/helpers/statsHelpers';
import { PropositionStatus } from '$lib/types';
import type { Proposition } from '$lib/types';

// ─── Test data ────────────────────────────────────────────────────────────────

function createTestProposition(
	overrides: Partial<Proposition> = {}
): Omit<Proposition, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		agencyId: 'agency-1',
		gestionnaireId: 'gest-1',
		status: PropositionStatus.Draft,
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

// ─── getStats ─────────────────────────────────────────────────────────────────

describe('statsHelpers.getStats', () => {
	it('returns all zeros when DB is empty', async () => {
		const stats = await statsHelpers.getStats('agency-1');
		expect(stats.total).toBe(0);
		expect(stats.thisMonth).toBe(0);
		expect(stats.finalizedThisMonth).toBe(0);
		expect(stats.finalizationRate).toBeNull();
	});

	it('counts total propositions for the agency', async () => {
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-1' } as Partial<Proposition>));
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-1' } as Partial<Proposition>));
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-2' } as Partial<Proposition>));

		const stats = await statsHelpers.getStats('agency-1');
		expect(stats.total).toBe(2);
	});

	it('counts this month propositions correctly', async () => {
		// Current month proposition
		await propositionHelpers.create(createTestProposition());

		// Old proposition (2 months ago)
		const oldDate = new Date();
		oldDate.setMonth(oldDate.getMonth() - 2);
		const oldProp = await propositionHelpers.create(createTestProposition());
		await db.propositions.update(oldProp.id, { createdAt: oldDate.getTime() });

		const stats = await statsHelpers.getStats('agency-1');
		expect(stats.total).toBe(2);
		expect(stats.thisMonth).toBe(1);
	});

	it('calculates finalization rate correctly', async () => {
		// 3 this month: 2 finalized, 1 draft → 67%
		await propositionHelpers.create(
			createTestProposition({ status: PropositionStatus.Finalized } as Partial<Proposition>)
		);
		await propositionHelpers.create(
			createTestProposition({ status: PropositionStatus.Finalized } as Partial<Proposition>)
		);
		await propositionHelpers.create(createTestProposition());

		const stats = await statsHelpers.getStats('agency-1');
		expect(stats.thisMonth).toBe(3);
		expect(stats.finalizedThisMonth).toBe(2);
		expect(stats.finalizationRate).toBe(67);
	});

	it('returns null finalization rate when no propositions this month', async () => {
		// Only old propositions
		const oldProp = await propositionHelpers.create(createTestProposition());
		const oldDate = new Date();
		oldDate.setMonth(oldDate.getMonth() - 3);
		await db.propositions.update(oldProp.id, { createdAt: oldDate.getTime() });

		const stats = await statsHelpers.getStats('agency-1');
		expect(stats.total).toBe(1);
		expect(stats.thisMonth).toBe(0);
		expect(stats.finalizationRate).toBeNull();
	});

	it('filters by agencyId', async () => {
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-1' } as Partial<Proposition>));
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-2' } as Partial<Proposition>));

		const stats1 = await statsHelpers.getStats('agency-1');
		const stats2 = await statsHelpers.getStats('agency-2');
		expect(stats1.total).toBe(1);
		expect(stats2.total).toBe(1);
	});
});

// ─── getMonthlyActivity ──────────────────────────────────────────────────────

describe('statsHelpers.getMonthlyActivity', () => {
	it('returns correct number of months with zeros when DB is empty', async () => {
		const activity = await statsHelpers.getMonthlyActivity('agency-1', 6);
		expect(activity).toHaveLength(6);
		expect(activity.every((a) => a.count === 0)).toBe(true);
	});

	it('returns correct month labels in order (oldest to newest)', async () => {
		const activity = await statsHelpers.getMonthlyActivity('agency-1', 3);
		expect(activity).toHaveLength(3);
		// Each month label should contain a year
		expect(activity.every((a) => /\d{4}/.test(a.month))).toBe(true);
	});

	it('counts current month propositions', async () => {
		await propositionHelpers.create(createTestProposition());
		await propositionHelpers.create(createTestProposition());

		const activity = await statsHelpers.getMonthlyActivity('agency-1', 6);
		// Last entry = current month
		expect(activity[5].count).toBe(2);
	});

	it('counts propositions in correct month buckets', async () => {
		// Current month
		await propositionHelpers.create(createTestProposition());

		// 1 month ago
		const lastMonthProp = await propositionHelpers.create(createTestProposition());
		const lastMonth = new Date();
		lastMonth.setMonth(lastMonth.getMonth() - 1, 15);
		await db.propositions.update(lastMonthProp.id, { createdAt: lastMonth.getTime() });

		const activity = await statsHelpers.getMonthlyActivity('agency-1', 6);
		expect(activity[5].count).toBe(1); // current month
		expect(activity[4].count).toBe(1); // last month
		expect(activity[3].count).toBe(0); // 2 months ago
	});

	it('filters by agencyId', async () => {
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-1' } as Partial<Proposition>));
		await propositionHelpers.create(createTestProposition({ agencyId: 'agency-2' } as Partial<Proposition>));

		const activity1 = await statsHelpers.getMonthlyActivity('agency-1', 6);
		const activity2 = await statsHelpers.getMonthlyActivity('agency-2', 6);
		expect(activity1[5].count).toBe(1);
		expect(activity2[5].count).toBe(1);
	});
});
