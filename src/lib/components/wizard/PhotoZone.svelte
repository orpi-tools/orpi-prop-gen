<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { photoHelpers } from '$lib/db/helpers/photoHelpers';
	import { compressPhoto, ACCEPTED_MIME_TYPES } from '$lib/utils/photoCompressor';
	import { addToast } from '$lib/stores/uiStore';
	import type { Photo } from '$lib/types';

	const MAX_PHOTOS = 5;

	let { propositionId }: { propositionId: string } = $props();

	let photos = $state<Photo[]>([]);
	let isDragOver = $state(false);
	let dragIndex = $state<number | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let isProcessing = $state(false);

	// F1 fix: manage object URLs to prevent memory leaks
	let photoUrls = $state<Map<string, string>>(new Map());

	function refreshPhotoUrls() {
		const oldUrls = new Map(photoUrls);
		const newUrls = new Map<string, string>();

		for (const photo of photos) {
			const existing = oldUrls.get(photo.id);
			if (existing) {
				newUrls.set(photo.id, existing);
				oldUrls.delete(photo.id);
			} else {
				newUrls.set(
					photo.id,
					URL.createObjectURL(new Blob([photo.blob], { type: photo.mimeType }))
				);
			}
		}

		for (const url of oldUrls.values()) {
			URL.revokeObjectURL(url);
		}

		photoUrls = newUrls;
	}

	onDestroy(() => {
		for (const url of photoUrls.values()) {
			URL.revokeObjectURL(url);
		}
	});

	onMount(async () => {
		if (propositionId) {
			photos = await photoHelpers.getByProposition(propositionId);
			refreshPhotoUrls();
		}
	});

	function isAcceptedType(type: string): boolean {
		return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
	}

	// F5 fix: guard against concurrent processing
	async function handleFiles(files: FileList | File[]) {
		if (isProcessing) return;
		isProcessing = true;

		try {
			const fileArray = Array.from(files);
			const accepted = fileArray.filter((f) => isAcceptedType(f.type));

			if (accepted.length === 0) return;

			const remaining = MAX_PHOTOS - photos.length;
			if (remaining <= 0) {
				addToast({ message: 'Limite de 5 photos atteinte', type: 'info' });
				return;
			}

			const toProcess = accepted.slice(0, remaining);
			if (accepted.length > remaining) {
				addToast({ message: 'Limite de 5 photos atteinte', type: 'info' });
			}

			for (const file of toProcess) {
				try {
					const compressed = await compressPhoto(file);
					const photo = await photoHelpers.add({
						propositionId,
						ordre: photos.length,
						blob: compressed,
						mimeType: 'image/jpeg'
					});
					photos = [...photos, photo];
				} catch (error) {
					console.error('[PhotoZone] add photo failed:', error);
					addToast({ message: "Erreur lors de l'ajout de la photo", type: 'error' });
				}
			}
		} finally {
			isProcessing = false;
			refreshPhotoUrls();
		}
	}

	// F5 fix: await handleFiles to prevent floating promises
	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;

		// Internal reorder drop — handled by handleThumbnailDrop
		if (dragIndex !== null) return;

		if (e.dataTransfer?.files) {
			await handleFiles(e.dataTransfer.files);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function openFilePicker() {
		fileInput?.click();
	}

	async function handleFileInputChange() {
		if (fileInput?.files) {
			await handleFiles(fileInput.files);
			fileInput.value = '';
		}
	}

	// F3 fix: immutable spread instead of direct mutation
	async function removePhoto(id: string) {
		try {
			await photoHelpers.delete(id);
			const remaining = photos.filter((p) => p.id !== id).map((p, i) => ({ ...p, ordre: i }));
			for (const p of remaining) {
				await photoHelpers.updateOrdre(p.id, p.ordre);
			}
			photos = remaining;
			refreshPhotoUrls();
		} catch (error) {
			console.error('[PhotoZone] delete photo failed:', error);
			addToast({ message: 'Erreur lors de la suppression', type: 'error' });
		}
	}

	function handleThumbnailDragStart(e: DragEvent, index: number) {
		dragIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	// F4 fix: immutable spread, assign photos only after all DB writes succeed
	async function handleThumbnailDrop(e: DragEvent, targetIndex: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === targetIndex) {
			dragIndex = null;
			return;
		}

		const reordered = [...photos];
		const [moved] = reordered.splice(dragIndex, 1);
		reordered.splice(targetIndex, 0, moved);

		try {
			const updated = reordered.map((p, i) => ({ ...p, ordre: i }));
			for (const p of updated) {
				await photoHelpers.updateOrdre(p.id, p.ordre);
			}
			photos = updated;
			refreshPhotoUrls();
		} catch (error) {
			console.error('[PhotoZone] reorder failed:', error);
			addToast({ message: 'Erreur lors de la réorganisation', type: 'error' });
		}

		dragIndex = null;
	}

	function handleThumbnailDragEnd() {
		dragIndex = null;
	}
</script>

<!-- Hidden file input for browse -->
<input
	bind:this={fileInput}
	type="file"
	multiple
	accept={ACCEPTED_MIME_TYPES.join(',')}
	onchange={handleFileInputChange}
	class="hidden"
/>

<div class="space-y-3">
	<!-- Drop zone -->
	<div
		role="button"
		tabindex="0"
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onclick={openFilePicker}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') openFilePicker();
		}}
		class="flex min-h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors
			{isDragOver
			? 'border-[var(--color-orpi-red)] bg-red-50 dark:bg-red-950'
			: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}"
	>
		<div class="text-sm text-gray-500 dark:text-gray-400">
			{#if photos.length >= MAX_PHOTOS}
				<p>Limite de {MAX_PHOTOS} photos atteinte</p>
			{:else}
				<p class="font-medium">Glissez vos photos ici ou cliquez pour parcourir</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-400">
					JPEG, PNG ou WebP — max {MAX_PHOTOS - photos.length} photo{MAX_PHOTOS - photos.length > 1
						? 's'
						: ''}
				</p>
			{/if}
		</div>
	</div>

	<!-- Thumbnails grid -->
	{#if photos.length > 0}
		<div class="grid grid-cols-5 gap-3">
			{#each photos as photo, index (photo.id)}
				<div
					role="listitem"
					draggable="true"
					ondragstart={(e) => handleThumbnailDragStart(e, index)}
					ondragover={(e) => e.preventDefault()}
					ondrop={(e) => handleThumbnailDrop(e, index)}
					ondragend={handleThumbnailDragEnd}
					class="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600
						{dragIndex === index ? 'opacity-50' : ''}"
				>
					<img
						src={photoUrls.get(photo.id) ?? ''}
						alt="Photo {index + 1}"
						class="h-full w-full object-cover"
					/>
					<button
						type="button"
						onclick={() => removePhoto(photo.id)}
						class="absolute top-1 right-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition-colors group-hover:flex hover:bg-red-600"
						aria-label="Supprimer photo {index + 1}"
					>
						✕
					</button>
					<span
						class="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white"
					>
						{index + 1}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
