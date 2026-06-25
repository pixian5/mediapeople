2026-06-25 | Claude Fable 5

# 缘定传媒人 — API 接口文档

## 基础信息

- **Base URL**：`/api`（由 Nginx 反代到 `http://api:3000/api`）
- **认证方式**：`Authorization: Bearer <token>`
- **请求体**：`Content-Type: application/json`
- **Token 类型**：自实现 HMAC-SHA256（payload 含 `role`、`sub`、`exp`，7 天有效期）
- **请求体大小限制**：2MB

---

## 认证接口

### 管理员登录

```
POST /api/auth/admin/login
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | 管理员密码（来自 .env 的 ADMIN_PASSWORD） |

**响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "id": "admin", "name": "平台管理员" }
}
```

**错误场景**：

- 密码错误 → 401 `{ "error": "invalid_credentials" }`

**复杂场景**：

- 管理员密码来自环境变量 `ADMIN_PASSWORD`，默认值为 `admin`
- 没有独立的管理员账号表，只有一个管理员密码
- Token payload: `{ role: "admin", sub: "admin", exp: now + 7天 }`

---

### 客户登录

```
POST /api/auth/client/login
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 直接按 ID 登录（演示用） |
| account | string | 否 | 手机/邮箱/微信号 |
| password | string | 否 | 密码 |

**响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "u1", "name": "林安", ... }
}
```

**登录逻辑**：

```
1. 如果提供了 userId → 直接查找该用户
2. 如果提供了 account → 按 phone/email/wechat 模糊匹配
3. 找到用户后：
   - 用户无 passwordHash → 允许登录（演示账号一键登录）
   - 用户有 passwordHash → 验证密码
4. 验证通过 → 签发 Token
```

**错误场景**：

- 用户不存在 → 401 `{ "error": "invalid_credentials" }`
- 密码错误 → 401 `{ "error": "invalid_credentials" }`

**复杂场景**：

- 演示账号（无密码）可按 userId 直接登录，正式上线需禁用
- account 匹配时会同时检查 phone、email、wechat 三个字段
- 匹配不区分大小写（统一转小写比较）

---

### 客户注册

```
POST /api/auth/client/register
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 姓名 |
| phone | string | 条件 | 手机号（phone 和 email 至少一个） |
| email | string | 条件 | 邮箱 |
| password | string | 是 | 密码 |
| gender | string | 否 | 性别 |
| age | number | 否 | 年龄 |
| city | string | 否 | 城市 |
| job | string | 否 | 职业 |
| wechat | string | 否 | 微信号 |
| bio | string | 否 | 自我介绍 |
| requirements | string | 否 | 择偶要求 |
| photo | string | 否 | 头像 URL |
| delegatedMatchmakerIds | string[] | 否 | 委托红娘列表 |

**响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "u123", "name": "张三", ... },
  "state": { ... }
}
```

**注册流程**：

```
1. 校验 phone 和 email 至少填一个
2. 检查 phone 是否已存在（业务层）
3. 检查 email 是否已存在（业务层）
4. 生成用户 ID（u + 时间戳 base36 + 随机 hex）
5. 密码哈希（scrypt）
6. 设置默认字段：
   - vip: false
   - accountStatus: "active"
   - realNameVerified: false
7. 写入数据库
8. 签发 Token
9. 返回用户信息和完整 state
```

**错误场景**：

- phone 和 email 都为空 → 400 `{ "error": "phone_or_email_required" }`
- phone 已存在 → 409 `{ "error": "phone_exists" }`
- email 已存在 → 409 `{ "error": "email_exists" }`

**复杂场景**：

- 注册时选择的 `delegatedMatchmakerIds` 决定了哪些红娘可以看到该客户
- 如果未选择，默认委托给所有红娘
- 注册后自动登录（返回 token）

---

### 红娘登录

```
POST /api/auth/matchmaker/login
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchmakerId | string | 否 | 直接按 ID 登录 |
| account | string | 否 | 手机/邮箱/推荐码 |
| password | string | 否 | 密码 |

**响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "matchmaker": { "id": "m1", "name": "李莉", ... }
}
```

**登录逻辑**：

与客户登录类似：
1. 按 matchmakerId 或 account 查找
2. 无密码则一键登录，有密码则验证
3. account 匹配检查 phone、email、code 三个字段

---

### 红娘注册

```
POST /api/auth/matchmaker/register
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 姓名 |
| phone | string | 是 | 手机号 |
| code | string | 是 | 推荐码（唯一） |
| password | string | 是 | 密码 |
| agencyId | string | 否 | 所属机构 |
| email | string | 否 | 邮箱 |

**响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "matchmaker": { "id": "m123", "name": "新红娘", ... },
  "state": { ... }
}
```

**错误场景**：

- phone 或 code 为空 → 400 `{ "error": "phone_and_code_required" }`
- code 已存在 → 409 `{ "error": "code_exists" }`
- phone 已存在 → 409 `{ "error": "phone_exists" }`
- email 已存在 → 409 `{ "error": "email_exists" }`

---

## 状态接口（兼容层）

### 读取全局状态

```
GET /api/state
```

**无需认证**。

**响应**：脱敏后的完整状态 JSON（剔除 `passwordHash` 和 `idCard`）。

**数据量**：包含所有用户、红娘、机构、牵线请求、聊天线程、聊天消息、成交记录、兑换码。

**复杂场景**：

- `readState()` 会自动补全缺失的聊天线程
- 如果某个牵线请求有 matchmakerId 但没有对应的 member_matchmaker 线程，会自动创建
- 如果某个牵线请求的 memberChatEnabled 为 true 但没有 member_member 线程，会自动创建

---

### 写入全局状态

```
PUT /api/state
```

**需要认证**（admin/client/matchmaker）。

**请求体**：完整 state JSON。

**响应**：写入后的完整状态（脱敏）。

**复杂场景**：

- 调用 `syncNormalizedState()` 全量同步到数据库
- 包含 UPSERT + DELETE 操作
- 在事务中执行
- 数据量大时性能较差

---

### 重置为种子数据

```
POST /api/reset
```

**需要管理员认证**。

**公网 Nginx 已屏蔽此接口**（返回 404）。

**响应**：重置后的完整状态（脱敏）。

---

### 健康检查

```
GET /api/health
```

**无需认证**。

**响应**：`{ "ok": true }`

**用途**：Docker 健康检查、部署验证。

---

## 客户精细化接口

### 修改个人资料

```
PATCH /api/client/profile
```

**需要 `client` 角色认证**。

**请求参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 姓名 |
| gender | string | 性别 |
| age | number | 年龄 |
| city | string | 城市 |
| job | string | 职业 |
| wechat | string | 微信号 |
| bio | string | 自我介绍 |
| requirements | string | 择偶要求 |
| delegatedMatchmakerIds | string[] | 委托红娘列表 |
| syncAllMatchmakers | boolean | 是否同步所有 VIP 红娘 |

**响应**：`{ user, state }`

