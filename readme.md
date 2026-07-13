# MatchMaker：客户小程序 + 红娘工作台 + 管理后台

这是一个婚恋牵线业务原型，包含真实 uniapp H5 客户端、红娘工作台、管理后台、Node/Express API、PostgreSQL 数据库和 Docker/Nginx 部署配置。

当前项目是开发测试版。数据为演示数据，可以重构和清理旧数据，但每次修改后必须验证客户、红娘、后台三端主流程。用户已明确要求：本地只开发代码，不用本地网站测试；功能验证访问实际线上网站。

## 当前线上入口

统一使用 HTTPS 单端口：

```text
统一入口：https://uk.sbbz.tech:21314/
客户 H5：https://uk.sbbz.tech:21314/
红娘端：https://uk.sbbz.tech:21314/#/pages/matchmaker/login/index
管理后台：https://uk.sbbz.tech:21314/#/pages/admin/login/index
```

服务器仅对外暴露 `21314`，由单个 Nginx 网关复用 `/root/.acme.sh/sbbz.tech_ecc/` 下的现有证书。根目录挂载 uniapp H5 构建产物，客户、红娘和管理后台通过 uniapp 页面路由共用入口。

## 当前业务状态

- 客户端：注册/登录、资料维护、多红娘服务订阅（3天体验卡/周卡/月卡/季卡）、浏览异性、申请牵线、与红娘聊天、红娘批准后与对方会员互聊。
- 红娘端：登录/注册、查看牵线请求、联系男方、联系女方、开通/关闭双方会员沟通、与会员一对一聊天、审核会员资料。
- 管理后台：登录、概览、分成比例、机构管理、红娘管理、客户信息、兑换码、模拟成交。
- 服务激励：红娘可记录跟进、有效匹配和用户确认的稳定发展；用户评分、续费和结果奖励影响后续曝光与接单机会。
- 前端静态页：`index.html`、`matchmaker.html`、`admin.html`，由 `scripts/render-static.mjs` 生成带 Git 版本号的 `dist/*.html`；客户真实端由 `uniapp/` 构建 H5。
- uniapp：`uniapp/` 目录包含 Vue3 + Vite + uniapp 版本，可构建 H5 和微信小程序。
- 后端：`server/index.js`，Express + PostgreSQL。
- 数据库：PostgreSQL 16 Docker 容器，服务器数据目录 `/opt/matchmaker/data/postgres`。

## 常用账号

种子会员默认密码：

```text
123456
```

常用会员：

```text
林安：男，上海，通常 ID 为 u1
孟晚棠：女，广州，通常 ID 为 u10
```

常用红娘：

```text
李莉：HM-LILI，通常 ID 为 m1
娜娜：HM-NANA，通常 ID 为 m2
```

后台默认密码：

```text
admin
```

## 关键文件

```text
index.html                      综合预览端模板
matchmaker.html                 红娘工作台端模板
admin.html                      管理后台端模板
app.js                          静态前端业务逻辑
styles.css                      静态前端样式
server/index.js                 Express API
scripts/render-static.mjs       静态 HTML 自动版本号生成脚本
deploy/auto-deploy.sh           服务器自动拉 Git 并部署
deploy/remote-deploy.sh         远程部署辅助脚本
compose.yml                     单端口 HTTPS 网关 + API + PostgreSQL
compose.ssl.yml                 兼容旧命令的空 SSL 覆盖文件
deploy/nginx-ssl.conf           单端口 HTTPS Nginx 配置
uniapp/src/                     uniapp 源码
说明/10-操作手册.md             当前最完整操作手册
说明/16-业务逻辑审计与防错清单.md 权威业务逻辑与聊天防错规则
```

如旧说明文档与 `说明/16-业务逻辑审计与防错清单.md` 冲突，以 `说明/16-业务逻辑审计与防错清单.md` 为准。

## 本地开发流程

进入项目：

```bash
cd /Users/x/code/matchmaker
```

修改代码后做本地检查，不启动本地网站作为最终验证：

```bash
git status --short
node --check app.js
node --check server/index.js
bash -n deploy/auto-deploy.sh
git diff --check
```

如果改了 uniapp：

```bash
cd /Users/x/code/matchmaker/uniapp
npm run build:h5
npm run build:mp-weixin
```

线上全业务回归审计：

```bash
cd /Users/x/code/matchmaker
node scripts/full-business-audit.mjs
```

该脚本直接访问线上 HTTPS API，会创建测试机构、红娘、会员、牵线单和聊天消息。

如果只需要生成静态 HTML 版本号：

```bash
cd /Users/x/code/matchmaker
npm run render:static
```

`dist/` 是生成物，不提交 Git。服务器部署时会重新生成。

