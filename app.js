const STORAGE_KEY = "mediapeople-dating-demo-v1";
const SESSION_KEY = `${STORAGE_KEY}:session`;
const VIP_PRICE = 399;
const API_BASE = "/api";
let currentDiscoverIndex = 0;
let activeMiniChatThreadId = null;
let activeMatchmakerChatThreadId = null;
let matchmakerChatModalOpen = false;

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
  chatThreads: [],
  chatMessages: [],
  deals: [{ id: "d1", requestId: null, amount: 399, createdAt: "2026-06-10" }],
  promoCodes: [
    { code: "VIP666", matchmakerId: "m1", used: false, usedBy: null },
    { code: "MEDIA888", matchmakerId: "m2", used: false, usedBy: null },
    { code: "LOVE999", matchmakerId: null, used: false, usedBy: null },
    { code: "1", matchmakerId: null, used: false, usedBy: null, infinite: true }
  ],
};

seedState.users.forEach((u) => {
  if (!u.vipMatchmakerIds) {
    u.vipMatchmakerIds = u.vip && u.referralMatchmakerId ? [u.referralMatchmakerId] : [];
  }
  if (!u.delegatedMatchmakerIds) {
    u.delegatedMatchmakerIds = u.referralMatchmakerId ? [u.referralMatchmakerId] : ["m1", "m2"];
  }
});

