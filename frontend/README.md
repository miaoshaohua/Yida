# AI虚拟试衣间 - 前端应用

## 项目概述

基于 React + TypeScript + Vite 的 AI 虚拟试衣间前端应用。

## 技术栈

- **框架**: React 18.3.1
- **语言**: TypeScript 5.2.2
- **构建工具**: Vite 5.2.0
- **路由**: React Router DOM 6.23.0
- **HTTP客户端**: Axios 1.6.8

## 项目结构

```
frontend/
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx                # 主应用组件（含路由）
│   ├── index.css              # 全局样式
│   ├── App.css                # 应用样式
│   ├── contexts/
│   │   └── AuthContext.tsx    # 认证状态管理
│   ├── services/
│   │   └── api.ts             # API服务封装
│   └── pages/
│       ├── LoginPage.tsx      # 用户登录页面
│       └── HomePage.tsx       # 首页
├── index.html                 # HTML入口
├── package.json               # 项目依赖
├── vite.config.ts             # Vite配置
├── tsconfig.json              # TypeScript配置
└── README.md
```

## 已实现功能

### 1. 用户认证
- ✅ 游客登录（设备ID自动注册）
- ✅ 手机号验证码登录（演示模式）
- ✅ 登录状态保持（localStorage）
- ✅ 退出登录

### 2. 用户登录页面
- ✅ 游客/手机号登录模式切换
- ✅ 验证码发送与输入
- ✅ 响应式设计
- ✅ 唯品会风格UI（玫红色渐变）

### 3. 首页
- ✅ 用户信息展示
- ✅ 今日剩余试衣次数
- ✅ 会员状态标识
- ✅ 开始试衣按钮
- ✅ 功能特点展示

### 4. API服务
- ✅ Axios实例配置
- ✅ 请求/响应拦截器
- ✅ Token自动添加
- ✅ 401自动跳转登录
- ✅ 认证API封装

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

**注意**: 如果遇到 Windows 上 esbuild EBUSY 错误，请尝试：
- 关闭杀毒软件临时监控
- 以管理员身份运行终端
- 删除 `node_modules` 后重新安装

### 2. 启动开发服务器

```bash
npm run dev
```

开发服务器将在 http://localhost:5173 启动。

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产构建

```bash
npm run preview
```

## 配置说明

### API代理

Vite 已配置代理 `/api` 到后端服务：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

确保后端服务运行在 http://localhost:3000。

## 后端API对接

### 已对接接口
- `POST /api/auth/guest-login` - 游客登录
- `POST /api/auth/send-sms` - 发送验证码
- `POST /api/auth/sms-login` - 短信登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/logout` - 退出登录

## UI设计风格

- **主色调**: 玫红色渐变 #E6004C → #FF2A6D
- **设计风格**: 唯品会风格
- **响应式**: 支持桌面端和移动端

## 下一步开发

### 待实现功能
1. 试衣页面
   - 人物照片上传
   - 衣服照片上传
   - 衣服类型选择
   - 异步任务提交
   
2. 加载状态页
   - 任务进度展示
   - 自动轮询状态
   - 超时处理

3. 结果展示页
   - 试衣结果展示
   - 保存/分享功能
   - 返回首页

4. 历史记录页
   - 记录列表
   - 记录详情
   - 删除功能
   - 批量删除

5. 我的页面
   - 用户信息
   - 会员升级
   - 退出登录

6. 会员升级弹窗
   - 套餐选择
   - 沙箱支付

## 相关文档

- 产品需求文档: `../documents/产品需求文档.md`
- 页面原型: `../documents/页面原型设计.html`
- PRD: `../documents/PRD_产品需求文档.md`
- 实施计划: `../documents/PRD_实施计划.md`
- 验证清单: `../documents/PRD_验证清单.md`

## 开发建议

### 代码规范
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 使用 React Router DOM 进行路由管理
- 使用 Context API 进行状态管理

### 注意事项
1. 确保后端服务已启动（http://localhost:3000）
2. 确保 PostgreSQL 和 Redis 容器运行正常
3. 所有 API 调用已配置代理，无需完整 URL

## 许可证

MIT License