## 提交和部署

提交：

```bash
git add 需要提交的文件
git commit -m "中文提交说明"
git push origin master
```

服务器部署：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'cd /opt/matchmaker && bash deploy/auto-deploy.sh'
```

`deploy/auto-deploy.sh` 当前流程：

```text
1. git pull origin master
2. 运行 scripts/render-static.mjs，生成 dist/*.html
3. 如 uniapp/ 有变化，或服务器现有 H5 产物不是当前提交构建的，自动构建/补构建 H5
4. 如 server/ 有变化，重建 API 容器
5. 重启前端 Nginx 容器
```

uniapp H5 构建成功后，服务器会在 `uniapp/dist/build/h5/.build-commit` 写入当前提交号。即使上一次部署中途失败，只要这个标记与当前 Git 提交不一致，下一次部署也会自动补构建，不会再出现“代码已更新但会员端还是旧 H5 包”的情况。

确认服务器版本：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'cd /opt/matchmaker && git rev-parse --short HEAD && grep -R "app.js?v=" -n dist | head'
```

正常情况下，`app.js?v=` 后面应是当前 Git 短提交号。

## 缓存和版本号

HTML 模板中使用：

```html
<script src="/app.js?v=__ASSET_VERSION__"></script>
```

部署时 `scripts/render-static.mjs` 会替换为当前 Git 短提交号，例如：

```html
<script src="/app.js?v=<Git短提交号>"></script>
```

如果线上页面仍加载旧脚本：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'cd /opt/matchmaker && bash deploy/auto-deploy.sh && grep -R "app.js?v=" -n dist | head'
```

如果刚更新过 `auto-deploy.sh` 自身，第一次执行可能仍按旧脚本跑，第二次执行才会使用新脚本内容。

## 线上验收主流程

### 客户端

1. 打开 `https://uk.sbbz.tech:21314/`。
2. 登录林安。
3. 进入“筛选”，选择孟晚棠。
4. 选择红娘李莉。
5. 点击“申请牵线”。
6. 进入“消息”，确认出现牵线请求。
7. 点击“联系红娘”，发送一条消息。

### 红娘端

1. 打开 `https://uk.sbbz.tech:21314/#/pages/matchmaker/login/index`。
2. 登录李莉。
3. 找到林安申请认识孟晚棠的请求。
4. 点击“联系男方”。
5. 点击“联系女方”。
6. 点击“开通双方沟通”。
7. 在“和会员聊天”区域打开林安线程。
8. 确认看到会员消息并回复。

### 会员互聊

1. 回到客户小程序林安账号。
2. 进入“消息”。
3. 确认出现“与对方互聊”。
4. 点击并发送消息。
5. 切换到孟晚棠账号，确认能看到林安发来的会员互聊消息。

### 后台端

1. 打开 `https://uk.sbbz.tech:21314/#/pages/admin/login/index`。
2. 输入 `admin` 登录。
3. 检查概览、分成比例、机构管理、红娘管理、客户信息、兑换码。

## 健康检查

浏览器检查前可先确认 API：

```bash
curl -sk https://uk.sbbz.tech:21314/api/health
```

服务器本机检查：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'curl -sk https://127.0.0.1:21314/api/health'
```

正常：

```json
{"ok":true}
```

## 常见排错

查看容器：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'cd /opt/matchmaker && docker compose -f compose.yml -f compose.ssl.yml ps'
```

查看 API 日志：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'docker logs --tail=100 matchmaker-api'
```

重建 API：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'cd /opt/matchmaker && docker compose -f compose.yml -f compose.ssl.yml up -d --build api'
```

重启前端容器：

```bash
ssh -o StrictHostKeyChecking=no root@uk.sbbz.tech \
  'cd /opt/matchmaker && docker compose -f compose.yml -f compose.ssl.yml up -d --build --force-recreate --remove-orphans gateway'
```

如果 Nginx 仍 502，常见原因是 API 容器重建后 Nginx 解析到旧容器 IP，重启前端 Nginx 容器即可刷新。

## 详细文档

当前最完整操作文档：

```text
说明/10-操作手册.md
```

其它说明文件按主题拆分：项目概述、技术架构、文件结构、数据库、API、前端、部署、安全、技术债务、界面交互、模态弹窗等。
# 开发质量门禁

提交涉及消息、实时通信或聊天页面时，必须先执行：

```bash
npm test
cd uniapp && npm ci && npm run build:h5
```

`npm test` 会验证服务端历史消息和两套聊天页面都以线程 `seq` 作为首要顺序，并检查 JavaScript 语法。GitHub Actions 会在每次 push 和 Pull Request 自动执行这些检查；检查失败时不得合并或部署。
