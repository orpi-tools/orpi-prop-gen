<script lang="ts">
	import type { Gestionnaire } from '$lib/types';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import { addToast } from '$lib/stores/uiStore';
	import Avatar from '$lib/components/shared/Avatar.svelte';

	let {
		gestionnaire,
		onUpdated,
		onCancel
	}: {
		gestionnaire: Gestionnaire;
		onUpdated: (g: Gestionnaire) => void;
		onCancel: () => void;
	} = $props();

	let firstName = $state(gestionnaire.firstName);
	let lastName = $state(gestionnaire.lastName);
	let email = $state(gestionnaire.email);
	let phone = $state(gestionnaire.phone);
	let photo = $state<File | Blob | undefined>(gestionnaire.photo);
	let newPhoto = $state<File | undefined>(undefined);
	let isSaving = $state(false);

	function isValidEmail(value: string): boolean {
		if (!value.trim()) return true;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	function isValidPhone(value: string): boolean {
		if (!value.trim()) return true;
		return /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/.test(value.replace(/\s/g, ''));
	}

	let initiales = $derived(
		((firstName.trim()[0] ?? '') + (lastName.trim()[0] ?? '')).toUpperCase()
	);

	let previewGestionnaire = $derived<Gestionnaire>({
		...gestionnaire,
		firstName: firstName.trim(),
		lastName: lastName.trim(),
		email: email.trim(),
		phone: phone.trim(),
		photo: newPhoto ?? photo,
		initiales
	});

	function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			addToast({ message: 'Veuillez sélectionner une image valide', type: 'error' });
			input.value = '';
			return;
		}

		const MAX_SIZE = 5 * 1024 * 1024;
		if (file.size > MAX_SIZE) {
			addToast({ message: 'Image trop volumineuse (maximum 5 MB)', type: 'error' });
			input.value = '';
			return;
		}

		newPhoto = file;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!firstName.trim() || !lastName.trim()) {
			addToast({ message: 'Le prénom et le nom sont obligatoires', type: 'error' });
			return;
		}

		if (!isValidEmail(email)) {
			addToast({ message: 'Veuillez entrer une adresse email valide', type: 'error' });
			return;
		}

		if (!isValidPhone(phone)) {
			addToast({ message: 'Veuillez entrer un numéro de téléphone valide', type: 'error' });
			return;
		}

		if (isSaving) return;
		isSaving = true;

		try {
			const changes: Partial<Omit<Gestionnaire, 'id'>> = {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				initiales
			};

			if (newPhoto) {
				changes.photo = newPhoto;
			}

			await gestionnaireHelpers.update(gestionnaire.id, changes);

			const updated: Gestionnaire = {
				...gestionnaire,
				...changes
			};

			addToast({ message: 'Profil mis à jour', type: 'success' });
			onUpdated(updated);
		} catch (error) {
			console.error('[ProfileEditor] Update failed:', error);
			addToast({ message: 'Erreur lors de la mise à jour du profil', type: 'error' });
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
	<div class="mb-4 flex justify-center">
		<Avatar gestionnaire={previewGestionnaire} size="md" />
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-3">
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="edit-firstName" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Prénom *
				</label>
				<input
					id="edit-firstName"
					type="text"
					required
					maxlength="50"
					bind:value={firstName}
					disabled={isSaving}
					class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>
			<div>
				<label for="edit-lastName" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Nom *
				</label>
				<input
					id="edit-lastName"
					type="text"
					required
					maxlength="50"
					bind:value={lastName}
					disabled={isSaving}
					class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>
		</div>

		<div>
			<label for="edit-email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Email <span class="text-xs text-gray-400">(optionnel)</span>
			</label>
			<input
				id="edit-email"
				type="email"
				bind:value={email}
				disabled={isSaving}
				class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
			/>
		</div>

		<div>
			<label for="edit-phone" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Téléphone <span class="text-xs text-gray-400">(optionnel)</span>
			</label>
			<input
				id="edit-phone"
				type="tel"
				bind:value={phone}
				disabled={isSaving}
				class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
			/>
		</div>

		<div>
			<label for="edit-photo" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Photo <span class="text-xs text-gray-400">(optionnel, max 5 MB)</span>
			</label>
			<input
				id="edit-photo"
				type="file"
				accept="image/*"
				onchange={handlePhotoUpload}
				disabled={isSaving}
				class="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:file:cursor-not-allowed dark:text-gray-400 dark:file:bg-gray-600 dark:file:text-gray-300"
			/>
		</div>

		<div class="flex gap-3 pt-1">
			<button
				type="submit"
				disabled={!firstName.trim() || !lastName.trim() || isSaving}
				class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
				style="background-color: var(--color-orpi-red)"
			>
				{isSaving ? 'Enregistrement…' : 'Enregistrer'}
			</button>
			<button
				type="button"
				onclick={onCancel}
				disabled={isSaving}
				class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Annuler
			</button>
		</div>
	</form>
</div>
