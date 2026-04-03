<script lang="ts">
	import type { AgencyStats } from '$lib/db/helpers/statsHelpers';

	interface Props {
		stats: AgencyStats;
	}

	let { stats }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-3" data-testid="stats-panel">
	<!-- Total propositions -->
	<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5" style="color: var(--color-orpi-navy, #002c51)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
			</svg>
			<span class="text-xs text-gray-500 dark:text-gray-400">Total</span>
		</div>
		<p class="mt-2 text-2xl font-bold" style="color: var(--color-orpi-navy, #002c51)" data-testid="stat-total">
			{stats.total}
		</p>
	</div>

	<!-- Ce mois-ci -->
	<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5" style="color: var(--color-orpi-navy, #002c51)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
			</svg>
			<span class="text-xs text-gray-500 dark:text-gray-400">Ce mois</span>
		</div>
		<p class="mt-2 text-2xl font-bold" style="color: var(--color-orpi-navy, #002c51)" data-testid="stat-this-month">
			{stats.thisMonth}
		</p>
	</div>

	<!-- Finalisees ce mois -->
	<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5" style="color: var(--color-orpi-red, #e60000)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span class="text-xs text-gray-500 dark:text-gray-400">Finalisees</span>
		</div>
		<p class="mt-2 text-2xl font-bold" style="color: var(--color-orpi-navy, #002c51)" data-testid="stat-finalized">
			{stats.finalizedThisMonth}
		</p>
	</div>

	<!-- Taux de finalisation -->
	<div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5" style="color: var(--color-orpi-navy, #002c51)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
			</svg>
			<span class="text-xs text-gray-500 dark:text-gray-400">Taux</span>
		</div>
		<p class="mt-2 text-2xl font-bold" style="color: var(--color-orpi-navy, #002c51)" data-testid="stat-rate">
			{stats.finalizationRate !== null && !isNaN(stats.finalizationRate) ? `${stats.finalizationRate}%` : '\u2014'}
		</p>
	</div>
</div>
