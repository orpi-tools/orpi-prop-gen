import type { BienData } from '$lib/types';

// ─── Données de référence ─────────────────────────────────────────────────

const equipementLabels: Record<string, string> = {
	balcon: 'un balcon',
	terrasse: 'une terrasse',
	jardin: 'un jardin',
	parking: 'un parking',
	garage: 'un garage',
	cave: 'une cave',
	piscine: 'une piscine',
	ascenseur: 'un ascenseur',
	gardien: 'un gardien',
	digicode: 'un digicode',
	interphone: 'un interphone',
	'cuisine-equipee': 'une cuisine équipée',
	'double-vitrage': 'un double vitrage',
	lumineux: 'lumineux',
	meuble: 'meublé'
};

const adjectiveEquipments = new Set(['lumineux', 'meuble']);

const feminineTypes = new Set(['Maison', 'Chambre']);

// ─── Banques de phrases ───────────────────────────────────────────────────

const openings: Record<string, string[]> = {
	Appartement: [
		'Votre appartement',
		'Cet appartement de qualité',
		'Bel appartement',
		'Cet agréable appartement',
		'Cet appartement soigné'
	],
	Maison: [
		'Votre maison',
		'Cette maison de caractère',
		'Belle maison',
		'Cette agréable maison',
		'Cette maison soignée'
	],
	Studio: [
		'Votre studio',
		'Ce studio bien agencé',
		'Ce studio fonctionnel',
		'Cet agréable studio'
	],
	Duplex: [
		'Votre duplex',
		'Ce duplex de standing',
		'Beau duplex',
		'Ce spacieux duplex'
	],
	Loft: [
		'Votre loft',
		'Ce loft de caractère',
		'Ce loft au cachet unique',
		'Ce spacieux loft'
	],
	Chambre: [
		'Votre chambre',
		'Cette chambre confortable',
		'Cette agréable chambre'
	]
};

const defaultOpenings = [
	'Votre bien',
	'Ce bien de qualité',
	'Ce logement soigné'
];

const locationPhrases = {
	standard: [
		'situé${e} à ${ville}',
		'idéalement situé${e} à ${ville}',
		'implanté${e} à ${ville}',
		'au cœur de ${ville}',
		'dans un quartier prisé de ${ville}'
	],
	withAddress: [
		'situé${e} ${rue}, à ${ville}',
		'idéalement positionné${e} ${rue} à ${ville}',
		'implanté${e} ${rue}, en plein ${ville}'
	]
};

const surfacePhrases = [
	'de ${surface} m²',
	'd\'une surface de ${surface} m²',
	'offrant ${surface} m²'
];

const roomPhrases: Record<string, string[]> = {
	'1': ['de 1 pièce'],
	'2': ['de 2 pièces'],
	'3': ['de 3 pièces'],
	default: ['de ${n} pièces']
};

const floorPhrases = [
	'au ${etageOrd} étage',
	'situé${e} au ${etageOrd} étage'
];

const floorRdcPhrases = [
	'en rez-de-chaussée',
	'au rez-de-chaussée'
];

const expositionPhrases: Record<string, string[]> = {
	Sud: ['exposition sud', 'plein sud'],
	Nord: ['exposition nord'],
	Est: ['exposition est'],
	Ouest: ['exposition ouest'],
	'Sud-Est': ['exposition sud-est'],
	'Sud-Ouest': ['exposition sud-ouest'],
	'Nord-Est': ['exposition nord-est'],
	'Nord-Ouest': ['exposition nord-ouest']
};

const equipmentIntros = [
	'Il dispose de',
	'Avec',
	'Le bien offre'
];

const closingPhrases = [
	'Un bien idéal pour la gestion locative.',
	'Idéal pour une mise en location.',
	'Un bien attractif sur le marché locatif.'
];

const rentPhrases = [
	'Loyer : ${loyer} €/mois HC',
	'Loyer proposé : ${loyer} €/mois HC'
];

// ─── Utilitaires ──────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function applyAccord(template: string, feminine: boolean): string {
	return template.replace(/\$\{e\}/g, feminine ? 'e' : '');
}

function applyVars(template: string, vars: Record<string, string | number>): string {
	let result = template;
	for (const [key, value] of Object.entries(vars)) {
		result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
	}
	return result;
}

function formatEquipements(equipements: string[]): { nouns: string[]; adjectives: string[] } {
	const nouns: string[] = [];
	const adjectives: string[] = [];

	for (const eq of equipements) {
		const label = equipementLabels[eq];
		if (!label) continue;
		if (adjectiveEquipments.has(eq)) {
			adjectives.push(label);
		} else {
			nouns.push(label);
		}
	}

	return { nouns, adjectives };
}

