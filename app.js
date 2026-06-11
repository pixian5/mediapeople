const STORAGE_KEY = "mediapeople-dating-demo-v1";
const VIP_PRICE = 399;
const API_BASE = "/api";

const seedState = {
  currentUserId: "u1",
  selectedMatchmakerId: null,
  adminLoggedIn: false,
  splits: {
    promo: 20,
    matchmaker: 35,
    platform: 45,
  },
  agencies: [
    { id: "a1", name: "优联婚恋传媒", city: "上海" },
    { id: "a2", name: "星河红娘社", city: "杭州" },
  ],
  matchmakers: [
    { id: "m1", agencyId: "a1", name: "李莉", code: "HM-LILI" },
    { id: "m2", agencyId: "a2", name: "娜娜", code: "HM-NANA" },
  ],
  users: [
    {
      id: "u1",
      name: "林安",
      gender: "男",
      age: 31,
      city: "上海",
      job: "内容策划",
      wechat: "linan_media",
      vip: false,
      referralMatchmakerId: null,
      bio: "喜欢纪录片、城市漫步和认真做饭，工作稳定，想找一个能一起成长的人。",
      requirements: "希望对方真诚、有稳定生活节奏，愿意沟通，也喜欢旅行或阅读。",
      photo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u2",
      name: "周晴",
      gender: "女",
      age: 29,
      city: "上海",
      job: "品牌经理",
      wechat: "qing_brand",
      vip: true,
      referralMatchmakerId: "m1",
      bio: "性格温和但有主见，喜欢展览、咖啡和羽毛球，期待长期关系。",
      requirements: "希望男生有责任心，情绪稳定，工作积极，年龄 28-35 岁。",
      photo:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u3",
      name: "许知夏",
      gender: "女",
      age: 33,
      city: "杭州",
      job: "制片人",
      wechat: "xuzhixia_film",
      vip: false,
      referralMatchmakerId: null,
      bio: "常年做项目管理，喜欢高效也珍惜松弛，周末会去爬山。",
      requirements: "希望对方成熟坦诚，尊重彼此事业，有结婚计划。",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u4",
      name: "陈亦舟",
      gender: "男",
      age: 35,
      city: "杭州",
      job: "摄影导演",
      wechat: "yizhou_photo",
      vip: true,
      referralMatchmakerId: "m2",
      bio: "工作在影像行业，生活里比较安静，喜欢骑行、做咖啡和看老电影。",
      requirements: "希望女生独立、善良，能接受偶尔出差，愿意认真经营关系。",
      photo:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u5",
      name: "宋予白",
      gender: "男",
      age: 28,
      city: "南京",
      job: "新媒体运营",
      wechat: "yubai_story",
      vip: false,
      referralMatchmakerId: null,
      bio: "做内容增长，平时喜欢打网球、听播客，也会认真记录生活里的小事。",
      requirements: "希望对方乐观坦率，愿意一起尝试新鲜事物，工作和生活都有边界感。",
      photo:
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u6",
      name: "沈嘉仪",
      gender: "女",
      age: 27,
      city: "苏州",
      job: "视觉设计师",
      wechat: "jiayi_design",
      vip: true,
      referralMatchmakerId: "m1",
      bio: "喜欢美术馆、手作和城市短途旅行，性格慢热但很重视承诺。",
      requirements: "希望男生真诚稳定，尊重审美和个人空间，年龄 27-34 岁。",
      photo:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u7",
      name: "顾南星",
      gender: "男",
      age: 39,
      city: "上海",
      job: "广告导演",
      wechat: "nanxing_ad",
      vip: true,
      referralMatchmakerId: "m2",
      bio: "项目型工作者，节奏有时很紧，但会给重要关系留出确定时间。",
      requirements: "希望对方成熟独立，能坦诚沟通，对家庭和事业都有清晰规划。",
      photo:
        "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u8",
      name: "唐一诺",
      gender: "女",
      age: 36,
      city: "成都",
      job: "纪录片编导",
      wechat: "yinuo_doc",
      vip: false,
      referralMatchmakerId: null,
      bio: "常在外地拍摄，喜欢真实的人和有温度的关系，休息时会做瑜伽。",
      requirements: "希望对方心态开放，能理解传媒行业节奏，愿意长期认真相处。",
      photo:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u9",
      name: "陆景然",
      gender: "男",
      age: 32,
      city: "深圳",
      job: "产品经理",
      wechat: "jingran_pm",
      vip: false,
      referralMatchmakerId: null,
      bio: "互联网产品经理，喜欢潜水、桌游和做计划，正在学习更松弛地生活。",
      requirements: "希望女生有稳定价值观，愿意沟通，彼此支持而不是消耗。",
      photo:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=60",
    },
    {
      id: "u10",
      name: "孟晚棠",
      gender: "女",
      age: 31,
      city: "广州",
      job: "公关顾问",
      wechat: "wantang_pr",
      vip: true,
      referralMatchmakerId: "m1",
      bio: "沟通型人格，喜欢剧场、粤菜和海边散步，期待轻松但认真地相处。",
      requirements: "希望对方情绪稳定，有幽默感，能一起面对现实问题。",
      photo:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=60",
    },
  ],
  requests: [],
  deals: [{ id: "d1", requestId: null, amount: 399, createdAt: "2026-06-10" }],
};

