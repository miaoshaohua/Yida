# AI虚拟试衣间 V1.0 - 实施计划

---

## 阶段一：后端基础架构（Week 1-2）

## [ ] Task 1: 后端项目初始化
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 使用NestJS创建后端项目
  - 配置Prisma ORM
  - 配置PostgreSQL数据库连接
  - 配置Redis缓存
  - 配置JWT认证
  - 配置Swagger API文档
  - 配置环境变量（.env）
- **Acceptance Criteria Addressed**: AC-7, AC-15
- **Test Requirements**:
  - `programmatic` TR-1.1: 项目可以正常启动
  - `programmatic` TR-1.2: 数据库连接成功
  - `programmatic` TR-1.3: Redis连接成功
- **Notes**: Railway部署准备，使用Railway PostgreSQL + Railway Redis

## [ ] Task 2: 数据库设计与迁移
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 设计数据表：users、sessions、tryon_records、orders、admins、system_configs、operation_logs
  - 创建Prisma schema
  - 执行数据库迁移
  - 插入初始数据（超级管理员账号）
- **Acceptance Criteria Addressed**: AC-7, AC-13, AC-14, AC-15
- **Test Requirements**:
  - `programmatic` TR-2.1: 所有表创建成功
  - `programmatic` TR-2.2: 初始数据插入成功
- **Notes**: 密码使用bcrypt加密

## [ ] Task 3: Cloudflare R2图片存储集成
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 配置Cloudflare R2连接
  - 实现图片上传接口
  - 实现图片删除接口
  - 实现图片加密存储
  - 配置预签名URL（30分钟有效期）
- **Acceptance Criteria Addressed**: AC-15, AC-16
- **Test Requirements**:
  - `programmatic` TR-3.1: 图片上传成功
  - `programmatic` TR-3.2: 图片删除成功
  - `programmatic` TR-3.3: 预签名URL正常生成
- **Notes**: R2存储所有图片，本地不保存

## [ ] Task 4: 用户认证模块
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 实现手机号验证码发送接口（游客模式自动注册）
  - 实现手机号验证码登录接口
  - 实现设备ID游客模式自动登录/注册
  - 实现JWT token刷新
  - 实现退出登录接口
  - 实现获取当前用户信息接口
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: 验证码发送成功
  - `programmatic` TR-4.2: 登录成功返回JWT
  - `programmatic` TR-4.3: 游客模式自动注册成功
- **Notes**: 使用阿里云/腾讯云短信服务

## [ ] Task 5: 异步任务+轮询系统
- **Priority**: P0
- **Depends On**: Task 1, Task 3
- **Description**: 
  - 实现异步任务队列（Redis + Bull Queue）
  - 实现试衣任务创建接口（返回task_id）
  - 实现任务状态查询接口（轮询用）
  - 实现FASHN VTON API调用封装
  - 实现任务超时机制（5分钟）
  - 实现任务失败重试
- **Acceptance Criteria Addressed**: AC-2, AC-15
- **Test Requirements**:
  - `programmatic` TR-5.1: 任务创建成功返回task_id
  - `programmatic` TR-5.2: 状态轮询返回正确状态
  - `programmatic` TR-5.3: 超时任务自动失败
- **Notes**: 替换1200秒长超时方案

## [ ] Task 6: 试衣记录接口
- **Priority**: P0
- **Depends On**: Task 4, Task 5
- **Description**: 
  - 实现试衣记录列表接口（分页）
  - 实现试衣记录详情接口
  - 实现试衣记录删除接口
  - 实现批量删除接口
  - 关联用户和订单信息
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-6.1: 记录列表分页正常
  - `programmatic` TR-6.2: 记录删除成功
- **Notes**: 存储到PostgreSQL，图片存储到R2

## [ ] Task 7: 30天自动清理定时任务
- **Priority**: P1
- **Depends On**: Task 3, Task 6
- **Description**: 
  - 实现定时任务（Cron Job）
  - 每天凌晨清理超过30天的记录
  - 同时删除R2中的图片
  - 记录清理日志
- **Acceptance Criteria Addressed**: AC-16
- **Test Requirements**:
  - `programmatic` TR-7.1: 过期记录自动清理
  - `programmatic` TR-7.2: R2图片同步删除
- **Notes**: 使用node-cron或NestJS Schedule

## [ ] Task 8: 沙箱支付接口
- **Priority**: P1
- **Depends On**: Task 2
- **Description**: 
  - 实现支付订单创建接口
  - 实现支付状态查询接口
  - 实现支付回调处理
  - 实现订单状态更新
  - V1.0先用沙箱模式/模拟支付
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-8.1: 订单创建成功
  - `programmatic` TR-8.2: 支付状态正确更新