let state = structuredClone(seedState);
let session = loadSession();
let apiAvailable = false;
let currentAdminSection = "overview";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function ensureStateDefaults(s) {
  if (!s) return s;
  if (!Array.isArray(s.chatThreads)) s.chatThreads = [];
  if (!Array.isArray(s.chatMessages)) s.chatMessages = [];
  s.users.forEach((u) => {
    if (u.phone === undefined) u.phone = null;
    if (u.email === undefined) u.email = null;
    if (u.realNameVerified === undefined) u.realNameVerified = false;
    if (u.realName === undefined) u.realName = null;
    if (u.idCard === undefined) u.idCard = null;
    if (u.vip && !u.vipExpiresAt) {
      u.vipExpiresAt = "2027-06-11";
    }
    if (!u.delegatedMatchmakerIds) {
      u.delegatedMatchmakerIds = u.referralMatchmakerId ? [u.referralMatchmakerId] : ["m1", "m2"];
    }
    if (!Array.isArray(u.vipMatchmakerIds)) {
      u.vipMatchmakerIds = u.vip && u.referralMatchmakerId ? [u.referralMatchmakerId] : [];
    }
    if (!u.profileByMatchmaker || typeof u.profileByMatchmaker !== "object") {
      u.profileByMatchmaker = {};
    }
    u.vip = u.vip || u.vipMatchmakerIds.length > 0;
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
  s.requests = (s.requests || []).map((request) => {
    if (request.maleContacted === undefined) request.maleContacted = request.status === "已联系双方" || request.status === "来和双方对话" || request.status === "已联系男方" || request.status === "联系男方";
    if (request.femaleContacted === undefined) request.femaleContacted = request.status === "已联系双方" || request.status === "来和双方对话" || request.status === "已联系女方" || request.status === "联系女方";
    request.status = getRequestContactStatus(request);
    if (request.memberChatEnabled === undefined) request.memberChatEnabled = false;
    return request;
  });
  s.chatThreads = s.chatThreads.map((thread) => {
    if (thread.status === undefined) thread.status = "active";
    if (!Array.isArray(thread.participants)) thread.participants = [];
    return thread;
  });

  // Ensure 1v1 matchmaker threads exist for each request
  (s.requests || []).forEach((request) => {
    if (request.matchmakerId) {
      const fromUser = s.users.find((u) => u.id === request.fromUserId);
      const toUser = s.users.find((u) => u.id === request.toUserId);
      if (fromUser && toUser) {
        const users = [fromUser, toUser];
        const maleUser = users.find((item) => item.gender === "男") || fromUser;
        const femaleUser = users.find((item) => item.gender === "女") || toUser;
        
        let maleThread = s.chatThreads.find(
          (t) =>
            t.requestId === request.id &&
            t.type === "member_matchmaker" &&
            (t.participants || []).length === 2 &&
            t.participants.some((p) => p.role === "client" && p.id === maleUser.id)
        );
        if (!maleThread) {
          maleThread = {
            id: `ct_gen_${request.id}_male`,
            type: "member_matchmaker",
            requestId: request.id,
            status: "active",
            participants: [
              { role: "matchmaker", id: request.matchmakerId },
              { role: "client", id: maleUser.id }
            ],
            createdAt: request.createdAt || new Date().toISOString(),
            lastMessageAt: null,
            lastMessagePreview: "",
          };
          s.chatThreads.push(maleThread);
        }
        
        let femaleThread = s.chatThreads.find(
          (t) =>
            t.requestId === request.id &&
            t.type === "member_matchmaker" &&
            (t.participants || []).length === 2 &&
            t.participants.some((p) => p.role === "client" && p.id === femaleUser.id)
        );
        if (!femaleThread) {
          femaleThread = {
            id: `ct_gen_${request.id}_female`,
            type: "member_matchmaker",
            requestId: request.id,
            status: "active",
            participants: [
              { role: "matchmaker", id: request.matchmakerId },
              { role: "client", id: femaleUser.id }
            ],
            createdAt: request.createdAt || new Date().toISOString(),
            lastMessageAt: null,
            lastMessagePreview: "",
          };
          s.chatThreads.push(femaleThread);
        }
      }
    }
    if (request.memberChatEnabled && !s.chatThreads.some((t) => t.type === "member_member" && t.requestId === request.id)) {
      s.chatThreads.push({
        id: `ct_gen_${request.id}_member`,
        type: "member_member",
        requestId: request.id,
        status: "active",
        participants: [
          { role: "client", id: request.fromUserId },
          { role: "client", id: request.toUserId }
        ],
        createdAt: request.createdAt || new Date().toISOString(),
        lastMessageAt: null,
        lastMessagePreview: "",
      });
    }
  });
  return s;
}

function getRequestContactStatus(request) {
  if (request.maleContacted && request.femaleContacted) return "来和双方对话";
  if (request.maleContacted) return "联系男方";
  if (request.femaleContacted) return "联系女方";
  return "待红娘联系";
}

function getRequestUsers(request) {
  return {
    from: state.users.find((item) => item.id === request.fromUserId) || null,
    to: state.users.find((item) => item.id === request.toUserId) || null,
  };
}

function getGenderParticipants(request) {
  const { from, to } = getRequestUsers(request);
  const users = [from, to].filter(Boolean);
  const maleUser = users.find((item) => item.gender === "男") || from;
  const femaleUser = users.find((item) => item.gender === "女") || to;
  return { maleUser, femaleUser };
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
    currentUserId: null,
    selectedMatchmakerId: null,
    adminLoggedIn: false,
    token: null,
    role: null,
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

function setAuthSession(role, id, token) {
  session.role = role;
  session.token = token || null;
  if (role === "client") {
    session.currentUserId = id;
  } else if (role === "matchmaker") {
    session.selectedMatchmakerId = id;
  } else if (role === "admin") {
    session.adminLoggedIn = true;
  }
  saveSession();
}

function authHeaders() {
  return session.token ? { Authorization: `Bearer ${session.token}` } : {};
}

function setCurrentUserId(id) {
  session.currentUserId = id;
  if (!id && session.role === "client") {
    session.token = null;
    session.role = null;
  }
  saveSession();
}

function setSelectedMatchmakerId(id) {
  session.selectedMatchmakerId = id;
  if (!id && session.role === "matchmaker") {
    session.token = null;
    session.role = null;
  }
  saveSession();
}

function setAdminLoggedIn(loggedIn) {
  session.adminLoggedIn = loggedIn;
  if (!loggedIn && session.role === "admin") {
    session.token = null;
    session.role = null;
  }
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
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
      switchMiniTab("mine");
      showVipSubpanel(false);
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
        switchMiniTab("mine");
        showVipSubpanel(false);
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

function currentMatchmaker() {
  return state.matchmakers.find((matchmaker) => matchmaker.id === session.selectedMatchmakerId);
}

function getMatchmaker(id) {
  return state.matchmakers.find((matchmaker) => matchmaker.id === id);
}

function getAgency(id) {
  return state.agencies.find((agency) => agency.id === id);
}

function getUserVipMatchmakerIds(user) {
  if (!user) return [];
  if (Array.isArray(user.vipMatchmakerIds)) return user.vipMatchmakerIds;
  return user.vip && user.referralMatchmakerId ? [user.referralMatchmakerId] : [];
}

function isVipForMatchmaker(user, matchmakerId) {
  return Boolean(matchmakerId && getUserVipMatchmakerIds(user).includes(matchmakerId));
}

function addVipMatchmaker(user, matchmakerId) {
  if (!user || !matchmakerId) return;
  if (!Array.isArray(user.vipMatchmakerIds)) user.vipMatchmakerIds = getUserVipMatchmakerIds(user);
  if (!user.vipMatchmakerIds.includes(matchmakerId)) user.vipMatchmakerIds.push(matchmakerId);
  if (!Array.isArray(user.delegatedMatchmakerIds)) user.delegatedMatchmakerIds = [];
  if (!user.delegatedMatchmakerIds.includes(matchmakerId)) user.delegatedMatchmakerIds.push(matchmakerId);
  if (!user.referralMatchmakerId) user.referralMatchmakerId = matchmakerId;
  user.vip = true;
}

function getUserBoundMatchmakerIds(user) {
  if (!user) return [];
  const ids = Array.isArray(user.delegatedMatchmakerIds) ? user.delegatedMatchmakerIds : [];
  return ids.length ? ids : getUserVipMatchmakerIds(user);
}

function getVisibleProfile(user, matchmakerId) {
  const profile = user?.profileByMatchmaker?.[matchmakerId];
  return profile?.published || user;
}

function getRequestById(id) {
  return state.requests.find((request) => request.id === id);
}

function getThreadById(id) {
  return state.chatThreads.find((thread) => thread.id === id);
}

function getMatchmakerThreadForRequest(requestId, clientId) {
  const exact = state.chatThreads.find(
    (thread) =>
      thread.type === "member_matchmaker" &&
      thread.requestId === requestId &&
      (thread.participants || []).length === 2 &&
      threadHasParticipant(thread, "client", clientId),
  );
  if (exact) return exact;
  return state.chatThreads.find(
    (thread) =>
      thread.type === "member_matchmaker" &&
      thread.requestId === requestId &&
      threadHasParticipant(thread, "client", clientId),
  ) || null;
}

function getMatchmakerThreadsForRequest(requestId, matchmakerId) {
  return state.chatThreads.filter(
    (thread) =>
      thread.type === "member_matchmaker" &&
      thread.requestId === requestId &&
      threadHasParticipant(thread, "matchmaker", matchmakerId),
  );
}

function getThreadMessages(threadId) {
  return state.chatMessages
    .filter((message) => message.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function threadHasParticipant(thread, role, id) {
  return (thread.participants || []).some((participant) => participant.role === role && participant.id === id);
}

function getOtherParticipant(thread, role, id) {
  return (thread.participants || []).find((participant) => !(participant.role === role && participant.id === id)) || null;
}

function getThreadDisplayName(thread, viewerRole, viewerId) {
  if (thread.type === "member_matchmaker" && viewerRole === "client") {
    const matchmakerParticipant = (thread.participants || []).find((participant) => participant.role === "matchmaker");
    const mm = matchmakerParticipant ? getMatchmaker(matchmakerParticipant.id) : null;
    return mm ? `红娘 ${mm.name}` : "专属红娘";
  }
  if (thread.type === "member_matchmaker" && viewerRole === "matchmaker") {
    const client = (thread.participants || [])
      .filter((participant) => participant.role === "client")
      .map((participant) => state.users.find((item) => item.id === participant.id))
      .find(Boolean);
    return client ? `${client.name} (一对一沟通)` : "会员会话";
  }
  const other = getOtherParticipant(thread, viewerRole, viewerId);
  if (!other) {
    if (thread.type === "member_member") return "会员互聊";
    return "聊天会话";
  }
  if (other.role === "matchmaker") {
    const mm = getMatchmaker(other.id);
    return mm ? `红娘 ${mm.name}` : "专属红娘";
  }
  const user = state.users.find((item) => item.id === other.id);
  return user ? user.name : "会员";
}

function getThreadSubtitle(thread) {
  const request = getRequestById(thread.requestId);
  if (!request) return thread.type === "member_member" ? "会员互聊" : "会员与红娘沟通";
  const from = state.users.find((item) => item.id === request.fromUserId);
  const to = state.users.find((item) => item.id === request.toUserId);
  if (thread.type === "member_member") {
    return `互聊已开启 · ${from?.name || "会员"} 与 ${to?.name || "会员"}`;
  }
  const clients = (thread.participants || []).filter((p) => p.role === "client");
  const clientParticipant = clients[0];
  const client = clientParticipant ? state.users.find((u) => u.id === clientParticipant.id) : null;
  return `一对一沟通 · 与红娘的聊天 (${client?.name || "会员"})`;
}

function getMessageSenderName(message) {
  if (message.senderRole === "matchmaker") {
    return getMatchmaker(message.senderId)?.name || "红娘";
  }
  if (message.senderRole === "client") {
    return state.users.find((user) => user.id === message.senderId)?.name || "会员";
  }
  return "系统";
}

function createLocalThread(type, request) {
  if (type === "member_matchmaker") {
    const { maleUser, femaleUser } = getGenderParticipants(request);
    const baseId = uid("ct");

    const maleThread = {
      id: `${baseId}_male`,
      type: "member_matchmaker",
      requestId: request.id,
      status: "active",
      participants: [
        { role: "matchmaker", id: request.matchmakerId },
        { role: "client", id: maleUser.id }
      ],
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: "",
    };
    state.chatThreads.unshift(maleThread);

    const femaleThread = {
      id: `${baseId}_female`,
      type: "member_matchmaker",
      requestId: request.id,
      status: "active",
      participants: [
        { role: "matchmaker", id: request.matchmakerId },
        { role: "client", id: femaleUser.id }
      ],
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: "",
    };
    state.chatThreads.unshift(femaleThread);

    return maleThread;
  } else {
    const participants = [
      { role: "client", id: request.fromUserId },
      { role: "client", id: request.toUserId },
    ];
    const thread = {
      id: uid("ct"),
      type,
      requestId: request.id,
      status: "active",
      participants,
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: "",
    };
    state.chatThreads.unshift(thread);
    return thread;
  }
}

function appendLocalMessage(threadId, senderRole, senderId, content) {
  const message = {
    id: uid("cm"),
    threadId,
    senderRole,
    senderId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  state.chatMessages.push(message);
  const thread = getThreadById(threadId);
  if (thread) {
    thread.lastMessageAt = message.createdAt;
    thread.lastMessagePreview = message.content.slice(0, 80);
  }
  return message;
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
    switchMiniTab("mine");
    showVipSubpanel(false);
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
  const headerVipCount = user ? getUserVipMatchmakerIds(user).length : 0;
  $("#vipState").textContent = user ? (headerVipCount ? `${headerVipCount} 位红娘 VIP` : "普通用户") : "游客访客";
  $("#vipState").style.background = user ? (headerVipCount ? "#d9f7e8" : "#fff1c7") : "#eef2f5";
  $("#vipState").style.color = user ? (headerVipCount ? "#166534" : "#7a4a08") : "#6d7785";

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
      const referralInput = $("#referralCodeInput");
      const code = referralInput ? referralInput.value.trim() : "";
      const m = state.matchmakers.find(item => item.code.toUpperCase() === code.toUpperCase());
      
      if (m && !isVipForMatchmaker(user, m.id)) {
        becomeVipBtn.textContent = "为该红娘开通 VIP";
        becomeVipBtn.disabled = false;
        becomeVipBtn.style.background = ""; 
      } else {
        becomeVipBtn.textContent = m ? "已是该红娘 VIP" : "已是会员";
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
    const syncAll = $("#syncAllMatchmakersInput");
    if (syncAll) syncAll.checked = false;

    const container = $("#profileMatchmakersContainer");
    if (container) {
      container.innerHTML = state.matchmakers.map(mm => {
        const checked = (user.delegatedMatchmakerIds && user.delegatedMatchmakerIds.includes(mm.id)) ? "checked" : "";
        return `
          <label style="display: flex; align-items: center; gap: 5px; font-weight: normal; cursor: pointer;">
            <input type="checkbox" name="delegatedMatchmakers" value="${mm.id}" ${checked} />
            <span>${mm.name}</span>
          </label>
        `;
      }).join("");
    }
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

    const registerContainer = $("#registerMatchmakersContainer");
    if (registerContainer) {
      registerContainer.innerHTML = state.matchmakers.map(mm => {
        return `
          <label style="display: flex; align-items: center; gap: 5px; font-weight: normal; cursor: pointer;">
            <input type="checkbox" name="delegatedMatchmakers" value="${mm.id}" checked />
            <span>${mm.name}</span>
          </label>
        `;
      }).join("");
    }
  } else {
    $("#miniMineUnregistered").style.display = "none";
    $("#miniMineRegistered").style.display = "block";
    
    $("#miniMineAvatarBg").style.backgroundImage = `url('${user.photo}')`;
    $("#miniMineName").textContent = user.name;
    $("#miniMineDetails").textContent = `${user.gender} · ${user.age} 岁 · ${user.city}`;
    
    const badge = $("#miniMineVip");
    const vipMatchmakerIds = getUserVipMatchmakerIds(user);
    badge.textContent = vipMatchmakerIds.length ? `${vipMatchmakerIds.length} 位红娘 VIP` : "普通用户";
    badge.style.background = user.vip ? "#d9f7e8" : "#fff1c7";
    badge.style.color = user.vip ? "#166534" : "#7a4a08";

    // 动态渲染客户数据指标面板
    const userReqs = state.requests.filter(r => r.fromUserId === user.id);
    const unlockedReqs = userReqs.filter(r => r.memberChatEnabled);
    const referralMm = user.referralMatchmakerId ? getMatchmaker(user.referralMatchmakerId) : null;

    $("#mineStatRequests").textContent = userReqs.length;
    $("#mineStatVIP").textContent = vipMatchmakerIds.length ? `${vipMatchmakerIds.length} 位` : "普通";
    $("#mineStatUnlocked").textContent = unlockedReqs.length;

    // 动态设置功能选项菜单内容
    $("#mineMenuVipStatus").textContent = vipMatchmakerIds.length ? `已绑定 ${vipMatchmakerIds.length} 位红娘` : "开通会员解锁要求";
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

  if (profiles.length === 0) {
    $("#profileList").innerHTML = `<div class="request-card muted">暂无符合筛选条件的资料。</div>`;
    return;
  }

  if (currentDiscoverIndex >= profiles.length) {
    currentDiscoverIndex = 0;
  }

  const profile = profiles[currentDiscoverIndex];
  const profileMatchmakerId = getUserBoundMatchmakerIds(profile)[0] || profile.referralMatchmakerId || null;
  const profileView = getVisibleProfile(profile, profileMatchmakerId);
  
  const requirement = user.vip
    ? profileView.requirements
    : "开通会员后可查看对方的择偶要求";
  const lockedClass = user.vip ? "" : " locked";

  const delegatedMms = (profile.delegatedMatchmakerIds || [])
    .map(id => getMatchmaker(id))
    .filter(Boolean);

  let matchmakerDropdownHtml = "";
  if (delegatedMms.length > 0) {
    matchmakerDropdownHtml = `
      <label class="wide" style="display: block; margin-bottom: 12px; text-align: left;">
        <span style="font-weight: bold; margin-bottom: 6px; display: block; color: var(--coral);">选择联系的红娘：</span>
        <select id="connectMatchmakerSelect" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; outline: none; background: #fff; font-size: 13px;">
          ${delegatedMms.map(mm => `<option value="${mm.id}">${mm.name} (${mm.code})</option>`).join("")}
        </select>
      </label>
    `;
  } else {
    const fallbackMm = state.matchmakers[0];
    matchmakerDropdownHtml = `
      <label class="wide" style="display: block; margin-bottom: 12px; text-align: left;">
        <span style="font-weight: bold; margin-bottom: 6px; display: block; color: var(--coral);">选择联系的红娘：</span>
        <select id="connectMatchmakerSelect" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; outline: none; background: #fff; font-size: 13px;">
          <option value="${fallbackMm.id}">${fallbackMm.name} (${fallbackMm.code})</option>
        </select>
      </label>
    `;
  }

  $("#profileList").innerHTML = `
    <article class="profile-card" style="border: 1px solid var(--line); border-radius: 8px; background: white; overflow: hidden; display: flex; flex-direction: column;">
      <div style="background-image: url('${profileView.photo || profile.photo}'); height: 220px; background-size: cover; background-position: center; position: relative;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 15px; color: #fff;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 800; text-align: left; color: #fff;">${profileView.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 14px; text-align: left; color: #fff; opacity: 0.9;">${profileView.gender} · ${profileView.age} 岁 · ${profileView.city}</p>
        </div>
      </div>
      <div class="profile-body" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; text-align: left;">
        <div>
          <span style="font-weight: bold; color: var(--coral); font-size: 13px;">职业身份</span>
          <p style="margin: 2px 0 0 0; font-size: 14px; color: #333;">${profileView.job}</p>
        </div>
        <div>
          <span style="font-weight: bold; color: var(--coral); font-size: 13px;">自我介绍</span>
          <p style="margin: 2px 0 0 0; font-size: 14px; line-height: 1.5; color: #555;">${profileView.bio}</p>
        </div>
        <div>
          <span style="font-weight: bold; color: var(--coral); font-size: 13px;">择偶要求</span>
          <div class="requirement-box${lockedClass}" style="margin-top: 4px; padding: 10px; font-size: 14px;">${requirement}</div>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 5px 0;" />
        <div>
          ${matchmakerDropdownHtml}
        </div>
        <div style="display: flex; gap: 10px; margin-top: 5px;">
          <button class="primary-button" id="cardApplyMatchRequestBtn" data-profile-id="${profile.id}" style="flex: 1.2;" type="button">申请牵线</button>
          <button class="secondary-button" id="nextDiscoverBtn" style="flex: 0.8; background: #f3f4f6; color: #374151;" type="button">换一位 ➔</button>
        </div>
      </div>
    </article>
  `;
}

function showProfileDetail(profileId) {
  const profile = state.users.find(u => u.id === profileId);
  const user = currentUser();
  if (!profile || !user) return;
  const profileMatchmakerId = getUserBoundMatchmakerIds(profile)[0] || profile.referralMatchmakerId || null;
  const profileView = getVisibleProfile(profile, profileMatchmakerId);

  const requirement = user.vip
    ? profileView.requirements
    : "开通会员后可查看对方的择偶要求";
  const lockedClass = user.vip ? "" : " locked";

  const delegatedMms = (profile.delegatedMatchmakerIds || [])
    .map(id => getMatchmaker(id))
    .filter(Boolean);

  let matchmakerDropdownHtml = "";
  if (delegatedMms.length > 0) {
    matchmakerDropdownHtml = `
      <label class="wide" style="display: block; margin-bottom: 12px; text-align: left;">
        <span style="font-weight: bold; margin-bottom: 6px; display: block; color: var(--coral);">选择联系的红娘：</span>
        <select id="connectMatchmakerSelect" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; outline: none; background: #fff; font-size: 13px;">
          ${delegatedMms.map(mm => `<option value="${mm.id}">${mm.name} (${mm.code})</option>`).join("")}
        </select>
      </label>
    `;
  } else {
    const fallbackMm = state.matchmakers[0];
    matchmakerDropdownHtml = `
      <label class="wide" style="display: block; margin-bottom: 12px; text-align: left;">
        <span style="font-weight: bold; margin-bottom: 6px; display: block; color: var(--coral);">选择联系的红娘：</span>
        <select id="connectMatchmakerSelect" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; outline: none; background: #fff; font-size: 13px;">
          <option value="${fallbackMm.id}">${fallbackMm.name} (${fallbackMm.code})</option>
        </select>
      </label>
    `;
  }

  const existingRequest = state.requests.find(
    (r) =>
      (r.fromUserId === user.id && r.toUserId === profile.id) ||
      (r.fromUserId === profile.id && r.toUserId === user.id)
  );

  let actionHtml = "";
  if (existingRequest) {
    actionHtml = `
      <div style="background: rgba(22, 163, 74, 0.05); border: 1px solid rgba(22, 163, 74, 0.2); padding: 12px; border-radius: 8px; text-align: left;">
        <span style="font-weight: bold; color: #16a34a; font-size: 13px; display: block; margin-bottom: 4px;">牵线进度：${existingRequest.status}</span>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="primary-button" id="profileContactMmBtn" data-request-id="${existingRequest.id}" style="flex: 1; min-height: 36px; font-size: 12px; margin-bottom: 0;" type="button">💬 联系红娘</button>
          ${existingRequest.memberChatEnabled ? `<button class="secondary-button" id="profileContactMemberBtn" data-request-id="${existingRequest.id}" style="flex: 1; min-height: 36px; font-size: 12px; background: #ecfeff; border-color: rgba(15, 118, 110, 0.22); color: var(--teal-dark); margin-bottom: 0;" type="button">💬 与对方互聊</button>` : ""}
        </div>
      </div>
    `;
  } else {
    actionHtml = `
      <div>
        ${matchmakerDropdownHtml}
        <button class="primary-button wide" id="applyMatchRequestBtn" data-profile-id="${profile.id}" type="button" style="margin-top: 5px;">申请牵线</button>
      </div>
    `;
  }

  const modalBody = $("#profileDetailModalBody");
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="background-image: url('${profileView.photo || profile.photo}'); height: 200px; background-size: cover; background-position: center; border-radius: 8px; position: relative;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 15px; color: #fff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 800; text-align: left;">${profileView.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 14px; text-align: left;">${profileView.gender} · ${profileView.age} 岁 · ${profileView.city}</p>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 250px; overflow-y: auto; padding-right: 4px; text-align: left;">
        <div>
          <span style="font-weight: bold; color: var(--coral); font-size: 13px;">职业身份</span>
          <p style="margin: 2px 0 0 0; font-size: 14px; color: #333;">${profileView.job}</p>
        </div>
        <div>
          <span style="font-weight: bold; color: var(--coral); font-size: 13px;">自我介绍</span>
          <p style="margin: 2px 0 0 0; font-size: 14px; line-height: 1.5; color: #555;">${profileView.bio}</p>
        </div>
        <div>
          <span style="font-weight: bold; color: var(--coral); font-size: 13px;">择偶要求</span>
          <div class="requirement-box${lockedClass}" style="margin-top: 4px; padding: 10px; font-size: 14px;">${requirement}</div>
        </div>
      </div>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 5px 0;" />
      ${actionHtml}
    `;
  }

  const modal = $("#profileDetailModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("show");
  }
}

async function createRequest(targetUserId, matchmakerId) {
  const user = currentUser();
  const target = state.users.find((item) => item.id === targetUserId);
  const selectedMatchmakerId = matchmakerId || getUserBoundMatchmakerIds(target)[0];
  if (!selectedMatchmakerId) {
    showToast("该会员暂未绑定红娘，无法申请牵线");
    return;
  }

  const vipReady = await ensureVipForMatchmaker(selectedMatchmakerId);
  if (!vipReady) return;

  const exists = state.requests.some(
    (request) =>
      request.fromUserId === user.id &&
      request.toUserId === targetUserId &&
      request.matchmakerId === selectedMatchmakerId &&
      request.status !== "已完成",
  );
  if (exists) {
    showToast("这条牵线请求已经在处理中");
    return;
  }

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/client/match-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ targetUserId, matchmakerId: selectedMatchmakerId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast(`已通知红娘为你和${target.name}牵线`);
    } catch (err) {
      console.warn("API match request failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    const newRequest = {
      id: uid("r"),
      fromUserId: user.id,
      toUserId: targetUserId,
      matchmakerId: selectedMatchmakerId,
      status: "待红娘联系",
      maleContacted: false,
      femaleContacted: false,
      memberChatEnabled: false,
      createdAt: new Date().toISOString(),
    };
    state.requests.unshift(newRequest);
    if (selectedMatchmakerId) {
      createLocalThread("member_matchmaker", newRequest);
    }
    saveState();
    renderAll();
    showToast(`已通知红娘为你和${target.name}牵线`);
  }

  const modal = $("#profileDetailModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("show");
  }

  const matchmaker = getMatchmaker(selectedMatchmakerId);
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
        const { from, to } = getRequestUsers(request);
        const matchmaker = getMatchmaker(request.matchmakerId);
        const otherUser = request.fromUserId === user.id ? to : from;
        const unlockedWechat = request.status === "来和双方对话" ? `<div class="muted">对方微信：${otherUser?.wechat || "待同步"}</div>` : "";
        const memberChatStatus = request.memberChatEnabled
          ? `<div class="muted">会员互聊：已开启</div>`
          : `<div class="muted">会员互聊：等待红娘开通</div>`;
        return `
          <article class="request-card">
            <span class="status-pill">${request.status}</span>
            <strong>${from.name} 与 ${to.name}</strong>
            <div class="muted">负责红娘：${matchmaker?.name || "待分配"}</div>
            ${unlockedWechat}
            ${memberChatStatus}
            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button class="primary-button size-sm" data-chat-with-mm="${request.id}" style="padding: 6px 12px; font-size: 12px; min-height: auto; width: auto; margin-bottom: 0;" type="button">💬 联系红娘</button>
              ${request.memberChatEnabled ? `<button class="secondary-button size-sm" data-chat-with-member="${request.id}" style="padding: 6px 12px; font-size: 12px; min-height: auto; width: auto; background: #ecfeff; border-color: rgba(15, 118, 110, 0.22); color: var(--teal-dark); margin-bottom: 0;" type="button">💬 与对方互聊</button>` : ""}
            </div>
          </article>
        `;
      })
      .join("") || `<div class="request-card muted">还没有牵线请求。</div>`;

  renderMiniChatSections(user, requests);
}

function renderMiniChatSections(user, requests) {
  const threadList = $("#memberChatThreadsList");
  const mutualList = $("#memberMutualChatList");
  const panel = $("#miniChatPanel");
  const panelTitle = $("#miniChatTitle");
  const panelMeta = $("#miniChatMeta");
  const messagesEl = $("#miniChatMessages");
  const emptyEl = $("#miniChatEmpty");
  const input = $("#miniChatInput");
  if (!threadList || !mutualList || !panel || !panelTitle || !panelMeta || !messagesEl || !emptyEl || !input) return;

  const accessibleThreads = state.chatThreads.filter((thread) => threadHasParticipant(thread, "client", user.id));
  const mmThreads = accessibleThreads.filter((thread) => thread.type === "member_matchmaker" && (thread.participants || []).length === 2);
  const memberThreads = accessibleThreads.filter((thread) => {
    if (thread.type !== "member_member") return false;
    const req = getRequestById(thread.requestId);
    return Boolean(req?.memberChatEnabled);
  });

  if (!activeMiniChatThreadId || !accessibleThreads.some((thread) => thread.id === activeMiniChatThreadId)) {
    activeMiniChatThreadId = mmThreads[0]?.id || memberThreads[0]?.id || null;
  }

  threadList.innerHTML =
    mmThreads
      .map((thread) => {
        const active = thread.id === activeMiniChatThreadId ? " active" : "";
        const preview = thread.lastMessagePreview || "向红娘留言，沟通你的想法和顾虑。";
        return `
          <button class="chat-thread-card${active}" type="button" data-open-thread="${thread.id}">
            <strong>${getThreadDisplayName(thread, "client", user.id)}</strong>
            <span>${getThreadSubtitle(thread)}</span>
            <em>${preview}</em>
          </button>
        `;
      })
      .join("") || `<div class="request-card muted">发起牵线后，这里会出现你和红娘的聊天窗口。</div>`;

  mutualList.innerHTML =
    requests
      .filter((request) => request.fromUserId === user.id || request.toUserId === user.id)
      .map((request) => {
        const thread = memberThreads.find((item) => item.requestId === request.id);
        const otherUser =
          request.fromUserId === user.id
            ? state.users.find((item) => item.id === request.toUserId)
            : state.users.find((item) => item.id === request.fromUserId);
        if (!thread) {
          return `
            <div class="request-card muted">
              <strong>${otherUser?.name || "会员"}</strong>
              <div>${request.memberChatEnabled ? "聊天线程生成中，请稍候刷新。" : "红娘开通后，这里会出现双方互聊入口。"}</div>
            </div>
          `;
        }
        const active = thread.id === activeMiniChatThreadId ? " active" : "";
        const preview = thread.lastMessagePreview || "你们现在可以直接聊天了。";
        return `
          <button class="chat-thread-card${active}" type="button" data-open-thread="${thread.id}">
            <strong>${getThreadDisplayName(thread, "client", user.id)}</strong>
            <span>${getThreadSubtitle(thread)}</span>
            <em>${preview}</em>
          </button>
        `;
      })
      .join("") || `<div class="request-card muted">暂无会员互聊会话。</div>`;

  const activeThread = getThreadById(activeMiniChatThreadId);
  if (!activeThread) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  panelTitle.textContent = getThreadDisplayName(activeThread, "client", user.id);
  panelMeta.textContent = getThreadSubtitle(activeThread);
  const messages = getThreadMessages(activeThread.id);
  if (!messages.length) {
    emptyEl.style.display = "block";
    messagesEl.innerHTML = "";
  } else {
    emptyEl.style.display = "none";
    messagesEl.innerHTML = messages
      .map((message) => {
        const mine = message.senderRole === "client" && message.senderId === user.id;
        return `
          <article class="chat-bubble${mine ? " mine" : ""}">
            <strong>${mine ? "我" : getMessageSenderName(message)}</strong>
            <p>${message.content}</p>
            <span>${new Date(message.createdAt).toLocaleString("zh-CN")}</span>
          </article>
        `;
      })
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  input.placeholder = activeThread.type === "member_member" ? "和对方打个招呼吧" : "把你的想法发给红娘";
  input.focus();
}

async function becomeVip() {
  const code = $("#referralCodeInput").value.trim();
  const matchmaker = state.matchmakers.find(
    (item) => item.code.toUpperCase() === code.toUpperCase(),
  );
  if (!matchmaker) {
    showToast("推荐码无效，请输入后台已登记的红娘推荐码");
    return;
  }

  const user = currentUser();
  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/client/vip/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ referralCode: code })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast(`已开通 VIP，推广红娘为${matchmaker.name}`);
    } catch (err) {
      console.warn("API become vip failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    addVipMatchmaker(user, matchmaker.id);
    user.vipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    state.deals.unshift({
      id: uid("d"),
      requestId: null,
      amount: VIP_PRICE,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    saveState();
    renderAll();
    showToast(`已开通 VIP，推广红娘为${matchmaker.name}`);
  }

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

async function ensureVipForMatchmaker(matchmakerId) {
  const user = currentUser();
  const matchmaker = getMatchmaker(matchmakerId);
  if (!user || !matchmaker) return false;
  if (isVipForMatchmaker(user, matchmakerId)) return true;

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/client/vip/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ referralCode: matchmaker.code })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("API ensure vip failed:", err);
      showToast("开通该红娘 VIP 失败：" + err.message);
      return false;
    }
  } else {
    addVipMatchmaker(user, matchmakerId);
    user.vipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    state.deals.unshift({
      id: uid("d"),
      requestId: null,
      amount: VIP_PRICE,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    saveState();
  }

  showToast(`已成为${matchmaker.name}的专属 VIP`);
  return true;
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

async function redeemVip() {
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

  const redeemBtn = $("#redeemVipBtn");

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/client/vip/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ code: rawCode })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      if (redeemBtn) {
        redeemBtn.textContent = "有效";
        redeemBtn.style.background = "#10b981"; // green
      }
      
      renderAll();
      $("#vipPromoCodeInput").value = "";
    } catch (err) {
      console.warn("API redeem VIP failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    if (!promoCode.infinite) {
      promoCode.used = true;
      promoCode.usedBy = user.id;
    }

    user.vipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    if (redeemBtn) {
      redeemBtn.textContent = "有效";
      redeemBtn.style.background = "#10b981"; // green
    }

    let matchmaker = null;
    if (promoCode.matchmakerId) {
      matchmaker = getMatchmaker(promoCode.matchmakerId);
      if (matchmaker) {
        addVipMatchmaker(user, matchmaker.id);
      }
    } else {
      user.vip = true;
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
  }

  let matchmaker = null;
  if (promoCode.matchmakerId) {
    matchmaker = getMatchmaker(promoCode.matchmakerId);
  }

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

async function generateRandomPromoCode() {
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

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/admin/promo-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ code: randomCode, matchmakerId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
    } catch (err) {
      console.warn("API generate promo code failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    const newCode = {
      code: randomCode,
      matchmakerId: matchmakerId,
      used: false,
      usedBy: null,
    };
    state.promoCodes.unshift(newCode);
    saveState();
    renderAll();
  }

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
  const pendingProfiles = state.users
    .map((user) => ({ user, profile: user.profileByMatchmaker?.[mmId] }))
    .filter((item) => item.profile?.status === "pending");
  $("#notificationCount").textContent = `${requests.filter((item) => item.status !== "来和双方对话").length + pendingProfiles.length} 条待处理`;
  const requestHtml =
    requests
      .map((request) => {
        const { from, to } = getRequestUsers(request);
        const { maleUser, femaleUser } = getGenderParticipants(request);
        const maleBtn =
          maleUser
            ? `<button class="secondary-button${request.maleContacted ? " contacted" : ""}" data-contact-request="${request.id}" data-contact-side="male" type="button">${request.maleContacted ? "✓ 联系男方" : "联系男方"}</button>`
            : "";
        const femaleBtn =
          femaleUser
            ? `<button class="secondary-button${request.femaleContacted ? " contacted" : ""}" data-contact-request="${request.id}" data-contact-side="female" type="button">${request.femaleContacted ? "✓ 联系女方" : "联系女方"}</button>`
            : "";
        const talkBothBtn =
          request.status === "来和双方对话"
            ? `<button class="primary-button" data-talk-both="${request.id}" type="button" style="width: auto;">来和双方对话</button>`
            : "";
        const chatToggleBtn = request.memberChatEnabled
          ? `<button class="ghost-button" data-toggle-member-chat="${request.id}" data-chat-enabled="false" type="button" style="width: auto;">关闭双方沟通</button>`
          : `<button class="primary-button" data-toggle-member-chat="${request.id}" data-chat-enabled="true" type="button" style="width: auto;">开通双方沟通</button>`;
        const approvedTag = `<div class="muted">会员互聊：${request.memberChatEnabled ? "已开启" : "未开启"}</div>`;
        return `
          <article class="request-card">
            <span class="status-pill">${request.status}</span>
            <strong>${from.name} 申请认识 ${to.name}</strong>
            <div class="muted">${new Date(request.createdAt).toLocaleString("zh-CN")}</div>
            <div class="muted">${maleUser?.name || "男方"}：${request.maleContacted ? "已联系" : "待联系"} ｜ ${femaleUser?.name || "女方"}：${request.femaleContacted ? "已联系" : "待联系"}</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
              ${maleBtn}
              ${femaleBtn}
              ${talkBothBtn}
              ${chatToggleBtn}
            </div>
            ${approvedTag}
          </article>
        `;
      })
      .join("");
  const profileReviewHtml = pendingProfiles
    .map(({ user, profile }) => {
      const draft = profile.draft || user;
      return `
        <article class="request-card">
          <span class="status-pill">资料待审核</span>
          <strong>${draft.name || user.name} 的资料更新</strong>
          <div class="muted">${draft.gender || user.gender} · ${draft.age || user.age} 岁 · ${draft.city || user.city}</div>
          <div class="muted">职业：${draft.job || "-"}</div>
          <div class="muted">自我介绍：${draft.bio || "-"}</div>
          <div class="muted">择偶要求：${draft.requirements || "-"}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
            <button class="primary-button" data-profile-review="${user.id}" data-review-action="approve" type="button" style="width:auto;">审核通过</button>
            <button class="ghost-button" data-profile-review="${user.id}" data-review-action="reject" type="button" style="width:auto;">退回修改</button>
          </div>
        </article>
      `;
    })
    .join("");
  $("#notificationList").innerHTML = requestHtml + profileReviewHtml || `<div class="request-card muted">暂无应用通知。</div>`;

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

  renderMatchmakerChats(mmId);
}

function renderMatchmakerChats(matchmakerId) {
  const list = $("#matchmakerChatThreadList");
  const panel = $("#matchmakerChatPanel");
  const title = $("#matchmakerChatTitle");
  const meta = $("#matchmakerChatMeta");
  const messagesEl = $("#matchmakerChatMessages");
  const emptyEl = $("#matchmakerChatEmpty");
  const input = $("#matchmakerChatInput");
  if (!list || !panel || !title || !meta || !messagesEl || !emptyEl || !input) return;

  const threads = state.chatThreads.filter(
    (thread) =>
      thread.type === "member_matchmaker" &&
      (thread.participants || []).length === 2 &&
      threadHasParticipant(thread, "matchmaker", matchmakerId),
  );
  if (!activeMatchmakerChatThreadId || !threads.some((thread) => thread.id === activeMatchmakerChatThreadId)) {
    activeMatchmakerChatThreadId = threads[0]?.id || null;
  }

  list.innerHTML =
    threads
      .map((thread) => {
        const active = thread.id === activeMatchmakerChatThreadId ? " active" : "";
        const preview = thread.lastMessagePreview || "这里可以和会员直接沟通牵线进度。";
        return `
          <button class="chat-thread-card${active}" type="button" data-open-mm-thread="${thread.id}">
            <strong>${getThreadDisplayName(thread, "matchmaker", matchmakerId)}</strong>
            <span>${getThreadSubtitle(thread)}</span>
            <em>${preview}</em>
          </button>
        `;
      })
      .join("") || `<div class="request-card muted">牵线单创建后，这里会自动出现会员聊天。</div>`;

  const activeThread = getThreadById(activeMatchmakerChatThreadId);
  if (!activeThread || !matchmakerChatModalOpen) {
    panel.style.display = "none";
    panel.classList.remove("show");
    return;
  }

  panel.style.display = "flex";
  panel.classList.add("show");
  title.textContent = getThreadDisplayName(activeThread, "matchmaker", matchmakerId);
  meta.textContent = getThreadSubtitle(activeThread);
  const messages = getThreadMessages(activeThread.id);
  if (!messages.length) {
    emptyEl.style.display = "block";
    messagesEl.style.display = "none";
    messagesEl.innerHTML = "";
  } else {
    emptyEl.style.display = "none";
    messagesEl.style.display = "flex";
    messagesEl.innerHTML = messages
      .map((message) => {
        const mine = message.senderRole === "matchmaker" && message.senderId === matchmakerId;
        return `
          <article class="chat-bubble${mine ? " mine" : ""}">
            <strong>${mine ? "我" : getMessageSenderName(message)}</strong>
            <p>${message.content}</p>
            <span>${new Date(message.createdAt).toLocaleString("zh-CN")}</span>
          </article>
        `;
      })
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  input.placeholder = "给会员发送消息";
  input.focus();
}

async function completeRequest(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  await contactRequestSide(requestId, request.maleContacted ? "female" : "male");
}

function openThreeWayChat(requestId) {
  const request = getRequestById(requestId);
  const { maleUser, femaleUser } = request ? getGenderParticipants(request) : { maleUser: null, femaleUser: null };
  const thread =
    (maleUser && getMatchmakerThreadForRequest(requestId, maleUser.id)) ||
    (femaleUser && getMatchmakerThreadForRequest(requestId, femaleUser.id)) ||
    null;
  if (thread) {
    activeMatchmakerChatThreadId = thread.id;
    matchmakerChatModalOpen = true;
    showToast("已打开双方会话");
  } else {
    showToast("未找到会话，请刷新页面");
  }
  renderAll();
}

async function contactRequestSide(requestId, side) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  if (!["male", "female"].includes(side)) return;

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/matchmaker/requests/${requestId}/contacted`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ side })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showToast(`已标记联系${side === "male" ? "男方" : "女方"}，正在打开聊天…`);
    } catch (err) {
      console.warn("API complete request failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    if (side === "male") request.maleContacted = true;
    if (side === "female") request.femaleContacted = true;
    request.status = getRequestContactStatus(request);
    saveState();
    showToast(`已标记联系${side === "male" ? "男方" : "女方"}，正在打开聊天…`);
  }

  const updatedRequest = getRequestById(requestId) || request;
  const { from, to } = getRequestUsers(updatedRequest);
  const { maleUser, femaleUser } = getGenderParticipants(updatedRequest);
  const matchmaker = getMatchmaker(updatedRequest.matchmakerId);
  const contactedUser = side === "male" ? maleUser : femaleUser;

  // 自动跳转到该方会员的聊天窗口
  const contactedUserId = contactedUser?.id;
  if (contactedUserId) {
    let thread = state.chatThreads.find(
      (t) => t.type === "member_matchmaker" && t.requestId === requestId &&
        (t.participants || []).length === 2 &&
        (t.participants || []).some((p) => p.role === "client" && p.id === contactedUserId)
    );
    if (!thread) {
      thread = state.chatThreads.find(
        (t) => t.type === "member_matchmaker" && t.requestId === requestId &&
          (t.participants || []).some((p) => p.role === "client" && p.id === contactedUserId)
      );
    }
    if (thread) {
      activeMatchmakerChatThreadId = thread.id;
      matchmakerChatModalOpen = true;
    }
  }

  renderAll();

  logEvent("match", `红娘 '${matchmaker?.name}' 联系${side === "male" ? "男方" : "女方"}：${contactedUser?.name || "会员"}，当前进度 ${updatedRequest.status}`);

  if (updatedRequest.status === "来和双方对话") {
    showPushNotification("【牵线成功进度通知】", {
      "牵线红娘": matchmaker?.name || "专属红娘",
      "心仪嘉宾": to.name,
      "微信号码": to.wechat,
      "温馨提示": "红娘已确认双方信息，请复制微信号添加好友并备注“缘定传媒人”。"
    });
  }
}

async function toggleMemberChat(requestId, enabled) {
  const request = getRequestById(requestId);
  if (!request) return;

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/matchmaker/requests/${requestId}/member-chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("API toggle member chat failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    request.memberChatEnabled = enabled;
    if (enabled && !state.chatThreads.some((thread) => thread.type === "member_member" && thread.requestId === requestId)) {
      createLocalThread("member_member", request);
    }
    saveState();
  }

  renderAll();
  showToast(enabled ? "已开通双方沟通" : "已关闭双方沟通");
}

async function reviewMatchmakerProfile(userId, action) {
  const mm = currentMatchmaker();
  const user = state.users.find((item) => item.id === userId);
  if (!mm || !user) return;

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/matchmaker/users/${userId}/profile-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("API profile review failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    const profile = user.profileByMatchmaker?.[mm.id];
    if (!profile) return;
    if (action === "approve") {
      profile.published = profile.draft || user;
      profile.status = "approved";
    } else {
      profile.status = "rejected";
    }
    profile.reviewedAt = new Date().toISOString();
    profile.reviewedBy = mm.id;
    saveState();
  }

  renderAll();
  showToast(action === "approve" ? "资料已审核通过" : "资料已退回修改");
}

async function sendMiniChatMessage(event) {
  event.preventDefault();
  const thread = getThreadById(activeMiniChatThreadId);
  const user = currentUser();
  const input = $("#miniChatInput");
  if (!thread || !user || !input) return;
  if (thread.type === "member_member" && !getRequestById(thread.requestId)?.memberChatEnabled) {
    showToast("红娘暂未开通双方沟通权限");
    return;
  }
  const content = input.value.trim();
  if (!content) return;

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/chat/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      input.value = "";
      renderAll();
    } catch (err) {
      console.warn("API send mini chat failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    appendLocalMessage(thread.id, "client", user.id, content);
    input.value = "";
    saveState();
    renderAll();
  }
}

async function sendMatchmakerChatMessage(event) {
  event.preventDefault();
  const thread = getThreadById(activeMatchmakerChatThreadId);
  const matchmaker = currentMatchmaker();
  const input = $("#matchmakerChatInput");
  if (!thread || !matchmaker || !input) return;
  const content = input.value.trim();
  if (!content) return;

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/chat/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      input.value = "";
      renderAll();
    } catch (err) {
      console.warn("API send matchmaker chat failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    appendLocalMessage(thread.id, "matchmaker", matchmaker.id, content);
    input.value = "";
    saveState();
    renderAll();
  }
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
  switchAdminSection(currentAdminSection);
}

function switchAdminSection(section) {
  const panels = $$("[data-admin-panel]");
  if (!panels.length) return;

  const nextSection = panels.some((panel) => panel.dataset.adminPanel === section)
    ? section
    : "overview";
  currentAdminSection = nextSection;

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === nextSection);
  });
  $$("[data-admin-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === nextSection);
  });
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

async function addAgency(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const city = form.elements.city.value.trim();

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/admin/agencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, city })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      form.reset();
      renderAll();
      showToast("机构已添加");
    } catch (err) {
      console.warn("API add agency failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    state.agencies.push({
      id: uid("a"),
      name,
      city,
    });
    form.reset();
    saveState();
    renderAll();
    showToast("机构已添加");
  }
}

