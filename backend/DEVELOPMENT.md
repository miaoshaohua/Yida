# 后端开发指南

## 项目状态

✅ **后端开发已完成** - 完整的前后端API和后台管理系统

## 下一步操作

### 1. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入配置
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

需要启动PostgreSQL和Redis，可以用Docker：

```bash
# PostgreSQL
docker run -d -p 5432:5432 --name yida-postgres \
  -e POSTGRES_USER=yida \
  -e POSTGRES_PASSWORD=yida123 \
  -e POSTGRES_DB=yida \
  postgres:15

# Redis
docker run -d -p 6379:6379 --name yida-redis redis:7
```

然后在 `.env` 中配置：
```
DATABASE_URL="postgresql://yida:yida123@localhost:5432/yida?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. 数据库迁移

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. 启动开发服务器

```bash
npm run start:dev
```

访问API文档：http://localhost:3000/api/docs

---

## API接口清单（共37个接口）

### 前端应用API（17个）

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | /auth/guest-login | 游客登录 |
| 认证 | POST | /auth/send-sms | 发送验证码 |
| 认证 | POST | /auth/sms-login | 短信登录 |
| 认证 | GET | /auth/me | 获取当前用户 |
| 认证 | POST | /auth/logout | 退出登录 |
| 存储 | POST | /storage/upload | 上传图片 |
| 试衣 | POST | /tryon/task | 创建试衣任务 |
| 试衣 | GET | /tryon/task/:taskId | 查询任务状态 |
| 用户 | GET | /users/tryon-records | 获取记录列表 |
| 用户 | GET | /users/tryon-records/:id | 获取记录详情 |
| 用户 | DELETE | /users/tryon-records/:id | 删除记录 |
| 用户 | POST | /users/tryon-records/batch-delete | 批量删除 |
| 订单 | POST | /orders | 创建订单 |
| 订单 | POST | /orders/:id/pay | 模拟支付（沙箱） |
| 订单 | GET | /orders | 获取订单列表 |
| 公告 | GET | /admin/announcements | 获取公告列表 |

---

### 后台管理API（20个）

| 模块 | 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|------|
| 后台认证 | POST | /admin/auth/login | 管理员登录 | 公开 |
| 后台认证 | GET | /admin/auth/me | 获取当前管理员 | ADMIN+ |
| 后台认证 | POST | /admin/auth/logout | 管理员退出 | ADMIN+ |
| 仪表板 | GET | /admin/dashboard | 获取仪表板数据 | ADMIN+ |
| 用户管理 | GET | /admin/users | 获取用户列表 | ADMIN+ |
| 用户管理 | GET | /admin/users/:userId | 获取用户详情 | ADMIN+ |
| 用户管理 | PUT | /admin/users/:userId/status | 更新用户状态 | ADMIN+ |
| 订单管理 | GET | /admin/orders | 获取订单列表 | ADMIN+ |
| 订单管理 | GET | /admin/orders/:orderId | 获取订单详情 | ADMIN+ |
| 订单管理 | POST | /admin/orders/:orderId/refund | 订单退款 | ADMIN+ |
| 记录管理 | GET | /admin/tryon-records | 获取试衣记录 | ADMIN+ |
| 记录管理 | GET | /admin/tryon-records/:id | 获取记录详情 | ADMIN+ |
| 记录管理 | DELETE | /admin/tryon-records/:id | 删除记录 | ADMIN+ |
| 照片管理 | GET | /admin/photos | 获取照片列表 | ADMIN+ |
| 系统配置 | GET | /admin/configs | 获取配置列表 | SUPER_ADMIN |
| 系统配置 | PUT | /admin/configs/:configKey | 更新配置 | SUPER_ADMIN |
| 公告管理 | POST | /admin/announcements | 创建公告 | SUPER_ADMIN |
| 公告管理 | DELETE | /admin/announcements/:id | 删除公告 | SUPER_ADMIN |
| 操作日志 | GET | /admin/operation-logs | 获取操作日志 | SUPER_ADMIN |

---

## 已完成功能

### 核心功能
- ✅ 项目初始化（NestJS + Prisma + PostgreSQL + Redis）
- ✅ 数据库设计（9张完整数据表）
- ✅ Cloudflare R2存储集成（上传/删除/预签名URL）

### 用户端
- ✅ 用户认证（游客模式 + 手机号验证码）
- ✅ 异步试衣任务队列（Bull Queue + task_id）
- ✅ 试衣记录管理（云端存储）
- ✅ 30天自动清理定时任务
- ✅ 沙箱支付接口

### 管理端
- ✅ 管理员认证（JWT + 权限控制）
- ✅ 角色权限守卫（ADMIN/SUPER_ADMIN）
- ✅ 用户管理（列表/详情/状态管理）
- ✅ 订单管理（列表/详情/退款）
- ✅ 试衣记录管理（列表/详情/删除）
- ✅ 照片管理（30天倒计时显示）
- ✅ 系统配置管理
- ✅ 公告管理
- ✅ 操作日志记录

---

## 待完善内容

- [ ] 真实短信服务接入（阿里云/腾讯云）
- [ ] 真实FASHN API接入
- [ ] 真实支付接入（微信/支付宝）
- [ ] 订单导出Excel功能
- [ ] 批量删除试衣记录
- [ ] 管理员管理（创建/编辑/删除）

---

## 项目结构

```
backend/
├── src/
│   ├── main.ts                      # 应用入口
│   ├── app.module.ts                # 根模块
│   ├── common/
│   │   ├── prisma/                  # Prisma服务
│   │   ├── guards/                  # 守卫（JWT/管理员/角色）
│   │   └── decorators/              # 装饰器（@CurrentUser/@CurrentAdmin/@Roles）
│   └── modules/
│       ├── auth/                    # 用户认证模块
│       ├── users/                   # 用户模块
│       ├── tryon/                   # 试衣模块
│       ├── storage/                 # 存储模块（R2）
│       ├── orders/                  # 订单模块
│       ├── admin/                   # 后台管理模块
│       └── tasks/                   # 定时任务模块
├── prisma/
│   └── schema.prisma                # 数据库Schema（9张表）
├── package.json
├── .env.example
├── README.md
└── DEVELOPMENT.md
```

---

## 超级管理员账号

应用启动时会自动初始化超级管理员：

- **用户名**: `superadmin`
- **邮箱**: `admin@yida.com`（可在.env中配置）
- **密码**: `change-this-in-production`（可在.env中配置）

**请务必在生产环境修改默认密码！**
