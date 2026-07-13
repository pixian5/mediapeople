import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const server = await readFile("server/index.js", "utf8");
const deploy = await readFile("deploy/auto-deploy.sh", "utf8");
const workflow = await readFile(".github/workflows/deploy.yml", "utf8");

assert.match(
  server,
  /select raw from promo_codes where upper\(code\) = upper\(\$1\) for update/,
  "promo-code redemption must lock the code row",
);
assert.match(
  server,
  /function renewServicePlan[\s\S]*subscriptionId: currentPlan\.subscriptionId[\s\S]*weeklyMatchUsed: Number\(currentPlan\.weeklyMatchUsed/,
  "renewal must retain subscription identity and usage counters",
);

const matchRequestRoute = server.slice(
  server.indexOf('app.post("/api/client/match-requests"'),
  server.indexOf('// 5. 红娘：分别标记已联系男方/女方'),
);
assert.ok(matchRequestRoute.includes('await client.query("begin")'), "match request must start a transaction");
assert.ok(matchRequestRoute.includes('order by id for update'), "match request must lock both users");
assert.ok(matchRequestRoute.includes('await client.query("commit")'), "match request must commit atomically");
assert.ok(matchRequestRoute.indexOf('await client.query("commit")') > matchRequestRoute.lastIndexOf("insert into chat_threads"));

assert.match(server, /const terminalStatus = \["已完成", "已拒绝"\]\.includes\(request\.status\)/);
assert.match(server, /req\.status = "已完成"/);
assert.match(server, /update users set phone = \$1, age = \$2, real_name_verified = true/);
assert.match(server, /rankedList\.sort[\s\S]*rankedList\.slice\(offset, offset \+ pageSize\)/);
assert.match(server, /function isGroupChatAllowed\(request\) \{\s*return Boolean\(request\?\.matchmakerId\)/);

assert.ok(
  deploy.indexOf("local exit_code=$?") < deploy.indexOf("set +e  # trap 内禁用 set -e"),
  "deploy trap must capture the real exit code before disabling errexit",
);
assert.match(deploy, /部署后 API 健康检查失败/);
assert.match(workflow, /concurrency:[\s\S]*matchmaker-production-deploy/);
assert.doesNotMatch(workflow, /git pull --ff-only origin master/);

console.log("business invariant regression test passed");
