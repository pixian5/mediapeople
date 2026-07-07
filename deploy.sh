#!/bin/bash

# 退出脚本如果任何命令失败
set -e

echo "=== 1. 自动更新前端资源版本号 (Cache Busting) ==="
node -e '
const fs = require("fs");
const files = ["admin.html", "index.html", "matchmaker.html", "mini.html", "readme.md"];
const content = fs.readFileSync("admin.html", "utf8");
const match = content.match(/app\.js\?v=([^"'\s&]+)/);
if (match) {
  const currentVersion = match[1];
  let newVersion;
  if (/^\d+\.\d+\.\d+$/.test(currentVersion)) {
    const parts = currentVersion.split(".");
    parts[parts.length - 1] = parseInt(parts[parts.length - 1], 10) + 1;
    newVersion = parts.join(".");
  } else {
    newVersion = Date.now().toString(36);
  }
  console.log("正在将版本号从 " + currentVersion + " 升级至 " + newVersion);
  for (const file of files) {
    if (fs.existsSync(file)) {
      let fileContent = fs.readFileSync(file, "utf8");
      fileContent = fileContent.replace(/(app\.js\?v=)[^"'\s&]+/g, "$1" + newVersion);
      fileContent = fileContent.replace(/(styles\.css\?v=)[^"'\s&]+/g, "$1" + newVersion);
      fs.writeFileSync(file, fileContent, "utf8");
    }
  }
} else {
  console.log("未找到版本号，跳过更新。");
}
'
echo ""

echo "=== 2. 运行本地语法与配置检查 ==="
node --check app.js
node --check server/index.js
POSTGRES_PASSWORD=dummy JWT_SECRET=dummy docker compose -f compose.yml -f compose.ssl.yml config > /dev/null
echo "✓ 语法与 Docker 配置检查通过！"
echo ""

# 检查是否有未提交的修改
if [ -n "$(git status --porcelain)" ]; then
    echo "=== 3. 发现未提交的更改，准备进行 Git 提交 ==="
    git status --short
    echo ""
    
    # 获取 commit 信息
    COMMIT_MSG="$1"
    if [ -z "$COMMIT_MSG" ]; then
        read -p "请输入 Git Commit 提交信息: " COMMIT_MSG
    fi
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="deploy: auto-commit at $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git add -A
    git commit -m "$COMMIT_MSG"
    echo "✓ 代码已本地提交: $COMMIT_MSG"
    echo ""
else
    echo "=== 3. 没有检测到未提交的更改，跳过 Commit ==="
    echo ""
fi

echo "=== 4. 推送代码至 GitHub ==="
git push origin master
echo "✓ 代码推送成功！"
echo ""

echo "=== 5. 连接服务器并执行部署 ==="
ssh -i ~/.ssh/mediapeople_uk_ed25519 -o StrictHostKeyChecking=accept-new root@uk.sbbz.tech "bash /opt/mediapeople/deploy/auto-deploy.sh"
echo "✓ 服务器部署指令执行完成！"
echo ""

echo "=== 6. 运行健康检查 ==="
echo "等待 3 秒让服务启动..."
sleep 3

echo "检查 HTTP 端口 (8095-8098):"
for port in 8095 8096 8097 8098; do
  printf "  HTTP Port %s: " "$port"
  status_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 http://uk.sbbz.tech:$port/api/health || echo "Failed")
  if [ "$status_code" = "200" ]; then
    echo "正常 (200)"
  else
    echo "异常 (HTTP $status_code)"
  fi
done

echo "检查 HTTPS 端口 (9445-9448):"
for port in 9445 9446 9447 9448; do
  printf "  HTTPS Port %s: " "$port"
  status_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 https://uk.sbbz.tech:$port/api/health || echo "Failed")
  if [ "$status_code" = "200" ]; then
    echo "正常 (200)"
  else
    echo "异常 (HTTP $status_code)"
  fi
done
echo ""

echo "=== 部署与验证全部完成！ ==="
