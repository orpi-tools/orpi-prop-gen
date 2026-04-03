# ============================================================
# Orpi PropGen -- Script de deploiement Windows (Edge)
# Executer via: clic droit -> "Executer avec PowerShell"
# Aucun droit administrateur requis
# ============================================================

$Source = Join-Path $PSScriptRoot "build"
$Dest = Join-Path $env:USERPROFILE "Orpi\PropGen"

Write-Host "[Orpi PropGen] Deploiement en cours..." -ForegroundColor Cyan

# Verifier que build/ existe
if (-not (Test-Path $Source)) {
    Write-Host "ERREUR: Le dossier build/ n'existe pas." -ForegroundColor Red
    Write-Host "Lancez d'abord: npm run build"
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Creer le dossier destination si necessaire
if (-not (Test-Path $Dest)) {
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    Write-Host "[OK] Dossier cree: $Dest" -ForegroundColor Green
}

# Copier le build (Copy-Item recursif avec ecrasement)
try {
    Copy-Item -Path "$Source\*" -Destination $Dest -Recurse -Force -ErrorAction Stop
    Write-Host "[OK] Fichiers copies vers $Dest" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Impossible de copier les fichiers." -ForegroundColor Red
    Write-Host "Raison: $_" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Verifier que index.html existe apres la copie
if (-not (Test-Path (Join-Path $Dest "index.html"))) {
    Write-Host "ERREUR: index.html n'a pas ete copie correctement." -ForegroundColor Red
    Write-Host "Verifie que le dossier build/ contient index.html"
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Construire l'URL file:// (remplacer backslashes de manière robuste)
$IndexPath = Join-Path $Dest "index.html"
$IndexUrl = "file:///" + $IndexPath.Replace("\", "/")

# Vérifier que Edge est installé
if (-not (Get-Command msedge -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: Edge n'est pas installe ou absent du PATH." -ForegroundColor Red
    Write-Host "Installez Edge depuis https://www.microsoft.com/edge/"
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Ouvrir Edge en mode app (sans barre d'adresse)
Write-Host "[OK] Lancement de Edge..." -ForegroundColor Green
Start-Process "msedge" -ArgumentList "--app=`"$IndexUrl`"", "--disable-web-security", "--allow-file-access-from-files"
