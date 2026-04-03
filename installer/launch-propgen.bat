@echo off
setlocal

:: ============================================================
:: Orpi PropGen -- Lanceur application
:: Ouvre PropGen dans Chrome ou Edge en mode application
:: ============================================================

set "APPDIR=%~dp0app"
set "INDEX=%APPDIR%\index.html"

:: Verifier que l'application est presente
if not exist "%INDEX%" (
    echo ERREUR: L'application n'est pas installee correctement.
    echo Fichier manquant: %INDEX%
    echo Veuillez reinstaller Orpi PropGen.
    pause
    exit /b 1
)

:: Convertir en URL file://
set "APP_URL=%INDEX:\=/%"

:: Essayer Chrome d'abord, puis Edge
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start "" "chrome" --app="file:///%APP_URL%" --disable-web-security --allow-file-access-from-files
    goto :end
)

:: Essayer Edge
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start "" "msedge" --app="file:///%APP_URL%" --disable-web-security --allow-file-access-from-files
    goto :end
)

:: Essayer le chemin complet Edge (pas toujours dans PATH)
set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE_PATH%" (
    start "" "%EDGE_PATH%" --app="file:///%APP_URL%" --disable-web-security --allow-file-access-from-files
    goto :end
)

:: Aucun navigateur compatible
echo ERREUR: Aucun navigateur compatible trouve.
echo Installez Chrome ou Edge pour utiliser Orpi PropGen.
pause
exit /b 1

:end
endlocal