async function addMatchmaker(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const agencyId = form.elements.agencyId.value;
  const code = form.elements.code.value.trim().toUpperCase();

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/admin/matchmakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, agencyId, code })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      form.reset();
      renderAll();
      showToast("红娘已添加");
    } catch (err) {
      console.warn("API add matchmaker failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    state.matchmakers.push({
      id: uid("m"),
      name,
      agencyId,
      code,
    });
    form.reset();
    saveState();
    renderAll();
    showToast("红娘已添加");
  }
}

async function saveSplits(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const promo = Number(form.elements.promo.value);
  const matchmaker = Number(form.elements.matchmaker.value);
  const platform = Number(form.elements.platform.value);
  const total = promo + matchmaker + platform;
  if (total !== 100) {
    showToast(`当前合计为 ${total}%，请调整为 100%`);
    return;
  }

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/admin/splits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ promo, matchmaker, platform })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast("分成比例已保存");
    } catch (err) {
      console.warn("API save splits failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    state.splits = { promo, matchmaker, platform };
    saveState();
    renderAll();
    showToast("分成比例已保存");
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const user = currentUser();
  const updatedData = {};
  ["name", "gender", "city", "job", "wechat", "bio", "requirements"].forEach((key) => {
    updatedData[key] = form.elements[key].value.trim();
  });
  updatedData.age = Number(form.elements.age.value);

  const delegatedMmCheckboxes = form.querySelectorAll('input[name="delegatedMatchmakers"]:checked');
  const delegatedMatchmakerIds = Array.from(delegatedMmCheckboxes).map(cb => cb.value);
  updatedData.delegatedMatchmakerIds = delegatedMatchmakerIds;
  updatedData.referralMatchmakerId = delegatedMatchmakerIds[0] || null;
  updatedData.syncAllMatchmakers = Boolean(form.elements.syncAllMatchmakers?.checked);
  const previousPublishedProfile = {
    name: user.name,
    gender: user.gender,
    age: user.age,
    city: user.city,
    job: user.job,
    wechat: user.wechat,
    bio: user.bio,
    requirements: user.requirements,
    photo: user.photo,
  };

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/client/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast("个人资料已提交红娘审核");
    } catch (err) {
      console.warn("API save profile failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    Object.assign(user, updatedData);
    if (!user.profileByMatchmaker) user.profileByMatchmaker = {};
    const ids = updatedData.syncAllMatchmakers ? getUserVipMatchmakerIds(user) : delegatedMatchmakerIds;
    ids.forEach((matchmakerId) => {
      const currentProfile = user.profileByMatchmaker[matchmakerId] || {};
      user.profileByMatchmaker[matchmakerId] = {
        ...currentProfile,
        published: currentProfile.published || previousPublishedProfile,
        draft: {
          name: user.name,
          gender: user.gender,
          age: user.age,
          city: user.city,
          job: user.job,
          wechat: user.wechat,
          bio: user.bio,
          requirements: user.requirements,
          photo: user.photo,
        },
        status: "pending",
        updatedAt: new Date().toISOString(),
      };
    });
    saveState();
    renderAll();
    showToast("个人资料已提交红娘审核");
  }
}

async function seedDeal() {
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

  if (apiAvailable) {
    try {
      const res = await fetch(`${API_BASE}/admin/deals/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "failed");
      }
      const data = await res.json();
      state = data.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      showToast("已模拟新增一笔成交");
    } catch (err) {
      console.warn("API simulate deal failed, fallback to local:", err);
      showToast("操作失败：" + err.message);
      return;
    }
  } else {
    state.deals.unshift({
      id: uid("d"),
      requestId: latestReq?.id || null,
      amount: VIP_PRICE,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    saveState();
    renderAll();
    showToast("已模拟新增一笔成交");
  }

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
async function mmAuthLogin() {
  const selectedId = $("#mmLoginSelect").value;
  const m = state.matchmakers.find((item) => item.id === selectedId);
  if (!m) return;

  if (apiAvailable) {
    try {
      const response = await fetch(`${API_BASE}/auth/matchmaker/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchmakerId: selectedId }),
      });
      if (!response.ok) throw new Error("login failed");
      const data = await response.json();
      setAuthSession("matchmaker", selectedId, data.token);
    } catch (error) {
      showToast("红娘登录失败，请稍后重试");
      return;
    }
  } else {
    setAuthSession("matchmaker", selectedId, null);
  }
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

  let data;
  try {
    const response = await fetch(`${API_BASE}/auth/matchmaker/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        agencyId: form.elements.agencyId.value,
        code,
        phone,
        email,
        password,
      }),
    });
    if (!response.ok) throw new Error("register failed");
    data = await response.json();
  } catch (error) {
    showToast("红娘注册失败，请检查手机号、邮箱或推荐码是否重复");
    return;
  }

  state = ensureStateDefaults(data.state || state);
  setAuthSession("matchmaker", data.matchmaker.id, data.token);
  form.reset();
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
async function adminAuthLogin(event) {
  event.preventDefault();
  const password = $("#adminPasswordInput").value;
  try {
    const response = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) throw new Error("invalid");
    const data = await response.json();
    setAuthSession("admin", "admin", data.token);
  } catch (error) {
    showToast("密码错误！默认演示密码为 admin");
    return;
  }
  const is8098 = isAdminView();
  navigate(is8098 ? "/console" : "/admin/console");
  logEvent("sys", "管理员成功安全登录管理控制台");
  showToast("管理员登录成功");
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

  const delegatedMmCheckboxes = form.querySelectorAll('input[name="delegatedMatchmakers"]:checked');
  const delegatedMatchmakerIds = Array.from(delegatedMmCheckboxes).map(cb => cb.value);

  let data;
  try {
    const response = await fetch(`${API_BASE}/auth/client/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        gender,
        age: Number(form.elements.age.value),
        city: form.elements.city.value.trim(),
        job: form.elements.job.value.trim(),
        wechat: form.elements.wechat.value.trim(),
        phone,
        email,
        password,
        bio: form.elements.bio.value.trim(),
        requirements: form.elements.requirements.value.trim(),
        photo,
        delegatedMatchmakerIds,
      }),
    });
    if (!response.ok) throw new Error("register failed");
    data = await response.json();
  } catch (error) {
    showToast("客户注册失败，请检查手机号或邮箱是否重复");
    return;
  }

  state = ensureStateDefaults(data.state || state);
  setAuthSession("client", data.user.id, data.token);
  form.reset();
  const is8096 = isMiniView();
  navigate(is8096 ? "/discover" : "/mini/discover");
  renderAll();
  showToast(`注册成功！已为您登录为 ${name}`);

  logEvent("user", `新客户在小程序端注册成功：${name} (${gender}·${data.user.age}岁·${data.user.city})`);
  showPushNotification("【客户注册成功通知】", {
    "注册客户": name,
    "性别年龄": `${gender} · ${data.user.age}岁`,
    "微信账号": data.user.wechat,
    "职业城市": `${data.user.job} · ${data.user.city}`
  });
}

