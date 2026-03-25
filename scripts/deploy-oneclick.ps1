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

$remoteIp = Read-Host '1) 服务器 IP（示例: 8.8.8.8）'
$remoteUser = Read-Host '2) SSH 用户名（示例: root）'
$sshPassword = Read-Host '3) SSH 密码（明文输入）'
$domain = Read-Host '4) 域名（示例: zeshawn.me）'
$email = Read-Host '5) 证书邮箱（示例: admin@example.com）'
$tag = Read-Host '6) 发布标签（留空或填 latest 表示最新）'
$adminUsername = Read-Host '7) 后台管理员用户名（示例: admin）'
$adminPassword = Read-Host '8) 后台管理员密码'

if ([string]::IsNullOrWhiteSpace($remoteIp)) { throw '错误: 服务器 IP 不能为空。' }
if ([string]::IsNullOrWhiteSpace($remoteUser)) { throw '错误: SSH 用户名不能为空。' }
if ([string]::IsNullOrWhiteSpace($domain)) { throw '错误: 域名不能为空。' }
if ([string]::IsNullOrWhiteSpace($email)) { throw '错误: 证书邮箱不能为空。' }
if ([string]::IsNullOrWhiteSpace($adminUsername)) { throw '错误: 管理员用户名不能为空。' }
if ([string]::IsNullOrWhiteSpace($adminPassword)) { throw '错误: 管理员密码不能为空。' }

$remoteTarget = "$remoteUser@$remoteIp"

function Resolve-PuttyTool {
  param([Parameter(Mandatory = $true)][string]$ToolName)

  $cmd = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $candidates = @(
    (Join-Path $env:ProgramFiles "PuTTY\$ToolName.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "PuTTY\$ToolName.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\PuTTY\$ToolName.exe")
  )

  foreach ($p in $candidates) {
    if ($p -and (Test-Path $p)) { return $p }
  }

  return $null
}

$usePutty = $false
$plinkPath = Resolve-PuttyTool -ToolName 'plink'
$pscpPath = Resolve-PuttyTool -ToolName 'pscp'
if ($plinkPath -and $pscpPath -and -not [string]::IsNullOrEmpty($sshPassword)) { $usePutty = $true }

if ($usePutty) {
  Write-Host 'SSH 连接方式: PuTTY 密码登录（无需预配置密钥）'
} else {
  Write-Host 'SSH 连接方式: OpenSSH 交互登录（无需 SSH Host 别名）'
  Write-Host '说明: 当前未检测到可用的 PuTTY 工具，将使用 OpenSSH 并在各步骤交互输入密码。'
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

  if ($usePutty) {
    $args = @('-ssh', '-pw', $sshPassword)
    if ($WithReverseProxy) {
      $args += @('-R', "${remoteProxyPort}:${localProxyHost}:${localProxyPort}")
    }
    $args += @($remoteTarget, $Command)
    & $plinkPath @args
  } else {
    $args = @()
    $args += @('-o', 'PreferredAuthentications=password', '-o', 'PubkeyAuthentication=no')
    if ($WithReverseProxy) {
      $args += @('-R', "${remoteProxyPort}:${localProxyHost}:${localProxyPort}")
    }
    $args += @($remoteTarget, $Command)
    & ssh @args
  }

  if ($LASTEXITCODE -ne 0) {
    throw "远程命令执行失败, 退出码: $LASTEXITCODE"
  }
}

function Copy-ToRemote {
  param(
    [Parameter(Mandatory = $true)][string]$LocalFile,
    [Parameter(Mandatory = $true)][string]$RemoteFile
  )

  if ($usePutty) {
    & $pscpPath '-pw' $sshPassword $LocalFile "$remoteTarget`:$RemoteFile"
  } else {
    $args = @()
    $args += @('-o', 'PreferredAuthentications=password', '-o', 'PubkeyAuthentication=no')
    $args += @($LocalFile, "$remoteTarget`:$RemoteFile")
    & scp @args
  }

  if ($LASTEXITCODE -ne 0) {
    throw "文件上传失败: $LocalFile -> $RemoteFile"
  }
}

$tmpAuth = Join-Path $env:TEMP ("zeshawn-auth-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$remoteAuthTmp = "$remoteApp/auth-input.tmp"
$adminUserB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($adminUsername))
$adminPassB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($adminPassword))
@(
  "ADMIN_USERNAME_B64=$adminUserB64"
  "ADMIN_PASSWORD_B64=$adminPassB64"
) | Set-Content -Path $tmpAuth -Encoding ASCII

try {
  Write-Host '[1/6] 正在让服务器下载发布包...'
  Write-Host "版本: $releaseLabel"
  Write-Host "URL: $releaseUrl"
  Invoke-RemoteCommand -WithReverseProxy -Command "set -euo pipefail; mkdir -p $remoteApp; cd $remoteApp; HTTPS_PROXY=http://127.0.0.1:$remoteProxyPort HTTP_PROXY=http://127.0.0.1:$remoteProxyPort ALL_PROXY=socks5h://127.0.0.1:$remoteProxyPort curl -fL --retry 3 --retry-delay 2 -o $archive '$releaseUrl'"

  Write-Host '[2/6] 正在上传服务器脚本...'
  Copy-ToRemote -LocalFile (Join-Path $PSScriptRoot $remoteDeployScript) -RemoteFile "$remoteApp/$remoteDeployScript"
  Copy-ToRemote -LocalFile (Join-Path $PSScriptRoot $remoteInitScript) -RemoteFile "$remoteApp/$remoteInitScript"
  Copy-ToRemote -LocalFile $tmpAuth -RemoteFile $remoteAuthTmp

  Write-Host '[3/6] 正在部署文件 (此步骤不重启服务)...'
  Invoke-RemoteCommand -Command "set -euo pipefail; chmod +x $remoteApp/$remoteDeployScript; bash $remoteApp/$remoteDeployScript $remoteApp $archive $serviceName no-restart"

  Write-Host '[4/6] 正在初始化服务器 (nginx / systemd / certbot / Node / 后台环境)...'
  Invoke-RemoteCommand -Command "set -euo pipefail; chmod +x $remoteApp/$remoteInitScript; sudo bash $remoteApp/$remoteInitScript $domain $email $remoteApp $serviceName $remoteAuthTmp"

  Write-Host '[5/6] 正在确认后台环境变量...'
  Invoke-RemoteCommand -Command "set -euo pipefail; sudo test -f /etc/systemd/system/$serviceName.service.d/env.conf"

  Write-Host '[6/6] 正在重启并验证服务状态...'
  Invoke-RemoteCommand -Command "set -euo pipefail; sudo systemctl restart $serviceName; sudo systemctl is-active --quiet $serviceName"

  Write-Host ''
  Write-Host '部署完成。'
  Write-Host "后台管理员账号: $adminUsername"
  Write-Host '密码哈希和 JWT_SECRET 已在服务器端生成并写入 systemd 环境变量.'
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
