import http from "http";
import crypto from "crypto";
import { exec } from "child_process";
import fs from "fs";

const PORT = Number(process.env.WEBHOOK_PORT || 9000);
const SECRET = process.env.WEBHOOK_SECRET || "";
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || "/opt/mediapeople/deploy/auto-deploy.sh";
const LOG_FILE = "/var/log/mediapeople-webhook.log";
const BARK_KEY = process.env.BARK_KEY || "RSyM7zPTvBfhNwf4RmMxic";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
}

function barkNotify(title, body) {
  const data = JSON.stringify({ title, body, group: "mediapeople-deploy" });
  const req = http.request(`https://api.day.app/${BARK_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    timeout: 10000,
  });
  req.on("error", () => {});
  req.write(data);
  req.end();
}

function verifySignature(body, signature) {
  if (!SECRET) return true; // 未配置 secret 时跳过验证
  const expected = "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

let deploying = false;

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk.toString(); });
  req.on("end", () => {
    const signature = req.headers["x-hub-signature-256"] || "";
    if (!verifySignature(body, signature)) {
      log("签名验证失败，拒绝请求");
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let payload;
    try { payload = JSON.parse(body); } catch { payload = {}; }

    // 忽略 GitHub ping 事件
    if (payload.hook_id && payload.zen && !payload.ref) {
      log("收到 ping 事件，忽略");
      res.writeHead(200);
      res.end("Pong");
      return;
    }

    const ref = payload.ref || "";
    // 只处理 main 或 master 分支的推送
    if (ref && !ref.endsWith("/main") && !ref.endsWith("/master")) {
      log(`忽略非主分支推送: ${ref}`);
      res.writeHead(200);
      res.end("Ignored");
      return;
    }

    if (deploying) {
      log("上次部署仍在进行，跳过本次");
      res.writeHead(202);
      res.end("Deploying, skipped");
      return;
    }

    log(`收到 push 事件 (${ref})，开始部署...`);
    res.writeHead(200);
    res.end("OK");

    deploying = true;
    // 拷贝脚本到临时文件，避免 git pull 更新原文件导致 bash trap 失效
    const tmpScript = `/tmp/auto-deploy-${Date.now()}.sh`;
    try { fs.copyFileSync(DEPLOY_SCRIPT, tmpScript); } catch (e) { log(`复制脚本失败: ${e.message}`); }
    exec(`bash ${tmpScript}`, { timeout: 300000 }, (error, stdout, stderr) => {
      try { fs.unlinkSync(tmpScript); } catch {}
      deploying = false;
      if (error) {
        if (error.killed) {
          log("部署超时 (300s)");
          barkNotify("mediapeople 部署超时", "部署脚本执行超过 300s 被强制终止");
        } else {
          log(`部署失败: ${error.message}`);
          // 失败通知由 auto-deploy.sh 的 trap 负责，避免重复
        }
      } else {
        log("部署成功完成");
        // 成功通知由 auto-deploy.sh 的 trap 负责，避免重复
      }
      if (stdout) log(`stdout: ${stdout.trim()}`);
      if (stderr) log(`stderr: ${stderr.trim()}`);
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  log(`Webhook 监听 http://127.0.0.1:${PORT}/webhook`);
});
