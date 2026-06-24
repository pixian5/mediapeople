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
