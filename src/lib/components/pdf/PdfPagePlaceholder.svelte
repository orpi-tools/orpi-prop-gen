<script lang="ts">
	interface Props {
		title: string;
		pageNum: number;
	}

	let { title, pageNum }: Props = $props();
</script>

<div class="flex h-full w-full flex-col items-center justify-center bg-gray-50 p-6">
	<div class="mb-4 rounded-full bg-gray-200 p-4">
		<svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
		</svg>
	</div>
	<p class="text-sm font-semibold text-gray-500">Page {pageNum}</p>
	<p class="mt-1 text-xs text-gray-400">{title}</p>
	<p class="mt-3 text-xs text-gray-300">Contenu dynamique — Story 4-2</p>
</div>