let state = structuredClone(seedState);
let apiAvailable = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(seedState);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (apiAvailable) {
    syncRemoteState();
  }
}

async function loadRemoteState() {
  const response = await fetch(`${API_BASE}/state`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load remote state: ${response.status}`);
  }
  apiAvailable = true;
  return response.json();
}

async function syncRemoteState({ keepalive = false, notify = true } = {}) {
  try {
    const response = await fetch(`${API_BASE}/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
      keepalive,
    });
    if (!response.ok) {
      throw new Error(`Failed to sync remote state: ${response.status}`);
    }
  } catch (error) {
    apiAvailable = false;
    console.warn(error);
    if (notify) {
      showToast("数据库同步失败，已临时保存到本机浏览器");
    }
  }
}

async function resetState() {
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_BASE}/reset`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Failed to reset remote state: ${response.status}`);
      }
      state = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast("演示数据已重置");
      return;
    } catch (error) {
      apiAvailable = false;
      console.warn(error);
    }
  }
  state = structuredClone(seedState);
  saveState();
  renderAll();
  showToast("演示数据已重置");
}

async function initApp() {
  try {
    state = await loadRemoteState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    logEvent("sys", "系统启动成功：已成功连接到远程数据库，同步全局状态");
  } catch (error) {
    apiAvailable = false;
    console.warn(error);
    state = loadState();
    showToast("暂未连接数据库，使用本机演示数据");
    logEvent("sys", "数据库连接失败，已自动启用浏览器 LocalStorage 本机演示数据");
  }
  renderAll();
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId);
}

function getMatchmaker(id) {
  return state.matchmakers.find((matchmaker) => matchmaker.id === id);
}

