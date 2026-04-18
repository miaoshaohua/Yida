# Yida 部署文档

## 架构概览

```
前端 (Vercel)  ←→  后端 (Railway)  ←→  数据库 (Railway PostgreSQL)
                                        ↓
                              Cloudflare R2 (图片存储)
```

---

## 1. 后端部署 (Railway)

### 1.1 创建 Railway 项目

1. 访问 [railway.app](https://railway.app) 并登录 GitHub
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 `yida` 仓库

### 1.2 添加 PostgreSQL 数据库

1. 在 Railway 项目页面点击 "+ New"
2. 选择 "Database" → "Add PostgreSQL"
3. 等待数据库创建完成
4. 复制 `DATABASE_URL` 环境变量

### 1.3 配置环境变量

在 Railway 项目 Settings → Variables 中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Railway 自动生成 |
| `JWT_SECRET` | `openssl rand -base64 32` | 使用强随机密钥 |
| `JWT_EXPIRES_IN` | `2h` | Token 有效期 |
| `FASHN_API_URL` | `https://...` | FASHN 虚拟试衣 API |
| `REDIS_URL` | `redis://...` | Redis 连接（可选，用于任务队列） |
| `PORT` | `3000` | 端口号（Railway 默认） |
| `NODE_ENV` | `production` | 生产环境 |

### 1.4 部署后端

1. 在 Railway 中连接 GitHub 仓库
2. 设置 Root Directory 为 `backend`
3. 部署命令自动读取 `railway.json`
4. 首次部署后 Railway 会生成一个公网 URL

### 1.5 初始化数据库

```bash
# SSH 到 Railway 或本地执行
npx prisma db push
npx prisma db seed  # 如果有 seed 脚本
```

---

## 2. 前端部署 (Vercel)

### 2.1 创建 Vercel 项目

1. 访问 [vercel.com](https://vercel.com) 并登录 GitHub
2. 点击 "New Project"
3. 选择 `yida` 仓库

### 2.2 配置环境变量

在 Vercel 项目 Settings → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://your-backend.railway.app` | 后端 API 地址 |

### 2.3 构建配置

Vercel 会自动检测为 Vite 项目，无需额外配置。

确保项目设置中：
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

### 2.4 部署前端

1. 推送代码到 main 分支自动触发部署
2. 或手动点击 "Deploy" 按钮
3. 部署成功后 Vercel 会生成一个公网 URL

---

## 3. 图片存储配置 (Cloudflare R2)

### 3.1 创建 R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 R2 → Create Bucket
3. Bucket 名称：`yida-images`

### 3.2 创建 API Token

1. R2 → Manage API Tokens → Create API Token
2. 权限：Object Read & Write
3. 复制 Access Key ID 和 Secret Access Key

### 3.3 配置后端环境变量

在 Railway 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `R2_ACCESS_KEY_ID` | `xxx` | R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | `xxx` | R2 Secret Key |
| `R2_BUCKET_NAME` | `yida-images` | Bucket 名称 |
| `R2_ACCOUNT_ID` | `xxx` | Cloudflare Account ID |
| `R2_PUBLIC_URL` | `https://your-bucket.r2.dev` | 公共访问 URL |

### 3.4 配置公共访问

1. R2 → Bucket Settings → Public Access
2. 开启公开读取（仅图片目录）
3. 或使用 presigned URL 方式

---

## 4. 域名配置

### 4.1 后端域名

1. Railway → Settings → Domains
2. 添加自定义域名（如 `api.yida.com`）
3. 配置 DNS CNAME 记录

### 4.2 前端域名

1. Vercel → Settings → Domains
2. 添加自定义域名（如 `yida.com`）
3. 配置 DNS CNAME/A 记录

---

## 5. CI/CD 配置

### 5.1 GitHub Actions

项目已包含 `.github/workflows/ci.yml`，会自动：

- 每次 push/PR 到 main 分支时运行
- 后端：安装依赖 → Prisma 生成 → TypeScript 检查 → 集成测试
- 前端：安装依赖 → TypeScript 检查 → 构建

### 5.2 添加 GitHub Secrets

在 GitHub 仓库 Settings → Secrets and variables 中添加：

| Secret | 说明 |
|--------|------|
| `RAILWAY_TOKEN` | Railway API Token（可选，用于自动部署） |
| `VERCEL_TOKEN` | Vercel API Token（可选，用于自动部署） |

---

## 6. 部署后验证清单

- [ ] 前端网站可访问
- [ ] 后端 API 可访问
- [ ] 游客登录正常
- [ ] 试衣功能正常（图片上传 → 生成 → 查看）
- [ ] 历史记录正常加载
- [ ] 管理员后台可登录
- [ ] 图片通过 R2 加载
- [ ] HTTPS 正常工作

---

## 7. 运维监控

### 7.1 日志查看

- Railway: 项目页面 → Deployments → View Logs
- Vercel: 项目页面 → Deployments → View Logs

### 7.2 数据库备份

Railway 自动每日备份，也可手动创建：
- Railway → PostgreSQL → Backups → Create Backup

### 7.3 错误监控

建议接入 Sentry 或其他错误监控服务

---

## 8. 常见问题

### Q: 部署后前端报 CORS 错误？
A: 在后端添加 Vercel 域名到 CORS 白名单

### Q: 图片上传失败？
A: 检查 R2 环境变量是否正确配置

### Q: 试衣任务一直处理中？
A: 检查 FASHN API 连接是否正常

### Q: 数据库连接失败？
A: 检查 DATABASE_URL 是否正确，网络是否允许

---

**部署文档版本：** v1.0  
**最后更新：** 2026-04-18
