<script lang="ts">
	import { proposalStore } from '$lib/stores/proposalStore';
	import EquipmentToggles from './EquipmentToggles.svelte';
	import PhotoZone from './PhotoZone.svelte';
	import { generateDescription, canGenerate } from '$lib/utils/descriptionGenerator';

	let hasGenerated = $state(false);

	const typesLogement = ['Appartement', 'Maison', 'Studio', 'Duplex', 'Loft', 'Chambre'];

	let showValidation = $state(false);

	function updateBien<K extends keyof typeof $proposalStore.bien>(
		field: K,
		value: (typeof $proposalStore.bien)[K]
	) {
		proposalStore.update((p) => ({
			...p,
			bien: { ...p.bien, [field]: value }
		}));
		updateComputedFields();
	}

	function handleEquipmentToggle(id: string) {
		const current = $proposalStore.bien.equipements || [];
		const updated = current.includes(id) ? current.filter((e) => e !== id) : [...current, id];
		updateBien('equipements', updated);
	}

	function updateComputedFields() {
		const { rue, codePostal, ville } = $proposalStore.bien;
		const adresse = [rue, codePostal, ville].filter(Boolean).join(', ');
		if (adresse !== $proposalStore.bien.adresse) {
			proposalStore.update((p) => ({
				...p,
				bien: { ...p.bien, adresse }
			}));
		}
	}

	const baseInputClass =
		'w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none transition-colors dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600';
	const focusClass = 'focus:border-[var(--color-orpi-red)] focus:ring-[var(--color-orpi-red)]';

	function getInputClass(value: string | number): string {
		const isEmpty = value === '' || value === 0;

		if (showValidation && isEmpty) {
			return `${baseInputClass} border-red-400 focus:border-red-400 focus:ring-red-400`;
		}
		return `${baseInputClass} border-gray-300 ${focusClass}`;
	}

	const expositions = ['Nord', 'Sud', 'Est', 'Ouest', 'Nord-Est', 'Nord-Ouest', 'Sud-Est', 'Sud-Ouest'];

	function validateNumberInput(e: Event, field: 'surface' | 'nbPieces' | 'etage') {
		const input = e.currentTarget as HTMLInputElement;
		let value = Number(input.value) || 0;
		if (value < 0) value = 0;
		updateBien(field, value);
	}

	function validatePostalCode(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const value = input.value.replace(/\D/g, '').slice(0, 5);
		updateBien('codePostal', value);
	}

	const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

	function isFormValid(): boolean {
		const { proprietairePrenom, proprietaireNom, rue, codePostal, ville, typeLogement } =
			$proposalStore.bien;
		return (
			proprietairePrenom.trim() !== '' &&
			proprietaireNom.trim() !== '' &&
			rue.trim() !== '' &&
			codePostal.trim() !== '' &&
			ville.trim() !== '' &&
			typeLogement !== ''
		);
	}
</script>

