@echo off
setlocal EnableExtensions

set "REMOTE_APP=/var/www/zeshawn-site"
set "ARCHIVE=zeshawn-site.tar.gz"
set "REMOTE_DEPLOY_SCRIPT=server-deploy.sh"
set "REMOTE_INIT_SCRIPT=server-init.sh"
set "REPO=Zeshawn-z/zeshawn-site"
set "LOCAL_PROXY_HOST=127.0.0.1"
set "LOCAL_PROXY_PORT=7890"
set "REMOTE_PROXY_PORT=17890"
set "SERVICE_NAME=zeshawn-next"

set "REMOTE_IP="
set "REMOTE_USER="
set "REMOTE_TARGET="
set "SSH_PASSWORD="
set "USE_PUTTY=0"
set "DOMAIN="
set "EMAIL="
set "TAG="
set "ADMIN_USERNAME="
set "ADMIN_PASSWORD_HASH="
set "JWT_SECRET="
set "TMP_PWD_FILE=%TEMP%\zeshawn-admin-pwd-%RANDOM%.txt"
set "TMP_ENV_FILE=%TEMP%\zeshawn-env-%RANDOM%.conf"
set "REMOTE_ENV_TMP=%REMOTE_APP%/env.conf.tmp"

echo ============================================
echo  一键部署向导（新手模式）
echo  说明：按提示输入，每项输入后按回车
echo ============================================
echo.
set /p "REMOTE_IP=1^)^ 服务器 IP（示例 8.8.8.8）: "
set /p "REMOTE_USER=2^)^ SSH 用户名（示例 root）: "
set /p "SSH_PASSWORD=3^)^ SSH 密码（明文输入）: "
set /p "DOMAIN=4^)^ 域名（示例 zeshawn.me）: "
set /p "EMAIL=5^)^ 证书邮箱（示例 admin@example.com）: "
set /p "TAG=6^)^ Release Tag（留空或填 latest = 最新版本）: "
set /p "ADMIN_USERNAME=7^)^ 后台管理员用户名（示例 admin）: "
powershell -NoProfile -Command "$p = Read-Host '8) 后台管理员密码'; Set-Content -Path '%TMP_PWD_FILE%' -Value $p -NoNewline -Encoding UTF8"
if errorlevel 1 (
  echo 错误：读取管理员密码失败。
  exit /b 1
)

if "%REMOTE_IP%"=="" (
  echo 错误：服务器 IP 不能为空。
  exit /b 1
)
if "%REMOTE_USER%"=="" (
  echo 错误：SSH 用户名不能为空。
  exit /b 1
)

set "REMOTE_TARGET=%REMOTE_USER%@%REMOTE_IP%"

if "%DOMAIN%"=="" (
  echo 错误：域名不能为空。
  exit /b 1
)
if "%EMAIL%"=="" (
  echo 错误：证书邮箱不能为空。
  exit /b 1
)
if "%ADMIN_USERNAME%"=="" (
  echo 错误：管理员用户名不能为空。
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo 错误：本机未检测到 node，无法生成密码哈希和 JWT。
  echo 请先安装 Node.js 20+ 后重试。
  exit /b 1
)

for /f "usebackq delims=" %%i in (`node -e "const fs=require('fs');const bcrypt=require('bcryptjs');const pwd=fs.readFileSync(process.argv[1],'utf8').replace(/^\uFEFF/,'');process.stdout.write(bcrypt.hashSync(pwd,10));" "%TMP_PWD_FILE%"`) do set "ADMIN_PASSWORD_HASH=%%i"
for /f "usebackq delims=" %%i in (`node -e "const crypto=require('crypto');process.stdout.write(crypto.randomBytes(48).toString('hex'));"`) do set "JWT_SECRET=%%i"
del /q "%TMP_PWD_FILE%" >nul 2>nul

if "%ADMIN_PASSWORD_HASH%"=="" (
  echo 错误：生成 ADMIN_PASSWORD_HASH 失败。
  exit /b 1
)
if "%JWT_SECRET%"=="" (
  echo 错误：生成 JWT_SECRET 失败。
  exit /b 1
)

(
  echo [Service]
  echo Environment="ADMIN_USERNAME=%ADMIN_USERNAME%"
  echo Environment="ADMIN_PASSWORD_HASH=%ADMIN_PASSWORD_HASH%"
  echo Environment="JWT_SECRET=%JWT_SECRET%"
) > "%TMP_ENV_FILE%"

