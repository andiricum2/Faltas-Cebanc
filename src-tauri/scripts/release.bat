@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Usage:
REM   release.bat [PRIVATE_KEY_PATH_OR_BASE64] [DOWNLOAD_BASE_URL] [KEY_PASSWORD] [RELEASE_NOTES] [INSTALLER_PATH]

set PRIVATE_KEY=%~1
set DOWNLOAD_BASE_URL=%~2
set KEY_PASSWORD=%~3
set RELEASE_NOTES=%~4
set INSTALLER_PATH=%~5

if "%PRIVATE_KEY%"=="" set PRIVATE_KEY=src-tauri\secret.key

set PS_ARGS=
if exist "%PRIVATE_KEY%" (
  set PS_ARGS=-PrivateKeyPath "%PRIVATE_KEY%"
) else (
  set PS_ARGS=-PrivateKey "%PRIVATE_KEY%"
)
if not "%KEY_PASSWORD%"=="" set PS_ARGS=%PS_ARGS% -KeyPassword "%KEY_PASSWORD%"
if not "%RELEASE_NOTES%"=="" set PS_ARGS=%PS_ARGS% -ReleaseNotes "%RELEASE_NOTES%"
if not "%INSTALLER_PATH%"=="" set PS_ARGS=%PS_ARGS% -InstallerPath "%INSTALLER_PATH%"
if not "%DOWNLOAD_BASE_URL%"=="" set PS_ARGS=%PS_ARGS% -DownloadBaseUrl "%DOWNLOAD_BASE_URL%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0release.ps1" %PS_ARGS%
exit /b %ERRORLEVEL%


