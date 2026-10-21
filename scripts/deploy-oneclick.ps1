$ErrorActionPreference = 'Stop'

$remoteApp = '/var/www/zeshawn-site'
$archive = 'zeshawn-site.tar.gz'
$remoteDeployScript = 'server-deploy.sh'
$remoteInitScript = 'server-init.sh'
$repo = 'Zeshawn-z/zeshawn-site'
$localProxyHost = '127.0.0.1'
$localProxyPort = 7890
$remoteProxyPort = 17890
$serviceName = 'zeshawn-next'

Write-Host '============================================'
Write-Host ' 一键部署向导'
Write-Host ' 请按提示输入后回车'
Write-Host '============================================'
Write-Host ''

$remoteHostAlias = Read-Host '1) SSH Host 别名（默认: tx）'
$domain = Read-Host '2) 域名（示例: zeshawn.me）'
$email = Read-Host '3) 证书邮箱（示例: admin@example.com）'
$tag = Read-Host '4) 发布标签（留空或填 latest 表示最新）'
$adminUsername = Read-Host '5) 后台管理员用户名（可留空跳过初始化）'
$adminPassword = Read-Host '6) 后台管理员密码（可留空跳过初始化）'

if ([string]::IsNullOrWhiteSpace($remoteHostAlias)) { $remoteHostAlias = 'tx' }
if ([string]::IsNullOrWhiteSpace($domain)) { throw '错误: 域名不能为空。' }
if ([string]::IsNullOrWhiteSpace($email)) { throw '错误: 证书邮箱不能为空。' }

$adminInitEnabled = -not [string]::IsNullOrWhiteSpace($adminUsername) -or -not [string]::IsNullOrWhiteSpace($adminPassword)
if ($adminInitEnabled -and ([string]::IsNullOrWhiteSpace($adminUsername) -or [string]::IsNullOrWhiteSpace($adminPassword))) {
  throw '错误: 若要初始化管理员，用户名和密码必须同时填写；迁移数据库场景请两项都留空。'
}

$remoteTarget = $remoteHostAlias

Write-Host "SSH 连接方式: OpenSSH Host 别名登录（ssh $remoteTarget）"
Write-Host '说明: 请确保 ~/.ssh/config 中已配置对应 Host 且可免密或可交互认证。'
if ($adminInitEnabled) {
  Write-Host '管理员初始化: 已启用（将覆盖服务环境中的后台账号配置）'
} else {
  Write-Host '管理员初始化: 已跳过（适用于迁移数据库场景）'
}

if ([string]::IsNullOrWhiteSpace($tag) -or $tag -eq 'latest') { $tag = '' }
if ($tag -eq '') {
  $releaseUrl = "https://github.com/$repo/releases/latest/download/$archive"
  $releaseLabel = 'latest'
} else {
  $releaseUrl = "https://github.com/$repo/releases/download/$tag/$archive"
  $releaseLabel = $tag
}

function Invoke-RemoteCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [switch]$WithReverseProxy
  )

  $args = @()
  if ($WithReverseProxy) {
    $args += @('-R', "${remoteProxyPort}:${localProxyHost}:${localProxyPort}")
  }
  $args += @($remoteTarget, $Command)
  & ssh @args

  if ($LASTEXITCODE -ne 0) {
    throw "远程命令执行失败, 退出码: $LASTEXITCODE"
  }
}

function Copy-ToRemote {
  param(
    [Parameter(Mandatory = $true)][string]$LocalFile,
    [Parameter(Mandatory = $true)][string]$RemoteFile
  )

  $remoteBasename = [System.IO.Path]::GetFileName($RemoteFile)
  $slashIndex = $RemoteFile.LastIndexOf('/')
  $remoteDir = if ($slashIndex -gt 0) { $RemoteFile.Substring(0, $slashIndex) } else { '/' }
  $remoteTmp = "/tmp/$remoteBasename.$([guid]::NewGuid().ToString('N')).tmp"

  & scp $LocalFile "$remoteTarget`:$remoteTmp"

  if ($LASTEXITCODE -ne 0) {
    throw "文件上传失败: $LocalFile -> $RemoteFile"
  }

  Invoke-RemoteCommand -Command "set -euo pipefail; sudo mkdir -p '$remoteDir'; sudo mv '$remoteTmp' '$RemoteFile'"
}

