# 缘定传媒人：单身交友小程序 + 红娘端 + 管理后台

这是一个单身交友业务原型，包含客户小程序端、红娘工作台、管理后台、Node/Express API、PostgreSQL 数据库和 Docker/Nginx 部署配置。

当前项目仍是开发测试版，数据为演示数据，可以重构，但改动后必须验证客户、红娘、后台三端主流程。

## 当前状态

- 客户端：注册/登录、资料维护、筛选异性资料、VIP 兑换、申请牵线、实名认证。
- 红娘端：注册/登录、查看牵线通知、查看双方隐藏微信、标记已联系。
- 管理后台：登录、左侧栏目导航、客户/红娘/机构/分成/兑换码/成交/图表管理。
- 数据库：PostgreSQL Docker 容器，数据目录在服务器 `/opt/mediapeople/data/postgres`。
- 前端：静态 HTML/CSS/JS，由 Docker Nginx 容器提供。
- 后端：`server/index.js`，Express + pg。
- 鉴权：后端签发 HMAC token，前端保存在浏览器 `localStorage` 的 `mediapeople-dating-demo-v1:session`。
- SSL：服务器已有通配证书，项目额外开放 9445-9448 HTTPS 端口。

## 角色入口

HTTP：

```text
http://uk.sbbz.tech:8095/  综合预览端
http://uk.sbbz.tech:8096/  客户小程序入口
http://uk.sbbz.tech:8097/  红娘工作台入口
http://uk.sbbz.tech:8098/  管理后台入口
```

HTTPS：

```text
https://uk.sbbz.tech:9445/  综合预览端
https://uk.sbbz.tech:9446/  客户小程序入口
https://uk.sbbz.tech:9447/  红娘工作台入口
https://uk.sbbz.tech:9448/  管理后台入口
```

服务器标准 `443` 端口已被现有 `bz` 网关服务占用，不能直接抢占。当前项目通过 `compose.ssl.yml` 暴露 9445-9448。

## 关键文件

```text
index.html              综合预览端
mini.html               客户小程序端
matchmaker.html         红娘工作台端
admin.html              管理后台端
app.js                  前端业务逻辑
styles.css              全局样式
server/index.js         Express API 与 PostgreSQL 同步逻辑
compose.yml             HTTP + API + PostgreSQL
compose.ssl.yml         HTTPS 9445-9448 前端容器
deploy/nginx.conf       HTTP 前端 Nginx 配置
deploy/nginx-ssl.conf   HTTPS 前端 Nginx 配置
.env.example            服务器 .env 示例
```

## 服务器信息

部署目录：

```text
/opt/mediapeople
```

数据库：

```text
容器名：mediapeople-postgres
数据库：mediapeople
用户：mediapeople
端口：127.0.0.1:5432，仅绑定服务器本机
```

API：

```text
容器名：mediapeople-api
容器内端口：3000
宿主机不直接暴露，由各 Nginx 前端容器反代 /api/
```

SSL 证书：

```text
/root/.acme.sh/sbbz.tech_ecc/fullchain.cer
/root/.acme.sh/sbbz.tech_ecc/sbbz.tech.key
```

证书覆盖 `*.sbbz.tech` 和 `sbbz.tech`。

服务器 `.env` 在：

```text
/opt/mediapeople/.env
```

需要包含：

```env
POSTGRES_DB=mediapeople
POSTGRES_USER=mediapeople
POSTGRES_PASSWORD=真实数据库密码
JWT_SECRET=随机长密钥
ADMIN_PASSWORD=admin
```

仓库只提交 `.env.example`，不要提交真实 `.env`。

## 本地开发

本地打开 HTML 可以看界面，但完整数据同步、登录 token、写入数据库需要 Docker API 和 PostgreSQL。

语法检查：

```bash
node --check app.js
node --check server/index.js
POSTGRES_PASSWORD=dummy JWT_SECRET=dummy docker compose -f compose.yml -f compose.ssl.yml config >/tmp/mediapeople-compose-check.yml
```

本地 Docker 启动：

```bash
cp .env.example .env
# 修改 .env 的 POSTGRES_PASSWORD 和 JWT_SECRET
docker compose -f compose.yml -f compose.ssl.yml up -d --build
```

## 部署命令

### 一键推送与部署（推荐）

在本地可以直接运行项目根目录下的 `deploy.sh` 脚本。它会自动执行本地语法与配置检查、Git 提交与推送、远程服务器部署以及健康状态检查：

