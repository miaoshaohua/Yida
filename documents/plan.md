# Yida 管理后台权限与日志系统 - 实施计划

## 概述
为管理后台实现完整的权限控制系统和增强型操作日志功能。超级管理员可以授权普通管理员访问特定模块的增删改查操作，所有操作都有详细的日志记录（包含操作前后的数据对比）。

---

## 第一阶段：数据库与基础设施

### 1.1 数据库迁移 ✅ 已完成
- [x] 添加 `AdminPermission` 表（管理员权限配置）
- [x] 增强 `OperationLog` 表（添加 module、entityId、beforeData、afterData 字段）
- [x] 添加 `PermissionModule` 和 `PermissionAction` 枚举
- [x] 数据库迁移已执行

### 1.2 权限中间件
- [ ] 创建 `PermissionGuard`（检查管理员是否有权限执行操作）
- [ ] 创建 `@Permissions()` 装饰器
- [ ] 超级管理员自动拥有所有权限
- [ ] 普通管理员根据 `AdminPermission` 表检查权限

### 1.3 操作日志服务
- [ ] 创建 `OperationLoggerService`
- [ ] 实现 `log()` 方法记录操作
- [ ] 实现 `formatDiff()` 方法格式化数据差异
- [ ] 所有增删改操作自动记录日志

---

## 第二阶段：用户管理模块（CRUD + 权限 + 日志）

### 2.1 后端API
- [ ] `GET /api/admin/users` - 获取用户列表（READ 权限）
- [ ] `GET /api/admin/users/:userId` - 获取用户详情（READ 权限）
- [ ] `POST /api/admin/users` - 创建用户（CREATE 权限）
- [ ] `PUT /api/admin/users/:userId` - 更新用户信息（UPDATE 权限）
- [ ] `DELETE /api/admin/users/:userId` - 删除用户（DELETE 权限）
- [ ] 所有操作记录增强日志（记录操作前后对比）

### 2.2 前端页面
- [ ] 更新 AdminUsersPage 添加"新增用户"功能
- [ ] 完善编辑和删除功能
- [ ] 添加权限控制（无权限时隐藏按钮）

---

## 第三阶段：订单管理模块（CRUD + 权限 + 日志）

### 3.1 后端API
- [ ] `GET /api/admin/orders` - 获取订单列表（READ）
- [ ] `GET /api/admin/orders/:orderId` - 获取订单详情（READ）
- [ ] `PUT /api/admin/orders/:orderId/refund` - 退款操作（UPDATE）
- [ ] 所有操作记录增强日志

### 3.2 前端页面
- [ ] 更新 AdminOrdersPage 添加退款功能
- [ ] 添加权限控制

---

## 第四阶段：试衣记录模块（CRUD + 权限 + 日志）

### 4.1 后端API
- [ ] `GET /api/admin/tryon-records` - 获取列表（READ）
- [ ] `GET /api/admin/tryon-records/:recordId` - 获取详情（READ）
- [ ] `DELETE /api/admin/tryon-records/:recordId` - 删除单条（DELETE）
- [ ] `POST /api/admin/tryon-records/batch-delete` - 批量删除（DELETE）
- [ ] 所有操作记录增强日志

### 4.2 前端页面
- [ ] 已有批量删除功能，添加权限控制
- [ ] 完善日志记录

---

## 第五阶段：照片管理模块（CRUD + 权限 + 日志）

### 5.1 后端API
- [ ] `GET /api/admin/photos` - 获取照片列表（READ）
- [ ] `DELETE /api/admin/photos/:photoId` - 删除照片（DELETE）
- [ ] 所有操作记录增强日志

### 5.2 前端页面
- [ ] 更新 AdminPhotosPage 添加删除功能
- [ ] 添加权限控制

---

## 第六阶段：权限管理功能

### 6.1 后端API
- [ ] `GET /api/admin/admins/:adminId/permissions` - 获取管理员权限
- [ ] `PUT /api/admin/admins/:adminId/permissions` - 更新管理员权限
- [ ] 创建 `AdminPermissionService`
- [ ] 记录权限变更日志

### 6.2 前端页面
- [ ] 在 AdminAccountsPage 中添加"权限配置"按钮
- [ ] 创建权限配置弹窗/页面
- [ ] 显示所有模块（用户、订单、试衣、照片）和对应操作权限

---

## 第七阶段：增强型日志管理页面

### 7.1 后端API
- [ ] `GET /api/admin/logs` - 获取操作日志列表（支持按模块、操作类型、时间筛选）
- [ ] `GET /api/admin/logs/:logId` - 获取日志详情
- [ ] 仅 SUPER_ADMIN 或拥有 LOGS READ 权限的管理员可访问

### 7.2 前端页面
- [ ] 创建 AdminLogsPage
- [ ] 添加筛选功能（模块、操作类型、时间范围）
- [ ] 日志详情弹窗显示操作前后对比
- [ ] 友好的差异展示（绿色新增、红色删除、黄色修改）

---

## 第八阶段：测试与优化

### 8.1 功能测试
- [ ] 测试超级管理员所有功能
- [ ] 测试普通管理员授权后功能
- [ ] 测试未授权时的访问拦截
- [ ] 测试日志记录的完整性和准确性

### 8.2 编译重启
- [ ] 重新编译后端
- [ ] 重启前后端服务
- [ ] 验证所有页面正常访问

---

## 预计实施顺序
1. 第一阶段（基础设施）→ 约30分钟
2. 第二阶段（用户管理）→ 约20分钟
3. 第三阶段（订单管理）→ 约15分钟
4. 第四阶段（试衣记录）→ 约15分钟
5. 第五阶段（照片管理）→ 约15分钟
6. 第六阶段（权限管理）→ 约25分钟
7. 第七阶段（日志管理）→ 约25分钟
8. 第八阶段（测试优化）→ 约15分钟

**总计约 2.5-3 小时，分步实施可即时看到每阶段成果。**
