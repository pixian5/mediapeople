#!/bin/sh
set -eu

BRANCH="${1:-master}"
REMOTE_HOST="${REMOTE_HOST:-root@uk.sbbz.tech}"
REMOTE_DEPLOY_SCRIPT="${REMOTE_DEPLOY_SCRIPT:-/opt/mediapeople/deploy/auto-deploy.sh}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/mediapeople_uk_ed25519}"

ssh_args="-o StrictHostKeyChecking=accept-new"
if [ -f "$SSH_KEY_PATH" ]; then
  ssh_args="$ssh_args -i $SSH_KEY_PATH"
fi

if [ "$BRANCH" != "master" ]; then
  echo "当前服务器自动部署脚本固定部署 master，暂不支持通过 remote-deploy.sh 切换到其他分支。" >&2
  exit 1
fi

ssh $ssh_args "$REMOTE_HOST" "cp '$REMOTE_DEPLOY_SCRIPT' /tmp/auto-deploy-\$\$.sh && bash /tmp/auto-deploy-\$\$.sh; rm -f /tmp/auto-deploy-\$\$.sh"
