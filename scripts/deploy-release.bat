@echo off
setlocal EnableExtensions

set "REMOTE_HOST=ali"
set "REMOTE_APP=/var/www/zeshawn-site"
set "ARCHIVE=zeshawn-site.tar.gz"
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

echo [2/3] Extracting archive and linking data directory...
ssh %REMOTE_HOST% "set -euo pipefail; ts=$(date +%Y%m%d-%H%M%S); backup_dir=%REMOTE_APP%/backups/data-$ts; mkdir -p $backup_dir; if [ -d %REMOTE_APP%/data ]; then cp -a %REMOTE_APP%/data/. $backup_dir/; fi; echo backup_data_dir=$backup_dir; service_wd=$(systemctl show zeshawn-next -p WorkingDirectory --value 2>/dev/null || true); mode=auto; if [ \"$service_wd\" = \"%REMOTE_APP%\" ]; then mode=root; elif [ \"$service_wd\" = \"%REMOTE_APP%/.next/standalone\" ]; then mode=standalone; fi; manifest=$(mktemp); tar -tzf %REMOTE_APP%/%ARCHIVE% > \"$manifest\"; has_standalone=0; has_root=0; if grep -q '^\./\.next/standalone/' \"$manifest\"; then has_standalone=1; fi; if grep -q '^\./server\.js$' \"$manifest\"; then has_root=1; fi; if [ \"$mode\" = auto ]; then if [ \"$has_standalone\" = 1 ]; then mode=standalone; elif [ \"$has_root\" = 1 ]; then mode=root; else echo 'ERROR: unknown archive layout'; rm -f \"$manifest\"; exit 6; fi; fi; echo deploy_mode=$mode; if [ \"$mode\" = standalone ]; then if [ \"$has_standalone\" = 1 ]; then rm -rf %REMOTE_APP%/.next/standalone %REMOTE_APP%/.next/static; tar -xzf %REMOTE_APP%/%ARCHIVE% -C %REMOTE_APP%; elif [ \"$has_root\" = 1 ]; then rm -rf %REMOTE_APP%/.next/standalone %REMOTE_APP%/.next/static; mkdir -p %REMOTE_APP%/.next/standalone; tar -xzf %REMOTE_APP%/%ARCHIVE% -C %REMOTE_APP%/.next/standalone; if [ -d %REMOTE_APP%/.next/standalone/.next/static ]; then mkdir -p %REMOTE_APP%/.next; mv %REMOTE_APP%/.next/standalone/.next/static %REMOTE_APP%/.next/static; fi; if [ -d %REMOTE_APP%/.next/standalone/public ]; then rm -rf %REMOTE_APP%/public; mv %REMOTE_APP%/.next/standalone/public %REMOTE_APP%/public; fi; rmdir %REMOTE_APP%/.next/standalone/.next 2>/dev/null || true; else echo 'ERROR: archive layout incompatible with standalone mode'; rm -f \"$manifest\"; exit 8; fi; work_dir=%REMOTE_APP%/.next/standalone; else if [ \"$has_root\" = 1 ]; then rm -rf %REMOTE_APP%/.next/static %REMOTE_APP%/public %REMOTE_APP%/node_modules; rm -f %REMOTE_APP%/server.js %REMOTE_APP%/package.json; tar -xzf %REMOTE_APP%/%ARCHIVE% -C %REMOTE_APP%; work_dir=%REMOTE_APP%; else echo 'ERROR: root mode requires archive with ./server.js'; rm -f \"$manifest\"; exit 9; fi; fi; rm -f \"$manifest\"; mkdir -p %REMOTE_APP%/data; if [ \"$work_dir\" = \"%REMOTE_APP%\" ]; then echo work_dir=app_root; else mkdir -p \"$work_dir\"; rm -rf \"$work_dir/data\"; ln -sfn %REMOTE_APP%/data \"$work_dir/data\"; fi; sqlite_nodes=$(find \"$work_dir\" -type f -name 'better_sqlite3.node'); if [ -z \"$sqlite_nodes\" ]; then echo 'ERROR: better_sqlite3.node not found.'; exit 4; fi; for f in $sqlite_nodes; do file \"$f\" | grep -q 'ELF' || { echo \"ERROR: non-ELF native module: $f\"; exit 5; }; done"
if errorlevel 1 (
  echo ERROR: Extract/verify failed.
  exit /b 1
)

echo [3/3] Restarting service...
ssh %REMOTE_HOST% "set -euo pipefail; sudo systemctl restart zeshawn-next; sudo systemctl is-active --quiet zeshawn-next"
if errorlevel 1 (
  echo ERROR: Service restart failed.
  exit /b 1
)

echo Deployment from GitHub Release successful.
exit /b 0
