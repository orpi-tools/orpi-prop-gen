<script lang="ts">
	type StatusFilterValue = 'all' | 'draft' | 'finalized';

	interface Props {
		value: StatusFilterValue;
		onChange: (filter: StatusFilterValue) => void;
	}

	let { value, onChange }: Props = $props();

	const options: { label: string; value: StatusFilterValue }[] = [
		{ label: 'Tous', value: 'all' },
		{ label: 'Brouillon', value: 'draft' },
		{ label: 'Finalisée', value: 'finalized' }
	];
</script>

<div class="flex gap-1" data-testid="status-filter">
	{#each options as option (option.value)}
		<button
			type="button"
			onclick={() => onChange(option.value)}
			class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
			style:background-color={value === option.value ? 'var(--color-orpi-navy, #002c51)' : undefined}
			style:color={value === option.value ? 'white' : undefined}
			class:bg-gray-100={value !== option.value}
			class:text-gray-500={value !== option.value}
			class:dark:bg-gray-700={value !== option.value}
			class:dark:text-gray-400={value !== option.value}
			data-testid={`filter-${option.value}`}
		>
			{option.label}
		</button>
	{/each}
</div>
