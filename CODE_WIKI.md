# MatchMaker - Code Wiki 文档

> 项目版本：v1.0.0 | 前端资源版本：v1.0.32 | 更新日期：2026-06-25

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [目录结构](#3-目录结构)
4. [前端模块](#4-前端模块)
5. [后端 API 模块](#5-后端-api-模块)
6. [数据库设计](#6-数据库设计)
7. [API 接口文档](#7-api-接口文档)
8. [安全机制](#8-安全机制)
9. [依赖关系](#9-依赖关系)
10. [项目运行方式](#10-项目运行方式)
11. [部署指南](#11-部署指南)
12. [技术债务与开发路线](#12-技术债务与开发路线)

---

## 1. 项目概述

### 1.1 项目简介

"MatchMaker"是一个面向单身人士的交友平台原型。项目涵盖完整的业务闭环：客户注册、资料展示、VIP 会员开通、红娘牵线、实时聊天、管理后台运营，以及佣金分成结算。

项目采用 **前后端分离 + Docker 容器化部署** 的架构，前端为纯静态 HTML/CSS/JS，后端为 Node.js Express API，数据库为 PostgreSQL。

### 1.2 核心业务流程

```
客户注册 → 浏览异性资料 → 开通 VIP → 申请牵线
    ↓
红娘收到通知 → 分别联系男女双方 → 双方确认
    ↓
公开双方微信 → 开启会员互聊 → 标记成交
    ↓
佣金结算（推广费 / 牵线费 / 平台服务费）
```

### 1.3 三端角色

| 角色 | 入口文件 | HTTP 端口 | HTTPS 端口 | 核心功能 |
|------|----------|-----------|------------|----------|
| **客户（真实 H5）** | `uniapp/src/` | 8096 | 21314 | 注册登录、资料维护、服务订阅、申请牵线、实时聊天 |
| **红娘（工作台）** | [matchmaker.html](file:///Users/x/code/matchmaker/matchmaker.html) | 8097 | 21314 | 注册登录、查看牵线通知、联系双方、查看微信、一对一聊天 |
| **管理员（后台）** | [admin.html](file:///Users/x/code/matchmaker/admin.html) | 8098 | 21314 | 客户/红娘/机构管理、分成设置、兑换码管理、数据图表 |
| **综合预览端** | [index.html](file:///Users/x/code/matchmaker/index.html) | 8095 | 21314 | 红娘和管理后台预览；客户业务跳转真实 H5 |

### 1.4 仓库信息

- **GitHub**: `https://github.com/pixian5/matchmaker`
- **服务器部署目录**: `/opt/matchmaker`
- **数据库容器**: `matchmaker-postgres`
- **API 容器**: `matchmaker-api`
- **域名**: `uk.sbbz.tech`

---

## 2. 整体架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      浏览器 / 客户端                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 综合预览  │  │ 客户小程序│  │ 红娘工作台│  │ 管理后台  │   │
│  │ 8095/21314│  │ 8096/21314│  │ 8097/21314│  │8098/21314 │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴────────────┴──────────────┘          │
│                      ▼ HTTP /api/*                           │
│              ┌───────────────────┐                           │
│              │   Nginx 反向代理    │                           │
│              │  (各端独立容器)     │                           │
│              └─────────┬─────────┘                           │
│                        ▼                                     │
│              ┌───────────────────┐                           │
│              │   Express API     │  ← Node.js 22             │
│              │   端口 3000        │                           │
│              └─────────┬─────────┘                           │
│                        ▼                                     │
│              ┌───────────────────┐                           │
│              │   PostgreSQL 16   │  ← 端口 5432 (仅本机)     │
│              │   数据库           │                           │
│              └───────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

#### 前端技术栈

| 技术 | 说明 |
|------|------|
| HTML5 | 四个入口页面，纯静态 |
| CSS3 | 自定义变量、Grid/Flex 布局、毛玻璃特效、响应式 |
| 原生 JavaScript | 无框架依赖，单文件 [app.js](file:///Users/x/code/matchmaker/app.js) 约 3900 行 |
| localStorage | 离线状态缓存与会话存储 |

#### 后端技术栈

| 技术 | 说明 |
|------|------|
| Node.js 22 | Alpine 镜像 |
| Express 4.x | RESTful API |
| pg (node-postgres) | PostgreSQL 连接池 |
| crypto | HMAC Token 签发与验证、scrypt 密码哈希 |

#### 数据库技术栈

| 技术 | 说明 |
|------|------|
| PostgreSQL 16 | Alpine 镜像，数据持久化到宿主机卷 |

#### 部署技术栈

| 技术 | 说明 |
|------|------|
| Docker Compose | 多容器编排（HTTP + SSL 两套 compose 文件） |
| Nginx 1.27 | 静态文件服务 + API 反向代理 |
| Let's Encrypt | 通配证书 `*.sbbz.tech`（acme.sh 管理） |
| systemd / webhook | 自动部署触发 |

---

## 3. 目录结构

### 3.1 根目录结构

```
matchmaker/
├── index.html              综合预览端（8095/21314）
├── uniapp/src/             真实客户 H5/微信小程序（8096/21314）
├── matchmaker.html         红娘工作台端（8097/21314）
├── admin.html              管理后台端（8098/21314）
├── app.js                  前端业务逻辑（约 3900 行）
├── styles.css              全局样式表（约 1680 行）
├── package.json            根项目配置
├── readme.md               项目说明文档
├── deploy.sh               一键部署脚本
├── compose.yml             Docker Compose：HTTP 前端 + API + PostgreSQL
├── compose.ssl.yml         Docker Compose：HTTPS 前端容器
├── .env.example            环境变量示例
├── server/                 后端 API 服务
│   ├── index.js            Express API 主文件
│   ├── package.json        后端依赖
│   ├── Dockerfile          Node.js 镜像构建
│   └── .dockerignore
├── deploy/                 部署配置
│   ├── nginx.conf          HTTP Nginx 配置
│   ├── nginx-ssl.conf      HTTPS Nginx 配置
│   ├── auto-deploy.sh      服务器自动部署脚本
│   └── ...
├── scripts/                构建脚本
│   └── render-static.mjs   静态资源版本号渲染脚本
├── webhook/                GitHub Webhook 服务
│   ├── index.js            Webhook HTTP 服务
│   ├── webhook_server.py   Python 版 Webhook 服务（备用）
│   └── ...
├── 说明/                   项目详细说明文档（15 份）
└── CODE_WIKI.md            本文档
```

### 3.2 关键文件说明

| 文件 | 行数 | 说明 |
|------|------|------|
| [app.js](file:///Users/x/code/matchmaker/app.js) | ~3900 | 前端业务逻辑（所有角色共享） |
| [server/index.js](file:///Users/x/code/matchmaker/server/index.js) | ~1680 | 后端 Express API |
| [styles.css](file:///Users/x/code/matchmaker/styles.css) | ~1680 | 全局样式表 |
| [compose.yml](file:///Users/x/code/matchmaker/compose.yml) | ~99 | HTTP 容器编排 |
| [compose.ssl.yml](file:///Users/x/code/matchmaker/compose.ssl.yml) | ~68 | HTTPS 容器编排 |

---

## 4. 前端模块

### 4.1 前端架构概述

前端采用**单文件架构**，所有业务逻辑集中在 [app.js](file:///Users/x/code/matchmaker/app.js) 中。四个 HTML 入口页面共享同一份 JS 和 CSS。

### 4.2 核心状态管理

#### 全局状态对象 `state`

```javascript
state = {
  currentUserId: "u1",           // 当前登录客户 ID
  selectedMatchmakerId: null,     // 当前登录红娘 ID
  adminLoggedIn: false,           // 管理员是否登录
  splits: { promo: 20, matchmaker: 35, platform: 45 },
  agencies: [...],                // 机构列表
  matchmakers: [...],             // 红娘列表
  users: [...],                   // 客户列表
  requests: [...],                // 牵线请求列表
  chatThreads: [...],             // 聊天线程列表
  chatMessages: [...],            // 聊天消息列表
  deals: [...],                   // 成交记录列表
  promoCodes: [...]               // 兑换码列表
}
```

#### 会话对象 `session`

```javascript
session = {
  currentUserId: "u1",
  selectedMatchmakerId: null,
  adminLoggedIn: false,
  token: "xxx.xxx",              // HMAC Token
  role: "client"                 // client / matchmaker / admin
}
```

### 4.3 关键函数说明

#### 初始化与状态管理

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `initApp()` | [app.js#L509-L542](file:///Users/x/code/matchmaker/app.js#L509-L542) | 应用初始化：加载远程状态、启动轮询、渲染页面 |
| `loadState()` | [app.js#L368-L379](file:///Users/x/code/matchmaker/app.js#L368-L379) | 从 localStorage 加载本地状态 |
| `saveState()` | [app.js#L381-L387](file:///Users/x/code/matchmaker/app.js#L381-L387) | 保存状态到 localStorage 并同步到远程 |
| `loadRemoteState()` | [app.js#L455-L463](file:///Users/x/code/matchmaker/app.js#L455-L463) | 从 API 加载远程状态 |
| `syncRemoteState()` | [app.js#L465-L483](file:///Users/x/code/matchmaker/app.js#L465-L483) | 同步本地状态到远程 API |
| `ensureStateDefaults()` | [app.js#L208-L344](file:///Users/x/code/matchmaker/app.js#L208-L344) | 补全状态对象的默认字段 |

#### 路由系统

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `handleRouting()` | [app.js#L556-L702](file:///Users/x/code/matchmaker/app.js#L556-L702) | 路由分发主函数 |
| `navigate()` | [app.js#L704-L711](file:///Users/x/code/matchmaker/app.js#L704-L711) | 编程式导航 |
| `isMiniView()` | [app.js#L544-L546](file:///Users/x/code/matchmaker/app.js#L544-L546) | 检测是否为小程序端视图 |
| `isMatchmakerView()` | [app.js#L548-L550](file:///Users/x/code/matchmaker/app.js#L548-L550) | 检测是否为红娘端视图 |
| `isAdminView()` | [app.js#L552-L554](file:///Users/x/code/matchmaker/app.js#L552-L554) | 检测是否为管理后台视图 |

#### 认证与会话

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `loadSession()` | [app.js#L389-L405](file:///Users/x/code/matchmaker/app.js#L389-L405) | 从 localStorage 加载会话 |
| `saveSession()` | [app.js#L407-L409](file:///Users/x/code/matchmaker/app.js#L407-L409) | 保存会话到 localStorage |
| `setAuthSession()` | [app.js#L411-L422](file:///Users/x/code/matchmaker/app.js#L411-L422) | 设置认证会话（角色、ID、Token） |
| `authHeaders()` | [app.js#L424-L426](file:///Users/x/code/matchmaker/app.js#L424-L426) | 获取认证请求头 |
| `hashText()` | [app.js#L717-L731](file:///Users/x/code/matchmaker/app.js#L717-L731) | 文本哈希（SHA-256 或 FNV-1a） |

#### 客户相关函数

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `currentUser()` | [app.js#L733-L735](file:///Users/x/code/matchmaker/app.js#L733-L735) | 获取当前登录用户 |
| `renderMiniApp()` | [app.js#L1116-L1200](file:///Users/x/code/matchmaker/app.js#L1116-L1200) | 渲染小程序端整体 |
| `renderProfiles()` | [app.js#L1302-L1399](file:///Users/x/code/matchmaker/app.js#L1302-L1399) | 渲染筛选资料卡片 |
| `renderMineTabContent()` | [app.js#L1230-L1294](file:///Users/x/code/matchmaker/app.js#L1230-L1294) | 渲染"我的"页面 |
| `addVipMatchmaker()` | [app.js#L759-L767](file:///Users/x/code/matchmaker/app.js#L759-L767) | 为用户添加 VIP 红娘 |

#### 红娘相关函数

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `currentMatchmaker()` | [app.js#L737-L739](file:///Users/x/code/matchmaker/app.js#L737-L739) | 获取当前登录红娘 |
| `renderMatchmakerDesk()` | - | 渲染红娘工作台 |
| `getRequestContactStatus()` | [app.js#L346-L351](file:///Users/x/code/matchmaker/app.js#L346-L351) | 计算牵线请求联系状态 |

#### 聊天相关函数

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `getThreadById()` | [app.js#L784-L786](file:///Users/x/code/matchmaker/app.js#L784-L786) | 根据 ID 获取聊天线程 |
| `getThreadMessages()` | [app.js#L814-L818](file:///Users/x/code/matchmaker/app.js#L814-L818) | 获取线程的所有消息 |
| `createLocalThread()` | [app.js#L878-L932](file:///Users/x/code/matchmaker/app.js#L878-L932) | 创建本地聊天线程 |
| `appendLocalMessage()` | [app.js#L934-L950](file:///Users/x/code/matchmaker/app.js#L934-L950) | 追加本地消息 |
| `threadHasParticipant()` | [app.js#L820-L822](file:///Users/x/code/matchmaker/app.js#L820-L822) | 检查线程是否包含某参与者 |

#### 渲染与 UI

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `renderAll()` | [app.js#L952-L958](file:///Users/x/code/matchmaker/app.js#L952-L958) | 渲染所有视图 |
| `showToast()` | [app.js#L960-L965](file:///Users/x/code/matchmaker/app.js#L960-L965) | 显示 Toast 提示 |
| `logEvent()` | [app.js#L967-L995](file:///Users/x/code/matchmaker/app.js#L967-L995) | 记录控制台日志事件 |
| `switchView()` | [app.js#L1047-L1063](file:///Users/x/code/matchmaker/app.js#L1047-L1063) | 切换视图（综合预览端用） |
| `switchMiniTab()` | [app.js#L1065-L1073](file:///Users/x/code/matchmaker/app.js#L1065-L1073) | 切换小程序 Tab |

### 4.4 数据同步机制

#### 本地优先写入

```
用户操作 → 修改本地 state → saveState()
  ├─ localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  └─ if (apiAvailable) syncRemoteState()
       └─ PUT /api/state（带 token）
           ├─ 成功 → 保持 apiAvailable = true
           └─ 失败 → apiAvailable = false，显示提示
```

#### 远程轮询同步

前端每 **4 秒**轮询 `GET /api/state`，检测到远程状态与本地不同时自动更新。

#### 离线模式

- API 不可用时，前端自动切换到 localStorage 离线模式
- 所有操作在本地完成，数据保存在浏览器
- API 恢复后，下次操作会重新同步

### 4.5 路由系统

#### 综合预览端路由（8095）

| 路径 | 页面 |
|------|------|
| `/mini/discover` | 客户端-筛选页 |
| `/mini/profile` | 客户端-资料页 |
| `/mini/vip` | 客户端-VIP页 |
| `/mini/requests` | 客户端-消息页 |
| `/mini/my` | 客户端-我的页 |
| `/matchmaker/login` | 红娘登录页 |
| `/matchmaker/workbench` | 红娘工作台 |
| `/admin/login` | 管理员登录页 |
| `/admin/console` | 管理后台 |

#### 独立端口路由

- **客户端（8096）**: `/discover`, `/profile`, `/vip`, `/requests`, `/my`
- **红娘端（8097）**: `/login`, `/workbench`
- **管理端（8098）**: `/login`, `/console`

#### 路由守卫

- 客户端：未登录时，除 `/my` 外所有页面重定向到 `/my`
- 红娘端：未登录时，`/workbench` 重定向到 `/login`
- 管理端：未登录时，`/console` 重定向到 `/login`

---

## 5. 后端 API 模块

### 5.1 后端架构概述

后端采用 **Express.js** 框架，单文件 [server/index.js](file:///Users/x/code/matchmaker/server/index.js) 实现，使用 ES Module 语法。

### 5.2 核心模块结构

```
server/index.js
├── 种子数据（seedState）          ~190 行
├── 数据库连接（Pool）
├── 工具函数
│   ├── Token 签发与验证
│   ├── 密码哈希
│   ├── 数据脱敏
│   └── 业务辅助函数
├── 数据库操作
│   ├── initDatabase()
│   ├── readState()
│   ├── writeState()
│   └── syncNormalizedState()
├── 认证接口（/api/auth/*）
├── 状态接口（/api/state, /api/reset, /api/health）
├── 客户精细化接口（/api/client/*）
├── 红娘精细化接口（/api/matchmaker/*）
├── 聊天接口（/api/chat/*）
└── 管理员接口（/api/admin/*）
```

### 5.3 Express 中间件链

```
请求进入
  ↓
express.json({ limit: "2mb" })  ← 解析 JSON 请求体
  ↓
路由匹配
  ├─ /api/health → 直接响应
  ├─ /api/auth/* → 认证路由（无需 token）
  ├─ /api/state GET → 公开（脱敏返回）
  ├─ /api/state PUT → requireAuth(["admin","client","matchmaker"])
  ├─ /api/reset → requireAuth(["admin"])
  ├─ /api/client/* → requireAuth(["client"])
  ├─ /api/matchmaker/* → requireAuth(["matchmaker"])
  ├─ /api/admin/* → requireAuth(["admin"])
  └─ /api/chat/* → requireAuth(["client","matchmaker","admin"])
  ↓
错误处理 → 500 + { error: "internal server error" }
```

### 5.4 关键函数说明

#### 数据库初始化与连接

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `initDatabase()` | [server/index.js#L215-L338](file:///Users/x/code/matchmaker/server/index.js#L215-L338) | 建表 + 种子数据初始化 |
| `Pool` | [server/index.js#L200-L210](file:///Users/x/code/matchmaker/server/index.js#L200-L210) | PostgreSQL 连接池实例 |

#### Token 与认证

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `signToken()` | [server/index.js#L364-L372](file:///Users/x/code/matchmaker/server/index.js#L364-L372) | 签发 HMAC Token（7 天有效期） |
| `verifyToken()` | [server/index.js#L374-L382](file:///Users/x/code/matchmaker/server/index.js#L374-L382) | 验证 Token 签名与过期时间 |
| `getBearerToken()` | [server/index.js#L384-L386](file:///Users/x/code/matchmaker/server/index.js#L384-L386) | 从请求头提取 Bearer Token |
| `requireAuth()` | [server/index.js#L388-L402](file:///Users/x/code/matchmaker/server/index.js#L388-L402) | 认证中间件工厂函数 |
| `hashPassword()` | [server/index.js#L404-L408](file:///Users/x/code/matchmaker/server/index.js#L404-L408) | scrypt 密码哈希 |
| `verifyPassword()` | [server/index.js#L410-L418](file:///Users/x/code/matchmaker/server/index.js#L410-L418) | 验证密码哈希 |

#### 数据读写

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `readState()` | [server/index.js#L569-L695](file:///Users/x/code/matchmaker/server/index.js#L569-L695) | 从各业务表读取组装完整 state |
| `writeState()` | [server/index.js#L697-L699](file:///Users/x/code/matchmaker/server/index.js#L697-L699) | 调用 syncNormalizedState 全量写入 |
| `syncNormalizedState()` | [server/index.js#L705-L999](file:///Users/x/code/matchmaker/server/index.js#L705-L999) | UPSERT + DELETE 全量同步到业务表 |
| `publicState()` | [server/index.js#L420-L426](file:///Users/x/code/matchmaker/server/index.js#L420-L426) | 数据脱敏（移除 passwordHash、idCard） |
| `validateState()` | [server/index.js#L340-L354](file:///Users/x/code/matchmaker/server/index.js#L340-L354) | 验证 state 数据结构 |

#### 业务辅助函数

| 函数名 | 位置 | 说明 |
|--------|------|------|
| `ensureUserDefaults()` | [server/index.js#L440-L452](file:///Users/x/code/matchmaker/server/index.js#L440-L452) | 补全用户默认字段 |
| `ensureRequestDefaults()` | [server/index.js#L428-L438](file:///Users/x/code/matchmaker/server/index.js#L428-L438) | 补全牵线请求默认字段 |
| `getRequestContactStatus()` | [server/index.js#L478-L483](file:///Users/x/code/matchmaker/server/index.js#L478-L483) | 计算牵线请求联系状态 |
| `buildMemberMatchmakerThreads()` | [server/index.js#L505-L542](file:///Users/x/code/matchmaker/server/index.js#L505-L542) | 创建红娘-会员聊天线程 |
| `buildMemberMemberThread()` | [server/index.js#L544-L558](file:///Users/x/code/matchmaker/server/index.js#L544-L558) | 创建会员互聊天线程 |
| `canAccessThread()` | [server/index.js#L495-L499](file:///Users/x/code/matchmaker/server/index.js#L495-L499) | 检查是否有权限访问线程 |

### 5.5 Token 机制详解

项目使用**自实现的 HMAC-SHA256 Token**（非标准 JWT）：

```
签发流程：
  1. 构造 payload: { role, sub, exp: now + 7天 }
  2. base64url 编码 payload
  3. HMAC-SHA256 签名：signature = HMAC(encoded, TOKEN_SECRET)
  4. token = encoded + "." + signature

验证流程：
  1. 拆分 token 为 encoded 和 signature
  2. 重新计算 expected = HMAC(encoded, TOKEN_SECRET)
  3. timingSafeEqual 比对签名
  4. 检查 exp 是否过期
```

Token 存储：前端保存在 `localStorage` 的 `matchmaker-dating-demo-v1:session`。

### 5.6 数据库连接池配置

```javascript
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "matchmaker",
  user: process.env.PGUSER || "matchmaker",
  password: process.env.PGPASSWORD,
});
```

- 默认连接池大小：10
- 支持 `DATABASE_URL` 连接字符串或分散环境变量

---

## 6. 数据库设计

### 6.1 数据表总览

| 表名 | 用途 | 主键 |
|------|------|------|
| `app_state` | 完整 JSON 状态兼容层 | `id` (integer) |
| `agencies` | 机构/婚介公司 | `id` (text) |
| `matchmakers` | 红娘账号 | `id` (text) |
| `users` | 客户账号 | `id` (text) |
| `match_requests` | 牵线请求 | `id` (text) |
| `chat_threads` | 聊天会话 | `id` (text) |
| `chat_messages` | 聊天消息 | `id` (text) |
| `deals` | 成交/订单记录 | `id` (text) |
| `promo_codes` | VIP 兑换码 | `code` (text) |
| `app_settings` | 运行时设置 | `id` (text) |

### 6.2 表结构详情

#### agencies — 机构表

```sql
CREATE TABLE agencies (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    city        TEXT,
    raw         JSONB NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

- `id`：主键，格式 `a` + 时间戳 base36 + 随机 hex
- `name`：机构名称
- `city`：所在城市
- `raw`：完整 JSON 副本（兼容整包读写模式）

#### matchmakers — 红娘表

```sql
CREATE TABLE matchmakers (
    id              TEXT PRIMARY KEY,
    agency_id       TEXT REFERENCES agencies(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    code            TEXT NOT NULL UNIQUE,
    phone           TEXT,
    email           TEXT,
    status          TEXT,
    password_hash   TEXT,
    registered_at   TIMESTAMPTZ,
    raw             JSONB NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

- `code`：唯一推荐码，如 `HM-LILI`
- `password_hash`：scrypt 哈希密码，格式 `scrypt$盐$哈希值`

#### users — 客户表

```sql
CREATE TABLE users (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    gender                  TEXT,
    age                     INTEGER,
    city                    TEXT,
    job                     TEXT,
    wechat                  TEXT,
    phone                   TEXT,
    email                   TEXT,
    vip                     BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash           TEXT,
    account_status          TEXT,
    registered_at           TIMESTAMPTZ,
    real_name_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    raw                     JSONB NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

`raw` JSONB 额外字段：
- `servicePlans`：服务包列表，每个服务包通过 `matchmakerId` 绑定红娘
- `matchmakerIds`：会员绑定的红娘列表
- `profileByMatchmaker`：按红娘分的资料审核状态
- `vipExpiresAt`：VIP 到期日期
- `realName` / `idCard`：实名认证信息（不返回前端）

#### match_requests — 牵线请求表

```sql
CREATE TABLE match_requests (
    id              TEXT PRIMARY KEY,
    from_user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    to_user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    matchmaker_id   TEXT REFERENCES matchmakers(id) ON DELETE SET NULL,
    status          TEXT NOT NULL,
    created_at      TIMESTAMPTZ,
    raw             JSONB NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

状态流转：
```
待红娘联系 → 联系男方 → 来和双方对话
待红娘联系 → 联系女方 → 来和双方对话
```

#### chat_threads — 聊天会话表

```sql
CREATE TABLE chat_threads (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,
    request_id      TEXT REFERENCES match_requests(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'active',
    participants    JSONB NOT NULL,
    raw             JSONB NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

会话类型：
- `member_matchmaker`：红娘与会员一对一
- `member_member`：会员间互聊

#### chat_messages — 聊天消息表

```sql
CREATE TABLE chat_messages (
    id              TEXT PRIMARY KEY,
    thread_id       TEXT REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_role     TEXT NOT NULL,
    sender_id       TEXT NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ,
    raw             JSONB NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### deals — 成交记录表

```sql
CREATE TABLE deals (
    id              TEXT PRIMARY KEY,
    request_id      TEXT REFERENCES match_requests(id) ON DELETE SET NULL,
    amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at      DATE,
    raw             JSONB NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### promo_codes — 兑换码表

```sql
CREATE TABLE promo_codes (
    code            TEXT PRIMARY KEY,
    matchmaker_id   TEXT REFERENCES matchmakers(id) ON DELETE SET NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    used_by         TEXT REFERENCES users(id) ON DELETE SET NULL,
    infinite        BOOLEAN NOT NULL DEFAULT FALSE,
    raw             JSONB NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### app_settings — 运行时设置表

```sql
CREATE TABLE app_settings (
    id          TEXT PRIMARY KEY,
    data        JSONB NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

存储内容：
- `currentUserId`：当前默认客户 ID
- `selectedMatchmakerId`：当前默认红娘 ID
- `adminLoggedIn`：管理员登录状态
- `splits`：分成比例 `{promo, matchmaker, platform}`

### 6.3 外键关系图

```
agencies ←── matchmakers.agency_id
users ──→ match_requests.from_user_id / to_user_id
matchmakers ←── match_requests.matchmaker_id
match_requests ←── chat_threads.request_id
chat_threads ←── chat_messages.thread_id
match_requests ←── deals.request_id
matchmakers ←── promo_codes.matchmaker_id
users ←── promo_codes.used_by
```

### 6.4 级联删除规则

- 删除客户 → 关联牵线请求级联删除 → 关联聊天线程级联删除 → 关联消息级联删除
- 删除牵线请求 → 关联聊天线程级联删除 → 关联消息级联删除
- 删除聊天线程 → 关联消息级联删除
- 删除机构 → 关联红娘的 `agency_id` 置为 NULL

---

## 7. API 接口文档

### 7.1 基础信息

- **Base URL**: `/api`
- **认证方式**: `Authorization: Bearer <token>`
- **请求体**: `Content-Type: application/json`
- **请求体大小限制**: 2MB

### 7.2 认证接口

#### 管理员登录
```
POST /api/auth/admin/login
```

请求参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | 管理员密码 |

响应：`{ token, admin: { id, name } }`

#### 客户登录
```
POST /api/auth/client/login
```

请求参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 直接按 ID 登录（演示用） |
| account | string | 否 | 手机/邮箱/微信号 |
| password | string | 否 | 密码 |

响应：`{ token, user }`

#### 客户注册
```
POST /api/auth/client/register
```

请求参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 姓名 |
| phone/email | string | 条件 | 至少填一个 |
| password | string | 是 | 密码 |
| matchmakerIds | string[] | 否 | 委托红娘列表 |

响应：`{ token, user, state }`

#### 红娘登录
```
POST /api/auth/matchmaker/login
```

请求参数：`matchmakerId` 或 `account` + `password`

响应：`{ token, matchmaker }`

#### 红娘注册
```
POST /api/auth/matchmaker/register
```

请求参数：`name`, `phone`(必填), `code`(必填推荐码), `password`, `agencyId`

响应：`{ token, matchmaker, state }`

### 7.3 状态接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/state` | 公开（脱敏） | 获取全局状态 |
| PUT | `/api/state` | admin/client/matchmaker | 写入全局状态 |
| POST | `/api/reset` | admin | 重置为种子数据（Nginx 公网屏蔽） |
| GET | `/api/health` | 公开 | 健康检查 |

### 7.4 客户精细化接口

| 方法 | 路径 | 说明 |
|------|------|------|
| PATCH | `/api/client/profile` | 修改个人资料 |
| POST | `/api/client/real-name` | 提交实名认证 |
| POST | `/api/client/vip/redeem` | VIP 兑换（兑换码或推荐码） |
| POST | `/api/client/match-requests` | 申请牵线 |

### 7.5 红娘精细化接口

| 方法 | 路径 | 说明 |
|------|------|------|
| PATCH | `/api/matchmaker/requests/:id/contacted` | 标记已联系 |
| PATCH | `/api/matchmaker/requests/:id/member-chat` | 开关会员互聊 |
| PATCH | `/api/matchmaker/users/:id/profile-review` | 审核客户资料 |

### 7.6 聊天接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/threads/:id/messages` | 发送消息 |

### 7.7 管理员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/agencies` | 添加机构 |
| POST | `/api/admin/matchmakers` | 添加红娘 |
| PATCH | `/api/admin/splits` | 修改分成比例 |
| POST | `/api/admin/promo-codes` | 生成兑换码 |
| POST | `/api/admin/deals/simulate` | 模拟成交 |

---

## 8. 安全机制

### 8.1 认证体系

| 特性 | 说明 |
|------|------|
| Token 算法 | HMAC-SHA256（自实现，非标准 JWT） |
| Token 有效期 | 7 天 |
| 密码哈希 | scrypt 算法（含随机盐） |
| 签名比对 | `crypto.timingSafeEqual` 防时序攻击 |

### 8.2 角色权限矩阵

| 角色 | 可用接口 |
|------|----------|
| admin | 所有管理接口、PUT /api/state、POST /api/reset |
| client | 客户资料、VIP 兑换、牵线请求、聊天 |
| matchmaker | 红娘工作台、标记联系、聊天 |
| 未认证 | GET /api/state、GET /api/health |

### 8.3 已实施的安全措施

1. **Token 认证**：所有写接口都需要认证
2. **角色权限**：不同角色只能访问对应的接口
3. **数据脱敏**：GET /api/state 不返回密码哈希和身份证号
4. **公网屏蔽**：/api/reset 公网返回 404（Nginx 层）
5. **时序安全**：使用 timingSafeEqual 防止时序攻击
6. **密码哈希**：使用 scrypt 算法
7. **请求体限制**：2MB 大小限制
8. **数据库隔离**：PostgreSQL 仅绑定 127.0.0.1
9. **API 隔离**：API 容器不直接暴露端口，仅通过 Nginx 反代

### 8.4 已知安全限制（待改进）

| 项目 | 现状 | 改进建议 |
|------|------|----------|
| 管理员账号 | `.env` 中的 `ADMIN_PASSWORD` | 改为独立 `admins` 表 |
| 演示登录 | 无密码用户可按 ID 一键登录 | 强制账号密码登录 |
| 限流 | 无 | 增加登录限流和写接口限流 |
| 审计日志 | 无 | 增加 `audit_logs` 表 |
| XSS 防护 | 未转义用户输入 | 增加 HTML 转义 |
| Token 存储 | localStorage | httpOnly Cookie |

---

## 9. 依赖关系

### 9.1 前端依赖

无第三方框架依赖，纯原生 HTML/CSS/JS。

根目录 [package.json](file:///Users/x/code/matchmaker/package.json) 仅有一个开发依赖：
```json
{
  "dependencies": {
    "puppeteer-core": "^25.2.1"
  }
}
```

### 9.2 后端依赖

[server/package.json](file:///Users/x/code/matchmaker/server/package.json)：
```json
{
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.13.1"
  }
}
```

| 依赖 | 版本 | 用途 |
|------|------|------|
| express | ^4.19.2 | Web 框架，RESTful API |
| pg | ^8.13.1 | PostgreSQL 客户端连接池 |

### 9.3 部署依赖

| 技术 | 版本 | 用途 |
|------|------|------|
| Docker | - | 容器化运行 |
| Docker Compose | - | 多容器编排 |
| Nginx | 1.27-alpine | 静态文件服务 + 反向代理 |
| PostgreSQL | 16-alpine | 关系型数据库 |
| Node.js | 22-alpine | API 服务运行时 |

### 9.4 文件依赖关系

```
HTML 入口页面
  ├─ 加载 styles.css（样式）
  └─ 加载 app.js（业务逻辑）
       ├─ 调用 /api/state（读取数据）
       ├─ 调用 /api/auth/*（认证）
       ├─ 调用 /api/client/*（客户操作）
       ├─ 调用 /api/matchmaker/*（红娘操作）
       ├─ 调用 /api/admin/*（管理员操作）
       └─ 调用 /api/chat/*（聊天）
            ↓
       Nginx 反向代理
            ↓
       server/index.js（Express API）
            ↓
       PostgreSQL 数据库
```

### 9.5 容器依赖关系

```
postgres (健康检查通过)
  ↓
api (depends_on: postgres)
  ↓
web / web-mini / web-matchmaker / web-admin (depends_on: api)
```

---

## 10. 项目运行方式

### 10.1 环境要求

- Docker + Docker Compose
- Node.js 22+（本地开发可选）

### 10.2 本地开发启动

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 修改 .env 中的密码和密钥
# POSTGRES_PASSWORD=你的数据库密码
# JWT_SECRET=你的随机长密钥

# 3. 渲染静态资源（生成 dist/ 目录）
node scripts/render-static.mjs

# 4. 启动所有服务
docker compose -f compose.yml -f compose.ssl.yml up -d --build
```

### 10.3 本地访问地址

| 角色 | HTTP 地址 | HTTPS 地址 |
|------|-----------|------------|
| 综合预览端 | http://localhost:8095 | https://localhost:21314 |
| 客户小程序端 | http://localhost:8096 | https://localhost:21314 |
| 红娘工作台 | http://localhost:8097 | https://localhost:21314 |
| 管理后台 | http://localhost:8098 | https://localhost:21314 |

### 10.4 语法检查

```bash
# 前端 JS 语法检查
node --check app.js

# 后端 JS 语法检查
node --check server/index.js

# Docker Compose 配置检查
POSTGRES_PASSWORD=dummy JWT_SECRET=dummy \
  docker compose -f compose.yml -f compose.ssl.yml config \
  > /tmp/matchmaker-compose-check.yml
```

### 10.5 查看服务状态

```bash
# 查看容器状态
docker compose -f compose.yml -f compose.ssl.yml ps

# 查看 API 日志
docker logs --tail=100 matchmaker-api

# 健康检查
curl http://localhost:8098/api/health
```

### 10.6 数据库备份与恢复

```bash
# 备份
docker exec matchmaker-postgres pg_dump \
  -U matchmaker -d matchmaker -Fc \
  -f /backup/backup-$(date +%F_%H%M%S).dump

# 恢复
docker exec matchmaker-postgres pg_restore \
  --clean --if-exists \
  -U matchmaker -d matchmaker /backup/文件名.dump

docker compose -f compose.yml -f compose.ssl.yml restart api
```

### 10.7 演示账号

内置 10 个演示用户、2 个红娘、2 个机构：

**客户（可按 ID 一键登录）**:
- u1 林安（男，上海，内容策划）
- u2 周晴（女，上海，品牌经理，VIP）
- u3 许知夏（女，杭州，制片人）
- u4 陈亦舟（男，杭州，摄影导演，VIP）
- ... 共 10 个

**红娘**:
- m1 李莉（HM-LILI，优联婚恋）
- m2 娜娜（HM-NANA，星河红娘社）

**管理员**: 密码 `admin`（可通过 `.env` 修改）

**兑换码**:
- `VIP666`（绑定红娘李莉）
- `MEDIA888`（绑定红娘娜娜）
- `LOVE999`（无绑定）
- `1`（无限次使用，测试用）

---

## 11. 部署指南

### 11.1 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 | uk.sbbz.tech |
| 部署目录 | `/opt/matchmaker` |
| SSH 密钥 | `~/.ssh/matchmaker_uk_ed25519` |
| 环境变量 | `/opt/matchmaker/.env` |
| 数据目录 | `/opt/matchmaker/data/postgres` |
| 备份目录 | `/opt/matchmaker/backup/postgres` |

### 11.2 一键部署（推荐）

在本地项目根目录执行：

```bash
# 带自定义 commit 信息
./deploy.sh "你的提交说明"

# 或直接运行（使用默认时间戳信息）
./deploy.sh
```

脚本自动执行：
1. 本地语法与配置检查
2. Git 提交与推送
3. 远程服务器部署
4. 健康状态检查

### 11.3 手动部署

```bash
# 1. 同步代码到服务器
rsync -az --delete \
  --exclude '.git' --exclude '.env' --exclude 'data' \
  -e 'ssh -i ~/.ssh/matchmaker_uk_ed25519' \
  ./ root@uk.sbbz.tech:/opt/matchmaker/

# 2. SSH 登录服务器
ssh -i ~/.ssh/matchmaker_uk_ed25519 root@uk.sbbz.tech
cd /opt/matchmaker

# 3. 启动/重建全部服务
docker compose -f compose.yml -f compose.ssl.yml up -d --build
```

### 11.4 部分重建

```bash
# 只重建 API
docker compose -f compose.yml -f compose.ssl.yml up -d --build api

# 只重启前端容器
docker compose -f compose.yml -f compose.ssl.yml up -d --force-recreate \
  web web-mini web-matchmaker web-admin \
  web-ssl web-mini-ssl web-matchmaker-ssl web-admin-ssl
```

### 11.5 发布后验证

```bash
# HTTP 健康检查
for port in 8095 8096 8097 8098; do
  printf "HTTP=%s " "$port"
  curl -fsS --max-time 12 http://uk.sbbz.tech:$port/api/health
  printf "\n"
done

# HTTPS 健康检查
for port in 21314; do
  printf "HTTPS=%s " "$port"
  curl -fsS --max-time 12 https://uk.sbbz.tech:$port/api/health
  printf "\n"
done

# 安全检查
curl -o /tmp/noauth.out -w '%{http_code}\n' \
  -X PUT http://uk.sbbz.tech:8098/api/state \
  -H 'Content-Type: application/json' -d '{}'
# 期望：401

curl -o /tmp/reset.out -w '%{http_code}\n' \
  -X POST http://uk.sbbz.tech:8098/api/reset
# 期望：404
```

---

## 12. 技术债务与开发路线

### 12.1 当前技术债

| 问题 | 影响 | 优先级 |
|------|------|--------|
| `PUT /api/state` 整包写入 | 数据不一致风险、性能差 | 高 |
| `syncNormalizedState()` 全表 truncate | 数据量大后锁表严重 | 高 |
| `GET /api/state` 返回全部数据 | 数据暴露、大包传输 | 高 |
| 自实现 HMAC Token（非标准 JWT） | 生态兼容性差 | 中 |
| 演示账号无密码可按 ID 登录 | 安全风险 | 高（上线前必须解决） |
| 管理员由 `.env` 控制，无 admins 表 | 多管理员管理困难 | 中 |
| 无登录限流和写接口限流 | 暴力破解风险 | 中 |
| 无审计日志 | 无法追溯操作 | 中 |
| 前端无 XSS 防护 | 注入攻击风险 | 高 |

### 12.2 后续开发路线（建议顺序）

1. **拆角色 API**，减少对 `/api/state` 的依赖
2. **客户接口**：`/api/client/me`、`/api/client/profiles`、`/api/client/vip/redeem` 等
3. **红娘接口**：`/api/matchmaker/workbench`、`/api/matchmaker/requests` 等
4. **后台接口**：`/api/admin/metrics`、`/api/admin/customers` 等
5. 删除 `syncNormalizedState()` 的 truncate 全表重写，改为单表 upsert
6. 增加 `audit_logs` 操作日志
7. 增加登录限流和写接口限流
8. 管理员改为独立 `admins` 表
9. 支付接入微信支付
10. 通知接入微信订阅消息、短信或企业微信

---

## 附录：相关文档

项目 `说明/` 目录下包含 15 份详细文档：

1. [01-项目概述.md](file:///Users/x/code/matchmaker/说明/01-项目概述.md)
2. [02-技术架构.md](file:///Users/x/code/matchmaker/说明/02-技术架构.md)
3. [03-文件结构.md](file:///Users/x/code/matchmaker/说明/03-文件结构.md)
4. [04-数据库设计.md](file:///Users/x/code/matchmaker/说明/04-数据库设计.md)
5. [05-API接口文档.md](file:///Users/x/code/matchmaker/说明/05-API接口文档.md)
6. [06-前端说明.md](file:///Users/x/code/matchmaker/说明/06-前端说明.md)
7. [07-部署指南.md](file:///Users/x/code/matchmaker/说明/07-部署指南.md)
8. [08-安全机制.md](file:///Users/x/code/matchmaker/说明/08-安全机制.md)
9. [09-技术债务与开发路线.md](file:///Users/x/code/matchmaker/说明/09-技术债务与开发路线.md)
10. [10-操作手册.md](file:///Users/x/code/matchmaker/说明/10-操作手册.md)
11. [11-前端界面交互说明.md](file:///Users/x/code/matchmaker/说明/11-前端界面交互说明.md)
12. [12-红娘端界面交互说明.md](file:///Users/x/code/matchmaker/说明/12-红娘端界面交互说明.md)
13. [13-管理后台界面交互说明.md](file:///Users/x/code/matchmaker/说明/13-管理后台界面交互说明.md)
14. [14-综合预览端界面交互说明.md](file:///Users/x/code/matchmaker/说明/14-综合预览端界面交互说明.md)
15. [15-模态弹窗与全局交互说明.md](file:///Users/x/code/matchmaker/说明/15-模态弹窗与全局交互说明.md)

---

> 本文档自动生成于 2026-06-25，基于项目代码库分析整理。