**复杂场景**：

- 修改委托红娘后，会更新 `profileByMatchmaker` 中的草稿状态
- 如果 `syncAllMatchmakers` 为 true，会同步到所有 VIP 红娘
- 资料修改后，红娘端可以看到待审核的草稿

---

### 提交实名认证

```
POST /api/client/real-name
```

**需要 `client` 角色认证**。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| realName | string | 是 | 真实姓名 |
| idCard | string | 是 | 身份证号 |
| phone | string | 否 | 补充手机号（注册时只填邮箱的情况） |

**响应**：`{ user, state }`

**错误场景**：

- realName 或 idCard 为空 → 400 `{ "error": "name_and_idcard_required" }`
- 用户不存在 → 404 `{ "error": "user_not_found" }`

**复杂场景**：

- 如果注册时只填了邮箱没填手机号，实名时需要补填手机号
- 认证后 `realNameVerified` 设为 true
- `realName` 和 `idCard` 存储在 raw JSON 中，不返回前端

---

### VIP 兑换/开通

```
POST /api/client/vip/redeem
```

**需要 `client` 角色认证**。

**请求参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 兑换码（与 referralCode 二选一） |
| referralCode | string | 红娘推荐码 |

**响应**：`{ user, state }`

**兑换码兑换流程**：

```
1. 查找兑换码（不区分大小写）
2. 兑换码不存在 → 404
3. 兑换码已使用且非无限次 → 400
4. 非无限次兑换码 → 标记为已使用
5. 如果兑换码关联了红娘 → 绑定该红娘
6. 升级用户为 VIP
7. 设置 vipExpiresAt（365 天后）
8. 写入成交记录（¥399）
9. 返回更新后的用户和状态
```

**推荐码支付流程**：

```
1. 查找红娘（按推荐码）
2. 红娘不存在 → 404
3. 升级用户为 VIP
4. 绑定该红娘
5. 写入成交记录
6. 返回更新后的用户和状态
```

**错误场景**：

- 兑换码不存在 → 404 `{ "error": "invalid_code" }`
- 兑换码已使用 → 400 `{ "error": "code_already_used" }`
- 推荐码无效 → 404 `{ "error": "invalid_referral_code" }`
- code 和 referralCode 都为空 → 400 `{ "error": "code_or_referral_code_required" }`

**复杂场景**：

- 无限次兑换码（`infinite: true`）可重复使用，如兑换码 `1`
- 兑换码可关联红娘，使用时自动绑定
- VIP 开通后自动创建成交记录
- VIP 到期后降级（当前未实现自动降级逻辑）

---

### 申请牵线

```
POST /api/client/match-requests
```

**需要 `client` 角色认证**。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUserId | string | 是 | 目标用户 ID |
| matchmakerId | string | 否 | 指定红娘（默认自动分配） |

**响应**：`{ request, state }`

**牵线请求创建流程**：

```
1. 查找发起方和目标方用户
2. 检查目标用户是否绑定了红娘→未绑定显示"该会员暂未绑定红娘，无法申请牵线"
3. 调用 ensureVipForMatchmaker(matchmakerId)：
   - 如果用户已是该红娘 VIP→继续
   - 如果用户不是该红娘 VIP→自动调用 API 开通 VIP（推荐码支付）
   - 开通失败→中止流程
4. 检查是否已有未完成请求（同一发起方、目标方、红娘）→有则提示"这条牵线请求已经在处理中"
5. 确定红娘：
   - 优先使用指定的 matchmakerId
   - 否则从目标方的 delegatedMatchmakerIds 中取第一个
   - 否则从发起方的 referralMatchmakerId 取
6. 校验：
   - 发起方必须是 VIP
   - 红娘必须在发起方的 vipMatchmakerIds 中
   - 目标方必须在红娘的 delegatedMatchmakerIds 中
7. 创建牵线请求（状态：待红娘联系）
8. 自动创建两条聊天线程：
   - 红娘-男方聊天线程
   - 红娘-女方聊天线程
9. 返回请求和完整状态
```

**错误场景**：

- 目标用户不存在 → 404 `{ "error": "target_not_found" }`
- 已有未完成请求 → 409 `{ "error": "request_pending" }`
- 未指定红娘且无法自动分配 → 400 `{ "error": "matchmaker_required" }`
- 发起方非该红娘 VIP → 403 `{ "error": "matchmaker_vip_required" }`
- 目标方未委托该红娘 → 400 `{ "error": "target_not_bound_to_matchmaker" }`

**复杂场景**：

- 牵线请求会自动创建两条 member_matchmaker 聊天线程
- 红娘可以在工作台看到这两条线程并分别与双方沟通
- 红娘批准后可创建 member_member 线程让双方直接聊天

---

## 红娘精细化接口

### 标记已联系

```
PATCH /api/matchmaker/requests/:id/contacted
```

**需要 `matchmaker` 角色认证**。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| side | string | 是 | `"male"` 或 `"female"` |

**响应**：`{ request, state }`

**状态流转**：

```
待红娘联系
  ├─ 标记联系男方 → 联系男方
  │   └─ 再标记联系女方 → 来和双方对话
  └─ 标记联系女方 → 联系女方
      └─ 再标记联系男方 → 来和双方对话
```

**错误场景**：

- 请求不存在 → 404 `{ "error": "request_not_found" }`
- 非该请求的红娘 → 403 `{ "error": "forbidden" }`
- side 无效 → 400 `{ "error": "contact_side_required" }`

**复杂场景**：

- 标记联系后，自动跳转到对应方的聊天窗口
- 两方都标记后，状态变为"来和双方对话"，此时双方微信号互相公开
- 红娘可以在聊天中与会员沟通牵线进度

---

### 开启会员互聊

```
PATCH /api/matchmaker/requests/:id/approve-member-chat
```

**需要 `matchmaker` 角色认证**。

**响应**：`{ request, state }`

**复杂场景**：

- 自动创建 `member_member` 类型的聊天线程
- 创建后双方可直接对话

```
PATCH /api/matchmaker/requests/:id/member-chat
```

**请求参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| enabled | boolean | 开启/关闭会员互聊 |

**复杂场景**：

- 开启时自动创建 member_member 线程（如果不存在）
- 关闭时不影响已有线程，但前端会禁止发送消息

---

### 审核客户资料

```
PATCH /api/matchmaker/users/:id/profile-review
```

**需要 `matchmaker` 角色认证**。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | `"approve"` 或 `"reject"` |

**响应**：`{ user, state }`

**复杂场景**：

- 客户修改资料后，委托红娘会收到待审核的草稿
- 红娘可以批准或拒绝
- 批准后，草稿变为 published，其他红娘可以看到更新后的资料

---

## 聊天接口

### 发送消息

```
POST /api/chat/threads/:id/messages
```

**需要 `client`/`matchmaker`/`admin` 角色认证**。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 消息内容 |

**响应**：`{ message, state }`

**发送流程**：

