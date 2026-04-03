<script lang="ts">
	import { uiStore } from '$lib/stores/uiStore';
	import { fly } from 'svelte/transition';
	import Toast from './Toast.svelte';

	const MAX_VISIBLE = 3;
	let visibleToasts = $derived($uiStore.toasts.slice(-MAX_VISIBLE));
</script>

<div
	class="pointer-events-none fixed right-0 bottom-0 z-[60] flex flex-col-reverse gap-2 p-4"
	aria-label="Notifications système"
	aria-live="polite"
	role="region"
>
	{#each visibleToasts as toast (toast.id)}
		<div
			in:fly={{ x: 64, duration: 200 }}
			out:fly={{ x: 64, duration: 150 }}
			class="pointer-events-auto"
		>
			<Toast message={toast.message} type={toast.type} id={toast.id} />
		</div>
	{/each}
</div>
