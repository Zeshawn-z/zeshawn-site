# zeshawn-site

基于 Next.js App Router 的个人站点模板，包含：

- 首页 / 关于 / 项目 / 博客 / 留言板
- 管理后台（登录后可管理内容）
- SQLite 本地数据存储
- Markdown/PDF 博客文章
- CI 自动构建与 Release 发布

## 1. 快速上手

如果你是第一次部署，直接用一键脚本：

```bat
./scripts/deploy-oneclick.bat
```

脚本会通过标准输入逐项询问：

1. 服务器 IP
2. SSH 用户名
3. SSH 密码
4. 域名（如 `example.com`）
5. Certbot 邮箱
6. Release Tag（留空或 `latest` 表示最新）
7. 管理后台用户名
8. 管理后台密码

脚本会自动完成：

1. 服务器下载 Release 产物
2. 上传并执行 `server-deploy.sh`（部署文件并处理 data 链接）
3. 上传并执行 `server-init.sh`（初始化 nginx/systemd/certbot）
4. 自动生成 `ADMIN_PASSWORD_HASH` 与 `JWT_SECRET` 并写入 systemd 环境变量
5. 启动并验证服务

### 1.1 常见错误回复（先看这里）

#### A. Certbot 失败 / 证书签发失败

常见报错关键词：`Timeout during connect`、`Connection refused`、`Invalid response from`。

优先检查：

1. 域名 A 记录是否指向当前服务器公网 IP。
2. 云防火墙/安全组是否放行 `80`、`443` 端口。
3. 服务器本机防火墙是否放行 `80`、`443`（如 `ufw` / `firewalld`）。
4. `nginx` 是否正在监听 80 端口：

```bash
sudo ss -ltnp | grep ':80'
```

#### B. SSH 连接失败

常见报错关键词：`Permission denied`、`Connection timed out`、`No route to host`。

优先检查：

1. IP、用户名、密码是否正确。
2. 服务器 SSH 服务是否正常：

```bash
sudo systemctl status ssh
```

3. 云防火墙是否放行 `22` 端口。

#### C. Release 下载失败

常见报错关键词：`curl failed`、`Could not resolve host`、`Proxy`。

优先检查：

1. 本机代理是否可用（脚本默认通过本机代理转发到服务器）。
2. GitHub Release 是否存在目标产物 `zeshawn-site.tar.gz`。
3. Tag 是否输入正确。

#### D. 服务启动后 502/空白

优先检查：

1. systemd 服务状态：

```bash
sudo systemctl status zeshawn-next
```

2. 服务日志：

```bash
sudo journalctl -u zeshawn-next -n 200 --no-pager
```

3. data 链接是否正确（standalone 模式应是软链接到 `<app_dir>/data`）。

## 2. 服务器脚本说明（核心）

这两个脚本是服务器侧核心能力：

- `scripts/server-deploy.sh`：部署/更新脚本
- `scripts/server-init.sh`：初始化脚本

### 2.1 server-deploy.sh（部署/更新）

用途：

1. 解压 release 产物
2. 识别运行布局（standalone/root）
3. 修复 data 目录链接
4. 验证原生模块
5. 重启服务（或按参数跳过重启）

手动执行示例：

```bash
bash scripts/server-deploy.sh /var/www/zeshawn-site zeshawn-site.tar.gz zeshawn-next
```

### 2.2 server-init.sh（初始化）

用途：

1. 安装 nginx + certbot
2. 写入 systemd 服务并启动
3. 写入 nginx 配置并 reload
4. 申请 HTTPS 证书
5. 再次校验服务状态

手动执行示例：

```bash
sudo bash scripts/server-init.sh example.com admin@example.com /var/www/zeshawn-site zeshawn-next
```

## 3. deploy-release（仅更新场景）

`scripts/deploy-release.bat` 是个人更新脚本，适合“服务器已初始化完成，仅做版本更新”的场景。

特点：

1. 默认使用本机 SSH Host 别名（如 `ali`）。
2. 从 GitHub Release 下载产物并部署。
3. 不包含首次初始化引导（首次部署请用 `deploy-oneclick.bat`）。

## 4. 数据与隐私

本项目默认只忽略数据库与私有备份目录，`data/*.json` 作为样板数据可提交到 Git：

- `data/*.db`
- `data/*.db-shm`
- `data/*.db-wal`
- `data-private/`

如需团队共享演示数据，请维护脱敏样例文件。

## 5. 服务器配置备份

- Nginx 配置备份：`ops/server-config/nginx/zeshawn.me.conf`
- systemd 服务备份：`ops/server-config/systemd/zeshawn-next.service`
- 环境变量示例：`ops/server-config/systemd/zeshawn-next.service.d/env.conf.example`

## 6. 目录结构

```text
src/
  app/                  # 页面与 API 路由
  components/           # 组件
  lib/                  # 数据访问、鉴权、配置
scripts/
  migrate.ts            # 数据迁移脚本
  deploy-oneclick.bat   # 一键初始化+部署+启动（交互式）
  deploy-release.bat    # 个人更新脚本（hostname 场景）
  server-deploy.sh      # 服务器部署/更新
  server-init.sh        # 服务器初始化
  archive/              # 已归档旧脚本
content/blog/           # 博客内容
data/                   # 样板数据与本地数据库
data-private/           # 私有数据备份（默认忽略）
```

## 7. 开发上手

### 7.1 环境要求

- Node.js 20+
- npm 10+

### 7.2 本地启动

```bash
npm ci
npm run migrate
npm run dev
```

访问：`http://localhost:3000`

### 7.3 常用命令

```bash
npm run dev      # 开发模式
npm run build    # 生产构建
npm run start    # 生产启动
npm run migrate  # 一次性迁移脚本
```

### 7.4 管理后台鉴权

建议通过环境变量配置：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`（bcrypt hash）
- `JWT_SECRET`

未配置时会使用默认值，仅适合本地开发。