// Mini Program Switch Existing User
async function miniSwitchUser() {
  const selectedId = $("#miniSwitchUserSelect").value;
  const user = state.users.find((u) => u.id === selectedId);
  if (!user) return;

  if (apiAvailable) {
    try {
      const response = await fetch(`${API_BASE}/auth/client/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedId }),
      });
      if (!response.ok) throw new Error("login failed");
      const data = await response.json();
      setAuthSession("client", selectedId, data.token);
    } catch (error) {
      showToast("客户登录失败，请稍后重试");
      return;
    }
  } else {
    setAuthSession("client", selectedId, null);
  }
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
        vip: "/vip",
        requests: "/requests",
        mine: "/my"
      };
      const path = prefix + (tabPathMap[tab] || "/discover");
      navigate(path);
    });
  });
  
  ["#genderFilter", "#cityFilter", "#ageFilter"].forEach((selector) => {
    safeBind(selector, "change", () => {
      currentDiscoverIndex = 0;
      renderProfiles();
    });
  });
  
  safeBind("#profileList", "click", (event) => {
    const nextBtn = event.target.closest("#nextDiscoverBtn");
    if (nextBtn) {
      currentDiscoverIndex++;
      renderProfiles();
      return;
    }
    const applyBtn = event.target.closest("#cardApplyMatchRequestBtn");
    if (applyBtn) {
      const select = $("#connectMatchmakerSelect");
      const matchmakerId = select ? select.value : null;
      if (!matchmakerId) {
        showToast("请选择联系的红娘");
        return;
      }
      createRequest(applyBtn.dataset.profileId, matchmakerId);
      return;
    }
  });

  safeBind("#closeProfileDetailModalBtn", "click", () => {
    const modal = $("#profileDetailModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("show");
    }
  });

  safeBind("#profileDetailModal", "click", (event) => {
    const user = currentUser();
    if (event.target === event.currentTarget) {
      event.currentTarget.style.display = "none";
      event.currentTarget.classList.remove("show");
      return;
    }
    const applyBtn = event.target.closest("#applyMatchRequestBtn");
    if (applyBtn) {
      const select = $("#connectMatchmakerSelect");
      const matchmakerId = select ? select.value : null;
      if (!matchmakerId) {
        showToast("请选择联系的红娘");
        return;
      }
      createRequest(applyBtn.dataset.profileId, matchmakerId);
      return;
    }
    const profileContactMmBtn = event.target.closest("#profileContactMmBtn");
    if (profileContactMmBtn && user) {
      const requestId = profileContactMmBtn.dataset.requestId;
      const modal = $("#profileDetailModal");
      if (modal) {
        modal.style.display = "none";
        modal.classList.remove("show");
      }
      navigate("/mini/requests");
      setTimeout(() => {
        const thread = getMatchmakerThreadForRequest(requestId, user.id);
        if (thread) {
          activeMiniChatThreadId = thread.id;
          renderAll();
          const chatPanel = $("#miniChatPanel");
          if (chatPanel) {
            chatPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else {
          showToast("未找到该聊天，请稍后刷新");
        }
      }, 100);
      return;
    }
    const profileContactMemberBtn = event.target.closest("#profileContactMemberBtn");
    if (profileContactMemberBtn) {
      const requestId = profileContactMemberBtn.dataset.requestId;
      const modal = $("#profileDetailModal");
      if (modal) {
        modal.style.display = "none";
        modal.classList.remove("show");
      }
      navigate("/mini/requests");
      setTimeout(() => {
        const thread = state.chatThreads.find(
          (t) => t.type === "member_member" && t.requestId === requestId
        );
        if (thread) {
          activeMiniChatThreadId = thread.id;
          renderAll();
          const chatPanel = $("#miniChatPanel");
          if (chatPanel) {
            chatPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else {
          showToast("未找到会员互聊会话，请稍后刷新");
        }
      }, 100);
      return;
    }
  });
  
  safeBind("#notificationList", "click", (event) => {
    const button = event.target.closest("[data-contact-request]");
    if (button) {
      contactRequestSide(button.dataset.contactRequest, button.dataset.contactSide);
      return;
    }
    const talkBothButton = event.target.closest("[data-talk-both]");
    if (talkBothButton) {
      openThreeWayChat(talkBothButton.dataset.talkBoth);
      return;
    }
    const toggleMemberChatButton = event.target.closest("[data-toggle-member-chat]");
    if (toggleMemberChatButton) {
      toggleMemberChat(
        toggleMemberChatButton.dataset.toggleMemberChat,
        toggleMemberChatButton.dataset.chatEnabled === "true",
      );
      return;
    }
    const profileReviewButton = event.target.closest("[data-profile-review]");
    if (profileReviewButton) {
      reviewMatchmakerProfile(profileReviewButton.dataset.profileReview, profileReviewButton.dataset.reviewAction);
      return;
    }
  });

  safeBind("#requestsContent", "click", (event) => {
    const user = currentUser();
    if (!user) return;

    const openThreadButton = event.target.closest("[data-open-thread]");
    if (openThreadButton) {
      activeMiniChatThreadId = openThreadButton.dataset.openThread;
      renderAll();
      return;
    }

    const chatWithMmButton = event.target.closest("[data-chat-with-mm]");
    if (chatWithMmButton) {
      const requestId = chatWithMmButton.dataset.chatWithMm;
      const thread = getMatchmakerThreadForRequest(requestId, user.id);
      if (thread) {
        activeMiniChatThreadId = thread.id;
        renderAll();
        const chatPanel = $("#miniChatPanel");
        if (chatPanel) {
          chatPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } else {
        showToast("未找到该聊天，请稍后刷新");
      }
      return;
    }

    const chatWithMemberButton = event.target.closest("[data-chat-with-member]");
    if (chatWithMemberButton) {
      const requestId = chatWithMemberButton.dataset.chatWithMember;
      const thread = state.chatThreads.find(
        (t) => t.type === "member_member" && t.requestId === requestId
      );
      if (thread) {
        activeMiniChatThreadId = thread.id;
        renderAll();
        const chatPanel = $("#miniChatPanel");
        if (chatPanel) {
          chatPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } else {
        showToast("未找到会员互聊会话，请稍后刷新");
      }
      return;
    }
  });

  safeBind("#matchmakerChatThreadList", "click", (event) => {
    const openThreadButton = event.target.closest("[data-open-mm-thread]");
    if (openThreadButton) {
      activeMatchmakerChatThreadId = openThreadButton.dataset.openMmThread;
      matchmakerChatModalOpen = true;
      renderAll();
    }
  });

  safeBind("#miniChatForm", "submit", sendMiniChatMessage);
  safeBind("#matchmakerChatForm", "submit", sendMatchmakerChatMessage);

  safeBind("#matchmakerChatPanel", "click", (event) => {
    console.log("Chat panel clicked, target ID:", event.target.id, "class:", event.target.className);
    const closeBtn = event.target.closest("#closeMatchmakerChatModalBtn");
    if (event.target === event.currentTarget || closeBtn) {
      console.log("Closing matchmaker chat panel modal...");
      matchmakerChatModalOpen = false;
      activeMatchmakerChatThreadId = null;
      renderAll();
    }
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
      if (dropdownPanel.style.display === "block" && !e.target.closest(".searchable-select")) {
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

  // 管理员后台左侧栏目导航：点击切换右侧显示的栏目
  $$("[data-admin-section]").forEach((button) => {
    button.addEventListener("click", () => {
      switchAdminSection(button.dataset.adminSection);
    });
  });

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

  safeBind("#realNameForm", "submit", async (event) => {
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
    }

    if (apiAvailable) {
      try {
        const res = await fetch(`${API_BASE}/client/real-name`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ realName, idCard, phone })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "failed");
        }
        const data = await res.json();
        state = data.state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
        showToast("实名认证成功！");
      } catch (err) {
        console.warn("API real name failed, fallback to local:", err);
        showToast("操作失败：" + err.message);
        return;
      }
    } else {
      user.phone = phone;
      user.realName = realName;
      user.idCard = idCard;
      user.realNameVerified = true;
      saveState();
      renderAll();
      showToast("实名认证成功！");
    }

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
