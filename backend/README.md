# AI虚拟试衣间 - 后端API

## 项目概述

这是AI虚拟试衣间V1.0的后端API服务，基于NestJS框架构建。

## 技术栈

- **框架**: NestJS 10.x
- **ORM**: Prisma 5.x
- **数据库**: PostgreSQL
- **缓存**: Redis
- **队列**: Bull Queue
- **存储**: Cloudflare R2
- **认证**: JWT + Passport
- **API文档**: Swagger

## 项目结构

```
backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── common/                 # 公共模块
│   │   └── prisma/            # Prisma服务
│   └── modules/                # 业务模块
│       ├── auth/               # 认证模块
│       ├── users/              # 用户模块
│       ├── tryon/              # 试衣模块
│       ├── storage/            # 存储模块（R2）
│       ├── orders/             # 订单模块
│       ├── admin/              # 后台管理模块
│       └── tasks/              # 定时任务模块
├── prisma/
│   └── schema.prisma           # 数据库Schema
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 已完成功能

- [x] 项目初始化（NestJS配置）
- [x] 数据库设计（Prisma Schema）
- [x] Cloudflare R2存储集成
- [x] Prisma模块
- [x] 模块骨架创建

## 待开发功能

- [ ] 用户认证（游客模式 + 手机号验证码）
- [ ] 异步试衣任务队列
- [ ] 30天自动清理定时任务
- [ ] 沙箱支付接口
- [ ] 后台管理系统API
- [ ] Swagger API文档

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
# 编辑 .env 文件
```

### 3. 数据库迁移

```bash
npx prisma migrate dev --name init
```

### 4. 生成Prisma Client

```bash
npx prisma generate
```

### 5. 启动开发服务器

```bash
npm run start:dev
```

## API文档

启动后访问：http://localhost:3000/api/docs

## 数据库设计

### 核心表

| 表名 | 说明 |
|------|------|
| User | 用户表 |
| Session | 会话表 |
| TryOnTask | 试衣任务表 |
| TryOnRecord | 试衣记录表 |
| Order | 订单表 |
| Admin | 管理员表 |
| SystemConfig | 系统配置表 |
| Announcement | 公告表 |
| OperationLog | 操作日志表 |

## 部署方案

详见根目录 `documents/产品需求文档.md` - 8.4 部署方案

## 开发进度

| 阶段 | 任务 | 状态 |
|------|------|------|
| 阶段一 | 后端基础架构 | 进行中 |
| 阶段二 | 前端应用 | 待开始 |
| 阶段三 | 后台管理系统 | 待开始 |
| 阶段四 | 部署与测试 | 待开始 |