```bash
# 运行部署并自定义 Commit 信息
./deploy.sh "这里写你的 commit 说明"

# 或者直接运行（脚本会提示输入 commit 信息，若不输入则使用默认的时间戳信息）
./deploy.sh
```

### 手动同步与部署（备用）

手动同步代码到服务器：

```bash
rsync -az --delete \
  --exclude '.git' \
  --exclude '.venv' \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude 'data' \
  --exclude 'backup' \
  -e 'ssh -i ~/.ssh/mediapeople_uk_ed25519 -o StrictHostKeyChecking=accept-new' \
  ./ root@uk.sbbz.tech:/opt/mediapeople/
```


启动或重建全部服务：

```bash
ssh -i ~/.ssh/mediapeople_uk_ed25519 -o StrictHostKeyChecking=accept-new root@uk.sbbz.tech
cd /opt/mediapeople
docker compose -f compose.yml -f compose.ssl.yml up -d --build
```

只重建 API：

```bash
cd /opt/mediapeople
docker compose -f compose.yml -f compose.ssl.yml up -d --build api
```

只强制重启前端容器：

```bash
cd /opt/mediapeople
docker compose -f compose.yml -f compose.ssl.yml up -d --force-recreate \
  web web-mini web-matchmaker web-admin \
  web-ssl web-mini-ssl web-matchmaker-ssl web-admin-ssl
```

查看状态：

```bash
cd /opt/mediapeople
docker compose -f compose.yml -f compose.ssl.yml ps
docker logs --tail=100 mediapeople-api
```

## 数据库备份与恢复

发布前备份：

```bash
cd /opt/mediapeople
mkdir -p backup/postgres
docker exec mediapeople-postgres pg_dump -U mediapeople -d mediapeople -Fc -f /backup/backup-$(date +%F_%H%M%S).dump
```

恢复：

```bash
cd /opt/mediapeople
docker exec mediapeople-postgres pg_restore --clean --if-exists -U mediapeople -d mediapeople /backup/文件名.dump
docker compose -f compose.yml -f compose.ssl.yml restart api
```

检查数据量：

```bash
curl -sS http://uk.sbbz.tech:8098/api/state | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d); console.log({users:s.users.length,matchmakers:s.matchmakers.length,agencies:s.agencies.length,requests:s.requests.length,deals:s.deals.length,promoCodes:s.promoCodes.length})})"
```

## API 与鉴权

认证接口：

```text
POST /api/auth/admin/login
POST /api/auth/client/login
POST /api/auth/client/register
POST /api/auth/matchmaker/login
POST /api/auth/matchmaker/register
```

兼容接口：

```text
GET  /api/state
PUT  /api/state
POST /api/reset
GET  /api/health
```

当前安全规则：

- `GET /api/state` 公开，但返回前会剔除 `passwordHash` 和 `idCard`。
- `PUT /api/state` 需要 `Authorization: Bearer <token>`。
- `POST /api/reset` 后端需要管理员 token，但公网 Nginx 已直接返回 `404`。
- HTTP 和 HTTPS Nginx 都屏蔽了 `/api/reset`。
- 前端登录后把 token 存在 `localStorage` 的 `mediapeople-dating-demo-v1:session`。

示例：

```bash
TOKEN=$(curl -sS http://uk.sbbz.tech:8098/api/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"admin"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

curl -i -X PUT http://uk.sbbz.tech:8098/api/state \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @state.json
```

安全验证：

```bash
curl -o /tmp/noauth.out -w '%{http_code}\n' \
  -X PUT http://uk.sbbz.tech:8098/api/state \
  -H 'Content-Type: application/json' \
  -d '{}'
# 期望：401

curl -o /tmp/reset.out -w '%{http_code}\n' \
  -X POST http://uk.sbbz.tech:8098/api/reset
# 期望：404

curl -sS http://uk.sbbz.tech:8098/api/state | rg passwordHash
# 期望：无输出
```

## 数据表

后端仍保留 `app_state.data` JSONB 作为兼容层，同时同步拆入业务表。

```text
app_state       完整 JSON 状态，兼容现有前端
agencies        机构
matchmakers     红娘账号
users           客户账号
match_requests  牵线请求
deals           成交/订单演示记录
promo_codes     会员兑换码
app_settings    运行设置和分成比例
```

