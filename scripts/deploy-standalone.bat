@echo off
setlocal EnableExtensions

set "ARCHIVE=next-standalone.tar.gz"
set "REMOTE_HOST=ali"
set "REMOTE_APP=/var/www/zeshawn-site"
set "REMOTE_ARCHIVE=%REMOTE_APP%/%ARCHIVE%"
set "WSL_USER=zeshawn"

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
wsl -u %WSL_USER% bash -lc "cd '%WSL_WORKDIR%'; bash '%WSL_WORKDIR%/scripts/deploy-build-wsl.sh' '%WSL_WORKDIR%'"
if errorlevel 1 (
  echo ERROR: WSL build/package failed.
  exit /b 1
)

echo [3/4] Uploading archive...
scp "%PROJECT_DIR%\%ARCHIVE%" "%REMOTE_HOST%:%REMOTE_APP%/"
if errorlevel 1 (
  echo ERROR: Upload archive failed.
  exit /b 1
)

echo [4/4] Deploying on server and restarting service...
ssh %REMOTE_HOST% "set -euo pipefail; rm -rf %REMOTE_APP%/.next/standalone %REMOTE_APP%/.next/static; tar -xzf %REMOTE_ARCHIVE% -C %REMOTE_APP%; mkdir -p %REMOTE_APP%/data; rm -rf %REMOTE_APP%/.next/standalone/data; ln -sf %REMOTE_APP%/data %REMOTE_APP%/.next/standalone/data; sqlite_nodes=$(find %REMOTE_APP%/.next/standalone -type f -name 'better_sqlite3.node'); if [ -z \"$sqlite_nodes\" ]; then echo 'ERROR: better_sqlite3.node not found.'; exit 4; fi; for f in $sqlite_nodes; do file \"$f\" | grep -q 'ELF' || { echo \"ERROR: non-ELF native module: $f\"; exit 5; }; done; sudo systemctl restart zeshawn-next; sudo systemctl is-active --quiet zeshawn-next"
if errorlevel 1 (
  echo ERROR: Remote deploy failed.
  exit /b 1
)

echo Deployment successful.
exit /b 0
