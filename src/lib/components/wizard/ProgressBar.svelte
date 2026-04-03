<script lang="ts">
	let {
		currentStep,
		onStepClick
	}: {
		currentStep: number;
		onStepClick: (step: number) => void;
	} = $props();

	const steps = [
		{ num: 1, label: 'Bien' },
		{ num: 2, label: 'Simulation' },
		{ num: 3, label: 'Récapitulatif' }
	];
</script>

<nav class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
	{#each steps as step, i (step.num)}
		{#if i > 0}
			<div
				class="mx-2 h-px flex-1 {step.num <= currentStep
					? 'bg-[var(--color-orpi-red)]'
					: 'bg-gray-200 dark:bg-gray-600'}"
			></div>
		{/if}

		<button
			onclick={() => onStepClick(step.num)}
			class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
				{step.num === currentStep
				? 'text-[var(--color-orpi-red)]'
				: step.num < currentStep
					? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
					: 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'}"
		>
			<span
				class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
					{step.num === currentStep
					? 'bg-[var(--color-orpi-red)] text-white'
					: step.num < currentStep
						? 'bg-gray-700 text-white'
						: 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}"
			>
				{#if step.num < currentStep}
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					{step.num}
				{/if}
			</span>
			{step.label}
		</button>
	{/each}
</nav>