```
1. 查找聊天线程
2. 验证发送者是否是参与者（admin 除外）
3. 验证线程状态是否为 active
4. 如果是 member_member 类型，验证 memberChatEnabled 是否为 true
5. 创建消息
6. 更新线程的 lastMessageAt 和 lastMessagePreview
7. 返回消息和完整状态
```

**错误场景**：

- 线程不存在 → 404 `{ "error": "thread_not_found" }`
- 非参与者 → 403 `{ "error": "forbidden" }`
- 线程非 active → 400 `{ "error": "thread_inactive" }`
- member_member 未开启 → 403 `{ "error": "member_chat_disabled" }`
- 内容为空 → 400 `{ "error": "content_required" }`

---

## 管理员接口

### 添加机构

```
POST /api/admin/agencies
```

**需要管理员认证**。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 机构名称 |
| city | string | 是 | 城市 |

**响应**：`{ agency, state }`

---

### 添加红娘

```
POST /api/admin/matchmakers
```

**需要管理员认证**。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 红娘姓名 |
| agencyId | string | 是 | 所属机构 ID |
| code | string | 是 | 推荐码（唯一） |

**响应**：`{ matchmaker, state }`

**错误场景**：

- 推荐码已存在 → 409 `{ "error": "code_exists" }`

---

### 修改分成比例

```
PATCH /api/admin/splits
```

**需要管理员认证**。

| 参数 | 类型 | 说明 |
|------|------|------|
| promo | number | 推广费百分比 |
| matchmaker | number | 牵线费百分比 |
| platform | number | 平台服务费百分比 |

**响应**：`{ splits, state }`

**错误场景**：

- 三者之和不为 100 → 400 `{ "error": "sum_must_be_100" }`

---

### 生成兑换码

```
POST /api/admin/promo-codes
```

**需要管理员认证**。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 兑换码（唯一） |
| matchmakerId | string | 否 | 关联红娘 |

**响应**：`{ promoCode, state }`

**错误场景**：

- 兑换码已存在 → 409 `{ "error": "code_exists" }`

---

### 模拟成交

```
POST /api/admin/deals/simulate
```

**需要管理员认证**。

无参数，生成一笔 ¥399 的成交记录。

**响应**：`{ deal, state }`

---

## 错误响应格式

```json
{ "error": "error_code_string" }
```

### 常见错误码

| HTTP 状态码 | 错误码 | 说明 |
|-------------|--------|------|
| 400 | invalid_action | 操作无效 |
| 400 | content_required | 消息内容为空 |
| 400 | sum_must_be_100 | 分成比例之和不为 100 |
| 400 | phone_or_email_required | 手机号和邮箱都为空 |
| 400 | phone_and_code_required | 手机号和推荐码都为空 |
| 400 | code_or_referral_code_required | 兑换码和推荐码都为空 |
| 400 | name_and_idcard_required | 真实姓名和身份证号都为空 |
| 400 | target_user_required | 目标用户 ID 为空 |
| 400 | matchmaker_required | 无法分配红娘 |
| 400 | target_not_bound_to_matchmaker | 目标方未委托该红娘 |
| 400 | thread_inactive | 聊天线程非活跃状态 |
| 400 | member_chat_disabled | 会员互聊未开启 |
| 401 | unauthorized | 未认证 |
| 401 | invalid_credentials | 账号或密码错误 |
| 403 | forbidden | 无权限 |
| 403 | matchmaker_vip_required | 非该红娘 VIP 会员 |
| 404 | user_not_found | 用户不存在 |
| 404 | target_not_found | 目标用户不存在 |
| 404 | request_not_found | 请求不存在 |
| 404 | thread_not_found | 会话不存在 |
| 404 | profile_not_found | 资料不存在 |
| 404 | invalid_code | 兑换码无效 |
| 404 | invalid_referral_code | 推荐码无效 |
| 409 | phone_exists | 手机号已注册 |
| 409 | email_exists | 邮箱已注册 |
| 409 | code_exists | 推荐码/兑换码已存在 |
| 409 | request_pending | 牵线请求已存在 |
| 409 | code_already_used | 兑换码已使用 |
| 500 | internal_server_error | 服务器内部错误 |

---

## 接口调用示例

### 完整的客户注册 + VIP 开通 + 申请牵线流程

```bash
# 1. 客户注册
curl -sS http://uk.sbbz.tech:8098/api/auth/client/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "测试用户",
    "phone": "13800001234",
    "password": "123456",
    "gender": "男",
    "age": 30,
    "city": "上海",
    "job": "工程师",
    "wechat": "test_user",
    "bio": "测试用户",
    "requirements": "测试要求"
  }'

# 2. 提取 token
TOKEN=$(curl -sS http://uk.sbbz.tech:8098/api/auth/client/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"13800001234","password":"123456"}' | \
  node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# 3. VIP 兑换（使用无限次兑换码 1）
curl -sS http://uk.sbbz.tech:8098/api/client/vip/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"code":"1"}'

# 4. 申请牵线
curl -sS http://uk.sbbz.tech:8098/api/client/match-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"targetUserId":"u2","matchmakerId":"m1"}'
```

### 红娘处理牵线请求流程

```bash
# 1. 红娘登录
MM_TOKEN=$(curl -sS http://uk.sbbz.tech:8098/api/auth/matchmaker/login \
  -H 'Content-Type: application/json' \
  -d '{"matchmakerId":"m1"}' | \
  node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# 2. 标记联系男方
curl -sS http://uk.sbbz.tech:8098/api/matchmaker/requests/请求ID/contacted \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MM_TOKEN" \
  -d '{"side":"male"}'

# 3. 标记联系女方
curl -sS http://uk.sbbz.tech:8098/api/matchmaker/requests/请求ID/contacted \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MM_TOKEN" \
  -d '{"side":"female"}'

# 4. 开启会员互聊
curl -sS http://uk.sbbz.tech:8098/api/matchmaker/requests/请求ID/approve-member-chat \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MM_TOKEN"
```

---

## 核心业务时序图

### 客户注册 → VIP开通 → 申请牵线 完整时序

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API服务
    participant DB as 数据库

    Note over Client,DB: 一、客户注册
    Client->>API: POST /api/auth/client/register
    API->>DB: 校验 phone/email 唯一性
    DB-->>API: 校验通过
    API->>DB: 生成用户ID，密码哈希，写入用户表
    API->>API: 签发 JWT Token
    API-->>Client: { token, user, state }

    Note over Client,DB: 二、VIP开通（兑换码方式）
    Client->>API: POST /api/client/vip/redeem (code)
    API->>DB: 查找兑换码
    DB-->>API: 兑换码有效
    API->>DB: 标记兑换码已使用（非无限次）
    API->>DB: 更新用户 vip=true, vipExpiresAt
    API->>DB: 写入成交记录（¥399）
    API-->>Client: { user, state }

    Note over Client,DB: 三、申请牵线
    Client->>API: POST /api/client/match-requests
    API->>DB: 查找发起方和目标方用户
    API->>DB: 检查目标方是否绑定红娘
    API->>DB: 确保发起方是该红娘VIP
    API->>DB: 检查是否已有未完成请求
    API->>DB: 创建牵线请求（状态：待红娘联系）
    API->>DB: 创建红娘-男方聊天线程
    API->>DB: 创建红娘-女方聊天线程
    API-->>Client: { request, state }
