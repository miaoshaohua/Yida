# Yida AI虚拟试衣间 - 项目规则

## 项目概述

AI虚拟试衣间全栈项目，用户上传人物照片+服装照片，调用FASHN VTON API生成试衣效果。

- 前端：React 18 + TypeScript + Vite 5 + React Router 6 + Axios（端口5173）
- 后端：NestJS + Prisma + SQLite/PostgreSQL + Redis(Bull Queue) + Swagger（端口3000）
- 存储：Cloudflare R2（S3兼容）+ 本地文件系统降级
- 认证：双体系 - 用户端（游客/短信JWT）+ 管理端（账号密码JWT+权限）
- 权限：细粒度模块权限，超级管理员授权，普通管理员按权限访问
- 日志：操作审计系统，自动记录增删改查操作，包含前后数据对比

## 关键架构规则

### 路由与代理
- 后端全局前缀：`api`（main.ts中 `app.setGlobalPrefix('api')`）
- 前端Vite代理：`/api` → `http://localhost:3000`（vite.config.ts）
- 前端axios baseURL：`/api`（api.ts）
- 所有后端Controller路由无需再加`/api`前缀，NestJS自动添加
- Swagger文档地址：`http://localhost:3000/api/docs`

### 数据库
- 开发环境使用SQLite（prisma/schema.sqlite.prisma）
- 生产环境使用PostgreSQL（prisma/schema.postgresql.prisma）
- 默认schema：prisma/schema.prisma（当前为SQLite兼容版）
- 迁移命令：`npx prisma migrate dev` / `npx prisma generate`
- 关键表：Admin（管理员）、AdminPermission（权限配置）、OperationLog（操作日志）

### 认证体系
- 用户端JWT：`Authorization: Bearer <token>`，通过JwtAuthGuard保护
- 管理端JWT：独立策略AdminJwtStrategy，通过AdminJwtAuthGuard保护
- 游客登录：deviceId或fingerprint，返回JWT token
- 短信登录：手机号+验证码，演示模式验证码为123456
- 获取当前用户：`@CurrentUser()`装饰器，需JwtAuthGuard
- 获取当前管理员：`@CurrentAdmin()`装饰器，需AdminJwtAuthGuard

### 权限体系
- **权限模块枚举**：PermissionModule（USERS, ORDERS, TRYON, PHOTOS, ADMINS, LOGS, CONFIG）
- **权限动作枚举**：PermissionAction（READ, CREATE, UPDATE, DELETE）
- **权限装饰器**：`@Permissions(module, action)`
- **权限守卫**：PermissionGuard，检查AdminPermission表中配置
- **超级管理员**：自动拥有所有模块的所有权限，无需检查
- **普通管理员**：需在AdminAccountsPage配置权限，按配置访问

### 操作日志体系
- **日志服务**：OperationLoggerService，提供`log()`和`logWithDiff()`方法
- **自动记录**：在Service层调用，自动记录管理员ID、操作类型、IP地址、User-Agent
- **Diff对比**：`formatDiff()`方法，JSON序列化前后数据，便于对比
- **日志查询**：GET /api/admin/operation-logs，支持按模块、操作类型、日期筛选
- **日志详情**：GET /api/admin/operation-logs/:id，展示完整beforeData/afterData

## 踩坑规则（必须遵守）

### 1. 环境变量不能用占位符
- `.env`中的`your-r2-account-id`、`your-r2-access-key-id`等是占位符，不是真实值
- 如果R2未配置，预签名URL会生成但无法使用（SSL错误）
- 必须提供真实配置，或在StorageService中实现本地存储降级
- 检查方法：搜索`.env`中包含`your-`的值，这些都是未配置的

