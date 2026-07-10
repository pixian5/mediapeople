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

ssh $ssh_args "$REMOTE_HOST" "cd /opt/mediapeople && git fetch origin '$BRANCH' && git checkout '$BRANCH' && bash '$REMOTE_DEPLOY_SCRIPT'"
