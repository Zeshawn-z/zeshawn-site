@echo off
setlocal EnableExtensions

set "REMOTE_HOST=ali"
set "REMOTE_APP=/var/www/zeshawn-site"
set "ARCHIVE=zeshawn-site.tar.gz"
set "REMOTE_SCRIPT=server-deploy.sh"
set "REPO=Zeshawn-z/zeshawn-site"
set "LOCAL_PROXY_HOST=127.0.0.1"
set "LOCAL_PROXY_PORT=7890"
set "REMOTE_PROXY_PORT=17890"

REM 默认使用最新 release，也支持命令行传入指定标签
set "TAG=%~1"
if /I "%TAG%"=="latest" set "TAG="

if "%TAG%"=="" (
  set "RELEASE_URL=https://github.com/%REPO%/releases/latest/download/%ARCHIVE%"
  set "RELEASE_LABEL=latest"
) else (
  set "RELEASE_URL=https://github.com/%REPO%/releases/download/%TAG%/%ARCHIVE%"
  set "RELEASE_LABEL=%TAG%"
)

echo [1/3] Downloading release archive on server...
echo Release: %RELEASE_LABEL%
echo URL: %RELEASE_URL%
echo Proxy: server 127.0.0.1:%REMOTE_PROXY_PORT% -> local %LOCAL_PROXY_HOST%:%LOCAL_PROXY_PORT%

ssh -R %REMOTE_PROXY_PORT%:%LOCAL_PROXY_HOST%:%LOCAL_PROXY_PORT% %REMOTE_HOST% "set -euo pipefail; mkdir -p %REMOTE_APP%; cd %REMOTE_APP%; HTTPS_PROXY=http://127.0.0.1:%REMOTE_PROXY_PORT% HTTP_PROXY=http://127.0.0.1:%REMOTE_PROXY_PORT% ALL_PROXY=socks5h://127.0.0.1:%REMOTE_PROXY_PORT% curl -fL --retry 3 --retry-delay 2 -o %ARCHIVE% '%RELEASE_URL%'"
if errorlevel 1 (
  echo ERROR: Download release archive failed. Please ensure local Clash proxy is running at %LOCAL_PROXY_HOST%:%LOCAL_PROXY_PORT%.
  exit /b 1
)

echo [2/3] Uploading and executing server deployment script...
scp "%~dp0%REMOTE_SCRIPT%" "%REMOTE_HOST%:%REMOTE_APP%/%REMOTE_SCRIPT%"
if errorlevel 1 (
  echo ERROR: Upload %REMOTE_SCRIPT% failed.
  exit /b 1
)

echo [3/3] Running server deploy...
ssh %REMOTE_HOST% "set -euo pipefail; chmod +x %REMOTE_APP%/%REMOTE_SCRIPT%; bash %REMOTE_APP%/%REMOTE_SCRIPT% %REMOTE_APP% %ARCHIVE% zeshawn-next"
if errorlevel 1 (
  echo ERROR: Server deploy failed.
  exit /b 1
)

echo Deployment from GitHub Release successful.
exit /b 0