### 2. 代码变更后必须重启后端
- NestJS开发模式（`npm run start:dev`）支持热重载
- 但如果使用`npm run start`或`node dist/main.js`，必须手动重启
- 修改Controller/Service后，确认路由是否生效的最佳方式：
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/your-route" -Method POST -Body '{"key":"value"}' -ContentType "application/json"
  ```

### 3. 前端API路径不要重复加/api
- api.ts中axios实例已设置`baseURL: '/api'`
- 调用时写`api.post('/storage/presigned-url')`，不要写`api.post('/api/storage/presigned-url')`
- Vite代理会将`/api/*`转发到后端`http://localhost:3000/api/*`

### 4. 新增后端接口的完整步骤
1. 创建DTO（dto/目录，使用class-validator装饰器）
2. 在Service中实现业务逻辑
3. 在Controller中添加路由（使用@Post/@Get等装饰器）
4. 如果需要认证，添加`@UseGuards(JwtAuthGuard)`和`@CurrentUser()`
5. 重启后端服务
6. 用PowerShell或Swagger测试接口
7. 在前端api.ts中添加对应的API方法

### 5. 页面样式必须对照原型
- 原型文件：`documents/页面原型设计.html`，用浏览器打开查看
- 设计风格：唯品会风格 - 玫红色渐变（#E6004C → #FF2A6D）
- 关键样式要素：
  - 品牌渐变：`linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)`
  - 背景渐变：`linear-gradient(180deg, #FFF5F8 0%, #FFE8EF 100%)`
  - 强调渐变：`linear-gradient(135deg, #FF6B8A 0%, #FF9A9E 100%)`
  - 上传区域：虚线边框 `2px dashed #E6004C`，浅粉背景
  - 圆角：大卡片24px，按钮16px，小元素12px
  - 底部导航栏：固定定位，当前页高亮+顶部渐变指示条

### 6. 前端组件不要使用Header/Footer
- 前端应用页面（首页/历史/我的）使用底部导航栏，不使用Header/Footer
- 管理后台页面使用AdminLayout（AdminSidebar + AdminHeader）
- 底部导航栏直接写在页面组件中，不是独立组件

### 7. 存储上传必须走后端代理（R2签名问题）
- R2预签名URL在前端直传时会因浏览器额外添加的Header（Accept、Origin、Referer等）导致AWS签名不匹配（SignatureDoesNotMatch）
- 解决方案：使用后端 `/api/storage/upload-direct` 接口，通过后端代理上传到R2或本地存储
- 前端调用：`storageAPI.uploadDirect(file, fileKey)`
- 不要使用前端 fetch PUT 直传预签名URL

### 8. 管理端新增权限规则
- 所有管理端CRUD操作都要添加 `@UseGuards(AdminJwtAuthGuard, PermissionGuard)`
- 使用 `@Permissions(PermissionModule.USERS, PermissionAction.CREATE)` 装饰器指定权限
- 超级管理员（role: SUPER_ADMIN）自动通过所有权限检查
- 普通管理员需在AdminPermission表配置权限后才能访问

### 9. 操作日志记录规则
- 所有增删改操作都要调用 `operationLoggerService.logWithDiff()` 记录
- 传入操作类型（如CREATE_USER）、模块、entityId、操作前数据、操作后数据
- 从Request中获取管理员ID、IP地址、User-Agent
- 查询操作不需要记录日志

### 10. NestJS编译输出路径是dist/src/
- `nest build` 后的入口文件路径是 `dist/src/main.js`，不是 `dist/main.js`
- Dockerfile 或任何启动命令必须使用：`node dist/src/main.js`
- nest-cli.json 配置：`"sourceRoot": "src"`

### 11. 每日试衣次数跨天重置
- 后端 `auth.service.ts` 的 `getCurrentUser` 会检测 `lastTryOnDate !== today`，自动重置 `dailyTryOnCount = 0` 并更新 `lastTryOnDate`
- 前端 `AuthContext.tsx` 在加载时比对 `_lastCheckDate`，如果跨天则自动刷新用户信息
- 后端 `tryon.service.ts` 的 `checkTryOnQuota` 也会在试衣前检测并重置

### 12. 游客次数用完引导登录
- 游客每日免费3次试衣，用完后前端显示错误提示 + "手机登录，获取更多次数" 按钮
- 手机注册/登录的用户也有每日3次免费试衣，独立计数
- 实现位置：`HomePage.tsx` 的 catch 块检测"今日试衣次数已用完"

## 部署规则

### Docker构建（Railway部署）
- 使用多阶段构建：builder阶段安装所有依赖并构建，production阶段只安装生产依赖
- Alpine镜像需要安装 OpenSSL：`RUN apk add --no-cache openssl`
- Dockerfile 在根目录：`Dockerfile`
- railway.json 也在根目录，指定 `"builder": "DOCKERFILE"`

### 环境变量（生产环境）
| 变量名 | 说明 | 必填 |
|--------|------|------|
| DATABASE_URL | PostgreSQL连接字符串 | ✅ |
| REDIS_URL | Redis连接字符串 | ✅ |
| JWT_SECRET | JWT密钥 | ✅ |
| FASHN_API_KEY | FASHN API密钥 | ✅ |
| R2_ACCOUNT_ID | Cloudflare R2账号ID | ✅ |
| R2_ACCESS_KEY_ID | R2访问密钥ID | ✅ |
| R2_SECRET_ACCESS_KEY | R2访问密钥 | ✅ |
| R2_BUCKET_NAME | R2存储桶名称 | ✅ |
| STORAGE_MODE | 存储模式（r2/local） | ❌ 默认r2 |
| NODE_ENV | 环境（production） | ✅ |
| PORT | 端口（3000） | ❌ 默认3000 |

## 开发流程规则

### 启动服务
```powershell
# 后端（在backend目录）
npm run start:dev    # 开发模式，热重载
npm run start        # 生产模式，需手动重启

# 前端（在frontend目录）
npm run dev          # Vite开发服务器
```

### 依赖检查
- 新增npm包前，先检查package.json是否已有该包
- 后端常用包：@nestjs/*, @aws-sdk/*, prisma, bcryptjs, bull
- 前端常用包：react, react-router-dom, axios
- 不要假设任何库已安装，使用前先确认

### 上下文管理
- 当对话上下文过长时，主动建议用户拆分任务
- 拆分时，将当前进度写入.trae/rules/project_rules.md或documents/中的文件
- 新对话开始时，先读取项目规则文件了解上下文

### 代码风格
- 不添加注释（除非用户要求）
- 使用inline style（当前项目模式），不引入CSS框架
- TypeScript严格模式
- 后端使用NestJS装饰器模式
- 前端使用函数组件+Hooks

## 文件路径速查

| 用途 | 路径 |
|------|------|
| 前端入口 | frontend/src/main.tsx |
| 前端路由 | frontend/src/App.tsx |
| 前端API | frontend/src/services/api.ts |
| 前端管理API | frontend/src/services/adminApi.ts |
| 前端认证 | frontend/src/contexts/AuthContext.tsx |
| 前端管理认证 | frontend/src/contexts/AdminAuthContext.tsx |
| 前端管理页面 | frontend/src/pages/admin/ |
| 前端日志页面 | frontend/src/pages/admin/AdminLogsPage.tsx |
| 前端权限弹窗 | frontend/src/components/admin/PermissionModal.tsx |
| 后端入口 | backend/src/main.ts |
| 后端模块 | backend/src/app.module.ts |
| 后端认证 | backend/src/modules/auth/ |
| 后端存储 | backend/src/modules/storage/ |
| 后端试衣 | backend/src/modules/tryon/ |
| 后端管理 | backend/src/modules/admin/ |
| 权限守卫 | backend/src/common/guards/permission.guard.ts |
| 权限装饰器 | backend/src/common/decorators/permissions.decorator.ts |
| 操作日志服务 | backend/src/modules/admin/services/operation-logger.service.ts |
| 数据库Schema | backend/prisma/schema.prisma |
| 环境变量 | backend/.env |
| 页面原型 | documents/页面原型设计.html |
| 产品需求 | documents/PRD_产品需求文档.md |
| 部署文档 | DEPLOY.md |
| 安全清单 | SECURITY_CHECKLIST.md |
| 页面复盘 | documents/开发复盘与经验总结.md |
| Docker配置 | Dockerfile |
| Railway配置 | railway.json |
| CI/CD | .github/workflows/ci.yml |
