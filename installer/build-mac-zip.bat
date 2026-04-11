@echo off
setlocal

:: ============================================================
:: Orpi PropGen -- Creer le ZIP pour macOS
:: Prerequis: npm, PowerShell
:: ============================================================

set "PROJECT_DIR=%~dp0.."
set "STAGING=%PROJECT_DIR%\dist\OrpiPropGen-Mac"

echo.
echo ========================================
echo  Orpi PropGen - Package Mac
echo ========================================
echo.

:: 1. Build
echo [1/3] Build du projet...
cd /d "%PROJECT_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Le build a echoue.
    pause
    exit /b 1
)
echo [OK] Build termine.
echo.

:: 2. Preparer le dossier
echo [2/3] Preparation du package...
if exist "%STAGING%" rmdir /s /q "%STAGING%"
mkdir "%STAGING%\app"
xcopy "%PROJECT_DIR%\build\*" "%STAGING%\app\" /s /e /q >nul
copy "%~dp0launch-propgen-mac.command" "%STAGING%\" >nul
echo [OK] Package prepare.
echo.

:: 3. Creer le ZIP
echo [3/3] Creation du ZIP...
powershell -Command "Compress-Archive -Path '%STAGING%\*' -DestinationPath '%PROJECT_DIR%\dist\OrpiPropGen-Mac.zip' -Force"
echo [OK] ZIP cree.
echo.

:: Nettoyage
rmdir /s /q "%STAGING%"

echo ========================================
echo  Package Mac pret: dist\OrpiPropGen-Mac.zip
echo ========================================
echo.
pause
endlocal
