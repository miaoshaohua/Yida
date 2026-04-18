# 测试环境准备指南

## ⚠️ 当前状态

后端代码已完成，但需要**PostgreSQL**和**Redis**才能启动服务。

---

## 🚀 方式一：使用Docker（推荐）

### 1. 安装Docker Desktop

下载并安装：https://www.docker.com/products/docker-desktop

### 2. 启动数据库容器

在PowerShell中运行：

```powershell
# 启动PostgreSQL
docker run -d -p 5432:5432 --name yida-postgres `
  -e POSTGRES_USER=yida `
  -e POSTGRES_PASSWORD=yida123 `
  -e POSTGRES_DB=yida `
  postgres:15

# 启动Redis
docker run -d -p 6379:6379 --name yida-redis redis:7
```

### 3. 验证容器运行状态

```powershell
docker ps
```

应该能看到 `yida-postgres` 和 `yida-redis` 两个容器正在运行。

---

## 🚀 方式二：使用本地安装

### 1. 安装PostgreSQL

下载：https://www.postgresql.org/download/windows/

安装后创建数据库：
```sql
CREATE USER yida WITH PASSWORD 'yida123';
CREATE DATABASE yida;
GRANT ALL PRIVILEGES ON DATABASE yida TO yida;
```

### 2. 安装Redis

下载：https://github.com/microsoftarchive/redis/releases

或使用Memurai（Windows版Redis）：https://www.memurai.com/

---

## 📦 启动后端服务

### 1. 执行数据库迁移

```powershell
cd backend
npx prisma migrate dev --name init
```

### 2. 启动开发服务器

```powershell
npm run start:dev
```

### 3. 访问API文档

打开浏览器：http://localhost:3000/api/docs

---

## 🔑 默认账号

### 超级管理员
- **用户名**: `superadmin`
- **密码**: `change-this-in-production`
- **登录接口**: `POST /admin/auth/login`

---

## 📊 可用的API测试

### 前端应用API
| 接口 | 说明 |
|------|------|
| `POST /auth/guest-login` | 游客登录（测试用） |
| `GET /auth/me` | 获取当前用户 |
| `GET /admin/announcements` | 获取公告 |

### 后台管理API
| 接口 | 说明 |
|------|------|
| `POST /admin/auth/login` | 管理员登录 |
| `GET /admin/dashboard` | 仪表板数据 |

---

## 🛑 常见问题

### Docker命令找不到？
- 确认Docker Desktop已启动
- 重启终端或PowerShell

### 数据库连接失败？
- 确认PostgreSQL容器正在运行：`docker ps`
- 检查.env中的DATABASE_URL是否正确

### Redis连接失败？
- 确认Redis容器正在运行：`docker ps`
- 检查.env中的REDIS配置

---

## 📝 下一步

数据库和Redis启动后，可以：
1. 使用Swagger文档测试API
2. 开始前端开发
3. 开始后台管理前端开发
