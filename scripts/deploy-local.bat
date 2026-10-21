@echo off
chcp 65001 >nul
setlocal EnableExtensions

set "REMOTE_HOST=tx"
set "REMOTE_APP=/var/www/zeshawn-site"
set "ARCHIVE=next-standalone.tar.gz"
set "REMOTE_SCRIPT=server-deploy.sh"

if not "%~1"=="" set "REMOTE_HOST=%~1"

set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%..") do set "PROJECT_DIR=%%~fi"

echo [1/4] Resolving WSL workspace path...
for /f "delims=" %%i in ('wsl wslpath "%PROJECT_DIR%"') do set "WSL_WORKDIR=%%i"
if not defined WSL_WORKDIR (
  echo ERROR: Failed to resolve WSL path from current directory.
  exit /b 1
)
echo WSL workspace: %WSL_WORKDIR%

echo [2/4] Building in WSL with Linux Node...
wsl bash -lc "cd '%WSL_WORKDIR%' && bash '%WSL_WORKDIR%/scripts/archive/deploy-build-wsl.sh' '%WSL_WORKDIR%'"
if errorlevel 1 (
  echo ERROR: WSL build/package failed.
  exit /b 1
)

echo [3/4] Uploading local build archive and deployment script...
scp "%PROJECT_DIR%\%ARCHIVE%" "%REMOTE_HOST%:%REMOTE_APP%/%ARCHIVE%"
if errorlevel 1 (
  echo ERROR: Upload archive failed.
  exit /b 1
)
scp "%PROJECT_DIR%\scripts\server-deploy.sh" "%REMOTE_HOST%:%REMOTE_APP%/%REMOTE_SCRIPT%"
if errorlevel 1 (
  echo ERROR: Upload %REMOTE_SCRIPT% failed.
  exit /b 1
)

echo [4/4] Deploying and restarting server...
ssh %REMOTE_HOST% "set -euo pipefail; chmod +x %REMOTE_APP%/%REMOTE_SCRIPT%; sudo bash %REMOTE_APP%/%REMOTE_SCRIPT% %REMOTE_APP% %ARCHIVE% zeshawn-next"
if errorlevel 1 (
  echo ERROR: Remote deploy failed.
  exit /b 1
)

echo Local build deployment successful.
exit /b 0