```

### 红娘处理牵线请求时序

```mermaid
sequenceDiagram
    participant MM as 红娘端
    participant API as API服务
    participant DB as 数据库

    Note over MM,DB: 1. 红娘登录
    MM->>API: POST /api/auth/matchmaker/login
    API->>DB: 验证红娘账号
    API->>API: 签发 Token
    API-->>MM: { token, matchmaker }

    Note over MM,DB: 2. 查看牵线请求列表
    MM->>API: GET /api/state
    API->>DB: 读取全量状态
    API->>API: 脱敏处理
    API-->>MM: state（含待处理请求）

    Note over MM,DB: 3. 标记联系男方
    MM->>API: PATCH /api/matchmaker/requests/:id/contacted (side=male)
    API->>DB: 验证红娘权限
    API->>DB: 更新请求状态 → 联系男方
    API-->>MM: { request, state }

    Note over MM,DB: 4. 标记联系女方
    MM->>API: PATCH /api/matchmaker/requests/:id/contacted (side=female)
    API->>DB: 更新请求状态 → 来和双方对话
    API->>DB: 双方微信号互相公开
    API-->>MM: { request, state }

    Note over MM,DB: 5. 开启会员互聊
    MM->>API: PATCH /api/matchmaker/requests/:id/approve-member-chat
    API->>DB: 创建 member_member 聊天线程
    API->>DB: memberChatEnabled = true
    API-->>MM: { request, state }
```

### 聊天消息发送时序

```mermaid
sequenceDiagram
    participant Sender as 发送方
    participant API as API服务
    participant DB as 数据库
    participant Receiver as 接收方

    Sender->>API: POST /api/chat/threads/:id/messages
    API->>DB: 查找聊天线程
    API->>DB: 验证发送者是参与者（admin除外）
    API->>DB: 验证线程状态为 active
    alt member_member 类型
        API->>DB: 验证 memberChatEnabled = true
    end
    API->>DB: 创建消息记录
    API->>DB: 更新线程 lastMessageAt / lastMessagePreview
    API-->>Sender: { message, state }

    Note over Receiver: 接收方通过轮询 /api/state 获取新消息
    Receiver->>API: GET /api/state
    API->>DB: 读取全量状态
    API-->>Receiver: state（含新消息）
```

---

## 接口依赖关系图

```mermaid
graph TD
    subgraph 认证层
        A1[POST /api/auth/admin/login]
        A2[POST /api/auth/client/login]
        A3[POST /api/auth/client/register]
        A4[POST /api/auth/matchmaker/login]
        A5[POST /api/auth/matchmaker/register]
    end

    subgraph 状态层
        S1[GET /api/state]
        S2[PUT /api/state]
        S3[POST /api/reset]
        H[GET /api/health]
    end

    subgraph 客户业务层
        C1[PATCH /api/client/profile]
        C2[POST /api/client/real-name]
        C3[POST /api/client/vip/redeem]
        C4[POST /api/client/match-requests]
    end

    subgraph 红娘业务层
        M1[PATCH /api/matchmaker/requests/:id/contacted]
        M2[PATCH /api/matchmaker/requests/:id/approve-member-chat]
        M3[PATCH /api/matchmaker/requests/:id/member-chat]
        M4[PATCH /api/matchmaker/users/:id/profile-review]
    end

    subgraph 聊天层
        CH1[POST /api/chat/threads/:id/messages]
    end

    subgraph 管理员业务层
        AD1[POST /api/admin/agencies]
        AD2[POST /api/admin/matchmakers]
        AD3[PATCH /api/admin/splits]
        AD4[POST /api/admin/promo-codes]
        AD5[POST /api/admin/deals/simulate]
    end

    A3 --> |写入| S1
    A5 --> |写入| S1
    C1 --> |读取/写入| S1
    C2 --> |读取/写入| S1
    C3 --> |读取/写入| S1
    C4 --> |读取/写入| S1
    M1 --> |读取/写入| S1
    M2 --> |读取/写入| S1
    M3 --> |读取/写入| S1
    M4 --> |读取/写入| S1
    CH1 --> |读取/写入| S1
    AD1 --> |读取/写入| S1
    AD2 --> |读取/写入| S1
    AD3 --> |读取/写入| S1
    AD4 --> |读取/写入| S1
    AD5 --> |读取/写入| S1

    S2 --> |全量同步| S1
    S3 --> |重置| S1

    C4 --> |依赖VIP| C3
    C3 --> |依赖注册| A3
    M2 --> |创建线程供| CH1
    M3 --> |控制开关| CH1
    AD4 --> |被使用| C3
    AD2 --> |被委托| C1
