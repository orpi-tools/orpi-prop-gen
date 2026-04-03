<script lang="ts">
	import type { MonthlyActivity } from '$lib/db/helpers/statsHelpers';

	interface Props {
		data?: MonthlyActivity[] | null;
	}

	let { data = [] }: Props = $props();

	// Guard against null/undefined data
	let safeData = $derived(data && Array.isArray(data) ? data : []);

	// ─── Chart dimensions ────────────────────────────────────────────────────────
	const chartWidth = 400;
	const chartHeight = 180;
	const barPadding = 12;
	const labelHeight = 24;
	const valueHeight = 18;
	const topPadding = 24;

	let maxCount = $derived(Math.max(...safeData.map((d) => d.count), 1));
	let barWidth = $derived(
		safeData.length > 0 ? (chartWidth - barPadding * (safeData.length + 1)) / safeData.length : 1
	);
	let drawableHeight = $derived(chartHeight - labelHeight - valueHeight - topPadding);

	function barHeight(count: number): number {
		return (count / maxCount) * drawableHeight;
	}

	function barX(index: number): number {
		return barPadding + index * (barWidth + barPadding);
	}

	function barY(count: number): number {
		return topPadding + valueHeight + drawableHeight - barHeight(count);
	}

	function shortLabel(month: string): string {
		// "jan. 2026" → "Jan"
		const parts = month.split(' ');
		if (parts.length === 0) return month;
		const m = parts[0].replace('.', '');
		return m.charAt(0).toUpperCase() + m.slice(1);
	}
</script>

<div class="mt-4" data-testid="activity-chart">
	<h3 class="mb-3 text-sm font-semibold dark:text-gray-50" style="color: var(--color-orpi-navy, #002c51)">
		Activite mensuelle
	</h3>
	<svg
		viewBox="0 0 {chartWidth} {chartHeight + labelHeight}"
		width="100%"
		role="img"
		aria-label="Graphique d'activite mensuelle"
	>
		{#each safeData as item, i}
			{@const x = barX(i)}
			{@const h = barHeight(item.count)}
			{@const y = barY(item.count)}

			<!-- Bar -->
			<rect
				{x}
				{y}
				width={barWidth}
				height={Math.max(h, 0)}
				rx="4"
				fill={item.count > 0 ? 'var(--color-orpi-red, #E60000)' : '#E5E7EB'}
				data-testid="bar-{i}"
			>
				<title>{item.month} : {item.count} proposition{item.count !== 1 ? 's' : ''}</title>
			</rect>

			<!-- Value above bar -->
			{#if item.count > 0}
				<text
					x={x + barWidth / 2}
					y={y - 4}
					text-anchor="middle"
					font-size="11"
					font-weight="600"
					fill="var(--color-orpi-navy, #002c51)"
				>
					{item.count}
				</text>
			{/if}

			<!-- Month label below -->
			<text
				x={x + barWidth / 2}
				y={chartHeight + labelHeight - 4}
				text-anchor="middle"
				font-size="11"
				class="fill-gray-500 dark:fill-gray-400"
			>
				{shortLabel(item.month)}
			</text>
		{/each}

		<!-- Baseline -->
		<line
			x1="0"
			y1={topPadding + valueHeight + drawableHeight}
			x2={chartWidth}
			y2={topPadding + valueHeight + drawableHeight}
			class="stroke-gray-200 dark:stroke-gray-700"
			stroke-width="1"
		/>
	</svg>
</div>
