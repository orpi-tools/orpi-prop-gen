<script lang="ts">
	import type { Gestionnaire } from '$lib/types';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import { addToast } from '$lib/stores/uiStore';
	import Avatar from '$lib/components/shared/Avatar.svelte';

	let { agencyId, onCreated }: { agencyId: string; onCreated: (g: Gestionnaire) => void } =
		$props();

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let photo: File | undefined = $state(undefined);
	let isLoading = $state(false);
	let isSubmitting = $state(false); // Prevent concurrent submissions

	// Validate email format
	function isValidEmail(value: string): boolean {
		if (!value.trim()) return true; // Optional field
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	// Validate phone format (French: optional, format +33/0X XXXXXXXXX)
	function isValidPhone(value: string): boolean {
		if (!value.trim()) return true; // Optional field
		return /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/.test(value.replace(/\s/g, ''));
	}

	// Generate initials from trimmed names
	let initiales = $derived(
		((firstName.trim()[0] ?? '') + (lastName.trim()[0] ?? '')).toUpperCase()
	);

	let previewGestionnaire = $derived<Gestionnaire | null>(
		firstName.trim() || lastName.trim()
			? {
					id: '',
					agencyId,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email.trim(),
					phone: phone.trim(),
					photo,
					initiales
				}
			: null
	);

	function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate MIME type
		if (!file.type.startsWith('image/')) {
			addToast({ message: 'Veuillez sélectionner une image valide', type: 'error' });
			input.value = '';
			return;
		}

		// Validate file size (max 5MB)
		const MAX_SIZE = 5 * 1024 * 1024;
		if (file.size > MAX_SIZE) {
			addToast({
				message: 'Image trop volumineuse (maximum 5 MB)',
				type: 'error'
			});
			input.value = '';
			return;
		}

		photo = file;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		// Validate required fields
		if (!firstName.trim() || !lastName.trim()) {
			addToast({ message: 'Le prénom et le nom sont obligatoires', type: 'error' });
			return;
		}

		// Validate email format if provided
		if (!isValidEmail(email)) {
			addToast({ message: 'Veuillez entrer une adresse email valide', type: 'error' });
			return;
		}

		// Validate phone format if provided
		if (!isValidPhone(phone)) {
			addToast({ message: 'Veuillez entrer un numéro de téléphone valide', type: 'error' });
			return;
		}

		// Prevent concurrent submissions (race condition)
		if (isSubmitting || isLoading) {
			return;
		}

		isSubmitting = true;
		isLoading = true;

		try {
			// Validate agencyId before submission
			if (!agencyId || !agencyId.trim()) {
				throw new Error('Agency ID is invalid');
			}

			const saved = await gestionnaireHelpers.create({
				agencyId,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				photo,
				initiales
			});

			// Validate response
			if (!saved || !saved.id) {
				throw new Error('Invalid response from server: missing profile id');
			}

			// Reset form state after successful submission
			firstName = '';
			lastName = '';
			email = '';
			phone = '';
			photo = undefined;

			// Clear file input
			const photoInput = document.querySelector('#photo') as HTMLInputElement;
			if (photoInput) {
				photoInput.value = '';
			}

			onCreated(saved);
		} catch (error) {
			console.error('[ProfileCreator] Creation failed:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Erreur lors de la création du profil';
			addToast({ message: errorMessage, type: 'error' });
		} finally {
			isLoading = false;
			isSubmitting = false;
		}
	}
</script>

<div class="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
	<!-- Avatar preview -->
	<div class="mb-6 flex justify-center">
		<Avatar gestionnaire={previewGestionnaire} size="lg" />
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="firstName" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Prénom *
				</label>
				<input
					id="firstName"
					type="text"
					required
					maxlength="50"
					bind:value={firstName}
					disabled={isLoading}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-600"
					placeholder="Jean"
				/>
			</div>
			<div>
				<label for="lastName" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"> Nom * </label>
				<input
					id="lastName"
					type="text"
					required
					maxlength="50"
					bind:value={lastName}
					disabled={isLoading}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-600"
					placeholder="Dupont"
				/>
			</div>
		</div>

		<div>
			<label for="email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Email <span class="text-sm text-gray-500 dark:text-gray-400">(optionnel)</span>
			</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				disabled={isLoading}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-600"
				placeholder="jean.dupont@orpi.fr"
				aria-describedby="email-hint"
			/>
			<span id="email-hint" class="sr-only">Votre adresse email (optionnel)</span>
		</div>

		<div>
			<label for="phone" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Téléphone <span class="text-sm text-gray-500 dark:text-gray-400">(optionnel)</span>
			</label>
			<input
				id="phone"
				type="tel"
				bind:value={phone}
				disabled={isLoading}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-600"
				placeholder="06 00 00 00 00"
				aria-describedby="phone-hint"
			/>
			<span id="phone-hint" class="sr-only">Votre numéro de téléphone (optionnel)</span>
		</div>

		<div>
			<label for="photo" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Photo <span class="text-sm text-gray-500 dark:text-gray-400">(optionnel, max 5 MB)</span>
			</label>
			<input
				id="photo"
				type="file"
				accept="image/*"
				onchange={handlePhotoUpload}
				disabled={isLoading}
				class="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:file:cursor-not-allowed disabled:file:bg-gray-200 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600 dark:disabled:file:bg-gray-700"
			/>
		</div>

		<button
			type="submit"
			disabled={!firstName.trim() || !lastName.trim() || isLoading}
			class="mt-2 w-full rounded-lg bg-[var(--color-orpi-red)] px-6 py-3 font-semibold text-white transition-all hover:brightness-95 dark:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isLoading ? 'Création en cours…' : 'Créer mon profil'}
		</button>
	</form>
</div>