注意：当前 `syncNormalizedState()` 仍会 `truncate table ... cascade` 再全量插入业务表。这是下一阶段要重构的重点。

## 当前技术债

必须让接手者知道：

- `PUT /api/state` 仍是整包写入，只是已经加了 token。
- `syncNormalizedState()` 仍会全表 truncate，数据量大后会有锁和性能问题。
- `GET /api/state` 虽已脱敏密码和身份证，但仍是大包接口，后续应按角色拆接口。
- 当前 token 是自实现 HMAC token，不是标准 JWT。可以继续用，也可以迁移到标准 JWT。
- 老演示账号没有密码时允许按 id 一键登录，这是为了保留演示体验。正式上线前应改成账号密码登录。
- 管理员当前由 `.env` 的 `ADMIN_PASSWORD` 控制，没有单独 `admins` 表。

## 后续开发路线

建议按顺序做：

1. 拆角色 API，减少对 `/api/state` 的依赖。
2. 客户接口：
   - `GET /api/client/me`
   - `PATCH /api/client/me`
   - `POST /api/client/real-name`
   - `GET /api/client/profiles`
   - `POST /api/client/vip/redeem`
   - `POST /api/client/match-requests`
   - `GET /api/client/match-requests`
3. 红娘接口：
   - `GET /api/matchmaker/workbench`
   - `GET /api/matchmaker/requests`
   - `PATCH /api/matchmaker/requests/:id/contacted`
4. 后台接口：
   - `GET /api/admin/metrics`
   - `GET /api/admin/customers`
   - `GET /api/admin/agencies`
   - `POST /api/admin/agencies`
   - `GET /api/admin/matchmakers`
   - `POST /api/admin/matchmakers`
   - `GET /api/admin/promo-codes`
   - `POST /api/admin/promo-codes`
   - `GET /api/admin/splits`
   - `PATCH /api/admin/splits`
   - `POST /api/admin/deals/simulate`
5. 删除 `syncNormalizedState()` 的 truncate 全表重写，改为单表 upsert 或资源接口直接写表。
6. 增加 `audit_logs` 操作日志。
7. 增加登录限流和写接口限流。
8. 管理员改为独立 `admins` 表，密码强制后端哈希。
9. 支付接入微信支付，VIP 开通由支付回调写订单和分成流水。
10. 通知接入微信订阅消息、短信或企业微信。

## 发布后必测清单

每次改完都至少跑：

```bash
node --check app.js
node --check server/index.js
POSTGRES_PASSWORD=dummy JWT_SECRET=dummy docker compose -f compose.yml -f compose.ssl.yml config >/tmp/mediapeople-compose-check.yml
```

线上检查：

```bash
for port in 8095 8096 8097 8098; do
  printf "HTTP=%s " "$port"
  curl -fsS --max-time 12 http://uk.sbbz.tech:$port/api/health
  printf "\n"
done

for port in 9445 9446 9447 9448; do
  printf "HTTPS=%s " "$port"
  curl -fsS --max-time 12 https://uk.sbbz.tech:$port/api/health
  printf "\n"
done
```

浏览器主流程：

- 客户端：未登录页、客户登录、筛选资料、保存资料、VIP 兑换、申请牵线。
- 红娘端：红娘登录、查看通知、查看双方微信、标记已联系。
- 后台端：管理员登录、左侧栏目切换、保存分成、添加机构、添加红娘、生成兑换码、模拟成交。

安全检查：

```bash
curl -o /tmp/noauth.out -w '%{http_code}\n' \
  -X PUT http://uk.sbbz.tech:8098/api/state \
  -H 'Content-Type: application/json' \
  -d '{}'

curl -o /tmp/reset.out -w '%{http_code}\n' \
  -X POST http://uk.sbbz.tech:8098/api/reset
```

期望分别是 `401` 和 `404`。

## 最近一次已验证状态

最近一次安全改造后已验证：

```text
未授权 PUT /api/state：401
公网 POST /api/reset：404
GET /api/state 不返回 passwordHash
管理员登录拿 token 成功
客户登录拿 token 成功
客户带 token 保存资料成功
红娘登录拿 token 成功
客户注册走后端并拿 token 成功
红娘注册走后端并拿 token 成功
HTTP 8095-8098 正常
HTTPS 9445-9448 正常
```

当前前端资源版本：

```text
app.js?v=1.0.26
styles.css?v=1.0.26
```