function getAgency(id) {
  return state.agencies.find((agency) => agency.id === id);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function logEvent(module, message) {
  const container = $("#consoleLogs");
  if (!container) return;

  const timeStr = new Date().toTimeString().slice(0, 8);
  const row = document.createElement("div");
  row.className = `log-row ${module}`;
  
  const tags = {
    sys: "系统",
    user: "客户",
    match: "红娘",
    deal: "分成"
  };
  const tagStr = tags[module] || "通知";

  row.innerHTML = `
    <span class="log-time">[${timeStr}]</span>
    <span class="log-tag">[${tagStr}]</span>
    <span class="log-msg">${message}</span>
  `;

  container.appendChild(row);
  container.scrollTop = container.scrollHeight;

  while (container.children.length > 80) {
    container.removeChild(container.firstChild);
  }
}

function showPushNotification(title, fields, type = "info") {
  const container = $("#pushNotificationsList");
  if (!container) return;

  const emptyTip = container.querySelector(".push-empty");
  if (emptyTip) {
    emptyTip.remove();
  }

  const timeStr = new Date().toTimeString().slice(0, 5);
  const card = document.createElement("article");
  card.className = "wechat-push-card";

  const rowsHtml = Object.entries(fields)
    .map(
      ([label, val]) => `
      <div class="wechat-row">
        <span class="wechat-label">${label}</span>
        <strong class="wechat-value">${val}</strong>
      </div>
    `
    )
    .join("");

  card.innerHTML = `
    <div class="wechat-header">
      <div class="wechat-brand">
        <div class="wechat-icon">微</div>
        <span>缘定传媒人微信公众号</span>
      </div>
      <span class="wechat-time">${timeStr}</span>
    </div>
    <div class="wechat-content">
      <div class="wechat-title" style="color:#07c160;">${title}</div>
      ${rowsHtml}
    </div>
    <div class="wechat-footer">
      <span>进入小程序查看详情</span>
      <span>&gt;</span>
    </div>
  `;

  container.insertBefore(card, container.firstChild);

  const cards = container.querySelectorAll(".wechat-push-card");
  if (cards.length > 5) {
    cards[cards.length - 1].remove();
  }
}

function switchView(view) {
  $$(".nav-item").forEach((item) =>
    item.classList.toggle("active", item.dataset.view === view),
  );
  $$(".view").forEach((panel) => panel.classList.remove("active"));
  $(`#${view}View`).classList.add("active");

  const user = currentUser();
  const names = {
    mini: user ? `客户：${user.name}` : "客户：未登录",
    matchmaker: `红娘：${getMatchmaker(state.selectedMatchmakerId)?.name || "未选择"}`,
    admin: "管理员：平台运营",
  };
  $("#currentPersona").textContent = names[view];
}

function switchMiniTab(tab) {
  $$("[data-mini-tab]").forEach((item) =>
    item.classList.toggle("active", item.dataset.miniTab === tab),
  );
  $$(".mini-tab").forEach((panel) => panel.classList.remove("active"));
  $(`#${tab}Tab`).classList.add("active");
}

function renderFilters() {
  const cities = ["全部", ...new Set(state.users.map((user) => user.city))];
  $("#cityFilter").innerHTML = cities
    .map((city) => `<option value="${city}">${city}</option>`)
    .join("");
}

function renderMiniApp() {
  const user = currentUser();
  
  // VIP Badge
  $("#vipState").textContent = user ? (user.vip ? "VIP 会员" : "普通用户") : "游客访客";
  $("#vipState").style.background = user ? (user.vip ? "#d9f7e8" : "#fff1c7") : "#eef2f5";
  $("#vipState").style.color = user ? (user.vip ? "#166534" : "#7a4a08") : "#6d7785";
  
  // Tab lock control (置灰其它页面 Tab，强行锁定“我的”)
  const tabs = $$("[data-mini-tab]");
  if (!user) {
    tabs.forEach((tab) => {
      const isMine = tab.dataset.miniTab === "mine";
      tab.classList.toggle("disabled", !isMine);
      tab.setAttribute("aria-disabled", !isMine ? "true" : "false");
    });
    
    // 如果当前活动的不是“我的”，强行切到“我的”
    const currentTab = $(".tabs.compact-tabs button.active")?.dataset.miniTab;
    if (currentTab !== "mine") {
      switchMiniTab("mine");
    }
  } else {
    tabs.forEach((tab) => {
      tab.classList.remove("disabled");
      tab.removeAttribute("aria-disabled");
    });
    renderProfileForm();
  }

  renderMineTabContent();
  renderProfiles();
  renderRequests();
}

function renderProfileForm() {
  const form = $("#profileForm");
  const user = currentUser();
  if (user) {
    Object.entries(user).forEach(([key, value]) => {
      if (form.elements[key]) {
        form.elements[key].value = value;
      }
    });
  }
}

function renderMineTabContent() {
  const user = currentUser();
  if (!user) {
    $("#miniMineUnregistered").style.display = "block";
    $("#miniMineRegistered").style.display = "none";
    
    // Render dropdown list for login inside the mine tab
    $("#miniSwitchUserSelect").innerHTML = state.users
      .map(
        (u) =>
          `<option value="${u.id}">${u.name} (${u.gender} · ${u.age}岁 · ${u.city})</option>`,
      )
      .join("");
  } else {
    $("#miniMineUnregistered").style.display = "none";
    $("#miniMineRegistered").style.display = "block";
    
    $("#miniMineAvatarBg").style.backgroundImage = `url('${user.photo}')`;
    $("#miniMineName").textContent = user.name;
    $("#miniMineDetails").textContent = `${user.gender} · ${user.age} 岁 · ${user.city}`;
    
    const badge = $("#miniMineVip");
    badge.textContent = user.vip ? "VIP 会员" : "普通用户";
    badge.style.background = user.vip ? "#d9f7e8" : "#fff1c7";
    badge.style.color = user.vip ? "#166534" : "#7a4a08";
  }
}

function matchesAge(age, range) {
  if (range === "all") return true;
  const [min, max] = range.split("-").map(Number);
  return age >= min && age <= max;
}

function renderProfiles() {
  const user = currentUser();
  if (!user) {
    $("#discoverLock").style.display = "flex";
    $("#discoverContent").style.display = "none";
    return;
  }
  $("#discoverLock").style.display = "none";
  $("#discoverContent").style.display = "block";

  const gender = $("#genderFilter").value;
  const city = $("#cityFilter").value || "全部";
  const ageRange = $("#ageFilter").value;
  const profiles = state.users.filter(
    (item) =>
      item.id !== user.id &&
      item.gender === gender &&
      (city === "全部" || item.city === city) &&
      matchesAge(item.age, ageRange),
  );

  $("#profileList").innerHTML =
    profiles
      .map((profile) => {
        const requirement = user.vip
          ? profile.requirements
          : "开通会员后可查看对方的择偶要求";
        const lockedClass = user.vip ? "" : " locked";
        return `
          <article class="profile-card">
            <div class="profile-photo" style="background-image:url('${profile.photo}')"></div>
            <div class="profile-body">
              <div class="profile-head">
                <strong>${profile.name}</strong>
                <span class="profile-meta">${profile.age} 岁 · ${profile.city}</span>
              </div>
              <div class="profile-meta">${profile.gender} · ${profile.job}</div>
              <p>${profile.bio}</p>
              <div class="requirement-box${lockedClass}">${requirement}</div>
              <button class="primary-button" data-connect="${profile.id}" type="button">申请牵线</button>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="request-card muted">暂无符合筛选条件的资料。</div>`;
}

function createRequest(targetUserId) {
  const user = currentUser();
  const target = state.users.find((item) => item.id === targetUserId);
  if (!user.vip) {
    showToast("请先扫码开通会员，再提交牵线请求");
    switchMiniTab("vip");
    return;
  }

  const exists = state.requests.some(
    (request) =>
      request.fromUserId === user.id &&
      request.toUserId === targetUserId &&
      request.status !== "已完成",
  );
  if (exists) {
    showToast("这条牵线请求已经在处理中");
    return;
  }

  const matchmakerId =
    user.referralMatchmakerId || target.referralMatchmakerId || state.matchmakers[0]?.id;
  state.requests.unshift({
    id: uid("r"),
    fromUserId: user.id,
    toUserId: targetUserId,
    matchmakerId,
    status: "待红娘联系",
    createdAt: new Date().toISOString(),
  });
  saveState();
  renderAll();
  showToast(`已通知红娘为你和${target.name}牵线`);

  const matchmaker = getMatchmaker(matchmakerId);
  logEvent("user", `客户 '${user.name}' 申请认识嘉宾 '${target.name}'，已指派红娘 '${matchmaker?.name || "未知"}'`);
  showPushNotification("【新牵线意向提醒】", {
    "专属红娘": matchmaker?.name || "未分配",
    "发起申请": `${user.name} (${user.gender}·${user.age}岁·${user.city})`,
    "牵线嘉宾": `${target.name} (${target.gender}·${target.age}岁·${target.city})`,
    "微信状态": "等待红娘线下双向确认，即可互相公开微信"
  });
}

function renderRequests() {
  const user = currentUser();
  if (!user) {
    $("#requestsLock").style.display = "flex";
    $("#requestsContent").style.display = "none";
    return;
  }
  $("#requestsLock").style.display = "none";
  $("#requestsContent").style.display = "block";

  const requests = state.requests.filter(
    (request) => request.fromUserId === user.id || request.toUserId === user.id,
  );
  $("#requestCount").textContent = `${requests.length} 条`;
  $("#myRequests").innerHTML =
    requests
      .map((request) => {
        const from = state.users.find((item) => item.id === request.fromUserId);
        const to = state.users.find((item) => item.id === request.toUserId);
        const matchmaker = getMatchmaker(request.matchmakerId);
        return `
          <article class="request-card">
            <span class="status-pill">${request.status}</span>
            <strong>${from.name} 与 ${to.name}</strong>
            <div class="muted">负责红娘：${matchmaker?.name || "待分配"}</div>
          </article>
        `;
      })
      .join("") || `<div class="request-card muted">还没有牵线请求。</div>`;
}

function becomeVip() {
  const code = $("#referralCodeInput").value.trim();
  const matchmaker = state.matchmakers.find(
    (item) => item.code.toUpperCase() === code.toUpperCase(),
  );
  if (!matchmaker) {
    showToast("推荐码无效，请输入后台已登记的红娘推荐码");
    return;
  }

  const user = currentUser();
  user.vip = true;
  user.referralMatchmakerId = matchmaker.id;
  state.deals.unshift({
    id: uid("d"),
    requestId: null,
    amount: VIP_PRICE,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  saveState();
  renderAll();
  showToast(`已开通 VIP，推广红娘为${matchmaker.name}`);

  const promoComm = (VIP_PRICE * (state.splits.promo / 100)).toFixed(2);
  const matchComm = (VIP_PRICE * (state.splits.matchmaker / 100)).toFixed(2);
  const platformComm = (VIP_PRICE * (state.splits.platform / 100)).toFixed(2);

  logEvent("deal", `客户 '${user.name}' 开通 VIP 成功 (金额: ¥${VIP_PRICE})，绑定推荐红娘: '${matchmaker.name}'`);
  logEvent("deal", `[佣金结算] 介绍推广分成: ¥${promoComm} (${state.splits.promo}%)，红娘牵线分成: ¥${matchComm} (${state.splits.matchmaker}%)，平台收益: ¥${platformComm} (${state.splits.platform}%)`);

  showPushNotification("【VIP会员开通通知】", {
    "开通客户": user.name,
    "微信账号": user.wechat,
    "专属红娘": matchmaker.name,
    "红娘代码": matchmaker.code
  });

  showPushNotification("【红娘推广佣金喜报】", {
    "收益红娘": matchmaker.name,
    "开通客户": user.name,
    "获得分成": `¥${promoComm} (${state.splits.promo}%)`,
    "账单状态": "已结算至红娘钱包"
  });
}

function renderMatchmakerDesk() {
  const mmId = state.selectedMatchmakerId;
  if (!mmId) {
    $("#matchmakerAuthContainer").style.display = "block";
    $("#matchmakerWorkbench").style.display = "none";

    // 渲染已有红娘登录列表
    $("#mmLoginSelect").innerHTML = state.matchmakers
      .map((m) => {
        const agency = getAgency(m.agencyId);
        return `<option value="${m.id}">${m.name} [${m.code}] (${agency?.name || "未知机构"})</option>`;
      })
      .join("");

    // 渲染红娘注册机构列表
    $("#mmRegisterAgencySelect").innerHTML = state.agencies
      .map((agency) => `<option value="${agency.id}">${agency.name}</option>`)
      .join("");
    return;
  }

  $("#matchmakerAuthContainer").style.display = "none";
  $("#matchmakerWorkbench").style.display = "block";

  const mm = getMatchmaker(mmId);
  $("#matchmakerWelcomeTitle").textContent = `红娘工作台 - 当前红娘：${mm?.name || "未登录"}`;

  const requests = state.requests.filter(
    (request) => request.matchmakerId === mmId,
  );
  $("#notificationCount").textContent = `${requests.filter((item) => item.status === "待红娘联系").length} 条待处理`;
  $("#notificationList").innerHTML =
    requests
      .map((request) => {
        const from = state.users.find((item) => item.id === request.fromUserId);
        const to = state.users.find((item) => item.id === request.toUserId);
        return `
          <article class="request-card">
            <span class="status-pill">${request.status}</span>
            <strong>${from.name} 申请认识 ${to.name}</strong>
            <div class="muted">${new Date(request.createdAt).toLocaleString("zh-CN")}</div>
            <button class="secondary-button" data-accept="${request.id}" type="button">标记已联系双方</button>
          </article>
        `;
      })
      .join("") || `<div class="request-card muted">暂无应用通知。</div>`;

  $("#contactPanel").innerHTML =
    requests
      .map((request) => {
        const from = state.users.find((item) => item.id === request.fromUserId);
        const to = state.users.find((item) => item.id === request.toUserId);
        return `
          <article class="contact-card">
            <strong>${from.name} 与 ${to.name}</strong>
            <p class="muted">${from.name} 微信：${from.wechat}</p>
            <p class="muted">${to.name} 微信：${to.wechat}</p>
          </article>
        `;
      })
      .join("") || `<div class="contact-card muted">接到牵线请求后会显示双方微信。</div>`;
}

function completeRequest(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  request.status = "已联系双方";
  saveState();
  renderAll();
  showToast("已标记红娘联系进度");

  const from = state.users.find((item) => item.id === request.fromUserId);
  const to = state.users.find((item) => item.id === request.toUserId);
  const matchmaker = getMatchmaker(request.matchmakerId);

  logEvent("match", `红娘 '${matchmaker?.name}' 已联络双方并协助牵线：[${from.name}] 📱 [${to.name}]`);
  
  showPushNotification("【牵线成功进度通知】", {
    "牵线红娘": matchmaker?.name || "专属红娘",
    "心仪嘉宾": to.name,
    "微信号码": to.wechat,
    "温馨提示": "红娘已确认双方信息，请复制微信号添加好友并备注“缘定传媒人”。"
  });
}

function renderAdmin() {
  if (!state.adminLoggedIn) {
    $("#adminAuthContainer").style.display = "block";
    $("#adminConsole").style.display = "none";
    return;
  }

  $("#adminAuthContainer").style.display = "none";
  $("#adminConsole").style.display = "block";

  renderMetrics();
  renderSplit();
  renderAgencies();
  renderMatchmakers();
  renderCustomers();
  renderChart();
}

function renderMetrics() {
  const vipCount = state.users.filter((user) => user.vip).length;
  const totalAmount = state.deals.reduce((sum, deal) => sum + deal.amount, 0);
  const cards = [
    ["客户数量", state.users.length],
    ["VIP 数量", vipCount],
    ["成交数量", state.deals.length],
    ["总金额", `¥${totalAmount}`],
  ];
  $("#metricsGrid").innerHTML = cards
    .map(([label, value]) => `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderSplit() {
  const form = $("#splitForm");
  form.elements.promo.value = state.splits.promo;
  form.elements.matchmaker.value = state.splits.matchmaker;
  form.elements.platform.value = state.splits.platform;
  const labels = [
    ["介绍推广费", "promo", "#dc6b5c"],
    ["红娘牵线费", "matchmaker", "#0f766e"],
    ["平台服务费", "platform", "#3867d6"],
  ];
  $("#splitPreview").innerHTML = labels
    .map(
      ([label, key, color]) => `
        <div class="split-row">
          <span>${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${state.splits[key]}%;background:${color}"></div></div>
          <strong>${state.splits[key]}%</strong>
        </div>
      `,
    )
    .join("");
}

function renderAgencies() {
  $("#agencyCount").textContent = `${state.agencies.length} 家`;
  $("#agencyList").innerHTML = state.agencies
    .map(
      (agency) => `
        <div class="plain-item">
          <strong>${agency.name}</strong>
          <span class="muted">${agency.city}</span>
        </div>
      `,
    )
    .join("");

  const select = $("#matchmakerForm select[name='agencyId']");
  select.innerHTML = state.agencies
    .map((agency) => `<option value="${agency.id}">${agency.name}</option>`)
    .join("");
}

function renderMatchmakers() {
  $("#matchmakerCount").textContent = `${state.matchmakers.length} 位`;
  $("#matchmakerList").innerHTML = state.matchmakers
    .map((matchmaker) => {
      const agency = getAgency(matchmaker.agencyId);
      return `
        <div class="plain-item">
          <strong>${matchmaker.name}</strong>
          <span class="muted">${agency?.name || "未分配"} · ${matchmaker.code}</span>
        </div>
      `;
    })
    .join("");
}

function renderCustomers() {
  $("#customerCount").textContent = `${state.users.length} 位`;
  $("#customerRows").innerHTML = state.users
    .map((user) => {
      const matchmaker = getMatchmaker(user.referralMatchmakerId);
      return `
        <tr>
          <td>${user.name} · ${user.gender} · ${user.age}</td>
          <td>${user.city}</td>
          <td>${user.vip ? "VIP" : "普通"}</td>
          <td>${matchmaker?.name || "-"}</td>
          <td>${user.wechat}</td>
        </tr>
      `;
    })
    .join("");
}

function renderChart() {
  const totalAmount = state.deals.reduce((sum, deal) => sum + deal.amount, 0);
  const max = Math.max(state.users.length, state.requests.length, state.deals.length, totalAmount / 100, 1);
  const rows = [
    ["客户", state.users.length, state.users.length],
    ["牵线", state.requests.length, state.requests.length],
    ["成交", state.deals.length, state.deals.length],
    ["金额", totalAmount / 100, `¥${totalAmount}`],
  ];
  $("#chartPanel").innerHTML = rows
    .map(
      ([label, value, display]) => `
        <div class="bar-row">
          <span>${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.max((value / max) * 100, 4)}%"></div></div>
          <strong>${display}</strong>
        </div>
      `,
    )
    .join("");
}

function addAgency(event) {
  event.preventDefault();
  const form = event.currentTarget;
  state.agencies.push({
    id: uid("a"),
    name: form.elements.name.value.trim(),
    city: form.elements.city.value.trim(),
  });
  form.reset();
  saveState();
  renderAll();
  showToast("机构已添加");
}

function addMatchmaker(event) {
  event.preventDefault();
  const form = event.currentTarget;
  state.matchmakers.push({
    id: uid("m"),
    name: form.elements.name.value.trim(),
    agencyId: form.elements.agencyId.value,
    code: form.elements.code.value.trim().toUpperCase(),
  });
  form.reset();
  saveState();
  renderAll();
  showToast("红娘已添加");
}

function saveSplits(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const next = {
    promo: Number(form.elements.promo.value),
    matchmaker: Number(form.elements.matchmaker.value),
    platform: Number(form.elements.platform.value),
  };
  const total = next.promo + next.matchmaker + next.platform;
  if (total !== 100) {
    showToast(`当前合计为 ${total}%，请调整为 100%`);
    return;
  }
  state.splits = next;
  saveState();
  renderAll();
  showToast("分成比例已保存");
}

function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const user = currentUser();
  ["name", "gender", "city", "job", "wechat", "bio", "requirements"].forEach((key) => {
    user[key] = form.elements[key].value.trim();
  });
  user.age = Number(form.elements.age.value);
  saveState();
  renderAll();
  showToast("个人资料已保存");
}

function seedDeal() {
  const latestReq = state.requests[0];
  let clientName = "未知客户";
  let mmName = "平台专属红娘";
  let referralMatchmakerId = null;

  if (latestReq) {
    const fromUser = state.users.find(u => u.id === latestReq.fromUserId);
    if (fromUser) {
      clientName = fromUser.name;
      referralMatchmakerId = fromUser.referralMatchmakerId;
    }
    const mm = getMatchmaker(latestReq.matchmakerId);
    if (mm) mmName = mm.name;
  } else {
    const randomUser = state.users[Math.floor(Math.random() * state.users.length)];
    if (randomUser) {
      clientName = randomUser.name;
      referralMatchmakerId = randomUser.referralMatchmakerId;
    }
  }

  const promoMm = referralMatchmakerId ? getMatchmaker(referralMatchmakerId) : state.matchmakers[0];
  const promoName = promoMm ? promoMm.name : mmName;

  state.deals.unshift({
    id: uid("d"),
    requestId: latestReq?.id || null,
    amount: VIP_PRICE,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  saveState();
  renderAll();
  showToast("已模拟新增一笔成交");

  const promoComm = (VIP_PRICE * (state.splits.promo / 100)).toFixed(2);
  const matchComm = (VIP_PRICE * (state.splits.matchmaker / 100)).toFixed(2);
  const platformComm = (VIP_PRICE * (state.splits.platform / 100)).toFixed(2);

  logEvent("sys", `管理员触发了一笔成交模拟（金额: ¥${VIP_PRICE}，绑定测试客户: ${clientName}）`);
  logEvent("deal", `[模拟分账] 推广红娘 '${promoName}' 获推广分成: ¥${promoComm}，牵线红娘 '${mmName}' 获牵线分成: ¥${matchComm}，平台分配收益: ¥${platformComm}`);

  showPushNotification("【喜报·交友业务模拟成交】", {
    "成交客户": clientName,
    "推广红娘": promoName,
    "牵线红娘": mmName,
    "结算分成总额": `¥${(Number(promoComm) + Number(matchComm)).toFixed(2)}`
  });
}

// Account Modal Functions (Matchmaker only)
// --- Matchmaker Built-in Auth Logic ---
function mmAuthLogin() {
  const selectedId = $("#mmLoginSelect").value;
  const m = state.matchmakers.find((item) => item.id === selectedId);
  if (!m) return;

  state.selectedMatchmakerId = selectedId;
  saveState();
  renderAll();
  logEvent("match", `红娘 '${m.name}' 成功登录红娘工作台`);
  showToast(`已登录为红娘：${m.name}`);
}

function mmAuthRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const code = form.elements.code.value.trim().toUpperCase();

  const isDuplicate = state.matchmakers.some(
    (m) => m.code.toUpperCase() === code
  );
  if (isDuplicate) {
    showToast("推荐码已存在，请更换！");
    return;
  }

  const name = form.elements.name.value.trim();
  const newId = uid("m");
  const newMatchmaker = {
    id: newId,
    name: name,
    agencyId: form.elements.agencyId.value,
    code: code
  };

  state.matchmakers.push(newMatchmaker);
  state.selectedMatchmakerId = newId;

  form.reset();
  saveState();
  renderAll();
  logEvent("match", `新红娘注册并登录成功：${name} [${code}]`);
  showToast(`红娘 ${name} 注册并登录成功`);
}

function mmAuthLogout() {
  const mm = getMatchmaker(state.selectedMatchmakerId);
  const name = mm ? mm.name : "未知";
  
  state.selectedMatchmakerId = null;
  saveState();
  renderAll();
  logEvent("match", `红娘 '${name}' 已退出工作台登录`);
  showToast("红娘已安全退出登录");
}

// --- Admin Built-in Auth Logic ---
function adminAuthLogin(event) {
  event.preventDefault();
  const password = $("#adminPasswordInput").value;
  if (password.toLowerCase() === "admin") {
    state.adminLoggedIn = true;
    saveState();
    renderAll();
    logEvent("sys", "管理员成功安全登录管理控制台");
    showToast("管理员登录成功");
  } else {
    showToast("密码错误！默认演示密码为 admin");
  }
}

function adminAuthLogout() {
  state.adminLoggedIn = false;
  saveState();
  renderAll();
  logEvent("sys", "管理员已退出管理控制台");
  showToast("管理员已退出登录");
}

// --- Mini Program Native Account Functions ---

// Mini Program Client Register User
// Mini Program Client Register User
function miniRegisterUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const gender = form.elements.gender.value;
  
  const femalePhotos = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=60"
  ];
  const malePhotos = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=60"
  ];
  
  const photoPool = gender === "女" ? femalePhotos : malePhotos;
  const photo = photoPool[Math.floor(Math.random() * photoPool.length)];
  const name = form.elements.name.value.trim();

  const newId = uid("u");
  const newUser = {
    id: newId,
    name: name,
    gender: gender,
    age: Number(form.elements.age.value),
    city: form.elements.city.value.trim(),
    job: form.elements.job.value.trim(),
    wechat: form.elements.wechat.value.trim(),
    vip: false,
    referralMatchmakerId: null,
    bio: form.elements.bio.value.trim(),
    requirements: form.elements.requirements.value.trim(),
    photo: photo
  };

  state.users.push(newUser);
  state.currentUserId = newId;
  
  form.reset();
  saveState();
  switchMiniTab("discover");
  renderAll();
  showToast(`注册成功！已为您登录为 ${name}`);

  logEvent("user", `新客户在小程序端注册成功：${name} (${gender}·${newUser.age}岁·${newUser.city})`);
  showPushNotification("【客户注册成功通知】", {
    "注册客户": name,
    "性别年龄": `${gender} · ${newUser.age}岁`,
    "微信账号": newUser.wechat,
    "职业城市": `${newUser.job} · ${newUser.city}`
  });
}

// Mini Program Switch Existing User
function miniSwitchUser() {
  const selectedId = $("#miniSwitchUserSelect").value;
  const user = state.users.find((u) => u.id === selectedId);
  if (!user) return;

  state.currentUserId = selectedId;
  saveState();
  switchMiniTab("discover");
  renderAll();
  showToast(`已成功登录：${user.name}`);

  logEvent("user", `已在小程序端切换登录为客户：${user.name} (${user.vip ? "VIP 会员" : "普通用户"})`);
  showPushNotification("【客户登录成功提醒】", {
    "登录客户": user.name,
    "微信账号": user.wechat,
    "会员级别": user.vip ? "VIP 会员" : "普通用户",
    "所在城市": user.city
  });
}

// Mini Program Logout User
function miniLogoutUser() {
  const user = currentUser();
  const oldName = user ? user.name : "未知";
  state.currentUserId = null;
  saveState();
  renderAll();
  showToast("已退出登录，当前为游客模式");

  logEvent("user", `客户 '${oldName}' 已退出登录`);
}

// Mini Program Redirect guest to mine tab (for login/register)
function miniToRegister() {
  switchMiniTab("mine");
}

function quickAddMember(gender) {
  const maleNames = ["江寒", "陆云洲", "祁宴", "沈修远", "裴渡", "陈亦帆", "林子默", "顾景川", "陆言熙", "沈慕白", "宋怀言", "周子安"];
  const femaleNames = ["温以凡", "桑稚", "许星若", "季秋", "姜泥", "沈星若", "温以乔", "姜暮烟", "许红豆", "林妙妙", "简言", "唐微微"];
  const maleJobs = ["视频摄影师", "自媒体主播", "播客主编", "新媒体策划", "传媒大学讲师", "独立制片人", "内容创意导演", "音频总监"];
  const femaleJobs = ["品牌公关总监", "时尚专栏作者", "纪录片策划", "新媒体主编", "娱乐记者", "配音演员", "创意法务", "广告制片"];
  const cities = ["上海", "北京", "广州", "深圳", "杭州", "南京", "成都", "武汉"];
  
  const malePhotos = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=60"
  ];
  const femalePhotos = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=60",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=60"
  ];

  const bios = [
    "做内容非常看重真诚，热爱看纪录片，周末喜欢在城市走走停停，期待遇到有共鸣的你。",
    "工作比较饱和但生活安排得井井有条，平时喜欢摄影、手作和网球，希望我们能一起去旅行。",
    "在传媒行业打拼，既向往高效的专业节奏，也珍惜松弛的周末生活，希望找个成熟有担当的人。",
    "性格慢热但很真诚，平时喜欢研究咖啡、阅读和看老电影，希望能共同经营一段长久的关系。",
    "热爱一切新鲜的事物，做品牌策划，平时爱打羽毛球，希望对方是个幽默有责任心的人。"
  ];

  const requirements = [
    "希望你真诚坦率，有自己独立的空间和热爱，年龄 25-35 岁，在同城工作。",
    "期待遇到一位情绪稳定、尊重彼此事业、同样喜欢生活和旅行的另一半。",
    "希望男生有责任心，懂得沟通，愿意一起面对生活里琐碎的细节。",
    "希望女生乐观善良，理解传媒行业的忙碌，愿意共同为未来做规划。"
  ];

  const name = gender === "男" 
    ? maleNames[Math.floor(Math.random() * maleNames.length)]
    : femaleNames[Math.floor(Math.random() * femaleNames.length)];
  const job = gender === "男"
    ? maleJobs[Math.floor(Math.random() * maleJobs.length)]
    : femaleJobs[Math.floor(Math.random() * femaleJobs.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const age = Math.floor(Math.random() * 18) + 24;
  const photoPool = gender === "男" ? malePhotos : femalePhotos;
  const photo = photoPool[Math.floor(Math.random() * photoPool.length)];
  const bio = bios[Math.floor(Math.random() * bios.length)];
  const req = requirements[Math.floor(Math.random() * requirements.length)];
  const wechat = `${gender === "男" ? "mr" : "ms"}_${name.toLowerCase() || "guest"}_${Math.floor(Math.random() * 899 + 100)}`;

  const newId = uid("u");
  const newUser = {
    id: newId,
    name: name,
    gender: gender,
    age: age,
    city: city,
    job: job,
    wechat: wechat,
    vip: Math.random() > 0.6,
    referralMatchmakerId: Math.random() > 0.3 ? state.matchmakers[Math.floor(Math.random() * state.matchmakers.length)].id : null,
    bio: bio,
    requirements: req,
    photo: photo
  };

  state.users.push(newUser);
  saveState();
  renderAll();

  logEvent("user", `快捷生成单身${gender}嘉宾成功：${name} (${age}岁·${city}·${job})`);
  showToast(`已快捷生成单身${gender}嘉宾：${name}`);

  showPushNotification("【单身嘉宾注册通知】", {
    "新入驻嘉宾": `${name} (${gender}·${age}岁)`,
    "地区城市": city,
    "职业岗位": job,
    "微信账号": wechat
  });
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  $$("[data-mini-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("disabled")) {
        const frame = $(".phone-frame");
        frame.classList.remove("shake");
        void frame.offsetWidth; // trigger reflow
        frame.classList.add("shake");
        showToast("请先在“我的”页面登录或注册客户账号");
        return;
      }
      switchMiniTab(button.dataset.miniTab);
    });
  });
  ["#genderFilter", "#cityFilter", "#ageFilter"].forEach((selector) => {
    $(selector).addEventListener("change", renderProfiles);
  });
  $("#profileList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-connect]");
    if (button) createRequest(button.dataset.connect);
  });
  $("#notificationList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-accept]");
    if (button) completeRequest(button.dataset.accept);
  });
  $("#becomeVipBtn").addEventListener("click", becomeVip);
  $("#profileForm").addEventListener("submit", saveProfile);
  $("#splitForm").addEventListener("submit", saveSplits);
  $("#agencyForm").addEventListener("submit", addAgency);
  $("#matchmakerForm").addEventListener("submit", addMatchmaker);
  $("#seedDealBtn").addEventListener("click", seedDeal);
  $("#resetDataBtn").addEventListener("click", resetState);

  // 小程序端内置登录/注册/退出/解锁跳转事件
  $$(".mini-to-register-btn").forEach((btn) => {
    btn.addEventListener("click", miniToRegister);
  });
  $("#miniSwitchUserBtn").addEventListener("click", miniSwitchUser);
  $("#miniRegisterForm").addEventListener("submit", miniRegisterUser);
  $("#miniLogoutBtn").addEventListener("click", miniLogoutUser);

  // 中台快捷助手事件绑定
  $("#quickAddMaleBtn").addEventListener("click", () => quickAddMember("男"));
  $("#quickAddFemaleBtn").addEventListener("click", () => quickAddMember("女"));
  $("#clearConsoleLogsBtn").addEventListener("click", () => {
    const container = $("#consoleLogs");
    if (container) {
      container.innerHTML = "";
      logEvent("sys", "业务审计日志已清空");
    }
  });

  // 内置红娘工作台登录/注册/退出事件绑定
  const mmTabLogin = $("#mmAuthTabLoginBtn");
  const mmTabReg = $("#mmAuthTabRegisterBtn");
  if (mmTabLogin && mmTabReg) {
    mmTabLogin.addEventListener("click", () => {
      mmTabLogin.classList.add("active");
      mmTabReg.classList.remove("active");
      $("#mmAuthLoginPanel").classList.add("active");
      $("#mmAuthRegisterPanel").style.display = "none";
    });
    mmTabReg.addEventListener("click", () => {
      mmTabReg.classList.add("active");
      mmTabLogin.classList.remove("active");
      $("#mmAuthRegisterPanel").style.display = "block";
      $("#mmAuthLoginPanel").classList.remove("active");
    });
  }
  $("#mmLoginSubmitBtn").addEventListener("click", mmAuthLogin);
  $("#mmRegisterForm").addEventListener("submit", mmAuthRegister);
  $("#mmLogoutBtn").addEventListener("click", mmAuthLogout);

  // 内置管理员登录/退出事件绑定
  $("#adminLoginForm").addEventListener("submit", adminAuthLogin);
  $("#adminLogoutBtn").addEventListener("click", adminAuthLogout);
}

bindEvents();
initApp();

window.addEventListener("pagehide", () => {
  if (apiAvailable) {
    syncRemoteState({ keepalive: true, notify: false });
  }
});