function joinList(items: string[]): string {
	if (items.length === 0) return '';
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} et ${items[1]}`;
	const last = items[items.length - 1];
	return `${items.slice(0, -1).join(', ')} et ${last}`;
}

/**
 * Apply French elision rules: "de un" → "d'un", "de une" → "d'une", etc.
 */
function applyElision(text: string): string {
	return text
		.replace(/\bde un/gi, "d'un")
		.replace(/\bde une/gi, "d'une")
		.replace(/\bde il/gi, "d'il")
		.replace(/\bque il/gi, "qu'il")
		.replace(/\bque elle/gi, "qu'elle");
}

// ─── API publique ─────────────────────────────────────────────────────────

/**
 * Check if enough data is available to generate a description.
 * Requires: typeLogement, surface > 0, nbPieces > 0, ville.
 */
export function canGenerate(bien: BienData): boolean {
	return (
		bien.typeLogement.trim() !== '' &&
		bien.surface > 0 &&
		bien.nbPieces > 0 &&
		bien.ville.trim() !== ''
	);
}

/**
 * Generate a professional property description in French from BienData fields.
 * Advanced template engine — no API calls, 100% local.
 * Produces varied, natural descriptions adapted to the property type.
 */
export function generateDescription(bien: BienData): string {
	const { typeLogement, surface, nbPieces, ville, rue, equipements, loyerHC, etage, exposition } =
		bien;

	const isFeminine = feminineTypes.has(typeLogement);
	const vars = {
		ville,
		rue,
		surface,
		n: nbPieces,
		loyer: loyerHC,
		etage: etage ?? 0,
		etageOrd: (etage ?? 0) === 1 ? '1er' : `${etage ?? 0}ème`
	};

	const paragraphs: string[] = [];

	// ── Phrase 1 : Ouverture + surface + pièces + localisation + étage/expo

	const opening = pick(openings[typeLogement] || defaultOpenings);
	const surfacePhrase = applyVars(pick(surfacePhrases), vars);

	const hasRue = rue && rue.trim() !== '';
	const locationPool = hasRue
		? [...locationPhrases.standard, ...locationPhrases.withAddress]
		: locationPhrases.standard;
	const locationPhrase = applyAccord(applyVars(pick(locationPool), vars), isFeminine);

	const roomPool = roomPhrases[String(nbPieces)] || roomPhrases['default'];
	const roomPhrase = applyVars(pick(roomPool), vars);

	const extras: string[] = [];
	if (etage !== undefined && etage !== null) {
		extras.push(etage === 0
			? applyAccord(pick(floorRdcPhrases), isFeminine)
			: applyAccord(applyVars(pick(floorPhrases), vars), isFeminine));
	}
	if (exposition && expositionPhrases[exposition]) {
		extras.push(pick(expositionPhrases[exposition]));
	}

	const extraStr = extras.length > 0 ? `, ${extras.join(', ')}` : '';
	paragraphs.push(`${opening} ${surfacePhrase}, ${locationPhrase}, ${roomPhrase}${extraStr}.`);

	// ── Phrase 3 : Équipements ─────────────────────────────────────────────

	if (equipements.length > 0) {
		const { nouns: allNouns, adjectives } = formatEquipements(equipements);
		const nouns = allNouns.slice(0, 4);

		// Filter out "lumineux" if already mentioned in opening or exposition
		const openingLower = opening.toLowerCase();
		const alreadyMentionsLumineux =
			openingLower.includes('lumineu') ||
			paragraphs.some((s) => s.toLowerCase().includes('lumineu'));
		const filteredAdjectives = alreadyMentionsLumineux
			? adjectives.filter((a) => a !== 'lumineux')
			: adjectives;

		const parts: string[] = [];

		if (nouns.length > 0) {
			const intro = pick(equipmentIntros);
			parts.push(`${intro} ${joinList(nouns)}.`);
		}

		if (filteredAdjectives.length > 0) {
			const adjectivePhrase =
				filteredAdjectives.length === 1
					? `Ce bien est ${filteredAdjectives[0]}.`
					: `Ce bien est ${joinList(filteredAdjectives)}.`;
			parts.push(adjectivePhrase);
		}

		if (parts.length > 0) {
			paragraphs.push(parts.join(' '));
		}
	}

	// ── Phrase 4 : Loyer (si renseigné) ───────────────────────────────────

	if (loyerHC > 0) {
		paragraphs.push(
			applyVars(pick(rentPhrases), vars) + '.'
		);
	}

	// ── Phrase 5 : Conclusion ─────────────────────────────────────────────

	paragraphs.push(pick(closingPhrases));

	return applyElision(paragraphs.join(' '));
}
