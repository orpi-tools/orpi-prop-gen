# Publication des releases Orpi PropGen

Le logiciel utilise **electron-updater** pour se mettre à jour automatiquement depuis le dépôt GitHub
`orpi-tools/orpi-prop-gen-releases`.

## Workflow de release

### 1. Bumper la version

Dans `package.json`, incrémenter `"version"` (ex : `1.1.0` → `1.1.1`).

### 2. Builder les installeurs

**Windows (à faire sur Windows) :**
```bash
npm run dist:win
```
→ Génère `dist/OrpiPropGen-Setup-<version>.exe` + `latest.yml`.

**Mac (à faire sur Mac) :**
```bash
npm run dist:mac
```
→ Génère `dist/OrpiPropGen-<version>-x64.dmg`, `dist/OrpiPropGen-<version>-arm64.dmg` + `latest-mac.yml`.

### 3. Publier sur GitHub

Créer un **tag** puis une **release** dans [orpi-tools/orpi-prop-gen-releases](https://github.com/orpi-tools/orpi-prop-gen-releases)
avec les fichiers suivants joints :

- `OrpiPropGen-Setup-<version>.exe` (Windows)
- `OrpiPropGen-Setup-<version>.exe.blockmap`
- `latest.yml`
- `OrpiPropGen-<version>-x64.dmg` (Mac Intel)
- `OrpiPropGen-<version>-arm64.dmg` (Mac Apple Silicon)
- `OrpiPropGen-<version>-x64.dmg.blockmap`
- `OrpiPropGen-<version>-arm64.dmg.blockmap`
- `latest-mac.yml`

Le tag **doit** être au format `v<version>` (ex : `v1.1.1`).

### Alternative : publication automatisée

Depuis une machine configurée avec un `GH_TOKEN` (token GitHub avec scope `repo`) :

```bash
# Export du token (à faire une seule fois par session)
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Publie automatiquement la release GitHub en même temps que le build
npm run release
```

`electron-builder` se chargera de créer la release, uploader les binaires et publier `latest.yml`.

## Vérification côté utilisateur

Une fois la release publiée, les utilisateurs de l'ancienne version voient apparaître
la mise à jour quand ils cliquent sur **Paramètres → Vérifier les mises à jour**.

La vérification est **manuelle uniquement** (aucun call réseau automatique au démarrage),
pour rester conforme aux exigences RGPD.

## Stockage local et RGPD

- Aucune donnée utilisateur (agences, gestionnaires, propositions, photos) ne quitte le poste.
- Les seules requêtes réseau possibles sont :
  - `GET github.com/orpi-tools/orpi-prop-gen-releases/releases/latest` (sur clic)
  - Téléchargement du binaire de mise à jour (sur clic)
- Aucune télémétrie, aucun analytics, aucun tracking.

## Première release (v1.1.0)

La version 1.1.0 inaugure l'architecture Electron + auto-updater. Les changements depuis v1.0.0 :

- 4 agences pré-configurées (Brousse, Brive RD, Périgueux, Terrasson) — édition, pas d'ajout/suppression.
- Pages PDF 7, 9, 10 personnalisées par agence.
- Photo gestionnaire max 8 Mo (au lieu de 5).
- Correction du bug de désynchronisation agence/gestionnaire.
- Clic sur un profil dans Settings pour le sélectionner directement.
- Migration Electron : fini le serveur PowerShell, un vrai binaire natif Windows + Mac.
- Bouton « Vérifier les mises à jour » dans les Paramètres.
