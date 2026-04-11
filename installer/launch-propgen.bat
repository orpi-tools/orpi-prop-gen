@echo off
setlocal

:: ============================================================
:: Orpi PropGen -- Lanceur application
:: Demarre un serveur local et ouvre l'app dans le navigateur
:: ============================================================

set "APPDIR=%~dp0app"
set "PORT=8491"
set "URL=http://localhost:%PORT%"

:: Verifier que l'application est presente
if not exist "%APPDIR%\index.html" (
    echo ERREUR: L'application n'est pas installee correctement.
    echo Fichier manquant: %APPDIR%\index.html
    echo Veuillez reinstaller Orpi PropGen.
    pause
    exit /b 1
)

:: Verifier si le port est deja utilise (instance deja lancee)
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo Orpi PropGen est deja lance.
    start "" "%URL%"
    exit /b 0
)

:: Demarrer le serveur en arriere-plan
start "OrpiPropGenServer" /min powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0serve.ps1" %PORT% "%APPDIR%"

:: Attendre que le serveur soit pret
:wait_server
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>nul
if %errorlevel% neq 0 goto :wait_server

:: Ouvrir dans le navigateur par defaut
start "" "%URL%"

endlocal
