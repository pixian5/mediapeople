FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime

WORKDIR /app

# 安装 wget 用于 healthcheck，然后清理 apk 缓存
RUN apk add --no-cache wget && rm -rf /var/cache/apk/*

# 创建非 root 用户运行应用
RUN addgroup -S app && adduser -S -G app -h /app app
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app index.js package.json ./

USER app

EXPOSE 3000

# 容器内健康检查：每 30s 调用 /api/health，失败 3 次标记 unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --tries=1 --timeout=3 http://127.0.0.1:3000/api/health | grep -q '"ok":true' || exit 1

CMD ["npm", "start"]
