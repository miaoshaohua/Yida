# Docker 部署教学指南 - 从零到上线

> 适用场景：将 Yida AI虚拟试衣间项目部署到云服务器（阿里云/腾讯云/华为云等）

---

## 📚 目录

1. [部署前准备](#1-部署前准备)
2. [服务器环境配置](#2-服务器环境配置)
3. [项目配置](#3-项目配置)
   - [方式一：Git克隆（推荐）](#方式一使用git克隆推荐)
   - [方式二：SCP上传](#方式二使用scp上传无需github)
4. [构建并启动](#4-构建并启动)
5. [初始化数据库](#5-初始化数据库)
6. [验证部署](#6-验证部署)
7. [域名与HTTPS配置](#7-域名与https配置可选)
8. [日常运维](#8-日常运维)
9. [常见问题](#9-常见问题)

---

## 1. 部署前准备

### 1.1 云服务器要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 硬盘 | 40GB SSD | 80GB SSD |
| 操作系统 | Ubuntu 20.04/22.04 | Ubuntu 22.04 |
| 带宽 | 3Mbps | 5Mbps+ |

### 1.2 需要准备的账号/密钥

- [x] 云服务器SSH访问权限（IP: 42.194.162.239, 用户: ubuntu）
- [x] Cloudflare R2 存储配置（已有）
- [x] FASHN API Key（已有）
- [ ] 域名（可选，用于HTTPS）
- [x] GitHub仓库（用于Git部署）

### 1.3 你的服务器信息

| 项目 | 值 |
|------|-----|
| 服务器IP | 42.194.162.239 |
| 登录用户 | ubuntu |
| 部署路径 | /opt/yida |
| 操作系统 | Ubuntu |

### 1.4 在你的Windows电脑上操作

确保已安装Git，将项目代码上传到服务器。

---

## 2. 服务器环境配置

### 2.1 SSH登录到云服务器

打开Windows PowerShell，执行：

```powershell
# Windows 10/11自带SSH客户端
ssh ubuntu@42.194.162.239
```

输入密码后，你将进入服务器终端。

### 2.2 安装Docker

依次执行以下命令（复制一行，粘贴回车，等完成再执行下一行）：

```bash
# 更新软件包索引
apt update

# 安装必要的依赖
apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# 添加Docker仓库
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 安装Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# 启动Docker并设置开机自启
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
```

如果看到 `Docker version 24.x.x`，说明安装成功。

### 2.3 安装Docker Compose

```bash
# 下载Docker Compose（v2版本）
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

如果看到 `Docker Compose version v2.x.x`，说明安装成功。

### 2.4 配置防火墙/安全组

在你的云服务器控制台（网页），放行以下端口：

| 端口 | 用途 | 协议 |
|------|------|------|
| 22 | SSH远程 | TCP |
| 80 | HTTP（前端） | TCP |
| 3000 | 后端API | TCP |
| 443 | HTTPS（可选） | TCP |

**阿里云示例操作：**
1. 登录阿里云控制台
2. 进入ECS实例 → 安全组 → 配置规则
3. 添加入方向规则，允许上述端口

**腾讯云示例操作：**
1. 登录腾讯云控制台
2. 进入CVM实例 → 安全组 → 修改规则
3. 添加入方向规则，允许上述端口

---

## 3. 项目配置

### 3.1 上传项目到服务器（两种方式任选其一）

#### 方式一：使用Git克隆（推荐）⭐

**前置条件：** 项目代码已推送到GitHub

**重要说明：**
- 生产环境配置文件 `.env.prod` 包含敏感信息，已添加到 `.gitignore`，不会被提交到GitHub
- 你需要在服务器上手动创建 `.env.prod` 文件（见步骤3.3）

在SSH终端中执行：

```bash
# 1. 创建部署目录
sudo mkdir -p /opt
sudo chown ubuntu:ubuntu /opt

# 2. 克隆项目代码（替换为你的GitHub仓库地址）
cd /opt
git clone https://github.com/你的用户名/Yida.git yida

# 3. 进入项目目录
cd /opt/yida
```

**后续代码更新：**

```bash
cd /opt/yida
git pull origin main  # 拉取最新代码
docker-compose up -d --build  # 重新构建并启动
```

#### 方式二：使用SCP上传（无需GitHub）

在你的Windows电脑PowerShell中执行（**不要在SSH中执行**）：

```powershell
# 使用scp命令上传整个项目
scp -r C:\Users\缪少华\Desktop\project\Yida ubuntu@42.194.162.239:/opt/yida
```

上传完成后，回到SSH终端。

### 3.2 进入项目目录

```bash
cd /opt/yida
```

### 3.3 创建生产环境配置文件

```bash
# 复制配置模板
cp .env.prod.example .env.prod

# 编辑配置文件
nano .env.prod
```

nano编辑器操作说明：
- 用方向键移动光标
- 修改以下必填项：

```bash
# 必填配置项（以下为示例，请替换为你的真实值）
POSTGRES_PASSWORD=Yida2026!SecurePass
JWT_SECRET=$(openssl rand -base64 32)  # 用下方命令生成
R2_ACCOUNT_ID=68a4d444e6e6a9919c824b7f4408b33d  # 已有
R2_ACCESS_KEY_ID=a05616a99e5f1c0d60e1888cdfaa3810  # 已有
R2_SECRET_ACCESS_KEY=3398f04a36daa8ac82b1be311d94eb16a35b53972ff32022613b3c79b8749a61  # 已有
FASHN_API_KEY=your-fashn-api-key  # 替换为真实值
ADMIN_PASSWORD=Admin2026!Secure
VITE_API_BASE_URL=http://42.194.162.239:3000  # 替换为你的服务器IP
```

**生成JWT_SECRET的方法：**

在SSH终端执行：
```bash
openssl rand -base64 32
```

将输出的随机字符串复制到 `.env.prod` 的 `JWT_SECRET=` 后面。

**保存文件：**
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认文件名
- 按 `Ctrl + X` 退出编辑器

### 3.4 验证配置文件

```bash
# 查看配置内容，确认没有占位符
cat .env.prod | grep "your-"
```

如果没有任何输出，说明配置正确。如果有输出，说明还有未填的项。

---

## 4. 构建并启动

### 4.1 构建Docker镜像

```bash
# 使用生产环境配置启动
docker-compose --env-file .env.prod up -d --build
```

**解释：**
- `--env-file .env.prod`：使用生产环境配置
- `up`：启动所有服务
- `-d`：后台运行（Detached mode）
- `--build`：重新构建镜像

**构建过程需要约3-5分钟**，你会看到类似输出：

```
[+] Building 8/10
 => [backend internal] load build context
 => [frontend internal] load build context
 => [backend] exporting to image
 => [frontend] exporting to image
```

### 4.2 查看容器状态

```bash
docker-compose ps
```

正常情况应看到4个容器都是 `Up` 状态：

```
NAME                STATUS              PORTS
yida-postgres       Up (healthy)        0.0.0.0:5432->5432/tcp
yida-redis          Up (healthy)        0.0.0.0:6379->6379/tcp
yida-backend        Up                  0.0.0.0:3000->3000/tcp
yida-frontend       Up                  0.0.0.0:80->80/tcp
```

### 4.3 查看实时日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 仅查看后端日志
docker-compose logs -f backend

# 按 Ctrl + C 退出日志查看
```

---

## 5. 初始化数据库

### 5.1 进入后端容器

```bash
docker exec -it yida-backend sh
```

### 5.2 执行数据库迁移

```bash
# 推送数据库结构
npx prisma db push

# 生成Prisma客户端
npx prisma generate

# 验证数据库连接
npx prisma db pull
```

正常输出类似：
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Your database is now in sync with your Prisma schema.
```

### 5.3 退出容器

```bash
exit
```

---

## 6. 验证部署

### 6.1 测试后端API

```bash
# 测试后端健康检查
curl http://localhost:3000/api/health

# 测试Swagger文档
curl http://localhost:3000/api/docs
```

### 6.2 测试前端

在你的Windows电脑浏览器中访问：

```
http://42.194.162.239
```

应该能看到Yida AI虚拟试衣间的首页。

### 6.3 测试后端API

在浏览器中访问Swagger文档：

```
http://42.194.162.239:3000/api/docs
```

### 6.4 完整功能测试清单

- [ ] 前端首页可以正常加载
- [ ] 游客登录功能正常
- [ ] 图片上传功能正常
- [ ] AI试衣功能可以调用
- [ ] 历史记录可以加载
- [ ] 管理员后台可以登录（http://42.194.162.239/admin）

---

## 7. 域名与HTTPS配置（可选）

### 7.1 配置域名DNS

在你的域名服务商控制台（阿里云/腾讯云），添加A记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 你的服务器IP | 10分钟 |
| A | www | 你的服务器IP | 10分钟 |

### 7.2 安装Certbot（免费HTTPS证书）

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书（替换为你的域名）
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

按提示输入邮箱地址，同意服务条款。

### 7.3 配置Nginx反向代理

由于前端容器内置Nginx，需要修改前端端口映射，并在宿主机配置Nginx：

```bash
# 安装Nginx
apt install -y nginx

# 创建网站配置
nano /etc/nginx/sites-available/yida
```

粘贴以下配置（替换域名）：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # HTTP自动跳转HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL证书
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置并重启Nginx：

```bash
# 启用站点
ln -s /etc/nginx/sites-available/yida /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

### 7.4 自动续期证书

```bash
# 设置自动续期定时器
crontab -e
```

添加以下行（每天凌晨2点检查并续期）：

```
0 2 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 8. 日常运维

### 8.1 常用命令速查表

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart backend
docker-compose restart frontend

# 停止所有服务
docker-compose down

# 启动所有服务
docker-compose up -d

# 更新代码后重新构建
docker-compose up -d --build

# 清理无用镜像/容器
docker system prune -a
```

### 8.2 数据备份

```bash
# 备份PostgreSQL数据库
docker exec yida-postgres pg_dump -U yida yida > /backup/yida_$(date +%Y%m%d).sql

# 备份Redis数据
docker exec yida-redis redis-cli BGSAVE
docker cp yida-redis:/bitnami/redis/data/dump.rdb /backup/redis_$(date +%Y%m%d).rdb

# 备份上传的图片（如果使用本地存储）
docker cp yida-backend:/app/uploads /backup/uploads_$(date +%Y%m%d)
```

### 8.3 监控命令

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看CPU使用
top
```

### 8.4 日志轮转（防止日志占满磁盘）

```bash
# 编辑Docker daemon配置
nano /etc/docker/daemon.json
```

添加以下内容：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启Docker：

```bash
systemctl restart docker
```

---

## 9. 常见问题

### Q1: 容器启动失败怎么办？

```bash
# 查看详细日志
docker-compose logs backend

# 常见原因：
# 1. 数据库连接失败：检查POSTGRES_PASSWORD是否正确
# 2. R2配置错误：检查R2_*环境变量
# 3. 端口被占用：netstat -tulpn | grep 3000
```

### Q2: 前端访问后端报CORS错误？

检查前端 `.env.prod` 中的 `VITE_API_BASE_URL` 是否指向正确的后端地址。

如果是域名部署，确保前后端使用相同的域名/协议。

### Q3: 图片上传失败？

```bash
# 检查R2配置
docker-compose logs backend | grep R2

# 测试R2连接
docker exec -it yida-backend sh
# 在容器内测试网络
curl -I https://api.cloudflare.com
```

### Q4: 数据库连接池满了？

```bash
# 重启数据库容器
docker-compose restart postgres

# 检查连接数
docker exec -it yida-postgres psql -U yida -d yida -c "SELECT count(*) FROM pg_stat_activity;"
```

### Q5: 如何更新项目代码？

**方式一：使用Git更新（推荐）**

```bash
cd /opt/yida
git pull origin main  # 拉取最新代码
docker-compose up -d --build  # 重新构建并启动
```

**方式二：使用SCP重新上传**

```bash
# 在Windows电脑上执行
scp -r C:\Users\缪少华\Desktop\project\Yida ubuntu@42.194.162.239:/opt/yida

# 在服务器上重新构建
cd /opt/yida
docker-compose up -d --build
```

### Q6: Docker容器时间不对？

```bash
# 同步容器时间
docker exec -it yida-backend date
# 如果不对，重新构建容器
docker-compose up -d --build --force-recreate
```

### Q7: 如何让容器开机自启？

在 `docker-compose.yml` 中已配置 `restart: unless-stopped`，容器会在Docker启动时自动启动。

确保Docker开机自启：

```bash
systemctl enable docker
```

### Q8: 如何查看Prisma数据库结构？

```bash
docker exec -it yida-backend sh
npx prisma studio
# 或使用pgAdmin等工具远程连接数据库
```

### Q9: 如何重置管理员密码？

```bash
docker exec -it yida-backend sh
# 在容器内使用Prisma更新
npx prisma db seed  # 如果有seed脚本
```

或者通过Swagger API更新：

```bash
curl -X PATCH http://localhost:3000/api/admin/users/1 \
  -H "Content-Type: application/json" \
  -d '{"password": "new-password"}'
```

### Q10: Git克隆失败怎么办？

```bash
# 检查Git是否安装
git --version

# 如果没有安装
sudo apt update
sudo apt install -y git

# 检查网络连接
ping github.com

# 如果是私有仓库，需要配置SSH密钥
git clone git@github.com:你的用户名/Yida.git yida

# 或者使用HTTPS+Token（推荐）
git clone https://你的Token@github.com/你的用户名/Yida.git yida
```

### Q11: 如何迁移到另一台服务器？

**方式一：使用Git迁移（推荐）**

```bash
# 1. 在原服务器备份数据库
docker exec yida-postgres pg_dump -U yida yida > yida_backup.sql

# 2. 在新服务器执行
cd /opt
git clone https://github.com/你的用户名/Yida.git yida
cd yida

# 3. 复制.env.prod配置（手动复制或使用scp）
scp ubuntu@原服务器IP:/opt/yida/.env.prod /opt/yida/.env.prod

# 4. 恢复数据库
docker-compose up -d postgres
docker exec -i yida-postgres psql -U yida -d yida < yida_backup.sql

# 5. 启动所有服务
docker-compose up -d
```

**方式二：使用SCP迁移**

```bash
# 1. 备份数据库
docker exec yida-postgres pg_dump -U yida yida > yida_backup.sql

# 2. 备份.env.prod配置
cp .env.prod /backup/

# 3. 在新服务器安装Docker
# 4. 上传项目和配置
scp -r /opt/yida root@新服务器IP:/opt/yida
scp yida_backup.sql root@新服务器IP:/opt/yida/

# 5. 在新服务器恢复数据库
cd /opt/yida
docker-compose up -d postgres
docker exec -i yida-postgres psql -U yida -d yida < yida_backup.sql

# 6. 启动所有服务
docker-compose up -d
```

---

## 附录：项目架构速览

```
云服务器 (Ubuntu)
├── Docker Compose
│   ├── yida-frontend (Nginx, 端口80)
│   ├── yida-backend (NestJS, 端口3000)
│   ├── yida-postgres (PostgreSQL, 端口5432)
│   └── yida-redis (Redis, 端口6379)
└── 数据卷
    ├── postgres_data (数据库持久化)
    └── redis_data (缓存持久化)
```

**数据流向：**

```
用户浏览器 → Nginx(80) → 静态文件
                ↓
            /api/* → NestJS(3000) → PostgreSQL + Redis + R2
```

---

**文档版本：** v1.0  
**最后更新：** 2026-04-20  
**适用项目：** Yida AI虚拟试衣间
