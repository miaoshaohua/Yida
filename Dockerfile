# 使用 Node.js 官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制后端 package.json 和 package-lock.json
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端源代码
COPY backend/ ./

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 NestJS 应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "run", "start:prod"]
