@echo off
setlocal

:: ============================================================
:: Orpi PropGen -- Script de deploiement Windows (Chrome)
:: Double-clic pour copier le build et lancer l'application
:: Aucun droit administrateur requis
:: ============================================================

set "SOURCE=%~dp0build"
set "DEST=%USERPROFILE%\Orpi\PropGen"

echo [Orpi PropGen] Deploiement en cours...

:: Verifier que le dossier build/ existe
if not exist "%SOURCE%" (
    echo ERREUR: Le dossier build/ n'existe pas.
    echo Lancez d'abord: npm run build
    pause
    exit /b 1
)

:: Creer le dossier destination si necessaire
if not exist "%DEST%" (
    mkdir "%DEST%"
    echo [OK] Dossier cree: %DEST%
)

:: Copier le build (robocopy /MIR synchronise, supprime les fichiers obsoletes)
robocopy "%SOURCE%" "%DEST%" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
echo [OK] Fichiers copies vers %DEST%

:: Verifier que index.html existe apres la copie
if not exist "%DEST%\index.html" (
    echo ERREUR: index.html n'a pas ete copie correctement.
    echo Verifie que le dossier build/ contient index.html
    pause
    exit /b 1
)

:: Convertir backslashes en forward slashes pour l'URL Chrome
set "DEST_URL=%DEST:\=/%"

:: Ouvrir Chrome en mode app (sans barre d'adresse)
echo [OK] Lancement de Chrome...
where chrome >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: Chrome n'est pas installe ou absent du PATH.
    echo Installez Chrome depuis https://www.google.com/chrome/
    pause
    exit /b 1
)
start "" "chrome" --app="file:///%DEST_URL%/index.html" --disable-web-security --allow-file-access-from-files

endlocal
