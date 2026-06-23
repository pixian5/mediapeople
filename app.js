const STORAGE_KEY = "mediapeople-dating-demo-v1";
const SESSION_KEY = `${STORAGE_KEY}:session`;
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
  promoCodes: [
    { code: "VIP666", matchmakerId: "m1", used: false, usedBy: null },
    { code: "MEDIA888", matchmakerId: "m2", used: false, usedBy: null },
    { code: "LOVE999", matchmakerId: null, used: false, usedBy: null },
    { code: "1", matchmakerId: null, used: false, usedBy: null, infinite: true }
  ],
};

let state = structuredClone(seedState);
let session = loadSession();
let apiAvailable = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function ensureStateDefaults(s) {
  if (!s) return s;
  s.users.forEach((u) => {
    if (u.phone === undefined) u.phone = null;
    if (u.email === undefined) u.email = null;
    if (u.realNameVerified === undefined) u.realNameVerified = false;
    if (u.realName === undefined) u.realName = null;
    if (u.idCard === undefined) u.idCard = null;
    if (u.vip && !u.vipExpiresAt) {
      u.vipExpiresAt = "2027-06-11";
    }
  });
  // Ensure u1 has phone and email, u2 has only email (no phone) to test phone supplement
  const u1 = s.users.find((u) => u.id === "u1");
  if (u1) {
    if (!u1.phone) u1.phone = "13800000001";
    if (!u1.email) u1.email = "linan@example.com";
  }
  const u2 = s.users.find((u) => u.id === "u2");
  if (u2) {
    if (!u2.email) u2.email = "qing@example.com";
    if (u2.phone === undefined || u2.phone === "13800000002") u2.phone = null; // force null for u2 to test supplement
  }
  if (!s.promoCodes || s.promoCodes.length === 0) {
    s.promoCodes = [
      { code: "VIP666", matchmakerId: "m1", used: false, usedBy: null },
      { code: "MEDIA888", matchmakerId: "m2", used: false, usedBy: null },
      { code: "LOVE999", matchmakerId: null, used: false, usedBy: null },
      { code: "1", matchmakerId: null, used: false, usedBy: null, infinite: true }
    ];
  } else {
    if (!s.promoCodes.some(p => p.code === "1")) {
      s.promoCodes.push({ code: "1", matchmakerId: null, used: false, usedBy: null, infinite: true });
    }
  }
  return s;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return ensureStateDefaults(structuredClone(seedState));
  }

  try {
    return ensureStateDefaults(JSON.parse(saved));
  } catch {
    return ensureStateDefaults(structuredClone(seedState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (apiAvailable) {
    return syncRemoteState();
  }
  return Promise.resolve();
}

function loadSession() {
  const defaults = {
    currentUserId: "u1",
    selectedMatchmakerId: null,
    adminLoggedIn: false,
  };
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return defaults;

  try {
    return { ...defaults, ...JSON.parse(saved) };
  } catch {
    return defaults;
  }
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function setCurrentUserId(id) {
  session.currentUserId = id;
  saveSession();
}

function setSelectedMatchmakerId(id) {
  session.selectedMatchmakerId = id;
  saveSession();
}

function setAdminLoggedIn(loggedIn) {
  session.adminLoggedIn = loggedIn;
  saveSession();
}

async function loadRemoteState() {
  const response = await fetch(`${API_BASE}/state`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load remote state: ${response.status}`);
  }
  apiAvailable = true;
  const data = await response.json();
  return ensureStateDefaults(data);
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
      ensureStateDefaults(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast("演示数据已重置");
      return;
    } catch (error) {
      apiAvailable = false;
      console.warn(error);
    }
  }
  state = ensureStateDefaults(structuredClone(seedState));
  saveState();
  renderAll();
  showToast("演示数据已重置");
}

async function initApp() {
  try {
    state = await loadRemoteState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    logEvent("sys", "系统启动成功：已成功连接 to 远程数据库，同步全局状态");
  } catch (error) {
    apiAvailable = false;
    console.warn(error);
    state = loadState();
    showToast("暂未连接数据库，使用本机演示数据");
    logEvent("sys", "数据库连接失败，已自动启用浏览器 LocalStorage 本机演示数据");
  }
  ensureStateDefaults(state);
  renderAll();
  handleRouting();
  window.addEventListener("popstate", handleRouting);

  // 开启多端自动轮询同步数据（每4秒）
  window.setInterval(async () => {
    if (apiAvailable) {
      try {
        const remoteState = await loadRemoteState();
        if (JSON.stringify(remoteState) !== JSON.stringify(state)) {
          state = remoteState;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          renderAll();
          logEvent("sys", "自动同步：已拉取来自其他端的最新业务状态");
        }
      } catch (e) {
        console.warn("轮询同步数据失败:", e);
      }
    }
  }, 4000);
}

function isMiniView() {
  return document.body.getAttribute("data-role") === "mini" || window.location.port === "8096";
}

function isMatchmakerView() {
  return document.body.getAttribute("data-role") === "matchmaker" || window.location.port === "8097";
}

function isAdminView() {
  return document.body.getAttribute("data-role") === "admin" || window.location.port === "8098";
}

function handleRouting() {
  const port = window.location.port;
  let path = window.location.pathname;

  // 基础视觉隔离控制
  if (isMiniView()) {
    document.body.className = "role-mini";
  } else if (isMatchmakerView()) {
    document.body.className = "role-matchmaker";
  } else if (isAdminView()) {
    document.body.className = "role-admin";
  } else {
    document.body.className = "";
  }

  // 路由跳转分发逻辑
  if (isMiniView()) {
    switchView("mini");
    const loggedIn = !!session.currentUserId;
    if (!loggedIn) {
      if (path !== "/my") {
        navigate("/my", { replace: true });
        return;
      }
    }
    if (path === "/" || path === "/discover") {
      switchMiniTab("discover");
    } else if (path === "/profile") {
      switchMiniTab("profile");
    } else if (path === "/vip") {
      switchMiniTab("mine");
      showVipSubpanel(true);
    } else if (path === "/requests") {
      switchMiniTab("requests");
    } else if (path === "/my") {
      switchMiniTab("mine");
      showVipSubpanel(false);
    } else {
      navigate(loggedIn ? "/discover" : "/my", { replace: true });
    }
  } else if (isMatchmakerView()) {
    switchView("matchmaker");
    const loggedIn = !!session.selectedMatchmakerId;
    if (path === "/workbench") {
      if (!loggedIn) {
        navigate("/login", { replace: true });
      } else {
        renderMatchmakerDesk();
      }
    } else if (path === "/" || path === "/login") {
      if (loggedIn) {
        navigate("/workbench", { replace: true });
      } else {
        renderMatchmakerDesk();
      }
    } else {
      navigate(loggedIn ? "/workbench" : "/login", { replace: true });
    }
  } else if (isAdminView()) {
    switchView("admin");
    const loggedIn = !!session.adminLoggedIn;
    if (path === "/console") {
      if (!loggedIn) {
        navigate("/login", { replace: true });
      } else {
        renderAdmin();
      }
    } else if (path === "/" || path === "/login") {
      if (loggedIn) {
        navigate("/console", { replace: true });
      } else {
        renderAdmin();
      }
    } else {
      navigate(loggedIn ? "/console" : "/login", { replace: true });
    }
  } else {
    // 8095 预览端路由解析
    if (path === "/" || path === "") {
      navigate("/mini/discover", { replace: true });
      return;
    }

    if (path.startsWith("/mini")) {
      switchView("mini");
      const loggedIn = !!session.currentUserId;
      const sub = path.substring(5);
      if (!loggedIn) {
        if (sub !== "/my") {
          navigate("/mini/my", { replace: true });
          return;
        }
      }
      if (sub === "" || sub === "/" || sub === "/discover") {
        switchMiniTab("discover");
      } else if (sub === "/profile") {
        switchMiniTab("profile");
      } else if (sub === "/vip") {
        switchMiniTab("mine");
        showVipSubpanel(true);
      } else if (sub === "/requests") {
        switchMiniTab("requests");
      } else if (sub === "/my") {
        switchMiniTab("mine");
        showVipSubpanel(false);
      } else {
        navigate(loggedIn ? "/mini/discover" : "/mini/my", { replace: true });
      }
    } else if (path.startsWith("/matchmaker")) {
      switchView("matchmaker");
      const loggedIn = !!session.selectedMatchmakerId;
      const sub = path.substring(11);
      if (sub === "/workbench") {
        if (!loggedIn) {
          navigate("/matchmaker/login", { replace: true });
        } else {
          renderMatchmakerDesk();
        }
      } else {
        if (loggedIn) {
          navigate("/matchmaker/workbench", { replace: true });
        } else {
          renderMatchmakerDesk();
        }
      }
    } else if (path.startsWith("/admin")) {
      switchView("admin");
      const loggedIn = !!session.adminLoggedIn;
      const sub = path.substring(6);
      if (sub === "/console") {
        if (!loggedIn) {
          navigate("/admin/login", { replace: true });
        } else {
          renderAdmin();
        }
      } else {
        if (loggedIn) {
          navigate("/admin/console", { replace: true });
        } else {
          renderAdmin();
        }
      }
    } else {
      navigate("/mini/discover", { replace: true });
    }
  }
}

function navigate(path, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  handleRouting();
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function hashText(text) {
  if (!window.crypto?.subtle) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `demo-fnv-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function currentUser() {
  return state.users.find((user) => user.id === session.currentUserId);
}

function getMatchmaker(id) {
  return state.matchmakers.find((matchmaker) => matchmaker.id === id);
}

function getAgency(id) {
  return state.agencies.find((agency) => agency.id === id);
}

function renderAll() {
  renderFilters();
  renderMiniApp();
  renderMatchmakerDesk();
  renderAdmin();
  renderPromoCodes();
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
  const viewEl = $(`#${view}View`);
  if (viewEl) viewEl.classList.add("active");

  const user = currentUser();
  const names = {
    mini: user ? `客户：${user.name}` : "客户：未登录",
    matchmaker: `红娘：${getMatchmaker(session.selectedMatchmakerId)?.name || "未选择"}`,
    admin: "管理员：平台运营",
  };
  const personaEl = $("#currentPersona");
  if (personaEl) personaEl.textContent = names[view];
}

function switchMiniTab(tab) {
  $$("[data-mini-tab]").forEach((item) =>
    item.classList.toggle("active", item.dataset.miniTab === tab),
  );
  $$(".mini-tab").forEach((panel) => panel.classList.remove("active"));
  const tabEl = $(`#${tab}Tab`);
  if (tabEl) tabEl.classList.add("active");
  renderMineTabContent();
}

function syncMiniTabFromLocation() {
  const path = window.location.pathname;
  const isMiniPath = isMiniView() || path.startsWith("/mini");
  if (!isMiniPath) return;

  if (path.endsWith("/profile")) {
    switchMiniTab("profile");
  } else if (path.endsWith("/requests")) {
    switchMiniTab("requests");
  } else if (path.endsWith("/vip")) {
    switchMiniTab("mine");
    showVipSubpanel(true);
  } else if (path.endsWith("/my")) {
    switchMiniTab("mine");
    showVipSubpanel(false);
  } else {
    switchMiniTab("discover");
  }
}

function showVipSubpanel(visible) {
  const mainRegistered = $("#miniMineRegisteredMain");
  const vipSubpanel = $("#miniMineVipSubpanel");
  if (!mainRegistered || !vipSubpanel) return;
  if (visible) {
    mainRegistered.style.display = "none";
    vipSubpanel.style.display = "block";
  } else {
    mainRegistered.style.display = "block";
    vipSubpanel.style.display = "none";
  }
}

function renderFilters() {
  if (!$("#cityFilter")) return;
  const cities = ["全部", ...new Set(state.users.map((user) => user.city))];
  $("#cityFilter").innerHTML = cities
    .map((city) => `<option value="${city}">${city}</option>`)
    .join("");
}

function renderMiniApp() {
  if (!$("#vipState")) return;
  const user = currentUser();
  renderVipMatchmakers();

  if (user) {
    const referralInput = $("#referralCodeInput");
    const selectTrigger = $("#referralMatchmakerSelect");
    if (referralInput && selectTrigger) {
      if (user.referralMatchmakerId && !referralInput.value) {
        const m = getMatchmaker(user.referralMatchmakerId);
        if (m) {
          referralInput.value = m.code;
          const agency = getAgency(m.agencyId);
          selectTrigger.value = `${m.name} [${m.code}] (${agency?.name || "未知机构"})`;
        }
      }
    }
  }
  
  // VIP Badge
  $("#vipState").textContent = user ? (user.vip ? "VIP 会员" : "普通用户") : "游客访客";
  $("#vipState").style.background = user ? (user.vip ? "#d9f7e8" : "#fff1c7") : "#eef2f5";
  $("#vipState").style.color = user ? (user.vip ? "#166534" : "#7a4a08") : "#6d7785";

  // Become VIP Button & Expiry Date update
  const becomeVipBtn = $("#becomeVipBtn");
  const vipExpiryDate = $("#vipExpiryDate");
  if (becomeVipBtn) {
    if (!user) {
      becomeVipBtn.textContent = "请先登录/注册";
      becomeVipBtn.disabled = true;
      becomeVipBtn.style.background = "#9ca3af";
      if (vipExpiryDate) vipExpiryDate.style.display = "none";
    } else if (!user.vip) {
      becomeVipBtn.textContent = "模拟支付并开通";
      becomeVipBtn.disabled = false;
      becomeVipBtn.style.background = ""; 
      if (vipExpiryDate) vipExpiryDate.style.display = "none";
    } else {
      // User is VIP
      const referralInput = $("#referralCodeInput");
      const code = referralInput ? referralInput.value.trim() : "";
      const m = state.matchmakers.find(item => item.code.toUpperCase() === code.toUpperCase());
      
      if (m && m.id !== user.referralMatchmakerId) {
        // Selected matchmaker is different from current referralMatchmakerId
        becomeVipBtn.textContent = "确认修改红娘并重新开通";
        becomeVipBtn.disabled = false;
        becomeVipBtn.style.background = ""; 
      } else {
        // Selected is same or none selected
        becomeVipBtn.textContent = "已是会员";
        becomeVipBtn.disabled = true;
        becomeVipBtn.style.background = "#9ca3af"; 
      }
      
      if (vipExpiryDate) {
        vipExpiryDate.textContent = `会员到期日期: ${user.vipExpiresAt || "2027-06-11"}`;
        vipExpiryDate.style.display = "block";
      }
    }
  }
  
  // Tab lock control (置灰其它页面 Tab，强行锁定“我的”)
  const tabs = $$("[data-mini-tab]");
  if (!user) {
    tabs.forEach((tab) => {
      const isMine = tab.dataset.miniTab === "mine";
      tab.classList.toggle("disabled", !isMine);
      tab.setAttribute("aria-disabled", !isMine ? "true" : "false");
    });
    
    // 路由层面会自动守卫非已登录用户重定向到 /my 选项卡，此处只需进行按钮禁用渲染
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
  syncMiniTabFromLocation();
}

function renderProfileForm() {
  const form = $("#profileForm");
  if (!form) return;
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
  if (!$("#miniMineUnregistered")) return;
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

    // 动态渲染客户数据指标面板
    const userReqs = state.requests.filter(r => r.fromUserId === user.id);
    const unlockedReqs = userReqs.filter(r => r.status === "已联系双方");
    const referralMm = user.referralMatchmakerId ? getMatchmaker(user.referralMatchmakerId) : null;

    $("#mineStatRequests").textContent = userReqs.length;
    $("#mineStatVIP").textContent = user.vip ? "VIP" : "普通";
    $("#mineStatUnlocked").textContent = unlockedReqs.length;

    // 动态设置功能选项菜单内容
    $("#mineMenuVipStatus").textContent = user.vip ? "已开通 VIP 会员" : "开通会员解锁要求";
    $("#mineMenuMatchmaker").textContent = referralMm ? `${referralMm.name} (${referralMm.code})` : "待分配";

    const realNameBadge = $("#miniMineRealNameStatus");
    if (realNameBadge) {
      if (user.realNameVerified) {
        realNameBadge.textContent = "已实名";
        realNameBadge.className = "status-badge green";
      } else {
        realNameBadge.textContent = "未认证";
        realNameBadge.className = "status-badge orange";
      }
    }
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
    const is8096 = isMiniView();
    navigate(is8096 ? "/vip" : "/mini/vip");
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
  user.vipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

function renderVipMatchmakers(filterKeyword = "") {
  const listContainer = $("#matchmakerOptionsList");
  if (!listContainer) return;

  const keyword = filterKeyword.trim().toLowerCase();
  const filtered = state.matchmakers.filter((m) => {
    const agency = getAgency(m.agencyId);
    const text = `${m.name} ${m.code} ${agency?.name || ""}`.toLowerCase();
    return text.includes(keyword);
  });

  const hiddenInput = $("#referralCodeInput");
  const currentVal = hiddenInput ? hiddenInput.value : "";

  let html = "";
  if (filtered.length === 0) {
    html = `<li class="no-results">没有找到匹配的红娘</li>`;
  } else {
    html = `<li data-value="" class="${currentVal === "" ? "selected" : ""}">-- 请选择专属红娘 --</li>`;
    html += filtered
      .map((m) => {
        const agency = getAgency(m.agencyId);
        const labelText = `${m.name} [${m.code}] (${agency?.name || "未知机构"})`;
        const isSelected = m.code === currentVal;
        return `<li data-value="${m.code}" data-label="${labelText}" class="${isSelected ? "selected" : ""}">
          ${labelText}
        </li>`;
      })
      .join("");
  }
  listContainer.innerHTML = html;
}

function redeemVip() {
  const rawCode = $("#vipPromoCodeInput").value.trim().toUpperCase();
  if (!rawCode) {
    showToast("请输入兑换码！");
    return;
  }

  if (!state.promoCodes) {
    state.promoCodes = [];
  }

  const promoCode = state.promoCodes.find((item) => item.code.toUpperCase() === rawCode);
  if (!promoCode) {
    showToast("兑换码无效！请核对或联系客服");
    return;
  }

  if (promoCode.used && !promoCode.infinite) {
    showToast("该兑换码已被兑换使用！");
    return;
  }

  const user = currentUser();
  if (!user) {
    showToast("请先登录客户账号再进行兑换");
    return;
  }

  if (!promoCode.infinite) {
    promoCode.used = true;
    promoCode.usedBy = user.id;
  }

  user.vip = true;
  user.vipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  const redeemBtn = $("#redeemVipBtn");
  if (redeemBtn) {
    redeemBtn.textContent = "有效";
    redeemBtn.style.background = "#10b981"; // green
  }

  let matchmaker = null;
  if (promoCode.matchmakerId) {
    matchmaker = getMatchmaker(promoCode.matchmakerId);
    if (matchmaker) {
      user.referralMatchmakerId = matchmaker.id;
    }
  }

  state.deals.unshift({
    id: uid("d"),
    requestId: null,
    amount: VIP_PRICE,
    createdAt: new Date().toISOString().slice(0, 10),
  });

  saveState();
  renderAll();
  $("#vipPromoCodeInput").value = "";

  if (matchmaker) {
    showToast(`兑换成功！专属红娘为${matchmaker.name}`);
    const promoComm = (VIP_PRICE * (state.splits.promo / 100)).toFixed(2);
    const matchComm = (VIP_PRICE * (state.splits.matchmaker / 100)).toFixed(2);
    const platformComm = (VIP_PRICE * (state.splits.platform / 100)).toFixed(2);

    logEvent("deal", `客户 '${user.name}' 使用兑换码 '${rawCode}' 成功开通 VIP 会员，关联推荐红娘: '${matchmaker.name}'`);
    logEvent("deal", `[佣金结算] 介绍推广分成: ¥${promoComm} (${state.splits.promo}%)，红娘牵线分成: ¥${matchComm} (${state.splits.matchmaker}%)，平台收益: ¥${platformComm} (${state.splits.platform}%)`);

    showPushNotification("【VIP兑换码使用成功】", {
      "开通客户": user.name,
      "使用兑换码": rawCode,
      "专属红娘": matchmaker.name,
      "红娘代码": matchmaker.code
    });

    showPushNotification("【红娘推广佣金喜报】", {
      "收益红娘": matchmaker.name,
      "开通客户": user.name,
      "兑换开通奖励": `¥${promoComm} (${state.splits.promo}%)`,
      "账单状态": "已结算至红娘钱包"
    });
  } else {
    showToast("兑换成功！已升级为 VIP 会员");
    logEvent("deal", `客户 '${user.name}' 使用无绑定兑换码 '${rawCode}' 成功开通 VIP 会员`);
    showPushNotification("【VIP兑换码使用成功】", {
      "开通客户": user.name,
      "使用兑换码": rawCode,
      "专属红娘": "无"
    });
  }
}

function renderPromoCodes() {
  const rows = $("#promoCodeRows");
  if (!rows) return;

  if (!state.promoCodes) {
    state.promoCodes = [];
  }

  rows.innerHTML =
    state.promoCodes
      .map((item) => {
        const mm = item.matchmakerId ? getMatchmaker(item.matchmakerId) : null;
        const mmText = mm ? `${mm.name} [${mm.code}]` : '<span class="muted">无关联红娘</span>';
        
        let statusHtml = "";
        if (item.used) {
          statusHtml = `<span class="status-badge gray">已使用</span>`;
        } else {
          statusHtml = `<span class="status-badge text-teal" style="background:#e6fffa;color:#0d9488;">可使用</span>`;
        }

        const userText = item.usedBy ? (state.users.find(u => u.id === item.usedBy)?.name || item.usedBy) : "-";

        return `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${mmText}</td>
            <td>${statusHtml}</td>
            <td>${userText}</td>
          </tr>
        `;
      })
      .join("") || `<tr><td colspan="4" class="text-center muted">暂无会员兑换码数据。</td></tr>`;
}

function generateRandomPromoCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomCode = "";
  for (let i = 0; i < 8; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  if (!state.promoCodes) {
    state.promoCodes = [];
  }
  while (state.promoCodes.some((item) => item.code === randomCode)) {
    randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  let matchmakerId = null;
  if (state.matchmakers && state.matchmakers.length > 0 && Math.random() > 0.3) {
    const idx = Math.floor(Math.random() * state.matchmakers.length);
    matchmakerId = state.matchmakers[idx].id;
  }

  const newCode = {
    code: randomCode,
    matchmakerId: matchmakerId,
    used: false,
    usedBy: null,
  };

  state.promoCodes.unshift(newCode);
  saveState();
  renderAll();

  const mm = matchmakerId ? getMatchmaker(matchmakerId) : null;
  logEvent("sys", `管理员随机生成了新会员兑换码：${randomCode} (关联红娘: ${mm ? mm.name : "无"})`);
  showToast(`已成功生成兑换码：${randomCode}`);
}

function renderMatchmakerDesk() {
  if (!$("#matchmakerAuthContainer")) return;
  const mmId = session.selectedMatchmakerId;
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
    $("#mmAuthLoginPanel").style.display = "block";
    $("#mmAuthRegisterPanel").style.display = "none";
    $("#mmAuthTabLoginBtn").classList.add("active");
    $("#mmAuthTabRegisterBtn").classList.remove("active");
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
  if (!$("#adminAuthContainer")) return;
  if (!session.adminLoggedIn) {
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
          <td>${user.phone || "-"} / ${user.email || "-"}</td>
          <td>${user.realNameVerified ? `<span class="status-badge green" style="font-size:11px;">已实名 (${user.realName})</span>` : '<span class="status-badge orange" style="font-size:11px;">未实名</span>'}</td>
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

  setSelectedMatchmakerId(selectedId);
  const is8097 = isMatchmakerView();
  navigate(is8097 ? "/workbench" : "/matchmaker/workbench");
  logEvent("match", `红娘 '${m.name}' 成功登录红娘工作台`);
  showToast(`已登录为红娘：${m.name}`);
}

async function mmAuthRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.trim();
  const email = form.elements.email.value.trim();
  const code = form.elements.code.value.trim().toUpperCase();
  const password = form.elements.password.value;
  const passwordConfirm = form.elements.passwordConfirm.value;

  if (!/^\d{11}$/.test(phone)) {
    showToast("请输入合法的11位手机号");
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast("请输入合法的邮箱地址");
    return;
  }
  if (password.length < 6) {
    showToast("登录密码至少 6 位");
    return;
  }
  if (password !== passwordConfirm) {
    showToast("两次输入的密码不一致");
    return;
  }

  const isDuplicate = state.matchmakers.some(
    (m) => m.code.toUpperCase() === code
  );
  if (isDuplicate) {
    showToast("推荐码已存在，请更换！");
    return;
  }
  if (state.matchmakers.some((m) => m.phone && m.phone === phone)) {
    showToast("该手机号已注册红娘账号");
    return;
  }
  if (email && state.matchmakers.some((m) => m.email && m.email.toLowerCase() === email.toLowerCase())) {
    showToast("该邮箱已注册红娘账号");
    return;
  }

  const newId = uid("m");
  const newMatchmaker = {
    id: newId,
    name: name,
    agencyId: form.elements.agencyId.value,
    code: code,
    phone,
    email: email || null,
    passwordHash: await hashText(password),
    status: "active",
    registeredAt: new Date().toISOString(),
  };

  state.matchmakers.push(newMatchmaker);
  setSelectedMatchmakerId(newId);

  form.reset();
  await saveState();
  const is8097 = isMatchmakerView();
  navigate(is8097 ? "/workbench" : "/matchmaker/workbench");
  logEvent("match", `新红娘注册并登录成功：${name} [${code}]`);
  showToast(`红娘 ${name} 注册并登录成功`);
}

function mmAuthLogout() {
  const mm = getMatchmaker(session.selectedMatchmakerId);
  const name = mm ? mm.name : "未知";
  
  setSelectedMatchmakerId(null);
  const is8097 = isMatchmakerView();
  navigate(is8097 ? "/login" : "/matchmaker/login");
  logEvent("match", `红娘 '${name}' 已退出工作台登录`);
  showToast("红娘已安全退出登录");
}

// --- Admin Built-in Auth Logic ---
function adminAuthLogin(event) {
  event.preventDefault();
  const password = $("#adminPasswordInput").value;
  if (password.toLowerCase() === "admin") {
    setAdminLoggedIn(true);
    const is8098 = isAdminView();
    navigate(is8098 ? "/console" : "/admin/console");
    logEvent("sys", "管理员成功安全登录管理控制台");
    showToast("管理员登录成功");
  } else {
    showToast("密码错误！默认演示密码为 admin");
  }
}

function adminAuthLogout() {
  setAdminLoggedIn(false);
  const is8098 = isAdminView();
  navigate(is8098 ? "/login" : "/admin/login");
  logEvent("sys", "管理员已退出管理控制台");
  showToast("管理员已退出登录");
}

// --- Mini Program Native Account Functions ---

// Mini Program Client Register User
// Mini Program Client Register User
async function miniRegisterUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  
  const phone = form.elements.phone.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const passwordConfirm = form.elements.passwordConfirm.value;
  if (!phone && !email) {
    showToast("手机号或邮箱必须填写一项！");
    return;
  }
  if (phone && !/^\d{11}$/.test(phone)) {
    showToast("请输入合法的11位手机号");
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast("请输入合法的邮箱地址");
    return;
  }
  if (password.length < 6) {
    showToast("登录密码至少 6 位");
    return;
  }
  if (password !== passwordConfirm) {
    showToast("两次输入的密码不一致");
    return;
  }
  if (phone && state.users.some((user) => user.phone && user.phone === phone)) {
    showToast("该手机号已注册客户账号");
    return;
  }
  if (email && state.users.some((user) => user.email && user.email.toLowerCase() === email.toLowerCase())) {
    showToast("该邮箱已注册客户账号");
    return;
  }

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
    phone: phone || null,
    email: email || null,
    passwordHash: await hashText(password),
    registeredAt: new Date().toISOString(),
    accountStatus: "active",
    realNameVerified: false,
    realName: null,
    idCard: null,
    vip: false,
    referralMatchmakerId: null,
    bio: form.elements.bio.value.trim(),
    requirements: form.elements.requirements.value.trim(),
    photo: photo
  };

  state.users.push(newUser);
  setCurrentUserId(newId);
  
  form.reset();
  saveState();
  const is8096 = isMiniView();
  navigate(is8096 ? "/discover" : "/mini/discover");
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

  setCurrentUserId(selectedId);
  const is8096 = isMiniView();
  navigate(is8096 ? "/discover" : "/mini/discover");
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
  setCurrentUserId(null);
  renderAll();
  showToast("已退出登录，当前为游客模式");

  const is8096 = isMiniView();
  navigate(is8096 ? "/my" : "/mini/my");

  logEvent("user", `客户 '${oldName}' 已退出登录`);
}

// Mini Program Redirect guest to mine tab (for login/register)
function miniToRegister() {
  const is8096 = isMiniView();
  navigate(is8096 ? "/my" : "/mini/my");
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

function safeBind(selector, event, handler) {
  const el = $(selector);
  if (el) {
    el.addEventListener(event, handler);
  }
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;
      if (view === "mini") {
        navigate("/mini/discover");
      } else if (view === "matchmaker") {
        const loggedIn = !!session.selectedMatchmakerId;
        navigate(loggedIn ? "/matchmaker/workbench" : "/matchmaker/login");
      } else if (view === "admin") {
        const loggedIn = !!session.adminLoggedIn;
        navigate(loggedIn ? "/admin/console" : "/admin/login");
      }
    });
  });
  $$("[data-mini-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("disabled")) {
        const frame = $(".phone-frame");
        if (frame) {
          frame.classList.remove("shake");
          void frame.offsetWidth; // trigger reflow
          frame.classList.add("shake");
        }
        showToast("请先在“我的”页面登录或注册客户账号");
        return;
      }
      
      const tab = button.dataset.miniTab;
      const is8096 = isMiniView();
      const prefix = is8096 ? "" : "/mini";
      const tabPathMap = {
        discover: "/discover",
        profile: "/profile",
        vip: "/vip",
        requests: "/requests",
        mine: "/my"
      };
      const path = prefix + (tabPathMap[tab] || "/discover");
      navigate(path);
    });
  });
  
  ["#genderFilter", "#cityFilter", "#ageFilter"].forEach((selector) => {
    safeBind(selector, "change", renderProfiles);
  });
  
  safeBind("#profileList", "click", (event) => {
    const button = event.target.closest("[data-connect]");
    if (button) createRequest(button.dataset.connect);
  });
  
  safeBind("#notificationList", "click", (event) => {
    const button = event.target.closest("[data-accept]");
    if (button) completeRequest(button.dataset.accept);
  });

  safeBind("#becomeVipBtn", "click", becomeVip);

  // VIP 会员页面专属红娘筛选、选择与兑换码绑定
  const selectTrigger = $("#referralMatchmakerSelect");
  const dropdownPanel = $("#matchmakerDropdownPanel");
  const optionsList = $("#matchmakerOptionsList");
  const referralInput = $("#referralCodeInput");

  if (selectTrigger && dropdownPanel && optionsList) {
    selectTrigger.addEventListener("focus", () => {
      renderVipMatchmakers("");
      dropdownPanel.style.display = "block";
    });
    
    selectTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      renderVipMatchmakers("");
      dropdownPanel.style.display = "block";
    });

    selectTrigger.addEventListener("input", (e) => {
      renderVipMatchmakers(e.target.value);
      dropdownPanel.style.display = "block";
      if (referralInput) referralInput.value = "";
    });

    optionsList.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const li = e.target.closest("li");
      if (!li || li.classList.contains("no-results")) return;

      const val = li.getAttribute("data-value");
      const label = li.getAttribute("data-label") || "";

      if (referralInput) referralInput.value = val;
      selectTrigger.value = val ? label : "";
      renderVipMatchmakers(selectTrigger.value);
      dropdownPanel.style.display = "none";
      renderMiniApp();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".searchable-select")) {
        dropdownPanel.style.display = "none";
        const selectedCode = referralInput ? referralInput.value : "";
        if (selectedCode) {
          const m = state.matchmakers.find(mm => mm.code === selectedCode);
          if (m) {
            const agency = getAgency(m.agencyId);
            selectTrigger.value = `${m.name} [${m.code}] (${agency?.name || "未知机构"})`;
          } else {
            selectTrigger.value = "";
          }
        } else {
          selectTrigger.value = "";
        }
        renderMiniApp();
      }
    });
  }
  
  safeBind("#redeemVipBtn", "click", redeemVip);

  // “会员服务”菜单项点击切换至二级面板
  safeBind("#vipServiceMenuItem", "click", () => {
    showVipSubpanel(true);
  });

  // VIP面板返回按钮点击切换回主面板
  safeBind("#vipSubpanelBackBtn", "click", () => {
    showVipSubpanel(false);
  });

  // 用户修改兑换码输入框时重置“确定”按钮
  const promoInput = $("#vipPromoCodeInput");
  const promoBtn = $("#redeemVipBtn");
  if (promoInput && promoBtn) {
    promoInput.addEventListener("input", () => {
      promoBtn.textContent = "确定";
      promoBtn.style.background = "";
    });
  }
  
  // 管理员后台兑换码生成按钮绑定
  safeBind("#generatePromoCodeBtn", "click", generateRandomPromoCode);
  
  safeBind("#profileForm", "submit", saveProfile);
  safeBind("#splitForm", "submit", saveSplits);
  safeBind("#agencyForm", "submit", addAgency);
  safeBind("#matchmakerForm", "submit", addMatchmaker);
  safeBind("#seedDealBtn", "click", seedDeal);
  safeBind("#resetDataBtn", "click", resetState);

  // 小程序端内置登录/注册/退出/解锁跳转事件
  $$(".mini-to-register-btn").forEach((btn) => {
    btn.addEventListener("click", miniToRegister);
  });
  safeBind("#miniSwitchUserBtn", "click", miniSwitchUser);
  safeBind("#miniRegisterForm", "submit", miniRegisterUser);
  safeBind("#miniLogoutBtn", "click", miniLogoutUser);

  // 中台快捷助手事件绑定
  safeBind("#quickAddMaleBtn", "click", () => quickAddMember("男"));
  safeBind("#quickAddFemaleBtn", "click", () => quickAddMember("女"));
  safeBind("#clearConsoleLogsBtn", "click", () => {
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
      const mmAuthLoginPanel = $("#mmAuthLoginPanel");
      if (mmAuthLoginPanel) {
        mmAuthLoginPanel.classList.add("active");
        mmAuthLoginPanel.style.display = "block";
      }
      const mmAuthRegisterPanel = $("#mmAuthRegisterPanel");
      if (mmAuthRegisterPanel) mmAuthRegisterPanel.style.display = "none";
    });
    mmTabReg.addEventListener("click", () => {
      mmTabReg.classList.add("active");
      mmTabLogin.classList.remove("active");
      const mmAuthRegisterPanel = $("#mmAuthRegisterPanel");
      if (mmAuthRegisterPanel) mmAuthRegisterPanel.style.display = "block";
      const mmAuthLoginPanel = $("#mmAuthLoginPanel");
      if (mmAuthLoginPanel) mmAuthLoginPanel.classList.remove("active");
    });
  }
  
  safeBind("#mmLoginSubmitBtn", "click", mmAuthLogin);
  safeBind("#mmRegisterForm", "submit", mmAuthRegister);
  safeBind("#mmLogoutBtn", "click", mmAuthLogout);

  // 内置管理员登录/退出事件绑定
  safeBind("#adminLoginForm", "submit", adminAuthLogin);
  safeBind("#adminLogoutBtn", "click", adminAuthLogout);

  // 实名认证事件绑定
  safeBind("#realNameVerificationMenuItem", "click", () => {
    const user = currentUser();
    if (!user) return;

    const modal = $("#realNameModal");
    if (modal) {
      modal.style.display = "flex";
      modal.classList.add("show");
    }

    if (user.realNameVerified) {
      $("#realNameForm").style.display = "none";
      $("#realNameInfoContainer").style.display = "flex";

      const maskName = (name) => {
        if (!name) return "-";
        if (name.length <= 2) return name[0] + "*";
        return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
      };
      const maskIdCard = (id) => {
        if (!id) return "-";
        return id.substring(0, 4) + "***********" + id.substring(15);
      };
      const maskPhone = (ph) => {
        if (!ph) return "-";
        return ph.substring(0, 3) + "****" + ph.substring(7);
      };

      $("#infoRealName").textContent = maskName(user.realName);
      $("#infoIdCard").textContent = maskIdCard(user.idCard);
      $("#infoPhone").textContent = maskPhone(user.phone);
    } else {
      $("#realNameForm").style.display = "block";
      $("#realNameInfoContainer").style.display = "none";
      $("#realNameInput").value = "";
      $("#idCardInput").value = "";

      if (!user.phone) {
        $("#realNamePhoneLabel").style.display = "block";
        $("#realNamePhoneInput").required = true;
        $("#realNamePhoneInput").value = "";
      } else {
        $("#realNamePhoneLabel").style.display = "none";
        $("#realNamePhoneInput").required = false;
      }
    }
  });

  safeBind("#closeRealNameModalBtn", "click", () => {
    const modal = $("#realNameModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("show");
    }
  });

  safeBind("#realNameModal", "click", (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.style.display = "none";
      e.currentTarget.classList.remove("show");
    }
  });

  safeBind("#realNameForm", "submit", (event) => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;

    const realName = $("#realNameInput").value.trim();
    const idCard = $("#idCardInput").value.trim();

    if (!realName || !idCard) {
      showToast("请填写真实姓名和身份证号");
      return;
    }

    const idCardPattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-3][0-9]))\d{3}[0-9Xx]$/;
    if (!idCardPattern.test(idCard)) {
      showToast("请输入合法的18位身份证号");
      return;
    }

    let phone = user.phone;
    if (!phone) {
      const phoneInput = $("#realNamePhoneInput").value.trim();
      if (!phoneInput) {
        showToast("未绑定手机号，请补充输入手机号");
        return;
      }
      if (!/^\d{11}$/.test(phoneInput)) {
        showToast("请输入合法的11位手机号");
        return;
      }
      phone = phoneInput;
      user.phone = phone;
    }

    user.realName = realName;
    user.idCard = idCard;
    user.realNameVerified = true;

    saveState();
    renderAll();
    showToast("实名认证成功！");

    window.setTimeout(() => {
      const modal = $("#realNameModal");
      if (modal) {
        modal.style.display = "none";
        modal.classList.remove("show");
      }
    }, 1200);

    logEvent("user", `客户 '${user.name}' 成功完成实名认证 (真实姓名: ${realName})`);
  });
}

bindEvents();
initApp();

window.addEventListener("pagehide", () => {
  if (apiAvailable) {
    syncRemoteState({ keepalive: true, notify: false });
  }
});