- **Notes**: 后续接入微信支付/支付宝

---

## 阶段二：前端应用（Week 2-3）

## [ ] Task 9: 前端项目初始化
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 使用Vite创建React项目
  - 配置Tailwind CSS
  - 配置项目结构和基础依赖
  - 配置路由（React Router）
  - 配置axios请求拦截器
  - 配置状态管理（Zustand）
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-9.1: 项目可以正常启动
  - `human-judgement` TR-9.2: 目录结构清晰
- **Notes**: Vercel部署准备

## [ ] Task 10: 用户登录页面开发
- **Priority**: P0
- **Depends On**: Task 9
- **Description**: 
  - 开发登录页面UI（唯品会风格）
  - 实现手机号验证码输入
  - 实现验证码倒计时
  - 实现设备ID游客模式自动登录
  - 实现登录状态持久化
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-10.1: 游客模式自动登录成功
  - `human-judgement` TR-10.2: 登录页设计美观
- **Notes**: 优先游客模式，降低使用门槛

## [ ] Task 11: 首页UI开发
- **Priority**: P0
- **Depends On**: Task 10
- **Description**: 
  - 开发玫红色渐变品牌区域
  - 开发功能入口卡片
  - 开发使用说明（3步简单操作）
  - 添加底部隐私提示
  - 响应式布局（桌面端/移动端）
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgement` TR-11.1: 设计风格符合唯品会风格
  - `human-judgement` TR-11.2: 响应式布局正常
- **Notes**: 使用Lucide React图标库

## [ ] Task 12: 图片上传组件开发
- **Priority**: P0
- **Depends On**: Task 9
- **Description**: 
  - 开发人物照片上传组件
  - 开发衣服图片上传组件
  - 实现点击选择和拖拽上传
  - 实现图片预览和重新上传
  - 实现图片格式和大小验证
  - 上传到R2（通过后端API）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-12.1: 支持JPG/PNG/WEBP
  - `programmatic` TR-12.2: 单张≤10MB
  - `programmatic` TR-12.3: 上传到R2成功
- **Notes**: 图片压缩预处理

## [ ] Task 13: 异步试衣流程开发
- **Priority**: P0
- **Depends On**: Task 12
- **Description**: 
  - 开发服装类型选择（默认上衣）
  - 开发"开始试衣"按钮（含次数显示）
  - 实现任务创建（获取task_id）
  - 实现状态轮询（每2秒）
  - 实现加载状态页（分阶段提示）
- **Acceptance Criteria Addressed**: AC-2, AC-5
- **Test Requirements**:
  - `programmatic` TR-13.1: task_id获取成功
  - `programmatic` TR-13.2: 轮询状态正确
  - `human-judgement` TR-13.3: 加载提示清晰
- **Notes**: 超时5分钟提示

## [ ] Task 14: 结果展示与下载
- **Priority**: P0
- **Depends On**: Task 13
- **Description**: 
  - 开发结果展示页面
  - 实现图片下载功能
  - 实现分享功能（带水印）
  - 实现"重新试衣"功能
  - 从R2加载图片（预签名URL）
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-14.1: 效果图清晰展示
  - `programmatic` TR-14.2: 下载功能正常
- **Notes**: 分享图片加品牌水印

## [ ] Task 15: 云端历史记录页面
- **Priority**: P0
- **Depends On**: Task 14
- **Description**: 
  - 开发历史记录列表页
  - 实现分页加载
  - 实现记录详情查看
  - 实现记录删除
  - 实现批量删除
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-15.1: 云端记录加载成功
  - `programmatic` TR-15.2: 删除功能正常
- **Notes**: 从云端拉取，不是localStorage

## [ ] Task 16: 我的页面开发
- **Priority**: P0
- **Depends On**: Task 10
- **Description**: 
  - 开发"我的"页面
  - 显示用户信息
  - 显示试衣次数
  - 会员状态显示
  - 退出登录功能
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgement` TR-16.1: 页面布局正常
  - `programmatic` TR-16.2: 退出登录成功
- **Notes**: 保持唯品会风格

## [ ] Task 17: 沙箱支付弹窗开发
- **Priority**: P1
- **Depends On**: Task 13
- **Description**: 
  - 开发会员升级弹窗
  - 展示价格（¥9.9/月 或 ¥49/年）
  - 支付方式选择
  - 沙箱模式模拟支付
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `human-judgement` TR-17.1: 弹窗设计美观
  - `programmatic` TR-17.2: 沙箱支付模拟成功