where plink >nul 2>nul
if not errorlevel 1 (
  where pscp >nul 2>nul
  if not errorlevel 1 (
    if not "%SSH_PASSWORD%"=="" set "USE_PUTTY=1"
  )
)

if "%USE_PUTTY%"=="1" (
  echo SSH 连接方式：PuTTY 密码登录（无需预配置密钥）
) else (
  echo SSH 连接方式：OpenSSH 交互登录（无需配置 SSH Host 别名）
)

if /I "%TAG%"=="latest" set "TAG="

if "%TAG%"=="" (
  set "RELEASE_URL=https://github.com/%REPO%/releases/latest/download/%ARCHIVE%"
  set "RELEASE_LABEL=latest"
) else (
  set "RELEASE_URL=https://github.com/%REPO%/releases/download/%TAG%/%ARCHIVE%"
  set "RELEASE_LABEL=%TAG%"
)

echo [1/6] 正在让服务器下载发布包...
echo 版本：%RELEASE_LABEL%
echo 下载地址：%RELEASE_URL%
if "%USE_PUTTY%"=="1" (
  plink -ssh -pw "%SSH_PASSWORD%" -R %REMOTE_PROXY_PORT%:%LOCAL_PROXY_HOST%:%LOCAL_PROXY_PORT% %REMOTE_TARGET% "set -euo pipefail; mkdir -p %REMOTE_APP%; cd %REMOTE_APP%; HTTPS_PROXY=http://127.0.0.1:%REMOTE_PROXY_PORT% HTTP_PROXY=http://127.0.0.1:%REMOTE_PROXY_PORT% ALL_PROXY=socks5h://127.0.0.1:%REMOTE_PROXY_PORT% curl -fL --retry 3 --retry-delay 2 -o %ARCHIVE% '%RELEASE_URL%'"
) else (
  ssh -R %REMOTE_PROXY_PORT%:%LOCAL_PROXY_HOST%:%LOCAL_PROXY_PORT% %REMOTE_TARGET% "set -euo pipefail; mkdir -p %REMOTE_APP%; cd %REMOTE_APP%; HTTPS_PROXY=http://127.0.0.1:%REMOTE_PROXY_PORT% HTTP_PROXY=http://127.0.0.1:%REMOTE_PROXY_PORT% ALL_PROXY=socks5h://127.0.0.1:%REMOTE_PROXY_PORT% curl -fL --retry 3 --retry-delay 2 -o %ARCHIVE% '%RELEASE_URL%'"
)
if errorlevel 1 (
  echo 错误：服务器下载发布包失败。
  echo 提示：请检查本机代理、服务器网络、Tag 是否存在。
  exit /b 1
)

echo [2/6] 正在上传服务器脚本...
if "%USE_PUTTY%"=="1" (
  pscp -pw "%SSH_PASSWORD%" "%~dp0%REMOTE_DEPLOY_SCRIPT%" "%REMOTE_TARGET%:%REMOTE_APP%/%REMOTE_DEPLOY_SCRIPT%"
) else (
  scp "%~dp0%REMOTE_DEPLOY_SCRIPT%" "%REMOTE_TARGET%:%REMOTE_APP%/%REMOTE_DEPLOY_SCRIPT%"
)
if errorlevel 1 (
  echo 错误：上传 %REMOTE_DEPLOY_SCRIPT% 失败。
  exit /b 1
)
if "%USE_PUTTY%"=="1" (
  pscp -pw "%SSH_PASSWORD%" "%~dp0%REMOTE_INIT_SCRIPT%" "%REMOTE_TARGET%:%REMOTE_APP%/%REMOTE_INIT_SCRIPT%"
) else (
  scp "%~dp0%REMOTE_INIT_SCRIPT%" "%REMOTE_TARGET%:%REMOTE_APP%/%REMOTE_INIT_SCRIPT%"
)
if errorlevel 1 (
  echo 错误：上传 %REMOTE_INIT_SCRIPT% 失败。
  exit /b 1
)

