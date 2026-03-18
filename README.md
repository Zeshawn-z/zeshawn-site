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
