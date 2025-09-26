@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Usage:
REM   release.bat <PRIVATE_KEY_PATH> <DOWNLOAD_BASE_URL> [KEY_PASSWORD] [RELEASE_NOTES]
REM Examples:
REM   release.bat C:\keys\tauri.key "https://github.com/USER/REPO/releases/download/v0.1.0" mypass "Notas de la versión"

REM Params
set PRIVATE_KEY=%~1
set DOWNLOAD_BASE_URL=%~2
set KEY_PASSWORD=%~3
set RELEASE_NOTES=%~4

REM Move to repo root if called from elsewhere
pushd "%~dp0.." >nul 2>&1

REM Build Next and Tauri bundles
call npm run build || goto :error
call npx --yes @tauri-apps/cli build -f --config src-tauri/tauri.conf.json || call npm run dist || goto :error

REM Find built NSIS installer (x64)
for /r "src-tauri\target\release\bundle\nsis" %%F in (*_x64-setup.exe) do (
  set INSTALLER=%%F
)
if "!INSTALLER!"=="" (
  echo [ERROR] NSIS installer not found under src-tauri\target\release\bundle\nsis
  goto :error
)

echo Found installer: !INSTALLER!

REM Extract version from tauri.conf.json using PowerShell
for /f "usebackq tokens=*" %%V in (`powershell -NoProfile -Command "(Get-Content src-tauri/tauri.conf.json -Raw | ConvertFrom-Json).version"`) do set APP_VERSION=%%V
if "!APP_VERSION!"=="" (
  echo [ERROR] Could not read version from src-tauri\tauri.conf.json
  goto :error
)

echo Version: !APP_VERSION!

REM Defaults
if "%PRIVATE_KEY%"=="" set PRIVATE_KEY=src-tauri\secret.key
if not exist "%PRIVATE_KEY%" (
  echo [ERROR] Private key not found at "%PRIVATE_KEY%". Pass path as first arg or place it at src-tauri\secret.key
  goto :error
)
if "%DOWNLOAD_BASE_URL%"=="" set DOWNLOAD_BASE_URL=https://github.com/andiricum2/Faltas-Cebanc/releases/download/v!APP_VERSION!
echo Using PRIVATE_KEY: %PRIVATE_KEY%
echo Using DOWNLOAD_BASE_URL: %DOWNLOAD_BASE_URL%

REM Use PowerShell helper to sign and generate latest.json
set PS_ARGS=
if exist "%PRIVATE_KEY%" (
  set PS_ARGS=-PrivateKeyPath "%PRIVATE_KEY%"
) else (
  set PS_ARGS=-PrivateKey "%PRIVATE_KEY%"
)
if not "%KEY_PASSWORD%"=="" set PS_ARGS=%PS_ARGS% -KeyPassword "%KEY_PASSWORD%"
if not "%RELEASE_NOTES%"=="" set PS_ARGS=%PS_ARGS% -ReleaseNotes "%RELEASE_NOTES%"
if not "%DOWNLOAD_BASE_URL%"=="" set PS_ARGS=%PS_ARGS% -DownloadBaseUrl "%DOWNLOAD_BASE_URL%"

powershell -NoProfile -ExecutionPolicy Bypass -File src-tauri/scripts/release.ps1 %PS_ARGS% || goto :error

echo Done.
popd >nul 2>&1
exit /b 0

:error
echo Build/sign/release failed.
popd >nul 2>&1
exit /b 1
