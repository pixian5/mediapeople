#!/bin/bash
# auto-deploy.sh - 由 GitHub Webhook 或手动触发，自动拉取代码并重启服务
# 用法: bash /opt/matchmaker/deploy/auto-deploy.sh

set -eo pipefail

REPO_DIR="/opt/matchmaker"
LOG_FILE="/var/log/matchmaker-deploy.log"
BARK_KEY="${BARK_KEY:-}"
LOCK_FILE="/var/run/matchmaker-deploy.lock"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

bark_notify() {
  local title="$1"
  local body="$2"
  if [ -z "$BARK_KEY" ]; then
    log "BARK_KEY 未配置，跳过推送：$title"
    return 0
  fi
  local esc_title esc_body
  esc_title=$(printf '%s' "$title" | sed 's/\\/\\\\/g; s/"/\\"/g')
  esc_body=$(printf '%s' "$body" | sed 's/\\/\\\\/g; s/"/\\"/g')
  curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.day.app/${BARK_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$esc_title\",\"body\":\"$esc_body\",\"group\":\"matchmaker-deploy\"}" \
    --max-time 10 || true
}

# 部署结束通知（成功/失败均触发）
DEPLOY_START_TIME=$(date +%s)
bark_on_exit() {
  local exit_code=$?
  set +e  # trap 内禁用 set -e，确保 bark_notify 一定能执行
  local elapsed=$(( $(date +%s) - DEPLOY_START_TIME ))
  local commit_hash commit_msg
  commit_hash=$(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
  commit_msg=$(git -C "$REPO_DIR" log -1 --pretty=format:'%s' 2>/dev/null || echo "")
  log "bark_on_exit 触发: exit_code=${exit_code} elapsed=${elapsed}s commit=${commit_hash}"
  if [ $exit_code -eq 0 ]; then
    local http_code
    http_code=$(bark_notify "matchmaker 部署成功" "耗时 ${elapsed}s | ${commit_hash} ${commit_msg}")
    log "bark_notify 返回: http_code=${http_code}"
  else
    local err_tail
    err_tail=$(tail -5 "$LOG_FILE" 2>/dev/null | tr '\n' ' ' | head -c 200)
    local http_code
    http_code=$(bark_notify "matchmaker 部署失败" "exit=${exit_code} 耗时 ${elapsed}s | ${commit_hash} ${commit_msg} | ${err_tail}")
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

# 部署前预检：校验 .env 中的关键密钥，避免服务器仍是默认值时让新容器在启动期崩溃
# 导致 web 长时间不可用。失败直接退出，不要走 docker build 那条路。
log "正在校验 /opt/matchmaker/.env 关键密钥..."
if [ ! -f "$REPO_DIR/.env" ]; then
  log "ERROR: $REPO_DIR/.env 不存在，请先按 .env.example 创建并填入强密钥"
  exit 1
fi
# 用 set -a 让 .env 中的 KEY=VALUE 自动 export，再用同名变量读取
set -a
# shellcheck disable=SC1091
. "$REPO_DIR/.env"
set +a

ENV_ERRORS=()
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  ENV_ERRORS+=("POSTGRES_PASSWORD 未设置")
fi
if [ -z "${JWT_SECRET:-}" ] || [ "${JWT_SECRET}" = "matchmaker-dev-secret-change-me" ]; then
  ENV_ERRORS+=("JWT_SECRET 未设置或仍是默认值")
elif [ "${#JWT_SECRET}" -lt 16 ]; then
  ENV_ERRORS+=("JWT_SECRET 长度必须 >= 16（当前 ${#JWT_SECRET}）")
fi
if [ -z "${ADMIN_PASSWORD:-}" ] || [ "${ADMIN_PASSWORD}" = "admin" ]; then
  ENV_ERRORS+=("ADMIN_PASSWORD 未设置或仍是默认值 admin")
elif [ "${#ADMIN_PASSWORD}" -lt 8 ]; then
  ENV_ERRORS+=("ADMIN_PASSWORD 长度必须 >= 8（当前 ${#ADMIN_PASSWORD}）")
fi
if [ "${#ENV_ERRORS[@]}" -gt 0 ]; then
  log "ERROR: .env 预检失败："
  for err in "${ENV_ERRORS[@]}"; do
    log "  - $err"
  done
  log "请先到服务器修改 $REPO_DIR/.env，再用新密钥重新部署。"
  exit 1
fi
log ".env 预检通过"

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
  touch /tmp/matchmaker-webhook-needs-restart
fi

# 单端口网关配置变更需要 recreate；--remove-orphans 会清理旧的多端口前端容器。
log "正在部署单端口 HTTPS 网关（21314）并清理旧前端容器..."
docker compose -f "$REPO_DIR/compose.yml" -f "$REPO_DIR/compose.ssl.yml" up -d \
  --build --force-recreate --remove-orphans gateway api postgres 2>&1 | tee -a "$LOG_FILE"

log "正在检查网关配置..."
docker exec matchmaker-gateway nginx -t 2>&1 | tee -a "$LOG_FILE"

log "正在检查线上 API 健康状态..."
HEALTH_OK=false
for attempt in 1 2 3 4 5; do
  if curl -kfsS --max-time 10 "https://127.0.0.1:21314/api/health" | grep -q '"ok":true'; then
    HEALTH_OK=true
    break
  fi
  sleep 2
done
if [ "$HEALTH_OK" != "true" ]; then
  log "ERROR: 部署后 API 健康检查失败"
  exit 1
fi

log "===== 部署完成 ====="
