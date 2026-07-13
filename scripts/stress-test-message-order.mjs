// 快速发送消息压力测试
// 用法: node scripts/stress-test-message-order.mjs [API_BASE] [THREAD_ID]
// 例: node scripts/stress-test-message-order.mjs http://localhost:3000 ct_test_thread

import http from "node:http";
import https from "node:https";

const API_BASE = process.argv[2] || "https://uk.sbbz.tech:21314";
const THREAD_ID = process.argv[3] || null;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === "https:";
    const httpModule = isHttps ? https : http;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
      rejectUnauthorized: false,
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;

    const req = httpModule.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function loginClient(userId, password) {
  const res = await request("POST", "/api/auth/client/login", { userId, password });
  if (res.status !== 200) throw new Error(`登录失败: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

async function createTestThread(token) {
  // 获取匹配请求/线程列表
  const res = await request("GET", "/api/client/chat/threads", null, token);
  if (res.body?.data?.list?.length > 0) {
    return res.body.data.list[0].id;
  }
  throw new Error("没有可用的聊天线程，请先创建一个匹配请求");
}

async function sendMessage(token, threadId, content, clientSeq, deviceId, createdAt) {
  const clientMsgNo = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const res = await request(
    "POST",
    `/api/chat/threads/${threadId}/messages`,
    { content, clientMsgNo, clientSeq, deviceId, createdAt },
    token
  );
  if (res.status !== 201) {
    throw new Error(`发送失败: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.message;
}

async function getMessages(token, threadId) {
  const res = await request("GET", `/api/client/chat/threads/${threadId}/messages`, null, token);
  if (res.status !== 200) {
    throw new Error(`获取消息失败: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.list;
}

async function main() {
  console.log(`=== 快速发送消息压力测试 ===`);
  console.log(`API_BASE: ${API_BASE}`);

  // 登录
  console.log("\n1. 登录测试账号...");
  const token = await loginClient("u1", "123456");
  console.log("   登录成功");

  // 获取线程
  console.log("\n2. 获取聊天线程...");
  const threadId = THREAD_ID || await createTestThread(token);
  console.log(`   线程ID: ${threadId}`);

  // 快速发送测试：一秒10条
  const BURST_COUNT = 10;
  const INTERVAL_MS = 100;
  const deviceId = `stress_${Date.now()}`;
  const baseTime = Date.now();

  console.log(`\n3. 快速发送 ${BURST_COUNT} 条消息（间隔 ${INTERVAL_MS}ms）...`);

  const sendPromises = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    const seq = i + 1;
    const createdAt = new Date(baseTime + i * INTERVAL_MS).toISOString();
    const content = `测试消息-${String(seq).padStart(3, "0")}`;

    await new Promise((r) => setTimeout(r, INTERVAL_MS));

    const promise = sendMessage(token, threadId, content, seq, deviceId, createdAt)
      .then((msg) => {
        console.log(`   ✓ 第${seq}条已发送 (seq=${msg.seq}, clientSeq=${msg.clientSeq})`);
        return msg;
      })
      .catch((err) => {
        console.log(`   ✗ 第${seq}条失败: ${err.message}`);
        return null;
      });
    sendPromises.push(promise);
  }

  const sentMessages = (await Promise.all(sendPromises)).filter(Boolean);
  console.log(`\n   成功发送 ${sentMessages.length}/${BURST_COUNT} 条`);

  // 等待一小会儿确保所有消息落库
  await new Promise((r) => setTimeout(r, 500));

  // 拉取历史消息验证顺序
  console.log("\n4. 拉取历史消息验证顺序...");
  const historyMessages = await getMessages(token, threadId);

  // 只取我们刚发的消息（通过deviceId过滤）
  const ourMessages = historyMessages.filter((m) => m.deviceId === deviceId);
  console.log(`   找到 ${ourMessages.length} 条测试消息`);

  console.log("\n5. 验证排序：");
  let orderCorrect = true;
  for (let i = 0; i < ourMessages.length - 1; i++) {
    const curr = ourMessages[i];
    const next = ourMessages[i + 1];

    // 验证 clientSeq 递增
    if (curr.clientSeq > next.clientSeq) {
      console.log(`   ✗ clientSeq乱序: ${curr.clientSeq} → ${next.clientSeq} (${curr.content} → ${next.content})`);
      orderCorrect = false;
    }

    // 验证 seq 和 clientSeq 的关系（网络延迟可能导致seq乱序）
    if (curr.seq > next.seq && curr.clientSeq < next.clientSeq) {
      console.log(`   ℹ seq乱序但clientSeq正常: seq ${curr.seq}→${next.seq}, clientSeq ${curr.clientSeq}→${next.clientSeq}`);
    }
  }

  if (orderCorrect) {
    console.log("   ✓ clientSeq 排序正确");
  }

  // 验证服务端返回的排序（按createdAt）
  console.log("\n6. 验证服务端 createdAt 排序：");
  let createdAtOrderCorrect = true;
  for (let i = 0; i < ourMessages.length - 1; i++) {
    const curr = ourMessages[i];
    const next = ourMessages[i + 1];
    if (new Date(curr.createdAt) > new Date(next.createdAt)) {
      console.log(`   ✗ createdAt乱序: ${curr.createdAt} → ${next.createdAt}`);
      createdAtOrderCorrect = false;
    }
  }
  if (createdAtOrderCorrect) {
    console.log("   ✓ createdAt 排序正确");
  }

  // 打印前5条消息详情
  console.log("\n7. 消息详情（前5条）：");
  ourMessages.slice(0, 5).forEach((m, i) => {
    console.log(`   [${i}] seq=${m.seq}, clientSeq=${m.clientSeq}, createdAt=${m.createdAt.slice(11, 23)}, content=${m.content}`);
  });

  console.log("\n=== 测试完成 ===");
  if (orderCorrect && createdAtOrderCorrect) {
    console.log("✅ 所有排序验证通过");
  } else {
    console.log("❌ 存在排序问题");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("测试失败:", err.message);
  process.exit(1);
});
