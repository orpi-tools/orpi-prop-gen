<script lang="ts">
	import type { Agency } from '$lib/types';
	import { agencyHelpers } from '$lib/db/helpers/agencyHelpers';
	import { addToast } from '$lib/stores/uiStore';

	let { onCreated, onCancel }: { onCreated: (a: Agency) => void; onCancel: () => void } = $props();

	let name = $state('');
	let address = $state('');
	let phone = $state('');
	let email = $state('');
	let tauxGestion = $state(7.8);
	let tauxGLI = $state(3.0);
	let isSubmitting = $state(false);

	function isValidEmail(value: string): boolean {
		if (!value.trim()) return true;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!name.trim()) {
			addToast({ message: "Le nom de l'agence est obligatoire", type: 'error' });
			return;
		}

		if (!isValidEmail(email)) {
			addToast({ message: 'Veuillez entrer une adresse email valide', type: 'error' });
			return;
		}

		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const saved = await agencyHelpers.create({
				name: name.trim(),
				address: address.trim(),
				phone: phone.trim(),
				email: email.trim(),
				logoFilename: 'orpi-logo.png',
				tauxGestion: Number.isFinite(tauxGestion) ? tauxGestion : 7.8,
				tauxGLI: Number.isFinite(tauxGLI) ? tauxGLI : 3.0
			});

			if (!saved || !saved.id) {
				throw new Error("Réponse invalide lors de la création de l'agence");
			}

			onCreated(saved);
		} catch (error) {
			console.error('[AgencyCreator] Creation failed:', error);
			const errorMessage =
				error instanceof Error ? error.message : "Erreur lors de la création de l'agence";
			addToast({ message: errorMessage, type: 'error' });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
	<h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">Nouvelle agence</h3>

	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<div>
			<label for="new-agency-name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Nom de l'agence *
			</label>
			<input
				id="new-agency-name"
				type="text"
				required
				maxlength="100"
				bind:value={name}
				disabled={isSubmitting}
				class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				placeholder="Orpi Mon Agence"
			/>
		</div>

		<div>
			<label for="new-agency-address" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				Adresse
			</label>
			<input
				id="new-agency-address"
				type="text"
				bind:value={address}
				disabled={isSubmitting}
				class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				placeholder="1 Rue de la Paix, 75001 Paris"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="new-agency-phone" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Téléphone
				</label>
				<input
					id="new-agency-phone"
					type="tel"
					bind:value={phone}
					disabled={isSubmitting}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
					placeholder="01 00 00 00 00"
				/>
			</div>
			<div>
				<label for="new-agency-email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Email
				</label>
				<input
					id="new-agency-email"
					type="email"
					bind:value={email}
					disabled={isSubmitting}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
					placeholder="contact@orpi.fr"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="new-agency-taux-gestion" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Taux de gestion (%)
				</label>
				<input
					id="new-agency-taux-gestion"
					type="number"
					step="0.1"
					min="0"
					max="100"
					bind:value={tauxGestion}
					disabled={isSubmitting}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>
			<div>
				<label for="new-agency-taux-gli" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Taux GLI (%)
				</label>
				<input
					id="new-agency-taux-gli"
					type="number"
					step="0.1"
					min="0"
					max="100"
					bind:value={tauxGLI}
					disabled={isSubmitting}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>
		</div>

		<div class="flex gap-3">
			<button
				type="submit"
				disabled={!name.trim() || isSubmitting}
				class="flex-1 rounded-lg px-6 py-2.5 font-semibold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
				style="background-color: var(--color-orpi-red)"
			>
				{isSubmitting ? 'Création en cours…' : 'Créer l\'agence'}
			</button>
			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Annuler
			</button>
		</div>
	</form>
</div>
