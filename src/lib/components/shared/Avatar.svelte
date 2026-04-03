<script lang="ts">
	import type { Gestionnaire } from '$lib/types';

	let {
		gestionnaire,
		size = 'md'
	}: { gestionnaire: Gestionnaire | null; size?: 'sm' | 'md' | 'lg' } = $props();

	const sizeClasses: Record<string, string> = {
		sm: 'h-8 w-8 text-xs',
		md: 'h-12 w-12 text-sm',
		lg: 'h-16 w-16 text-lg'
	};

	// Manage object URL lifecycle with proper cleanup
	let photoUrl = $state<string | null>(null);

	$effect(() => {
		if (gestionnaire?.photo) {
			try {
				const url = URL.createObjectURL(gestionnaire.photo);
				photoUrl = url;
				// Return cleanup function to revoke URL when effect cleans up
				return () => {
					URL.revokeObjectURL(url);
				};
			} catch (error) {
				console.error('[Avatar] Failed to create object URL:', error);
				photoUrl = null;
			}
		} else {
			photoUrl = null;
		}
	});
</script>

{#if gestionnaire}
	{#if photoUrl}
		<img
			src={photoUrl}
			alt="{gestionnaire.firstName} {gestionnaire.lastName}"
			class="rounded-full object-cover {sizeClasses[size]}"
		/>
	{:else}
		<div
			class="flex items-center justify-center rounded-full font-semibold text-white {sizeClasses[
				size
			]}"
			style="background-color: var(--color-orpi-navy-bg)"
		>
			{gestionnaire.initiales || '?'}
		</div>
	{/if}
{/if}
