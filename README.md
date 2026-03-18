# zeshawn-site

基于 Next.js App Router 的个人站点模板，包含：

- 首页/关于/项目/博客/留言板
- 管理后台（登录后可管理数据）
- SQLite 本地数据存储
- MDX 博客内容支持
- Standalone 构建与服务器部署脚本

## 1. 环境要求

- Node.js 20+
- npm 10+
- （可选，Windows 部署推荐）WSL2 + Ubuntu
- 远程服务器可通过 SSH 访问

## 2. 快速开始

```bash
npm ci
```

首次使用建议执行一次数据迁移（将 `data/*.json`、`content/blog/*`、默认站点配置导入 SQLite）：

```bash
npm run migrate
```

启动开发环境：

```bash
npm run dev
```

访问：`http://localhost:3000`

## 3. 常用命令

```bash
npm run dev      # 开发模式
npm run build    # 生产构建
npm run start    # 生产启动
npm run migrate  # 一次性迁移脚本
```

## 4. 配置说明

### 4.1 管理后台鉴权

后台登录逻辑位于 `src/lib/auth.ts`，建议通过环境变量配置：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`（bcrypt hash）
- `JWT_SECRET`

未配置时会使用默认值，仅适合本地开发。

### 4.2 站点配置

`src/lib/site-config.ts` 是公开仓库中的默认模板配置，不包含真实个人信息。

真实内容建议通过后台写入数据库，不直接写入仓库。

## 5. 数据与隐私

本项目默认只忽略数据库与私有备份目录，`data/*.json` 作为样板数据可提交到 Git：

- `data/*.db`
- `data/*.db-shm`
- `data/*.db-wal`
- `data-private/`

如需团队共享演示数据，请单独维护脱敏样例文件。

## 6. 部署（Windows + WSL + SSH）

部署入口脚本：`scripts/deploy-standalone.bat`

它会执行以下流程：

1. 在 WSL 中使用 Linux Node 构建并打包
2. 上传 `next-standalone.tar.gz` 到服务器
3. 服务器解压到 `/var/www/zeshawn-site`
4. 重启 `zeshawn-next` systemd 服务

直接运行：

```bat
./scripts/deploy-standalone.bat
```

也可以直接让服务器从 GitHub Release 下载并部署（无需本地构建）：

说明：该脚本默认下载 CI 产物 `zeshawn-site.tar.gz`。
如果服务器直连 GitHub 不通，脚本会通过 SSH 反向端口转发使用本地 Clash 代理（默认 `127.0.0.1:7890`）。

```bat
./scripts/deploy-release.bat
```

默认会使用最新 release（latest），也可传入其它标签：

```bat
./scripts/deploy-release.bat v2026.03.17.1
```

`deploy-release.bat` 支持两种服务运行模式：

- standalone 模式：`WorkingDirectory=/var/www/zeshawn-site/.next/standalone`
- root 模式：`WorkingDirectory=/var/www/zeshawn-site`

脚本会自动检测当前服务模式并按对应方式解压与链接 data 目录。

### 部署前请确认

- 本机 SSH Host 已配置 `ali`
- 服务器目录为 `/var/www/zeshawn-site`
- 服务器已有 `zeshawn-next` systemd 服务
- WSL 用户与 bat 脚本中的 `WSL_USER` 一致（默认是 `zeshawn`）

如需修改部署目标，可编辑：`scripts/deploy-standalone.bat`。

## 7. 目录结构（关键部分）

```text
src/
	app/                  # 页面与 API 路由
	components/           # 组件
	lib/                  # 数据访问、鉴权、配置
scripts/
	migrate.ts            # 数据迁移脚本
	deploy-build-wsl.sh   # WSL 构建脚本
	deploy-standalone.bat # 部署入口
	deploy-release.bat    # 服务器从 Release 下载并部署
	server-init.sh        # 服务器初始化（nginx/systemd/certbot）
content/blog/           # MDX 博客内容
data/                   # 样板数据与本地数据库
data-private/           # 私有数据备份（默认忽略）
```

## 8. 注意事项

- `npm run migrate` 主要用于初始化，不建议在生产反复执行。
- 如果你改了数据库结构，请同步调整 `scripts/migrate.ts` 与 `src/lib/schema.ts`。
- 部署失败时，优先检查：WSL Node 路径、SSH 可达性、服务器 systemd 日志。

## 9. 服务器配置备份

- Nginx 站点配置备份：`ops/server-config/nginx/zeshawn.me.conf`
- systemd 服务配置备份：`ops/server-config/systemd/zeshawn-next.service`
- 环境变量示例（脱敏）：`ops/server-config/systemd/zeshawn-next.service.d/env.conf.example`

## 10. 服务器初始部署（含 Certbot）

首次在服务器初始化时可使用：

```bash
sudo bash scripts/server-init.sh <domain> <email> [app_dir] [service_name]
```

示例：

```bash
sudo bash scripts/server-init.sh zeshawn.me admin@example.com
```

脚本会自动完成：

1. 安装 nginx + certbot
2. 配置数据目录软链接（`<app_dir>/data` -> `<app_dir>/.next/standalone/data`）
3. 配置并启动 systemd 服务
4. 配置 nginx 反代与静态目录
5. 申请并启用 HTTPS 证书

产物结构兼容说明：

- 支持直接解压到项目根目录（`<app_dir>/server.js`）
- 也支持旧结构（`<app_dir>/.next/standalone/server.js`）

升级建议：

- 推荐使用 standalone 运行布局（`<app_dir>/.next/standalone/server.js`），与 `deploy-release.bat` 的升级路径最一致。
- 如果当前是 root 运行布局（`<app_dir>/server.js`），请确保升级脚本也会更新根目录 `server.js`，否则可能出现“服务运行正常但代码未升级”的情况。

说明：脚本会按你传入的域名原样配置，不会自动拼接 `www`。

### 10.1 可改项说明

你通常只需要改这 4 个输入参数：

1. domain
说明：你的主域名。
示例：zeshawn.me 或 example.com。

2. email
说明：Certbot 用于签发证书和续期提醒的邮箱。
示例：admin@example.com。

3. app_dir（可选）
说明：站点部署目录，默认 /var/www/zeshawn-site。
什么时候改：你把项目部署在其它目录时。

4. service_name（可选）
说明：systemd 服务名，默认 zeshawn-next。
什么时候改：同机部署多个站点，或你想用统一命名规范时。

### 10.2 常见改法示例

使用默认目录与默认服务名：

```bash
sudo bash scripts/server-init.sh example.com admin@example.com
```

使用自定义部署目录：

```bash
sudo bash scripts/server-init.sh example.com admin@example.com /srv/example-site
```

使用自定义服务名：

```bash
sudo bash scripts/server-init.sh example.com admin@example.com /srv/example-site example-next
```

### 10.3 不建议手改的内容

- Nginx 反代目标（127.0.0.1:3000）
- 数据目录软链接逻辑（app_dir/data -> app_dir/.next/standalone/data）
- systemd 重启策略（Restart=always）

如果确实要改，建议先在测试机验证后再用于生产环境。