$tmpAuth = Join-Path $env:TEMP ("zeshawn-auth-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$remoteAuthTmp = ''
if ($adminInitEnabled) {
  $remoteAuthTmp = "$remoteApp/auth-input.tmp"
  $adminUserB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($adminUsername))
  $adminPassB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($adminPassword))
  @(
    "ADMIN_USERNAME_B64=$adminUserB64"
    "ADMIN_PASSWORD_B64=$adminPassB64"
  ) | Set-Content -Path $tmpAuth -Encoding ASCII
}

try {
  Write-Host '[0/6] 正在验证 SSH Host 别名连通性...'
  Invoke-RemoteCommand -Command 'echo connected'

  Write-Host '[1/6] 正在让服务器下载发布包...'
  Write-Host "版本: $releaseLabel"
  Write-Host "URL: $releaseUrl"
  Invoke-RemoteCommand -WithReverseProxy -Command "set -euo pipefail; HTTPS_PROXY=http://127.0.0.1:$remoteProxyPort HTTP_PROXY=http://127.0.0.1:$remoteProxyPort ALL_PROXY=socks5h://127.0.0.1:$remoteProxyPort curl -fL --retry 3 --retry-delay 2 -o /tmp/$archive '$releaseUrl'; sudo mkdir -p $remoteApp; sudo mv /tmp/$archive $remoteApp/$archive"

  Write-Host '[2/6] 正在上传服务器脚本...'
  Copy-ToRemote -LocalFile (Join-Path $PSScriptRoot $remoteDeployScript) -RemoteFile "$remoteApp/$remoteDeployScript"
  Copy-ToRemote -LocalFile (Join-Path $PSScriptRoot $remoteInitScript) -RemoteFile "$remoteApp/$remoteInitScript"
  if ($adminInitEnabled) {
    Copy-ToRemote -LocalFile $tmpAuth -RemoteFile $remoteAuthTmp
  }

  Write-Host '[3/6] 正在部署文件 (此步骤不重启服务)...'
  Invoke-RemoteCommand -Command "set -euo pipefail; sudo chmod +x $remoteApp/$remoteDeployScript; sudo bash $remoteApp/$remoteDeployScript $remoteApp $archive $serviceName no-restart"

  Write-Host '[4/6] 正在初始化服务器 (nginx / systemd / certbot / Node / 后台环境)...'
  Invoke-RemoteCommand -Command "set -euo pipefail; chmod +x $remoteApp/$remoteInitScript; sudo bash $remoteApp/$remoteInitScript $domain $email $remoteApp $serviceName $remoteAuthTmp"

  if ($adminInitEnabled) {
    Write-Host '[5/6] 正在确认后台环境变量...'
    Invoke-RemoteCommand -Command "set -euo pipefail; sudo test -f /etc/systemd/system/$serviceName.service.d/env.conf"
  } else {
    Write-Host '[5/6] 已跳过后台环境变量初始化确认（迁移数据库模式）'
  }

  Write-Host '[6/6] 正在重启并验证服务状态...'
  Invoke-RemoteCommand -Command "set -euo pipefail; sudo systemctl restart $serviceName; sudo systemctl is-active --quiet $serviceName"

  Write-Host ''
  Write-Host '部署完成。'
  if ($adminInitEnabled) {
    Write-Host "后台管理员账号: $adminUsername"
    Write-Host '密码哈希和 JWT_SECRET 已在服务器端生成并写入 systemd 环境变量.'
  } else {
    Write-Host '已跳过管理员初始化，沿用现有数据库和服务环境中的账号配置。'
  }
  Write-Host '建议: 立即登录后台并验证功能是否正常.'
  exit 0
} catch {
  Write-Host "错误: $($_.Exception.Message)"
  Write-Host '提示: 若证书申请失败，请先检查 DNS 和 80/443 端口。'
  exit 1
} finally {
  if (Test-Path $tmpAuth) {
    Remove-Item -Path $tmpAuth -Force -ErrorAction SilentlyContinue
  }
}
