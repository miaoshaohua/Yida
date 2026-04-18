# 快速启动指南

## ✅ 当前状态

- ✅ 后端代码已完成
- ✅ npm依赖已安装
- ✅ Prisma Client已生成
- ✅ TypeScript编译通过

---

## 🚀 启动步骤

### 1. 启动数据库（PostgreSQL + Redis）

#### 方式A：使用Docker（推荐）

```bash
# 启动PostgreSQL
docker run -d -p 5432:5432 --name yida-postgres ^
  -e POSTGRES_USER=yida ^
  -e POSTGRES_PASSWORD=yida123 ^
  -e POSTGRES_DB=yida ^
  postgres:15

# 启动Redis
docker run -d -p 6379:6379 --name yida-redis redis:7
```

#### 方式B：使用本地数据库

确保本地已安装PostgreSQL和Redis，并修改 `.env` 中的配置。

---

### 2. 执行数据库迁移

```bash
npx prisma migrate dev --name init
```

---

### 3. 启动开发服务器

```bash
npm run start:dev
```

---

### 4. 访问API文档

打开浏览器访问：http://localhost:3000/api/docs

---

## 📋 环境变量说明

已配置在 `.env` 文件中：

| 配置项 | 说明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL连接字符串 |
| `REDIS_HOST` / `REDIS_PORT` | Redis配置 |
| `JWT_SECRET` | JWT密钥 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 初始管理员账号 |

---

## 🔐 默认账号

### 超级管理员
- **用户名**: `superadmin`
- **密码**: `change-this-in-production`
- **登录接口**: `POST /admin/auth/login`

---

## 🎯 API端点总览

### 前端应用（17个）
- 认证：`/auth/*`
- 存储：`/storage/upload`
- 试衣：`/tryon/*`
- 用户：`/users/*`
- 订单：`/orders/*`

### 后台管理（20个）
- 后台认证：`/admin/auth/*`
- 仪表板：`/admin/dashboard`
- 用户管理：`/admin/users/*`
- 订单管理：`/admin/orders/*`
- 记录管理：`/admin/tryon-records/*`
- 照片管理：`/admin/photos`
- 配置管理：`/admin/configs/*`
- 公告管理：`/admin/announcements/*`
- 操作日志：`/admin/operation-logs`

---

## 📝 注意事项

1. **生产环境请务必修改默认密码！**
2. 30天自动清理定时任务每天凌晨2点执行
3. 图片存储在Cloudflare R2（需配置R2账号）
4. FASHN API调用已占位，需填入真实API Key
5. 短信服务已占位，需接入真实服务商

---

## 🎉 项目完成度

| 阶段 | 完成度 |
|------|--------|
| 阶段一：后端基础架构 | ✅ 100% |
| 阶段二：前端应用 | ⏳ 待开发 |
| 阶段三：后台管理系统 | ⏳ 待开发 |
| 阶段四：部署与测试 | ⏳ 待开发 |