- **Notes**: V1.0先用沙箱

## [ ] Task 18: 响应式适配完善
- **Priority**: P0
- **Depends On**: Task 11-Task 17
- **Description**: 
  - 移动端适配（<768px）
  - 平板端适配（768px-1024px）
  - 桌面端适配（>1024px）
  - 触摸友好优化（44x44px）
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgement` TR-18.1: 各断点布局正常
  - `human-judgement` TR-18.2: 点击区域足够大
- **Notes**: Tailwind响应式断点

---

## 阶段三：后台管理系统（Week 3-4）

## [ ] Task 19: 后台认证模块
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 实现管理员登录接口
  - 实现退出登录接口
  - 实现获取当前管理员信息
  - 实现修改密码接口
  - 实现JWT token刷新
  - 实现登录失败次数限制
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-19.1: 登录返回JWT
  - `programmatic` TR-19.2: 5次失败锁定30分钟
- **Notes**: 密码bcrypt加密

## [ ] Task 20: 后台前端项目初始化
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 使用Vite创建React项目
  - 配置Ant Design 5+
  - 配置React Router
  - 配置axios请求拦截器
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-20.1: 项目正常启动
  - `human-judgement` TR-20.2: Ant Design组件正常
- **Notes**: 配置代理解决跨域

## [ ] Task 21: 后台登录页面
- **Priority**: P0
- **Depends On**: Task 19, Task 20
- **Description**: 
  - 开发后台登录页面UI
  - 实现登录逻辑
  - 实现token存储
  - 实现退出登录
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-21.1: 正确账号密码可以登录
  - `programmatic` TR-21.2: 错误密码提示失败
- **Notes**: 登录后跳仪表板

## [ ] Task 22: 仪表板数据统计
- **Priority**: P0
- **Depends On**: Task 19, Task 21
- **Description**: 
  - 开发后端统计接口（overview、trends）
  - 开发前端仪表板页面
  - 实现核心数据卡片
  - 实现趋势图表（ECharts）
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `human-judgement` TR-22.1: 数据卡片显示正确
  - `human-judgement` TR-22.2: 图表正常渲染
- **Notes**: 近7天/30天趋势

## [ ] Task 23: 用户管理模块
- **Priority**: P0
- **Depends On**: Task 19, Task 21
- **Description**: 
  - 开发后端用户管理接口
  - 开发前端用户管理页面
  - 实现用户列表（分页、搜索）
  - 实现用户详情查看
  - 实现用户状态管理
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `programmatic` TR-23.1: 用户列表分页正常
  - `programmatic` TR-23.2: 状态更新成功
- **Notes**: 关联试衣记录和订单

## [ ] Task 24: 订单管理模块
- **Priority**: P0
- **Depends On**: Task 19, Task 21
- **Description**: 
  - 开发后端订单管理接口
  - 开发前端订单管理页面
  - 实现订单列表（分页、筛选）
  - 实现订单详情
  - 实现订单退款
  - 实现订单导出
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `programmatic` TR-24.1: 订单状态正确更新
  - `programmatic` TR-24.2: 导出功能正常
- **Notes**: 退款记录日志

## [ ] Task 25: 试衣记录管理模块
- **Priority**: P0
- **Depends On**: Task 19, Task 21
- **Description**: 
  - 开发后端试衣记录接口
  - 开发前端试衣记录管理页面
  - 实现记录列表（分页、搜索、筛选）
  - 实现记录详情（人物/服装/结果图）
  - 实现记录删除/批量删除
  - 实现30天清理状态显示
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `programmatic` TR-25.1: 记录删除成功
  - `human-judgement` TR-25.2: 详情页图片清晰
- **Notes**: 删除记录日志

## [ ] Task 26: 照片管理模块（新增）
- **Priority**: P1
- **Depends On**: Task 19, Task 21
- **Description**: 
  - 开发后端照片管理接口
  - 开发前端照片管理页面
  - 实现照片列表（分页、筛选）
  - 显示存储时长、剩余天数
  - 实现手动删除照片
  - 显示R2存储使用量
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `human-judgement` TR-26.1: 剩余天数显示正确
  - `programmatic` TR-26.2: 手动删除成功
- **Notes**: 30天自动清理倒计时

## [ ] Task 27: 系统配置模块
- **Priority**: P1
- **Depends On**: Task 19, Task 21
- **Description**: 
  - 开发后端系统配置接口
  - 开发前端系统配置页面
  - 实现API配置、价格配置
  - 实现30天清理周期配置
  - 实现公告管理
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `programmatic` TR-27.1: 配置保存成功
  - `programmatic` TR-27.2: 配置生效
- **Notes**: 仅超级管理员

## [ ] Task 28: 权限管理
- **Priority**: P0
- **Depends On**: Task 19
- **Description**: 
  - 实现角色权限守卫
  - 实现接口权限校验
  - 前端路由权限控制
  - 页面元素权限控制
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `programmatic` TR-28.1: 普通管理员无法访问受限页面
  - `programmatic` TR-28.2: 权限接口返回403
- **Notes**: 超级管理员所有权限

---

## 阶段四：部署与测试（Week 4-5）

## [ ] Task 29: Vercel前端部署
- **Priority**: P0
- **Depends On**: Task 18
- **Description**: 
  - 配置Vercel项目
  - 配置环境变量
  - 配置自定义域名
  - 配置自动部署（GitHub推送触发）
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `programmatic` TR-29.1: 前端部署成功
  - `programmatic` TR-29.2: 自动部署正常
- **Notes**: 零运维部署

## [ ] Task 30: Railway后端部署
- **Priority**: P0
- **Depends On**: Task 8
- **Description**: 
  - 配置Railway项目
  - 配置PostgreSQL数据库
  - 配置Redis缓存
  - 配置环境变量
  - 配置自动部署
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `programmatic` TR-30.1: 后端部署成功
  - `programmatic` TR-30.2: 数据库连接正常
- **Notes**: Railway一键部署

## [ ] Task 31: Cloudflare R2配置
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 创建R2存储桶
  - 配置CORS
  - 配置访问密钥
  - 配置生命周期规则（30天自动删除）
- **Acceptance Criteria Addressed**: AC-15, AC-16
- **Test Requirements**:
  - `programmatic` TR-31.1: R2连接成功
  - `programmatic` TR-31.2: 生命周期规则生效
- **Notes**: R2生命周期自动清理

## [ ] Task 32: 前端功能测试
- **Priority**: P0
- **Depends On**: Task 18
- **Description**: 
  - 测试登录/游客模式
  - 测试图片上传
  - 测试异步试衣流程
  - 测试历史记录
  - 测试响应式布局
  - 测试错误处理
- **Acceptance Criteria Addressed**: AC-1-AC-6
- **Test Requirements**:
  - `programmatic` TR-32.1: 所有核心功能正常
  - `human-judgement` TR-32.2: 用户体验流畅
- **Notes**: 多浏览器多设备测试

## [ ] Task 33: 后端功能测试
- **Priority**: P0
- **Depends On**: Task 28
- **Description**: 
  - 测试用户认证
  - 测试异步任务队列
  - 测试R2存储
  - 测试30天清理
  - 测试所有管理功能
  - 测试权限控制
- **Acceptance Criteria Addressed**: AC-7-AC-14
- **Test Requirements**:
  - `programmatic` TR-33.1: 所有API正常工作
  - `programmatic` TR-33.2: 权限控制正确
- **Notes**: 测试超级/普通管理员

## [ ] Task 34: 安全合规测试
- **Priority**: P0
- **Depends On**: Task 31
- **Description**: 
  - 测试图片加密存储
  - 测试30天自动删除
  - 测试用户数据删除
  - 测试SQL注入防护
  - 测试XSS防护
  - 测试API权限校验
- **Acceptance Criteria Addressed**: AC-16
- **Test Requirements**:
  - `programmatic` TR-34.1: 安全措施生效
  - `programmatic` TR-34.2: 合规要求满足
- **Notes**: 隐私合规重点

## [ ] Task 35: Bug修复与优化
- **Priority**: P0
- **Depends On**: Task 32-Task 34
- **Description**: 
  - 修复测试中发现的Bug
  - 优化用户体验
  - 优化性能
  - 代码清理和重构
- **Acceptance Criteria Addressed**: 所有AC
- **Test Requirements**:
  - `human-judgement` TR-35.1: 所有已知Bug已修复
  - `human-judgement` TR-35.2: 代码质量良好
- **Notes**: 代码审查

---

## 交付物清单

- [ ] 前端应用代码
- [ ] 后端API代码
- [ ] 后台管理系统代码
- [ ] 数据库Schema
- [ ] API文档（Swagger）
- [ ] 部署文档
- [ ] 用户使用说明
- [ ] 管理员操作手册
