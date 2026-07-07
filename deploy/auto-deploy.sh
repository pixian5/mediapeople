#!/bin/bash
# auto-deploy.sh - 由 GitHub Webhook 或手动触发，自动拉取代码并重启服务
# 用法: bash /opt/mediapeople/deploy/auto-deploy.sh

set -e

REPO_DIR="/opt/mediapeople"
LOG_FILE="/var/log/mediapeople-deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "===== 开始自动部署 ====="

cd "$REPO_DIR"

# 拉取最新代码
log "正在 git pull..."
git pull origin master 2>&1 | tee -a "$LOG_FILE"

# 检查是否有 server/ 变更（需要重新构建 api 容器）
CHANGED_FILES=$(git diff HEAD@{1} HEAD --name-only 2>/dev/null || echo "")

NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  elif command -v nodejs >/dev/null 2>&1; then
    NODE_BIN="$(command -v nodejs)"
  else
    NODE_BIN="$(find "$HOME/.nvm/versions/node" -maxdepth 3 -type f -name node 2>/dev/null | sort | tail -n 1)"
  fi
fi

if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  log "ERROR: Node.js 未找到，无法生成自动版本号静态页面"
  exit 1
fi

log "正在生成带自动版本号的静态页面..."
"$NODE_BIN" "$REPO_DIR/scripts/render-static.mjs" 2>&1 | tee -a "$LOG_FILE"

if echo "$CHANGED_FILES" | grep -q '^uniapp/'; then
  log "检测到 uniapp/ 变更，构建 H5 版本..."
  NPM_BIN="${NPM_BIN:-}"
  if [ -z "$NPM_BIN" ] && command -v npm >/dev/null 2>&1; then
    NPM_BIN="$(command -v npm)"
  fi
  if [ -z "$NPM_BIN" ] && [ -x "$(dirname "$NODE_BIN")/npm" ]; then
    NPM_BIN="$(dirname "$NODE_BIN")/npm"
  fi

  if [ -n "$NPM_BIN" ] && [ -x "$NPM_BIN" ]; then
    (
      cd "$REPO_DIR/uniapp"
      "$NPM_BIN" install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
      "$NPM_BIN" run build:h5 2>&1 | tee -a "$LOG_FILE"
    )
  elif command -v docker >/dev/null 2>&1; then
    log "宿主机 npm 未找到，改用 Docker Node 构建 uniapp H5..."
    docker run --rm \
      -v "$REPO_DIR/uniapp:/app" \
      -w /app \
      node:22-alpine \
      sh -lc 'npm install --legacy-peer-deps && npm run build:h5' 2>&1 | tee -a "$LOG_FILE"
  else
    log "ERROR: npm 和 Docker 都不可用，无法构建 uniapp H5"
    exit 1
  fi
else
  log "无 uniapp/ 变更，跳过 H5 构建"
fi

if echo "$CHANGED_FILES" | grep -q '^server/'; then
  log "检测到 server/ 变更，重新构建 api 容器..."
  docker compose -f "$REPO_DIR/compose.yml" build api 2>&1 | tee -a "$LOG_FILE"
  docker compose -f "$REPO_DIR/compose.yml" up -d api 2>&1 | tee -a "$LOG_FILE"
  log "api 容器已重新构建并重启"
else
  log "无 server/ 变更，前端文件通过 volume 挂载已更新"
fi

# 重建 SSL version API（若有必要）
if docker ps --format '{{.Names}}' | grep -q 'mediapeople-web-ssl'; then
  if echo "$CHANGED_FILES" | grep -q '^server/'; then
    docker compose -f "$REPO_DIR/compose.ssl.yml" up -d 2>&1 | tee -a "$LOG_FILE"
  fi
fi

log "正在重启 Nginx 容器以挂载最新文件并应用配置..."
for container in web web-mini web-matchmaker web-admin web-ssl web-mini-ssl web-matchmaker-ssl web-admin-ssl; do
  docker compose -f "$REPO_DIR/compose.yml" -f "$REPO_DIR/compose.ssl.yml" restart $container 2>&1 | tee -a "$LOG_FILE" || true
done

log "===== 部署完成 ====="
