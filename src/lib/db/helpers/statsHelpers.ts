import { db } from '$lib/db/dexie';
import { PropositionStatus } from '$lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgencyStats {
	total: number;
	thisMonth: number;
	finalizedThisMonth: number;
	finalizationRate: number | null; // null si 0 propositions ce mois
}

export interface MonthlyActivity {
	month: string; // "jan. 2026", "fev. 2026", etc.
	count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStartOfMonth(date: Date = new Date()): number {
	const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
	return start.getTime();
}

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(date: Date): string {
	const month = MONTH_ABBR[date.getMonth()] || 'Jan';
	return `${month} ${date.getFullYear()}`;
}

// ─── Stats Helpers ───────────────────────────────────────────────────────────

export const statsHelpers = {
	/**
	 * Get aggregate stats for an agency.
	 */
	async getStats(agencyId: string): Promise<AgencyStats> {
		if (!agencyId?.trim()) {
			return { total: 0, thisMonth: 0, finalizedThisMonth: 0, finalizationRate: null };
		}
		const all = await db.propositions.where('agencyId').equals(agencyId).toArray();
		const monthStart = getStartOfMonth();

		const total = all.length;
		const thisMonthProps = all.filter((p) => p.createdAt >= monthStart);
		const finalizedThisMonth = thisMonthProps.filter(
			(p) => p.status === PropositionStatus.Finalized
		).length;
		const finalizationRate =
			thisMonthProps.length > 0
				? Math.round((finalizedThisMonth / thisMonthProps.length) * 100)
				: null;

		return {
			total,
			thisMonth: thisMonthProps.length,
			finalizedThisMonth,
			finalizationRate
		};
	},

	/**
	 * Get monthly proposition counts for the last N months (current month included).
	 */
	async getMonthlyActivity(agencyId: string, months: number): Promise<MonthlyActivity[]> {
		if (!agencyId?.trim()) {
			return [];
		}
		let validMonths = months;
		if (validMonths < 1) validMonths = 6;
		if (validMonths > 120) validMonths = 120;

		const now = new Date();
		const result: MonthlyActivity[] = [];

		// Build month ranges from oldest to newest
		for (let i = validMonths - 1; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const start = date.getTime();
			const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
			const end = nextMonth.getTime();

			try {
				const count = await db.propositions
					.where('agencyId')
					.equals(agencyId)
					.and((p) => p.createdAt >= start && p.createdAt < end)
					.count();
				result.push({
					month: formatMonth(date),
					count
				});
			} catch (error) {
				console.error('[statsHelpers] getMonthlyActivity count failed:', error);
				result.push({
					month: formatMonth(date),
					count: 0
				});
			}
		}

		return result;
	}
};
