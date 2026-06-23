# 缘定传媒人：单身交友小程序 + 管理后台原型

这是一个零依赖的本地开发版原型，用于验证单身交友业务主流程。直接用浏览器打开 `index.html` 即可运行。

## 已实现功能

- 客户端：内置 10 个示例用户，支持上传和保存个人资料、筛选异性资料、查看资料卡片。
- 账户：客户可在小程序“我的”页注册并登录；红娘可在红娘工作台注册并登录。
- 注册校验：客户手机号/邮箱去重，红娘手机号/邮箱/推荐码去重，密码会保存为摘要字段。
- 会员：输入红娘推荐码模拟扫码支付，开通 VIP 后可查看对方择偶要求。
- 牵线：VIP 客户点击“申请牵线”后生成红娘应用通知。
- 红娘工作台：查看牵线通知，查看双方隐藏微信，标记已联系。
- 管理后台：查看客户、VIP、成交、金额统计。
- 管理后台：添加机构、添加机构下红娘、维护红娘推荐码。
- 管理后台：设置介绍推广费、红娘牵线费、平台服务费分成比例。
- 图表：用轻量柱状图分段显示客户、牵线、成交、金额。

## 演示账号与推荐码

- 默认客户：林安
- 默认红娘：李莉，推荐码 `HM-LILI`
- 默认红娘：娜娜，推荐码 `HM-NANA`

## 运行方式

```bash
open /Users/x/code/mediapeople/index.html
```

数据保存在浏览器 `localStorage` 中，可在页面左下角点击“重置演示数据”恢复初始状态。

## 服务器部署

当前测试部署地址：

```text
http://uk.sbbz.tech:8095/
```

角色端口：

```text
http://uk.sbbz.tech:8096/  小程序客户入口
http://uk.sbbz.tech:8097/  红娘工作台入口
http://uk.sbbz.tech:8098/  管理后台入口
```

以上入口共用同一个 API 和 PostgreSQL 数据库，但前端入口已经完全拆开：

```text
mini.html        只包含客户小程序端
matchmaker.html  只包含红娘工作台
admin.html       只包含管理后台
index.html       综合预览端
```

服务器部署目录：

```text
/opt/mediapeople
```

使用 Docker Compose 启动 Nginx 静态站点：

```bash
docker compose up -d web
```

PostgreSQL 使用 Docker Compose 部署，数据目录为：

```text
/opt/mediapeople/data/postgres
```

数据库只绑定服务器本机地址 `127.0.0.1:5432`，不直接暴露公网。服务器上的真实数据库密码保存在 `/opt/mediapeople/.env`，仓库只保留 `.env.example`。

当前后端 API 仍保留 `/api/state` 兼容前端，同时会把完整业务状态保存到 PostgreSQL 的 `app_state.data` JSONB 字段，并同步拆入正式业务表。前端启动时优先读取 `/api/state`，修改资料、VIP、牵线、机构、红娘和分成时会同步写回数据库；如果 API 暂时不可用，会降级保存到浏览器 `localStorage`。

已创建的业务表：

```text
agencies         机构
matchmakers     红娘账号
users           客户账号
match_requests  牵线请求
deals           成交/订单演示记录
promo_codes     会员兑换码
app_settings    当前登录态、分成比例等运行设置
app_state       兼容现有前端的完整 JSON 状态
```

常用维护命令：

```bash
cd /opt/mediapeople
docker compose up -d postgres
docker compose up -d api web
docker exec mediapeople-postgres pg_isready -U mediapeople -d mediapeople
docker exec mediapeople-postgres psql -U mediapeople -d mediapeople -c "select updated_at from app_state where id = 1;"
docker exec mediapeople-postgres pg_dump -U mediapeople mediapeople > backup/postgres/mediapeople-$(date +%F).sql
```

## 后续开发建议

- 小程序端可迁移到微信小程序原生或 uni-app，把 `users`、`requests`、`deals` 等本地数据替换为接口。
- 后台可迁移到 Vue/React + 服务端 API，保留当前的信息架构。
- 后端建议拆分为客户、红娘、机构、订单、分成流水、通知六个核心模块。
- 支付应接入微信支付，会员开通成功后由支付回调写入订单和分成流水。
- 红娘通知可接入微信订阅消息、短信或企业微信。
