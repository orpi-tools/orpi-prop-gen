<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		pageNum: number;
		totalPages: number;
		children: Snippet;
	}

	let { pageNum, totalPages, children }: Props = $props();
</script>

<div class="relative mx-auto w-full overflow-hidden rounded-lg bg-white shadow-md" style="aspect-ratio: 210 / 297;">
	{@render children()}
	<span class="absolute bottom-2 right-3 text-xs text-gray-400">{pageNum}/{totalPages}</span>
</div>
