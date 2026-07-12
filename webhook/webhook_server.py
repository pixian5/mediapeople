#!/usr/bin/env python3
"""
mediapeople webhook server
接收 GitHub push 事件，触发服务器自动部署

用法:
  WEBHOOK_SECRET=your_secret python3 webhook_server.py
  
  或设置环境变量后后台运行 (推荐通过 systemd 管理)
"""

import http.server
import socketserver
import hashlib
import hmac
import json
import os
import subprocess
import threading
import logging
import sys
import urllib.request
from datetime import datetime

PORT = int(os.environ.get("WEBHOOK_PORT", 9000))
SECRET = os.environ.get("WEBHOOK_SECRET", "").encode()
DEPLOY_SCRIPT = os.environ.get("DEPLOY_SCRIPT", "/opt/mediapeople/deploy/auto-deploy.sh")
LOG_FILE = "/var/log/mediapeople-webhook.log"
BARK_KEY = os.environ.get("BARK_KEY", "RSyM7zPTvBfhNwf4RmMxic")

# 配置日志同时输出到文件和标准输出
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE),
    ]
)
logger = logging.getLogger(__name__)

deploying = threading.Lock()


def bark_notify(title: str, body: str):
    """发送 Bark 推送通知（不抛异常，失败静默）"""
    try:
        data = json.dumps({
            "title": title,
            "body": body,
            "group": "mediapeople-deploy",
        }).encode()
        req = urllib.request.Request(
            f"https://api.day.app/{BARK_KEY}",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def verify_signature(body: bytes, signature: str) -> bool:
    if not SECRET:
        return True  # 未配置 secret 时跳过验证
    expected = "sha256=" + hmac.new(SECRET, body, hashlib.sha256).hexdigest()
    try:
        return hmac.compare_digest(expected.encode(), signature.encode())
    except Exception:
        return False


def run_deploy():
    logger.info("开始执行部署脚本...")
    try:
        # 拷贝脚本到临时文件，避免 git pull 更新原文件导致 bash trap 失效
        import tempfile, shutil
        tmp_script = tempfile.NamedTemporaryFile(suffix=".sh", delete=False, mode="w")
        shutil.copy2(DEPLOY_SCRIPT, tmp_script.name)
        tmp_script.close()
        result = subprocess.run(
            ["bash", tmp_script.name],
            timeout=300,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=False,
        )
        try:
            os.unlink(tmp_script.name)
        except Exception:
            pass
        # 流式写出输出，避免在内存里堆积
        try:
            if result.stdout:
                for line in result.stdout.split(b"\n"):
                    sys.stdout.write(line.decode("utf-8", errors="replace") + "\n")
                sys.stdout.flush()
        except Exception:
            pass
        if result.returncode == 0:
            logger.info("部署成功完成")
            # 成功通知由 auto-deploy.sh 的 trap 负责，避免重复
        else:
            logger.error(f"部署脚本退出码: {result.returncode}")
            # 失败通知由 auto-deploy.sh 的 trap 负责，避免重复

        # 检查是否需要重启 webhook（webhook/ 代码变更时由 auto-deploy.sh 标记）
        if os.path.exists("/tmp/mediapeople-webhook-needs-restart"):
            try:
                os.unlink("/tmp/mediapeople-webhook-needs-restart")
            except Exception:
                pass
            logger.info("检测到 webhook 重启标记，15秒后延迟重启...")
            # 用 systemd-run 创建独立 transient service 执行延迟重启
            # 这样重启 webhook 时不会杀掉这个延迟重启进程
            subprocess.Popen(
                ["systemd-run", "--unit=mediapeople-webhook-restart",
                 "bash", "-c", "sleep 15 && systemctl restart mediapeople-webhook"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    except subprocess.TimeoutExpired:
        logger.error("部署超时 (300s)")
        bark_notify("mediapeople 部署超时", "部署脚本执行超过 300s 被强制终止")
    except Exception as e:
        logger.error(f"部署异常: {e}")
        bark_notify("mediapeople 部署异常", f"webhook 执行部署脚本时出错: {e}")
    finally:
        deploying.release()


class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 禁用默认访问日志

    def do_POST(self):
        if self.path != "/webhook":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        signature = self.headers.get("X-Hub-Signature-256", "")

        if not verify_signature(body, signature):
            logger.warning("签名验证失败，拒绝请求")
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Forbidden")
            return

        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 忽略 GitHub ping 事件
        if "hook_id" in payload and "zen" in payload and "ref" not in payload:
            logger.info("收到 ping 事件，忽略")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Pong")
            return

        ref = payload.get("ref", "")
        if ref and not (ref.endswith("/main") or ref.endswith("/master")):
            logger.info(f"忽略非主分支推送: {ref}")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Ignored")
            return

        if not deploying.acquire(blocking=False):
            logger.info("上次部署仍在进行，跳过本次")
            self.send_response(202)
            self.end_headers()
            self.wfile.write(b"Deploying, skipped")
            return

        # 额外检查跨进程锁，防止手动 SSH 触发的部署与 webhook 触发的并发
        import fcntl
        lock_fd = os.open("/var/run/mediapeople-deploy.lock", os.O_CREAT | os.O_RDWR, 0o644)
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except (IOError, OSError):
            os.close(lock_fd)
            deploying.release()
            logger.info("跨进程锁被占用（手动部署进行中），跳过本次")
            self.send_response(202)
            self.end_headers()
            self.wfile.write(b"Deploying, skipped")
            return
        os.close(lock_fd)  # auto-deploy.sh 内部会重新获取 flock

        logger.info(f"收到 push 事件 ({ref})，启动部署线程...")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")

        thread = threading.Thread(target=run_deploy, daemon=True)
        thread.start()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), WebhookHandler)
    logger.info(f"Webhook 监听 http://127.0.0.1:{PORT}/webhook (ThreadingHTTPServer)")
    logger.info(f"健康检查: http://127.0.0.1:{PORT}/health")
    logger.info(f"部署脚本: {DEPLOY_SCRIPT}")
    logger.info(f"Signature 验证: {'开启' if SECRET else '关闭 (未设置 WEBHOOK_SECRET)'}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("服务已停止")
