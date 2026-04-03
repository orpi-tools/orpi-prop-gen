@echo off
setlocal

:: ============================================================
:: Orpi PropGen -- Build + creation de l'installateur
:: Prerequis: Node.js, npm, Inno Setup 6 (iscc.exe dans le PATH)
:: ============================================================

set "PROJECT_DIR=%~dp0.."
set "ISS_FILE=%~dp0propgen-setup.iss"

echo.
echo ========================================
echo  Orpi PropGen - Build Installateur
echo ========================================
echo.

:: 1. Verifier que npm est disponible
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: npm n'est pas installe ou absent du PATH.
    pause
    exit /b 1
)

:: 2. Build du projet SvelteKit
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

:: 3. Verifier que le dossier build/ existe
if not exist "%PROJECT_DIR%\build\index.html" (
    echo ERREUR: build/index.html introuvable apres le build.
    pause
    exit /b 1
)

:: 4. Chercher iscc.exe (Inno Setup Compiler)
set "ISCC="

:: Chercher dans le PATH
where iscc >nul 2>nul
if %errorlevel% equ 0 (
    set "ISCC=iscc"
    goto :found_iscc
)

:: Chercher dans les emplacements classiques
for %%P in (
    "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
    "%ProgramFiles%\Inno Setup 6\ISCC.exe"
    "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
) do (
    if exist %%P (
        set "ISCC=%%~P"
        goto :found_iscc
    )
)

echo ERREUR: Inno Setup (ISCC.exe) introuvable.
echo Installez Inno Setup 6 depuis: https://jrsoftware.org/isdl.php
pause
exit /b 1

:found_iscc
echo [2/3] Compilation de l'installateur...
"%ISCC%" "%ISS_FILE%"
if %errorlevel% neq 0 (
    echo ERREUR: La compilation de l'installateur a echoue.
    pause
    exit /b 1
)
echo [OK] Installateur cree.
echo.

:: 5. Afficher le resultat
echo [3/3] Resultat:
echo.
dir "%PROJECT_DIR%\dist\OrpiPropGen-Setup-*.exe" 2>nul
echo.
echo ========================================
echo  Installateur pret dans: dist\
echo ========================================
echo.

pause
endlocal