```

---

## 完整响应示例

### GET /api/state（完整结构）

```json
{
  "users": [
    {
      "id": "u1",
      "name": "林安",
      "gender": "女",
      "age": 28,
      "city": "北京",
      "job": "产品经理",
      "wechat": "linan_2024",
      "photo": "https://example.com/photos/u1.jpg",
      "bio": "性格开朗，热爱生活，喜欢旅行和阅读。",
      "requirements": "希望对方身高175以上，本科以上学历，性格稳重。",
      "phone": "138****1234",
      "email": "li***@example.com",
      "vip": true,
      "vipExpiresAt": "2027-06-25T00:00:00.000Z",
      "accountStatus": "active",
      "realNameVerified": true,
      "delegatedMatchmakerIds": ["m1", "m2"],
      "referralMatchmakerId": "m1",
      "vipMatchmakerIds": ["m1"],
      "profileByMatchmaker": {
        "m1": { "status": "published", "data": { "name": "林安", "age": 28 } }
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2026-06-20T14:20:00.000Z"
    }
  ],
  "matchmakers": [
    {
      "id": "m1",
      "name": "李莉",
      "phone": "139****5678",
      "email": "li***@example.com",
      "code": "LILI888",
      "agencyId": "a1",
      "photo": "https://example.com/photos/m1.jpg",
      "bio": "资深红娘，从业5年，成功牵线200+对。",
      "isVip": true,
      "createdAt": "2023-06-01T09:00:00.000Z"
    }
  ],
  "agencies": [
    {
      "id": "a1",
      "name": "缘定北京旗舰店",
      "city": "北京",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "matchRequests": [
    {
      "id": "r1",
      "requesterId": "u1",
      "targetUserId": "u2",
      "matchmakerId": "m1",
      "status": "pending_matchmaker_contact",
      "maleContacted": false,
      "femaleContacted": false,
      "memberChatEnabled": false,
      "createdAt": "2026-06-25T10:00:00.000Z",
      "updatedAt": "2026-06-25T10:00:00.000Z"
    }
  ],
  "chatThreads": [
    {
      "id": "t1",
      "type": "member_matchmaker",
      "matchRequestId": "r1",
      "participantIds": ["u1", "m1"],
      "status": "active",
      "lastMessageAt": "2026-06-25T10:30:00.000Z",
      "lastMessagePreview": "你好，我是红娘李莉",
      "createdAt": "2026-06-25T10:00:00.000Z"
    }
  ],
  "chatMessages": [
    {
      "id": "msg1",
      "threadId": "t1",
      "senderId": "m1",
      "senderRole": "matchmaker",
      "content": "你好，我是红娘李莉，很高兴为您服务。",
      "timestamp": "2026-06-25T10:30:00.000Z",
      "readBy": ["m1"]
    }
  ],
  "deals": [
    {
      "id": "d1",
      "userId": "u1",
      "matchmakerId": "m1",
      "amount": 399,
      "type": "vip_redeem",
      "promoCodeId": "pc1",
      "createdAt": "2026-06-20T14:20:00.000Z"
    }
  ],
  "promoCodes": [
    {
      "id": "pc1",
      "code": "VIP2026",
      "matchmakerId": "m1",
      "infinite": false,
      "used": true,
      "usedBy": "u1",
      "usedAt": "2026-06-20T14:20:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "splits": {
    "promo": 30,
    "matchmaker": 40,
    "platform": 30
  },
  "profileDrafts": {}
}
```

**脱敏字段说明：**
- `passwordHash`：已移除，不返回前端
- `idCard`：已移除，不返回前端
- `phone`：中间4位脱敏为 `****`
- `email`：用户名中间部分脱敏为 `***`
- `realName`：仅存储在 raw JSON 中，不返回前端

### POST /api/auth/client/register

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiY2xpZW50Iiwic3ViIjoidTEyMyIsImV4cCI6MTc1MjExOTIwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": "u123",
    "name": "张三",
    "gender": "男",
    "age": 30,
    "city": "上海",
    "job": "工程师",
    "wechat": "zhangsan_dev",
    "photo": "",
    "bio": "热爱技术，喜欢健身和音乐。",
    "requirements": "希望对方温柔善良，有共同话题。",
    "phone": "138****1234",
    "email": "zh***@example.com",
    "vip": false,
    "vipExpiresAt": null,
    "accountStatus": "active",
    "realNameVerified": false,
    "delegatedMatchmakerIds": ["m1", "m2"],
    "referralMatchmakerId": null,
    "vipMatchmakerIds": [],
    "profileByMatchmaker": {},
    "createdAt": "2026-06-25T12:00:00.000Z",
    "updatedAt": "2026-06-25T12:00:00.000Z"
  },
  "state": {
    "users": [
      {
        "id": "u123",
        "name": "张三",
        "gender": "男",
        "age": 30,
        "city": "上海",
        "job": "工程师",
        "wechat": "zhangsan_dev",
        "photo": "",
        "bio": "热爱技术，喜欢健身和音乐。",
        "requirements": "希望对方温柔善良，有共同话题。",
        "phone": "138****1234",
        "email": "zh***@example.com",
        "vip": false,
        "vipExpiresAt": null,
        "accountStatus": "active",
        "realNameVerified": false,
        "delegatedMatchmakerIds": ["m1", "m2"],
        "referralMatchmakerId": null,
        "vipMatchmakerIds": [],
        "profileByMatchmaker": {},
        "createdAt": "2026-06-25T12:00:00.000Z",
        "updatedAt": "2026-06-25T12:00:00.000Z"
      }
    ],
    "matchmakers": [],
    "agencies": [],
    "matchRequests": [],
    "chatThreads": [],
    "chatMessages": [],
    "deals": [],
    "promoCodes": [],
    "splits": {
      "promo": 30,
      "matchmaker": 40,
      "platform": 30
    },
    "profileDrafts": {}
  }
}
```

### POST /api/client/match-requests

```json
{
  "request": {
    "id": "r1001",
    "requesterId": "u123",
    "targetUserId": "u2",
    "matchmakerId": "m1",
    "status": "pending_matchmaker_contact",
    "maleContacted": false,
    "femaleContacted": false,
    "memberChatEnabled": false,
    "createdAt": "2026-06-25T12:30:00.000Z",
    "updatedAt": "2026-06-25T12:30:00.000Z"
  },
  "state": {
    "users": [
      {
        "id": "u123",
        "name": "张三",
        "vip": true,
        "vipMatchmakerIds": ["m1"]
      }
    ],
    "matchmakers": [
      {
        "id": "m1",
        "name": "李莉"
      }
    ],
    "matchRequests": [
      {
        "id": "r1001",
        "requesterId": "u123",
        "targetUserId": "u2",
        "matchmakerId": "m1",
        "status": "pending_matchmaker_contact",
        "maleContacted": false,
        "femaleContacted": false,
        "memberChatEnabled": false,
        "createdAt": "2026-06-25T12:30:00.000Z",
        "updatedAt": "2026-06-25T12:30:00.000Z"
      }
    ],
    "chatThreads": [
      {
        "id": "t_m_u123_m1",
        "type": "member_matchmaker",
        "matchRequestId": "r1001",
        "participantIds": ["u123", "m1"],
        "status": "active",
        "lastMessageAt": null,
        "lastMessagePreview": "",
        "createdAt": "2026-06-25T12:30:00.000Z"
      },
      {
        "id": "t_m_u2_m1",
        "type": "member_matchmaker",
        "matchRequestId": "r1001",
        "participantIds": ["u2", "m1"],
        "status": "active",
        "lastMessageAt": null,
        "lastMessagePreview": "",
        "createdAt": "2026-06-25T12:30:00.000Z"
      }
    ],
    "chatMessages": [],
    "deals": []
  }
}
```

### POST /api/chat/threads/:id/messages

```json
{
  "message": {
    "id": "msg5001",
    "threadId": "t_m_u123_m1",
    "senderId": "u123",
    "senderRole": "client",
    "content": "你好，我想了解一下对方的情况。",
    "timestamp": "2026-06-25T13:00:00.000Z",
    "readBy": ["u123"]
  },
  "state": {
    "chatThreads": [
      {
        "id": "t_m_u123_m1",
        "type": "member_matchmaker",
        "matchRequestId": "r1001",
        "participantIds": ["u123", "m1"],
        "status": "active",
        "lastMessageAt": "2026-06-25T13:00:00.000Z",
        "lastMessagePreview": "你好，我想了解一下对方的情况。",
        "createdAt": "2026-06-25T12:30:00.000Z"
      }
    ],
    "chatMessages": [
      {
        "id": "msg5001",
        "threadId": "t_m_u123_m1",
        "senderId": "u123",
        "senderRole": "client",
        "content": "你好，我想了解一下对方的情况。",
        "timestamp": "2026-06-25T13:00:00.000Z",
        "readBy": ["u123"]
      }
    ]
  }
}
```

---

## 状态码与错误处理

### HTTP 状态码说明

| 状态码 | 名称 | 说明 | 典型场景 |
|--------|------|------|----------|
| 200 | OK | 请求成功 | 正常查询、更新、删除操作 |
| 201 | Created | 资源创建成功 | 注册用户、创建牵线请求、发送消息 |
| 400 | Bad Request | 请求参数错误 | 必填字段缺失、参数格式错误、业务校验失败 |
| 401 | Unauthorized | 未认证或认证失败 | Token 缺失、Token 过期、密码错误 |
| 403 | Forbidden | 无权限访问 | 角色不匹配、非资源所有者、非VIP会员 |
| 404 | Not Found | 资源不存在 | 用户不存在、请求不存在、线程不存在 |
| 409 | Conflict | 资源冲突 | 手机号已注册、牵线请求已存在、兑换码已使用 |
| 413 | Payload Too Large | 请求体过大 | 请求体超过 2MB 限制 |
| 429 | Too Many Requests | 请求过于频繁 | 触发限流阈值 |
| 500 | Internal Server Error | 服务器内部错误 | 数据库异常、代码Bug |
| 502 | Bad Gateway | 网关错误 | Nginx 反代后端不可达 |
| 503 | Service Unavailable | 服务不可用 | 服务重启、维护中 |
| 504 | Gateway Timeout | 网关超时 | 后端处理超时 |

### 错误码对照表

| 错误码 | HTTP状态码 | 说明 | 触发接口 |
|--------|-----------|------|----------|
| `invalid_credentials` | 401 | 账号或密码错误 | 所有登录接口 |
| `unauthorized` | 401 | 未认证或Token无效 | 所有需要认证的接口 |
| `forbidden` | 403 | 无权限操作 | 资源非本人、角色不匹配 |
| `phone_or_email_required` | 400 | 手机号和邮箱至少填一个 | 客户注册 |
| `phone_and_code_required` | 400 | 手机号和推荐码都必填 | 红娘注册 |
| `code_or_referral_code_required` | 400 | 兑换码和推荐码至少填一个 | VIP兑换 |
| `name_and_idcard_required` | 400 | 真实姓名和身份证号都必填 | 实名认证 |
| `content_required` | 400 | 消息内容不能为空 | 发送消息 |
| `target_user_required` | 400 | 目标用户ID不能为空 | 申请牵线 |
| `matchmaker_required` | 400 | 无法自动分配红娘 | 申请牵线 |
| `target_not_bound_to_matchmaker` | 400 | 目标方未委托该红娘 | 申请牵线 |
| `thread_inactive` | 400 | 聊天线程非活跃状态 | 发送消息 |
| `member_chat_disabled` | 403 | 会员互聊未开启 | 发送消息(member_member) |
| `matchmaker_vip_required` | 403 | 非该红娘VIP会员 | 申请牵线 |
| `contact_side_required` | 400 | 联系方参数无效 | 标记已联系 |
| `invalid_action` | 400 | 操作无效 | 资料审核等 |
| `sum_must_be_100` | 400 | 分成比例之和不为100 | 修改分成比例 |
| `user_not_found` | 404 | 用户不存在 | 资料审核、实名认证 |
| `target_not_found` | 404 | 目标用户不存在 | 申请牵线 |
| `request_not_found` | 404 | 牵线请求不存在 | 红娘处理接口 |
| `thread_not_found` | 404 | 聊天线程不存在 | 发送消息 |
| `profile_not_found` | 404 | 资料不存在 | 资料审核 |
| `invalid_code` | 404 | 兑换码无效 | VIP兑换 |
| `invalid_referral_code` | 404 | 推荐码无效 | VIP兑换 |
| `phone_exists` | 409 | 手机号已注册 | 注册接口 |
| `email_exists` | 409 | 邮箱已注册 | 注册接口 |
| `code_exists` | 409 | 推荐码/兑换码已存在 | 红娘注册、生成兑换码 |
| `request_pending` | 409 | 牵线请求已存在（待处理） | 申请牵线 |
| `code_already_used` | 400 | 兑换码已使用 | VIP兑换 |
| `rate_limit_exceeded` | 429 | 请求频率超限 | 所有接口（限流时） |
| `internal_server_error` | 500 | 服务器内部错误 | 所有接口（异常时） |

### 错误处理最佳实践

**1. 客户端错误处理流程**

```
发起请求
  ├─ 成功 (2xx) → 解析响应数据，更新UI
  ├─ 400 → 显示错误提示，引导用户修正输入
  ├─ 401 → 清除本地Token，跳转到登录页
  ├─ 403 → 显示"无权限"提示，返回上一页
  ├─ 404 → 显示"资源不存在"，返回列表页
  ├─ 409 → 显示冲突原因，引导用户操作
  ├─ 429 → 显示"操作过于频繁"，引导稍后重试
  └─ 5xx → 显示"服务器繁忙"，提供重试按钮
```

**2. 前端统一错误处理示例（伪代码）**

```javascript
async function request(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      return await res.json();
    }

    const error = await res.json().catch(() => ({}));
    const errorCode = error.error || 'unknown_error';

    switch (res.status) {
      case 401:
        clearToken();
        redirect('/login');
        throw new Error('登录已过期，请重新登录');
      case 403:
        toast.error('无权限操作');
        throw new Error('forbidden');
      case 429:
        toast.error('操作过于频繁，请稍后再试');
        throw new Error('rate_limit');
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('服务器繁忙，请稍后重试');
        throw new Error('server_error');
      default:
        toast.error(getErrorMessage(errorCode));
        throw new Error(errorCode);
    }
  } catch (err) {
    if (err.name === 'TypeError') {
      toast.error('网络连接失败，请检查网络');
    }
    throw err;
  }
}
```

**3. 重试策略建议**

| 错误类型 | 是否重试 | 重试策略 | 最大重试次数 |
|----------|----------|----------|-------------|
| 网络错误 | 是 | 指数退避 1s/2s/4s | 3次 |
| 429 限流 | 是 | 等待 Retry-After 头 | 3次 |
| 502/503/504 | 是 | 指数退避 1s/2s/4s | 3次 |
| 400/401/403/404 | 否 | - | 0次 |
| 409 冲突 | 否 | - | 0次 |
| 500 内部错误 | 谨慎 | 仅GET请求可重试 | 1次 |

**4. 错误日志与监控**

- 客户端：捕获未处理的 Promise 异常，上报到监控平台
- 服务端：记录请求ID、用户ID、错误栈、请求参数，便于排查
- 关键指标：5xx 错误率、429 触发次数、平均响应时间 P95/P99

---

## 接口版本规划

### v1（当前） vs v2（目标）对比

| 维度 | v1（当前） | v2（目标） |
|------|-----------|-----------|
| **架构模式** | 单体全量状态模式 | 微服务 + RESTful 资源模式 |
| **状态获取** | GET /api/state 返回全量状态 | 按资源分接口，分页/筛选获取 |
| **数据同步** | PUT /api/state 全量覆盖 | PATCH 增量更新 + ETag 乐观锁 |
| **认证方式** | HMAC-SHA256 自实现 | JWT (RS256) + Refresh Token |
| **实时推送** | 前端轮询 /api/state | WebSocket / SSE 事件推送 |
| **文件上传** | 无（直接传URL） | 统一文件上传接口 + OSS |
| **分页支持** | 无 | 所有列表接口支持 cursor/offset 分页 |
| **搜索过滤** | 前端过滤 | 后端支持多条件查询、排序 |
| **限流** | 无 | 全局限流 + 接口级限流 |
| **幂等性** | 无 | 关键接口支持幂等键 |
| **API文档** | Markdown | OpenAPI 3.0 (Swagger) |
| **版本号** | 无（隐式v1） | URL 路径 /api/v2/... |
| **错误码** | 简单错误码 | 详细错误码 + 错误描述 + 解决方案链接 |
| **SDK** | 无 | 官方 JS/TS SDK |
| **Webhook** | 无 | 事件订阅 Webhook |

### v2 接口规划（示例）

```
认证模块
├── POST   /api/v2/auth/login          统一登录（支持多种方式）
├── POST   /api/v2/auth/refresh        刷新 Token
├── POST   /api/v2/auth/logout         登出
└── POST   /api/v2/auth/send-code      发送验证码

用户模块
├── GET    /api/v2/users               用户列表（分页、筛选）
├── POST   /api/v2/users               注册用户
├── GET    /api/v2/users/:id           用户详情
├── PATCH  /api/v2/users/:id           更新用户资料
├── POST   /api/v2/users/:id/real-name 实名认证
└── GET    /api/v2/users/:id/deals     用户成交记录

红娘模块
├── GET    /api/v2/matchmakers         红娘列表
├── GET    /api/v2/matchmakers/:id     红娘详情
└── GET    /api/v2/matchmakers/:id/clients 红娘的客户列表

牵线请求模块
├── GET    /api/v2/match-requests      牵线请求列表
├── POST   /api/v2/match-requests      创建牵线请求
├── GET    /api/v2/match-requests/:id  牵线请求详情
├── PATCH  /api/v2/match-requests/:id  更新牵线请求状态
└── POST   /api/v2/match-requests/:id/contact 标记已联系

聊天模块
├── GET    /api/v2/chat/threads        聊天线程列表
├── GET    /api/v2/chat/threads/:id    线程详情
├── GET    /api/v2/chat/threads/:id/messages 消息列表
├── POST   /api/v2/chat/threads/:id/messages 发送消息
└── GET    /api/v2/chat/threads/:id/messages/:id 消息详情

管理员模块
├── POST   /api/v2/admin/agencies      添加机构
├── POST   /api/v2/admin/matchmakers   添加红娘
├── PATCH  /api/v2/admin/splits        修改分成比例
├── POST   /api/v2/admin/promo-codes   生成兑换码
└── GET    /api/v2/admin/statistics    数据统计
```

### 迁移路径

**阶段一：兼容过渡（v1 + v2 并行）**

```
1. 在 v1 代码基础上，新增 /api/v2/ 路由
2. v2 接口复用 v1 的业务逻辑层
3. v1 接口继续维护，不新增功能
4. 新功能只在 v2 接口上开发
5. 前端逐步迁移到 v2 接口
```

**阶段二：功能对齐（v2 功能完整）**

```
1. v2 接口覆盖所有 v1 功能
2. v2 增加分页、搜索、WebSocket 等新特性
3. 前端完成全部迁移
4. 发布 v2.0 正式版
5. 标记 v1 为 Deprecated
```

**阶段三：v1 下线**

```
1. v1 接口继续保留 6 个月
2. 通过监控统计 v1 调用量
3. 调用量为 0 后，移除 v1 代码
4. 完成版本升级
```

**兼容性保障措施：**

- v1 和 v2 使用同一套数据库，数据双向兼容
- v2 接口响应结构更规范，但核心字段保持一致
- 提供迁移工具脚本，辅助前端改造
- 文档中提供 v1 → v2 接口映射表

---

## 接口限流方案

### 限流策略

采用 **多层限流** 策略，从外到内层层防护：

```
┌─────────────────────────────────────┐
│  Nginx 层：IP 级限流（第一道防线）    │
│  全局限流：1000 次/秒（保护服务整体） │
├─────────────────────────────────────┤
│  API 层：用户级限流（精细化控制）      │
│  按用户ID + 接口维度分别限流          │
├─────────────────────────────────────┤
│  业务层：关键操作额外限制              │
│  注册、登录、短信等敏感接口更严格      │
└─────────────────────────────────────┘
```

### 限流阈值建议

| 接口 | 匿名用户 | 普通客户 | 红娘 | 管理员 | 限流维度 |
|------|---------|---------|------|--------|----------|
| **所有接口（全局）** | 60次/分钟 | 300次/分钟 | 300次/分钟 | 600次/分钟 | IP / 用户ID |
| POST /api/auth/client/register | 5次/分钟 | - | - | - | IP |
| POST /api/auth/client/login | 10次/分钟 | - | - | - | IP |
| POST /api/auth/matchmaker/login | 10次/分钟 | - | - | - | IP |
| POST /api/auth/admin/login | 5次/分钟 | - | - | - | IP |
| GET /api/state | 30次/分钟 | 120次/分钟 | 120次/分钟 | 240次/分钟 | 用户ID |
| PUT /api/state | - | 10次/分钟 | 10次/分钟 | 60次/分钟 | 用户ID |
| POST /api/client/match-requests | - | 5次/分钟 | - | - | 用户ID |
| POST /api/chat/threads/:id/messages | - | 60次/分钟 | 60次/分钟 | 120次/分钟 | 用户ID + 线程ID |
| POST /api/client/vip/redeem | - | 3次/分钟 | - | - | 用户ID |
| POST /api/client/real-name | - | 3次/天 | - | - | 用户ID |
| POST /api/admin/promo-codes | - | - | - | 60次/分钟 | 管理员ID |

### 实现方式

**方式一：Nginx 限流（推荐，最外层）**

```nginx
http {
    # 定义限流区域（全局限流，按IP）
    limit_req_zone $binary_remote_addr zone=api_general:10m rate=60r/m;

    # 登录接口更严格
    limit_req_zone $binary_remote_addr zone=auth_login:10m rate=10r/m;

    server {
        location /api/ {
            limit_req zone=api_general burst=20 nodelay;

            # 登录接口单独限流
            location ~* /api/auth/.*/login {
                limit_req zone=auth_login burst=5 nodelay;
                proxy_pass http://api:3000;
            }

            proxy_pass http://api:3000;
        }
    }
}
```

**方式二：应用层限流（Redis + Token Bucket）**

```javascript
// 伪代码：基于 Redis 的令牌桶限流
async function rateLimit(userId, apiPath, limit, window) {
  const key = `rate_limit:${userId}:${apiPath}`;
  const now = Date.now();
  const windowMs = window * 1000;

  const pipeline = redis.pipeline();
  pipeline.zadd(key, now, now);
  pipeline.zremrangebyscore(key, 0, now - windowMs);
  pipeline.zcard(key);
  pipeline.expire(key, window);

  const results = await pipeline.exec();
  const count = results[2][1];

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt: now + windowMs };
  }

  return {
    allowed: true,
    remaining: limit - count,
    resetAt: now + windowMs
  };
}
```

**方式三：接口中间件集成**

```javascript
// Express 中间件示例
const rateLimitConfig = {
  'POST /api/auth/client/login': { limit: 10, window: 60, by: 'ip' },
  'POST /api/auth/client/register': { limit: 5, window: 60, by: 'ip' },
  'POST /api/client/match-requests': { limit: 5, window: 60, by: 'user' },
  'POST /api/chat/threads/:id/messages': { limit: 60, window: 60, by: 'user' },
  // ...
};

app.use(async (req, res, next) => {
  const routeKey = `${req.method} ${req.route?.path || req.path}`;
  const config = rateLimitConfig[routeKey];

  if (config) {
    const identifier = config.by === 'ip'
      ? req.ip
      : req.user?.id || req.ip;

    const result = await rateLimit(
      identifier,
      routeKey,
      config.limit,
      config.window
    );

    res.set('X-RateLimit-Limit', config.limit);
    res.set('X-RateLimit-Remaining', result.remaining);
    res.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      res.set('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
      return res.status(429).json({ error: 'rate_limit_exceeded' });
    }
  }

  next();
});
```

### 限流响应头规范

```
X-RateLimit-Limit: 60        # 时间窗口内最大请求数
X-RateLimit-Remaining: 42    # 剩余请求数
X-RateLimit-Reset: 1719292800 # 限流重置时间（Unix时间戳，秒）
Retry-After: 30              # 多久后可以重试（秒，仅429时返回）
```

### 限流应对建议

1. **前端**：检测到 429 时自动按 Retry-After 等待后重试
2. **轮询优化**：减少不必要的 /api/state 轮询，空闲时降低频率
3. **批量操作**：将多次小请求合并为一次批量请求
4. **本地缓存**：不经常变化的数据前端本地缓存
5. **降级策略**：限流时提供降级体验（如展示缓存数据）

---

## 幂等性设计

### 需要幂等的接口

| 接口 | 是否需要幂等 | 原因 | 幂等键方案 |
|------|-------------|------|-----------|
| POST /api/auth/client/register | ⚠️ 建议 | 防止重复注册 | phone / email 唯一约束 |
| POST /api/auth/matchmaker/register | ⚠️ 建议 | 防止重复注册 | phone / code 唯一约束 |
| POST /api/client/vip/redeem | ✅ 必须 | 防止重复扣款/重复开通 | 兑换码本身唯一 |
| POST /api/client/match-requests | ✅ 必须 | 防止重复提交牵线请求 | requesterId + targetUserId + matchmakerId |
| POST /api/chat/threads/:id/messages | ⚠️ 建议 | 防止重复发送消息 | 客户端生成 messageId |
| POST /api/admin/promo-codes | ✅ 必须 | 防止重复生成兑换码 | code 唯一约束 |
| POST /api/admin/deals/simulate | ❌ 无需 | 模拟操作，每次都是新的 | - |
| PUT /api/state | ✅ 天然幂等 | 全量覆盖，重复执行结果一致 | - |
| PATCH 类接口 | ✅ 天然幂等 | 同一操作重复执行结果相同 | - |
| GET 类接口 | ✅ 天然幂等 | 只读操作，不改变状态 | - |

### 幂等性保证方式

**方式一：唯一键约束（数据库层面，最可靠）**

```
场景：用户注册、兑换码生成
原理：数据库唯一索引，重复插入直接报错
示例：
- users 表 phone 字段唯一索引
- promo_codes 表 code 字段唯一索引
- match_requests 表 (requesterId, targetUserId, matchmakerId, status=pending) 联合唯一
```

**方式二：幂等键（Idempotency-Key）**

```
场景：创建牵线请求、发送消息、VIP兑换
原理：客户端生成唯一键，服务端缓存结果，相同键直接返回缓存
请求头：
  X-Idempotency-Key: <uuid-or-client-generated-id>

处理流程：
  1. 检查 Redis 中是否存在该 key
  2. 存在 → 直接返回缓存的响应结果
  3. 不存在 → 执行业务逻辑，缓存结果，设置过期时间（24h）
  4. 返回结果
```

**方式三：状态机校验**

```
场景：牵线请求状态流转
原理：只有特定状态才能执行特定操作，重复操作不生效
示例：
  - 只有 "pending_matchmaker_contact" 状态才能标记已联系
  - 重复标记同一侧已联系，不报错但也不改变状态
```

**方式四：前端防抖 + 按钮置灰**

```
场景：所有提交类操作
原理：用户点击后立即禁用按钮，请求完成再恢复
补充：防抖处理，防止快速连续点击
```

### 幂等键实现示例

**服务端中间件（伪代码）：**

```javascript
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24小时

app.use(async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!idempotencyKey || req.method === 'GET') {
    return next();
  }

  const cacheKey = `idempotency:${req.user.id}:${idempotencyKey}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    const { status, body } = JSON.parse(cached);
    return res.status(status).json(body);
  }

  // 捕获原始 send，缓存结果
  const originalSend = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) {
      redis.setex(
        cacheKey,
        IDEMPOTENCY_TTL,
        JSON.stringify({ status: res.statusCode, body })
      );
    }
    return originalSend(body);
  };

  next();
});
```

**客户端使用示例：**

```javascript
// 生成 UUID 作为幂等键
function generateIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 发送消息时使用幂等键
async function sendMessage(threadId, content) {
  const idempotencyKey = generateIdempotencyKey();

  return request(`/api/chat/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': idempotencyKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
}

// 重试时使用相同的幂等键
async function sendMessageWithRetry(threadId, content, retries = 3) {
  const idempotencyKey = generateIdempotencyKey();

  for (let i = 0; i < retries; i++) {
    try {
      return await request(`/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'X-Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
    } catch (err) {
      if (i === retries - 1) throw err;
      if (err.message === 'server_error' || err.message === 'network_error') {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
}
```

### 幂等性与并发控制

对于高并发场景，需要结合分布式锁防止缓存击穿：

```
1. 请求携带幂等键到达
2. 尝试 setnx 加锁（防止同一键并发请求）
3. 获取锁失败 → 等待 + 重试读取缓存
4. 获取锁成功 → 执行业务逻辑
5. 写入缓存，释放锁
6. 返回结果
```

**总结：** 幂等性是分布式系统的重要保障，建议优先在数据库层面用唯一约束兜底，关键业务接口增加幂等键支持，前端配合防抖和按钮置灰，形成多层次防护。
