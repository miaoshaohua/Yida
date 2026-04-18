# 构建阶段
FROM node:18-alpine AS builder

# 安装 OpenSSL 和其他依赖
RUN apk add --no-cache openssl

WORKDIR /app

# 复制后端 package.json 和 package-lock.json
COPY backend/package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制后端源代码
COPY backend/ ./

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 NestJS 应用
RUN npm run build

# 生产阶段
FROM node:18-alpine

# 安装 OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

# 复制 package.json
COPY backend/package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 暴露端口
EXPOSE 3000

# 启动应用 - 注意路径是 dist/src/main.js
CMD ["node", "dist/src/main.js"]