<div class="space-y-6">
	<!-- Section: Propriétaire -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Propriétaire</h3>
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="prop-prenom" class={labelClass}>Prénom *</label>
					<input
						id="prop-prenom"
						type="text"
						value={$proposalStore.bien.proprietairePrenom}
						oninput={(e) => updateBien('proprietairePrenom', e.currentTarget.value)}
						class={getInputClass($proposalStore.bien.proprietairePrenom)}
						placeholder="Jean"
					/>
				</div>
				<div>
					<label for="prop-nom" class={labelClass}>Nom *</label>
					<input
						id="prop-nom"
						type="text"
						value={$proposalStore.bien.proprietaireNom}
						oninput={(e) => updateBien('proprietaireNom', e.currentTarget.value)}
						class={getInputClass($proposalStore.bien.proprietaireNom)}
						placeholder="Dupont"
					/>
				</div>
			</div>
			<div>
				<label for="prop-email" class={labelClass}>
					Email <span class="text-gray-400 dark:text-gray-400">(optionnel)</span>
				</label>
				<input
					id="prop-email"
					type="email"
					value={$proposalStore.bien.proprietaireEmail}
					oninput={(e) => updateBien('proprietaireEmail', e.currentTarget.value)}
					class={`${baseInputClass} border-gray-300 ${focusClass}`}
					placeholder="jean.dupont@email.fr"
				/>
			</div>
		</div>
	</section>

	<!-- Section: Adresse -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Adresse du bien
		</h3>
		<div class="space-y-4">
			<div>
				<label for="bien-rue" class={labelClass}>Rue *</label>
				<input
					id="bien-rue"
					type="text"
					value={$proposalStore.bien.rue}
					oninput={(e) => updateBien('rue', e.currentTarget.value)}
					class={getInputClass($proposalStore.bien.rue)}
					placeholder="12 rue de la Paix"
				/>
			</div>
			<div class="grid grid-cols-3 gap-4">
				<div>
					<label for="bien-cp" class={labelClass}>Code postal *</label>
					<input
						id="bien-cp"
						type="text"
						pattern="^\d{5}$"
						maxlength="5"
						value={$proposalStore.bien.codePostal}
						oninput={validatePostalCode}
						class={getInputClass($proposalStore.bien.codePostal)}
						placeholder="75001"
					/>
				</div>
				<div class="col-span-2">
					<label for="bien-ville" class={labelClass}>Ville *</label>
					<input
						id="bien-ville"
						type="text"
						value={$proposalStore.bien.ville}
						oninput={(e) => updateBien('ville', e.currentTarget.value)}
						class={getInputClass($proposalStore.bien.ville)}
						placeholder="Paris"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Section: Caractéristiques -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Caractéristiques
		</h3>
		<div class="space-y-4">
			<div>
				<label for="bien-type" class={labelClass}>Type de bien *</label>
				<select
					id="bien-type"
					value={$proposalStore.bien.typeLogement}
					onchange={(e) => {
						const value = e.currentTarget.value;
						if (value) updateBien('typeLogement', value);
					}}
					class={getInputClass($proposalStore.bien.typeLogement)}
				>
					<option value="">Sélectionner...</option>
					{#each typesLogement as type (type)}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="bien-surface" class={labelClass}>Surface (m²)</label>
					<input
						id="bien-surface"
						type="number"
						min="0"
						step="1"
						value={$proposalStore.bien.surface === 0 ? '' : $proposalStore.bien.surface}
						oninput={(e) => validateNumberInput(e, 'surface')}
						class={`${baseInputClass} border-gray-300 ${focusClass}`}
						placeholder="45"
					/>
				</div>
				<div>
					<label for="bien-pieces" class={labelClass}>Pièces</label>
					<input
						id="bien-pieces"
						type="number"
						min="0"
						step="1"
						value={$proposalStore.bien.nbPieces === 0 ? '' : $proposalStore.bien.nbPieces}
						oninput={(e) => validateNumberInput(e, 'nbPieces')}
						class={`${baseInputClass} border-gray-300 ${focusClass}`}
						placeholder="2"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="bien-etage" class={labelClass}>Étage <span class="text-gray-400 dark:text-gray-400">(optionnel)</span></label>
					<input
						id="bien-etage"
						type="number"
						min="0"
						step="1"
						value={$proposalStore.bien.etage == null ? '' : $proposalStore.bien.etage}
						oninput={(e) => validateNumberInput(e, 'etage')}
						class={`${baseInputClass} border-gray-300 ${focusClass}`}
						placeholder="3"
					/>
				</div>
				<div>
					<label for="bien-exposition" class={labelClass}>Exposition <span class="text-gray-400 dark:text-gray-400">(optionnel)</span></label>
					<select
						id="bien-exposition"
						value={$proposalStore.bien.exposition || ''}
						onchange={(e) => {
							const value = e.currentTarget.value;
							updateBien('exposition', value || undefined);
						}}
						class={`${baseInputClass} border-gray-300 ${focusClass}`}
					>
						<option value="">Non renseigné</option>
						{#each expositions as expo (expo)}
							<option value={expo}>{expo}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</section>

	<!-- Section: Équipements -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Équipements</h3>
		<EquipmentToggles
			selected={$proposalStore.bien.equipements || []}
			onToggle={handleEquipmentToggle}
		/>
	</section>

	<!-- Section: Description -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Description du bien
		</h3>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<label for="bien-description" class={labelClass}>Description</label>
				<button
					type="button"
					disabled={!canGenerate($proposalStore.bien)}
					onclick={() => {
						const desc = generateDescription($proposalStore.bien);
						updateBien('description', desc);
						hasGenerated = true;
					}}
					class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
						{canGenerate($proposalStore.bien)
						? 'bg-[var(--color-orpi-red)] text-white hover:bg-[var(--color-orpi-red-dark,#b91c1c)]'
						: 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-400'}"
				>
					{hasGenerated ? 'Régénérer' : 'Générer une description'}
				</button>
			</div>
			<textarea
				id="bien-description"
				value={$proposalStore.bien.description}
				oninput={(e) => updateBien('description', e.currentTarget.value)}
				class={`${baseInputClass} border-gray-300 ${focusClass} min-h-24 resize-none`}
				placeholder="Cliquez sur « Générer » ou saisissez manuellement..."
			></textarea>
			{#if !canGenerate($proposalStore.bien) && !$proposalStore.bien.description}
				<p class="text-xs text-gray-400 dark:text-gray-400">
					Remplissez le type, la surface, les pièces, la ville et au moins un équipement pour
					générer.
				</p>
			{/if}
		</div>
	</section>

	<!-- Section: Photos -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Photos</h3>
		<PhotoZone propositionId={$proposalStore.id} />
	</section>

	<!-- Soft Validation Notice -->
	{#if showValidation && !isFormValid()}
		<div class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4">
			<p class="text-sm text-red-700 dark:text-red-400">
				⚠️ Veuillez compléter les champs requis marqués d'une bordure rouge.
			</p>
		</div>
	{/if}
</div>