echo [3/6] 正在部署文件（此步骤不重启服务）...
if "%USE_PUTTY%"=="1" (
  plink -ssh -pw "%SSH_PASSWORD%" %REMOTE_TARGET% "set -euo pipefail; chmod +x %REMOTE_APP%/%REMOTE_DEPLOY_SCRIPT%; bash %REMOTE_APP%/%REMOTE_DEPLOY_SCRIPT% %REMOTE_APP% %ARCHIVE% %SERVICE_NAME% no-restart"
) else (
  ssh %REMOTE_TARGET% "set -euo pipefail; chmod +x %REMOTE_APP%/%REMOTE_DEPLOY_SCRIPT%; bash %REMOTE_APP%/%REMOTE_DEPLOY_SCRIPT% %REMOTE_APP% %ARCHIVE% %SERVICE_NAME% no-restart"
)
if errorlevel 1 (
  echo 错误：部署文件失败。
  exit /b 1
)

echo [4/6] 正在初始化服务器（nginx / systemd / certbot）...
if "%USE_PUTTY%"=="1" (
  plink -ssh -pw "%SSH_PASSWORD%" %REMOTE_TARGET% "set -euo pipefail; chmod +x %REMOTE_APP%/%REMOTE_INIT_SCRIPT%; sudo bash %REMOTE_APP%/%REMOTE_INIT_SCRIPT% %DOMAIN% %EMAIL% %REMOTE_APP% %SERVICE_NAME%"
) else (
  ssh %REMOTE_TARGET% "set -euo pipefail; chmod +x %REMOTE_APP%/%REMOTE_INIT_SCRIPT%; sudo bash %REMOTE_APP%/%REMOTE_INIT_SCRIPT% %DOMAIN% %EMAIL% %REMOTE_APP% %SERVICE_NAME%"
)
if errorlevel 1 (
  echo 错误：服务器初始化失败。
  echo 提示：大概率是域名解析或 80/443 端口未放开，先检查防火墙和安全组。
  exit /b 1
)

echo [5/6] 正在配置后台登录环境变量...
if "%USE_PUTTY%"=="1" (
  pscp -pw "%SSH_PASSWORD%" "%TMP_ENV_FILE%" "%REMOTE_TARGET%:%REMOTE_ENV_TMP%"
) else (
  scp "%TMP_ENV_FILE%" "%REMOTE_TARGET%:%REMOTE_ENV_TMP%"
)
if errorlevel 1 (
  del /q "%TMP_ENV_FILE%" >nul 2>nul
  echo 错误：上传后台环境变量文件失败。
  exit /b 1
)

if "%USE_PUTTY%"=="1" (
  plink -ssh -pw "%SSH_PASSWORD%" %REMOTE_TARGET% "set -euo pipefail; sudo mkdir -p /etc/systemd/system/%SERVICE_NAME%.service.d; sudo mv %REMOTE_ENV_TMP% /etc/systemd/system/%SERVICE_NAME%.service.d/env.conf; sudo chmod 600 /etc/systemd/system/%SERVICE_NAME%.service.d/env.conf; sudo systemctl daemon-reload"
) else (
  ssh %REMOTE_TARGET% "set -euo pipefail; sudo mkdir -p /etc/systemd/system/%SERVICE_NAME%.service.d; sudo mv %REMOTE_ENV_TMP% /etc/systemd/system/%SERVICE_NAME%.service.d/env.conf; sudo chmod 600 /etc/systemd/system/%SERVICE_NAME%.service.d/env.conf; sudo systemctl daemon-reload"
)
if errorlevel 1 (
  del /q "%TMP_ENV_FILE%" >nul 2>nul
  echo 错误：写入后台环境变量失败。
  exit /b 1
)

echo [6/6] 正在重启并验证服务状态...
if "%USE_PUTTY%"=="1" (
  plink -ssh -pw "%SSH_PASSWORD%" %REMOTE_TARGET% "set -euo pipefail; sudo systemctl restart %SERVICE_NAME%; sudo systemctl is-active --quiet %SERVICE_NAME%"
) else (
  ssh %REMOTE_TARGET% "set -euo pipefail; sudo systemctl restart %SERVICE_NAME%; sudo systemctl is-active --quiet %SERVICE_NAME%"
)
if errorlevel 1 (
  del /q "%TMP_ENV_FILE%" >nul 2>nul
  echo 错误：服务重启失败，请登录服务器查看日志。
  echo 命令：sudo journalctl -u %SERVICE_NAME% -n 200 --no-pager
  exit /b 1
)

del /q "%TMP_ENV_FILE%" >nul 2>nul

echo.
echo 部署完成！
echo 后台管理员账号：%ADMIN_USERNAME%
echo 已自动生成 JWT_SECRET 并写入 systemd 环境变量。
echo 建议：立即使用新账号登录后台，确认功能正常。
exit /b 0
