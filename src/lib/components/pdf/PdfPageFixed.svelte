<script lang="ts">
	interface Props {
		src: string;
		alt: string;
	}

	let { src, alt }: Props = $props();

	let hasError = $state(false);
</script>

{#if hasError}
	<div class="flex h-full w-full items-center justify-center bg-gray-100">
		<p class="text-sm text-gray-400">{alt}</p>
	</div>
{:else}
	<img
		{src}
		{alt}
		class="h-full w-full object-contain"
		onerror={() => { console.warn('[PdfPageFixed] Image introuvable:', src); hasError = true; }}
	/>
{/if}
