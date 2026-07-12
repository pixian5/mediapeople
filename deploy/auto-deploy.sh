#!/bin/bash
# auto-deploy.sh - 由 GitHub Webhook 或手动触发，自动拉取代码并重启服务
# 用法: bash /opt/mediapeople/deploy/auto-deploy.sh

set -eo pipefail

REPO_DIR="/opt/mediapeople"
LOG_FILE="/var/log/mediapeople-deploy.log"
BARK_KEY="RSyM7zPTvBfhNwf4RmMxic"
LOCK_FILE="/var/run/mediapeople-deploy.lock"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

bark_notify() {
  local title="$1"
  local body="$2"
  local esc_title esc_body
  esc_title=$(printf '%s' "$title" | sed 's/\\/\\\\/g; s/"/\\"/g')
  esc_body=$(printf '%s' "$body" | sed 's/\\/\\\\/g; s/"/\\"/g')
  curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.day.app/${BARK_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$esc_title\",\"body\":\"$esc_body\",\"group\":\"mediapeople-deploy\"}" \
    --max-time 10 || true
}

# 部署结束通知（成功/失败均触发）
DEPLOY_START_TIME=$(date +%s)
bark_on_exit() {
  set +e  # trap 内禁用 set -e，确保 bark_notify 一定能执行
  local exit_code=$?
  local elapsed=$(( $(date +%s) - DEPLOY_START_TIME ))
  local commit_hash commit_msg
  commit_hash=$(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
  commit_msg=$(git -C "$REPO_DIR" log -1 --pretty=format:'%s' 2>/dev/null || echo "")
  log "bark_on_exit 触发: exit_code=${exit_code} elapsed=${elapsed}s commit=${commit_hash}"
  if [ $exit_code -eq 0 ]; then
    local http_code
    http_code=$(bark_notify "mediapeople 部署成功" "耗时 ${elapsed}s | ${commit_hash} ${commit_msg}")
    log "bark_notify 返回: http_code=${http_code}"
  else
    local err_tail
    err_tail=$(tail -5 "$LOG_FILE" 2>/dev/null | tr '\n' ' ' | head -c 200)
    local http_code
    http_code=$(bark_notify "mediapeople 部署失败" "exit=${exit_code} 耗时 ${elapsed}s | ${commit_hash} ${commit_msg} | ${err_tail}")
    log "bark_notify 返回: http_code=${http_code}"
  fi
}
trap bark_on_exit EXIT

# 跨进程部署锁，防止 webhook 触发和手动 SSH 触发并发
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "另一个部署正在运行，退出"
  exit 0
fi

log "===== 开始自动部署 ====="

cd "$REPO_DIR"

PREVIOUS_HEAD="$(git rev-parse HEAD 2>/dev/null || echo '')"
CURRENT_HEAD=""
H5_BUILD_STAMP="$REPO_DIR/uniapp/dist/build/h5/.build-commit"

# 拉取最新代码（先恢复 npm install 可能改写的 lockfile，防止 pull 冲突）
git -C "$REPO_DIR" checkout -- uniapp/package-lock.json 2>/dev/null || true
log "正在 git pull --ff-only..."
git pull --ff-only origin master 2>&1 | tee -a "$LOG_FILE"
CURRENT_HEAD="$(git rev-parse HEAD 2>/dev/null || echo '')"

# 检查是否有 server/ / uniapp/ 变更（需要重新构建对应产物）
if [ -n "$PREVIOUS_HEAD" ] && [ -n "$CURRENT_HEAD" ] && [ "$PREVIOUS_HEAD" != "$CURRENT_HEAD" ]; then
  CHANGED_FILES="$(git diff "$PREVIOUS_HEAD" "$CURRENT_HEAD" --name-only 2>/dev/null || echo '')"
else
  CHANGED_FILES=""
fi

NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  elif command -v nodejs >/dev/null 2>&1; then
    NODE_BIN="$(command -v nodejs)"
  else
    NODE_BIN="$(find "$HOME/.nvm/versions/node" -maxdepth 3 -type f -name node 2>/dev/null | sort -V | tail -n 1)"
  fi
fi

if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  log "ERROR: Node.js 未找到，无法生成自动版本号静态页面"
  exit 1
fi
export PATH="$(dirname "$NODE_BIN"):$PATH"

build_uniapp_h5() {
  log "开始构建 uniapp H5..."

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

  mkdir -p "$(dirname "$H5_BUILD_STAMP")"
  printf '%s\n' "$CURRENT_HEAD" > "$H5_BUILD_STAMP"
  log "uniapp H5 构建完成，已记录提交标记: ${CURRENT_HEAD}"
}

log "正在生成带自动版本号的静态页面..."
"$NODE_BIN" "$REPO_DIR/scripts/render-static.mjs" 2>&1 | tee -a "$LOG_FILE"

CURRENT_H5_BUILD="$(cat "$H5_BUILD_STAMP" 2>/dev/null || echo '')"
if echo "$CHANGED_FILES" | grep -q '^uniapp/'; then
  log "检测到 uniapp/ 代码变更，构建 H5 版本..."
  build_uniapp_h5
elif [ ! -d "$REPO_DIR/uniapp/dist/build/h5" ] || [ "$CURRENT_H5_BUILD" != "$CURRENT_HEAD" ]; then
  log "检测到 H5 构建产物缺失或提交标记不匹配，执行补构建..."
  build_uniapp_h5
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

# webhook 服务自身变更时重启 systemd 服务，否则新代码不会生效
# 用标记文件通知 webhook server 在部署完成后自行重启
WEBHOOK_NEEDS_RESTART=false
if echo "$CHANGED_FILES" | grep -q '^webhook/'; then
  log "检测到 webhook/ 变更，将在部署完成后触发重启..."
  WEBHOOK_NEEDS_RESTART=true
  touch /tmp/mediapeople-webhook-needs-restart
fi

# 重建 SSL version API / Nginx 容器（若有必要）。compose 配置变更必须 recreate，restart 不会应用 extra_hosts/ports 等容器配置。
if docker ps --format '{{.Names}}' | grep -q 'mediapeople-web-ssl'; then
  if echo "$CHANGED_FILES" | grep -Eq '^(server/|compose\.ssl\.yml|deploy/nginx-ssl\.conf)'; then
    SSL_RECREATE_ARGS=""
    if echo "$CHANGED_FILES" | grep -Eq '^(compose\.ssl\.yml|deploy/nginx-ssl\.conf)'; then
      SSL_RECREATE_ARGS="--force-recreate"
    fi
    docker compose -f "$REPO_DIR/compose.yml" -f "$REPO_DIR/compose.ssl.yml" up -d $SSL_RECREATE_ARGS \
      web-ssl web-mini-ssl web-matchmaker-ssl web-admin-ssl 2>&1 | tee -a "$LOG_FILE"
  fi
fi

log "正在重启 Nginx 容器以挂载最新文件并应用配置..."
for container in web web-mini web-matchmaker web-admin web-ssl web-mini-ssl web-matchmaker-ssl web-admin-ssl; do
  docker compose -f "$REPO_DIR/compose.yml" -f "$REPO_DIR/compose.ssl.yml" restart $container 2>&1 | tee -a "$LOG_FILE" || true
done

log "===== 部署完成 ====="
