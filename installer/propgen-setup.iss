; ============================================================
; Orpi PropGen -- Script Inno Setup
; Genere un installateur .exe autonome
; ============================================================
; Prerequis : Inno Setup 6+ (https://jrsoftware.org/isinfo.php)
; Compilation : iscc.exe propgen-setup.iss
; ============================================================

#define MyAppName "Orpi PropGen"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Orpi"
#define MyAppExeName "launch-propgen.bat"

[Setup]
AppId={{A3F2B8C1-7D4E-4A9F-B6E2-1C8D5F3A7B90}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={userpf}\{#MyAppName}
DefaultGroupName={#MyAppName}
; Pas besoin de droits admin -- installation dans le profil utilisateur
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=OrpiPropGen-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
; Desactiver la page de selection de dossier pour simplifier
DisableDirPage=no
; Pas de licence a accepter
LicenseFile=
; Icone de l'installateur (utilise l'icone par defaut si absente)
; SetupIconFile=..\static\logos\orpi-logo.ico
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName={#MyAppName}

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "Creer un raccourci sur le Bureau"; GroupDescription: "Raccourcis:"; Flags: checked

[Files]
; Application web (contenu du dossier build/)
Source: "..\build\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
; Lanceur
Source: "launch-propgen.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Menu Demarrer
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Comment: "Lancer Orpi PropGen"
Name: "{group}\Desinstaller {#MyAppName}"; Filename: "{uninstallexe}"
; Bureau
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon; Comment: "Lancer Orpi PropGen"

[Run]
; Lancer l'application apres l'installation
Filename: "{app}\{#MyAppExeName}"; Description: "Lancer {#MyAppName}"; Flags: nowait postinstall skipifsilent shellexec
