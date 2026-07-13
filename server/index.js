import express from "express";
import { createServer } from "http";
import pg from "pg";
import crypto from "crypto";
import { WebSocketServer } from "ws";

const { Pool } = pg;
const PORT = Number(process.env.PORT || 3000);
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.ADMIN_API_TOKEN || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const INSECURE_DEFAULT_SECRET = "matchmaker-dev-secret-change-me";
const FALLBACK_TOKEN_SECRET = INSECURE_DEFAULT_SECRET;
const FALLBACK_ADMIN_PASSWORD = "admin";

function assertProductionSecrets() {
  // 生产环境必须显式配置 JWT_SECRET 和 ADMIN_PASSWORD，禁止使用源码默认值。
  if (process.env.NODE_ENV !== "production") return;
  if (!TOKEN_SECRET || TOKEN_SECRET === INSECURE_DEFAULT_SECRET) {
    throw new Error("生产环境必须设置 JWT_SECRET 环境变量且不能使用默认值");
  }
  if (TOKEN_SECRET.length < 16) {
    throw new Error("生产环境 JWT_SECRET 长度必须 >= 16");
  }
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD === FALLBACK_ADMIN_PASSWORD) {
    throw new Error("生产环境必须设置 ADMIN_PASSWORD 环境变量且不能使用默认值 admin");
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error("生产环境 ADMIN_PASSWORD 长度必须 >= 8");
  }
}

assertProductionSecrets();
const EFFECTIVE_TOKEN_SECRET = TOKEN_SECRET || FALLBACK_TOKEN_SECRET;
const EFFECTIVE_ADMIN_PASSWORD = ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD;
const SERVICE_PLANS = {
  trial_3d: {
    id: "trial_3d", name: "3天体验卡", price: 29.9, durationDays: 3,
    totalMatchLimit: 1, weeklyMatchLimit: 1, weeklyFollowupLimit: 1,
    exclusive: false, recommendationGuarantee: 1, successReward: 0,
  },
  weekly: {
    id: "weekly", name: "周卡", price: 99, durationDays: 7,
    totalMatchLimit: 3, weeklyMatchLimit: 3, weeklyFollowupLimit: 2,
    exclusive: false, recommendationGuarantee: 3, successReward: 0,
  },
  monthly: {
    id: "monthly", name: "月卡", price: 399, durationDays: 30,
    totalMatchLimit: null, weeklyMatchLimit: 2, weeklyFollowupLimit: null,
    exclusive: true, recommendationGuarantee: 2, successReward: 100,
  },
  quarterly: {
    id: "quarterly", name: "季卡", price: 999, durationDays: 90,
    totalMatchLimit: null, weeklyMatchLimit: 2, weeklyFollowupLimit: null,
    exclusive: true, recommendationGuarantee: 2, successReward: 300,
  },
};
const LEGACY_SERVICE_PLAN = SERVICE_PLANS.monthly;

function serviceWeekKey(date = new Date()) {
  const value = new Date(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

function getServicePlan(planId = "monthly") {
  return SERVICE_PLANS[planId] || SERVICE_PLANS.monthly;
}

function createServicePlan(start = new Date(), planId = "monthly", matchmakerId = null) {
  const definition = getServicePlan(planId);
  const startsAt = new Date(start);
  const expiresAt = new Date(startsAt.getTime() + definition.durationDays * 24 * 60 * 60 * 1000);
  return {
    id: definition.id,
    subscriptionId: `sub_${Date.now().toString(36)}_${crypto.randomBytes(2).toString("hex")}`,
    name: definition.name,
    price: definition.price,
    durationDays: definition.durationDays,
    exclusive: definition.exclusive,
    matchmakerId,
    recommendationGuarantee: definition.recommendationGuarantee,
    totalMatchLimit: definition.totalMatchLimit,
    successReward: definition.successReward,
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    weeklyMatchLimit: definition.weeklyMatchLimit,
    weeklyFollowupLimit: definition.weeklyFollowupLimit,
    weekKey: serviceWeekKey(),
    weeklyMatchUsed: 0,
    weeklyFollowupUsed: 0,
    totalMatchUsed: 0,
    status: "active",
    renewalMode: "manual",
  };
}

function ensureServiceSubscriptions(user) {
  if (!Array.isArray(user.servicePlans)) {
    user.servicePlans = user.servicePlan ? [user.servicePlan] : [];
  }
  user.servicePlans = user.servicePlans.map((plan) => {
    const definition = getServicePlan(plan.id);
    plan.subscriptionId ||= `sub_legacy_${plan.id}_${user.id}`;
    plan.weeklyMatchLimit ??= definition.weeklyMatchLimit;
    plan.weeklyFollowupLimit ??= definition.weeklyFollowupLimit;
    plan.totalMatchLimit ??= definition.totalMatchLimit;
    plan.weeklyMatchUsed ||= 0;
    plan.weeklyFollowupUsed ||= 0;
    plan.totalMatchUsed ||= 0;
    if (plan.weekKey !== serviceWeekKey()) {
      plan.weekKey = serviceWeekKey();
      plan.weeklyMatchUsed = 0;
      plan.weeklyFollowupUsed = 0;
    }
    return plan;
  });
  user.servicePlan = user.servicePlans[user.servicePlans.length - 1] || null;
  return user.servicePlans;
}

function ensureMatchmakerMetrics(matchmaker) {
  if (!matchmaker) return matchmaker;
  matchmaker.ratingCount ||= 0;
  matchmaker.ratingTotal ||= 0;
  matchmaker.serviceScore = Number(matchmaker.serviceScore || (matchmaker.ratingCount ? matchmaker.ratingTotal / matchmaker.ratingCount : 5).toFixed(2));
  matchmaker.renewalRate ??= 0;
  matchmaker.avgRecommendationHours ??= 72;
  matchmaker.completedServiceCount ||= 0;
  return matchmaker;
}

function getActiveServicePlan(user, matchmakerId = null) {
  ensureServiceSubscriptions(user);
  const candidates = user.servicePlans.filter((plan) =>
    plan.status === "active" &&
    new Date(plan.expiresAt) > new Date() &&
    (!plan.matchmakerId || !matchmakerId || plan.matchmakerId === matchmakerId)
  );
  candidates.sort((a, b) => {
    const aHasQuota = (a.totalMatchLimit === null || a.totalMatchUsed < a.totalMatchLimit) &&
      (a.weeklyMatchLimit === null || a.weeklyMatchUsed < a.weeklyMatchLimit);
    const bHasQuota = (b.totalMatchLimit === null || b.totalMatchUsed < b.totalMatchLimit) &&
      (b.weeklyMatchLimit === null || b.weeklyMatchUsed < b.weeklyMatchLimit);
    if (aHasQuota !== bHasQuota) return aHasQuota ? -1 : 1;
    return new Date(a.expiresAt) - new Date(b.expiresAt);
  });
  return candidates[0] || null;
}

function renewServicePlan(currentPlan, planId, matchmakerId) {
  const now = new Date();
  const currentExpiry = new Date(currentPlan.expiresAt);
  const extensionStart = currentExpiry > now ? currentExpiry : now;
  const renewed = createServicePlan(extensionStart, planId, matchmakerId);
  // 跨周续期时重置 weekly 计数
  const currentWeekKey = serviceWeekKey();
  const isSameWeek = currentPlan.weekKey === currentWeekKey;
  return {
    ...renewed,
    subscriptionId: currentPlan.subscriptionId,
    startsAt: currentPlan.startsAt || renewed.startsAt,
    weekKey: currentWeekKey,
    weeklyMatchUsed: isSameWeek ? Number(currentPlan.weeklyMatchUsed || 0) : 0,
    weeklyFollowupUsed: isSameWeek ? Number(currentPlan.weeklyFollowupUsed || 0) : 0,
    totalMatchUsed: Number(currentPlan.totalMatchUsed || 0),
  };
}

function getServiceMatchmakerIds(user) {
  ensureServiceSubscriptions(user);
  const activePlans = user.servicePlans.filter((plan) =>
    plan.status === "active" && new Date(plan.expiresAt) > new Date()
  );
  const ids = activePlans.filter((plan) => plan.matchmakerId).map((plan) => plan.matchmakerId);
  if (activePlans.some((plan) => !plan.matchmakerId)) ids.push(...user.matchmakerIds);
  return [...new Set(ids.filter(Boolean))];
}

// 敏感词列表（反欺诈：杀猪盘、引流、博彩、违规交易等）
const SENSITIVE_WORDS = [
  "转账", "支付宝", "银行卡", "汇款", "网银", "充值",
  "投资", "理财", "炒股", "虚拟币", "比特币", "数字货币", "区块链投资",
  "博彩", "赌博", "彩票", "投注", "下注",
  "杀猪盘", "刷单", "薅羊毛",
  "加微信", "加我微信", "加v", "加V", "微信号是", "qq号",
  "二维码", "扫码", "扫一扫",
  "约炮", "一夜情", "裸聊", "包夜",
];

// 检查消息是否包含敏感词
function findSensitiveWords(text) {
  if (!text || typeof text !== "string") return [];
  const found = [];
  const lowerText = text.toLowerCase();
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word) || lowerText.includes(word.toLowerCase())) {
      found.push(word);
    }
  }
  return found;
}

// 替换敏感词为 *
function maskSensitiveWords(text) {
  let result = text;
  for (const word of SENSITIVE_WORDS) {
    const lowerWord = word.toLowerCase();
    const lowerResult = result.toLowerCase();
    let idx = lowerResult.indexOf(lowerWord);
    while (idx !== -1) {
      result = result.slice(0, idx) + "*".repeat(word.length) + result.slice(idx + word.length);
      const newLower = result.toLowerCase();
      idx = newLower.indexOf(lowerWord, idx + word.length);
    }
  }
  return result;
}

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
    { id: "a1", name: "优联婚恋", city: "上海" },
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
      job: "软件工程师",
      wechat: "linan_dev",
      vip: false,
      matchmakerIds: [],
      bio: "喜欢城市漫步和认真做饭，工作稳定，想找一个能一起成长的人。",
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
      job: "市场营销经理",
      wechat: "qing_brand",
      vip: true,
      matchmakerIds: ["m1"],
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
      job: "项目管理",
      wechat: "xuzhixia_pm",
      vip: false,
      matchmakerIds: [],
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
      job: "建筑师",
      wechat: "yizhou_arch",
      vip: true,
      matchmakerIds: ["m2"],
      bio: "工作在建筑设计行业，生活里比较安静，喜欢骑行、做咖啡和看老电影。",
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
      job: "公务员",
      wechat: "yubai_story",
      vip: false,
      matchmakerIds: [],
      bio: "工作稳定有规律，平时喜欢打网球、听播客，也会认真记录生活里的小事。",
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
      job: "UI设计师",
      wechat: "jiayi_design",
      vip: true,
      matchmakerIds: ["m1"],
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
      job: "金融分析师",
      wechat: "nanxing_fin",
      vip: true,
      matchmakerIds: ["m2"],
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
      job: "心理咨询师",
      wechat: "yinuo_mind",
      vip: false,
      matchmakerIds: [],
      bio: "常在外地参加培训，喜欢真实的人和有温度的关系，休息时会做瑜伽。",
      requirements: "希望对方心态开放，能理解彼此的工作节奏，愿意长期认真相处。",
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
      matchmakerIds: [],
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
      matchmakerIds: ["m1"],
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
  // 为种子用户设置默认密码 "123456"，防止无密码即可登录
  if (!u.passwordHash) {
    u.passwordHash = hashPassword("123456");
  }
});

seedState.matchmakers.forEach((mm) => {
  // 为种子红娘设置默认密码 "123456"，防止无密码即可登录
  if (!mm.passwordHash) {
    mm.passwordHash = hashPassword("123456");
  }
});

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || "matchmaker",
        user: process.env.PGUSER || "matchmaker",
        password: process.env.PGPASSWORD,
      },
);

const app = express();
// trust proxy：通过 nginx 反向代理时正确解析客户端真实 IP
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });
const realtimeClients = new Map();

function shouldInvalidateStateCache(sql) {
  if (typeof sql !== "string") return false;
  return /^(insert|update|delete|truncate|create|drop|alter|replace)\b/i.test(sql.trim());
}

const rawPoolQuery = pool.query.bind(pool);
pool.query = async (...args) => {
  const result = await rawPoolQuery(...args);
  if (shouldInvalidateStateCache(args[0])) {
    invalidateStateCache();
  }
  return result;
};

async function initDatabase() {
  await pool.query(`
    create table if not exists app_state (
      id integer primary key,
      data jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists agencies (
      id text primary key,
      name text not null,
      city text,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists matchmakers (
      id text primary key,
      agency_id text references agencies(id) on delete set null,
      name text not null,
      code text not null unique,
      phone text,
      email text,
      status text,
      password_hash text,
      registered_at timestamptz,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists users (
      id text primary key,
      name text not null,
      gender text,
      age integer,
      city text,
      job text,
      wechat text,
      phone text,
      email text,
      vip boolean not null default false,
      password_hash text,
      account_status text,
      registered_at timestamptz,
      real_name_verified boolean not null default false,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query("alter table users drop column if exists referral_matchmaker_id");
  await pool.query(`
    create table if not exists match_requests (
      id text primary key,
      from_user_id text references users(id) on delete cascade,
      to_user_id text references users(id) on delete cascade,
      matchmaker_id text references matchmakers(id) on delete set null,
      status text not null,
      created_at timestamptz,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists deals (
      id text primary key,
      request_id text references match_requests(id) on delete set null,
      amount numeric(12, 2) not null default 0,
      created_at date,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists chat_threads (
      id text primary key,
      type text not null,
      request_id text references match_requests(id) on delete cascade,
      status text not null default 'active',
      participants jsonb not null,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists chat_messages (
      id text primary key,
      thread_id text references chat_threads(id) on delete cascade,
      sender_role text not null,
      sender_id text not null,
      content text not null,
      created_at timestamptz,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists promo_codes (
      code text primary key,
      matchmaker_id text references matchmakers(id) on delete set null,
      used boolean not null default false,
      used_by text references users(id) on delete set null,
      infinite boolean not null default false,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists app_settings (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists blocks (
      id text primary key,
      blocker_id text not null,
      blocked_id text not null,
      reason text,
      created_at timestamptz not null default now(),
      raw jsonb not null,
      unique(blocker_id, blocked_id)
    )
  `);
  await pool.query(`
    create table if not exists reports (
      id text primary key,
      reporter_id text not null,
      reported_id text not null,
      reason text not null,
      detail text,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      raw jsonb not null
    )
  `);
  // 业务唯一性必须由数据库兜底，不能只依赖应用层“先查再写”。
  await pool.query("create unique index if not exists users_phone_unique on users (phone) where phone is not null and phone <> ''");
  await pool.query("create unique index if not exists users_email_unique on users (lower(email)) where email is not null and email <> ''");
  await pool.query("create unique index if not exists matchmakers_phone_unique on matchmakers (phone) where phone is not null and phone <> ''");
  await pool.query("create unique index if not exists matchmakers_email_unique on matchmakers (lower(email)) where email is not null and email <> ''");
  await pool.query(`
    create unique index if not exists chat_threads_request_singleton_unique
    on chat_threads (request_id, type)
    where request_id is not null and type in ('member_member', 'matchmaker_group')
  `);
  // member_matchmaker 一个 request 有男/女两条线程，按 (request_id, client_id) 去重
  await pool.query(`
    create unique index if not exists chat_threads_mm_client_unique
    on chat_threads (request_id, (participants -> 1 ->> 'id'))
    where request_id is not null and type = 'member_matchmaker'
  `);
  await pool.query(`
    create unique index if not exists chat_messages_thread_seq_unique
    on chat_messages (thread_id, ((raw->>'seq')::int))
    where thread_id is not null and raw ? 'seq'
  `);
  await pool.query(`
    create unique index if not exists chat_messages_client_msg_unique
    on chat_messages (thread_id, (raw->>'clientMsgNo'))
    where thread_id is not null and nullif(raw->>'clientMsgNo', '') is not null
  `);
  // 外键列与常查询字段索引，避免列表查询和去重检查全表扫描
  await pool.query("create index if not exists match_requests_from_user_id_idx on match_requests (from_user_id)");
  await pool.query("create index if not exists match_requests_to_user_id_idx on match_requests (to_user_id)");
  await pool.query("create index if not exists match_requests_matchmaker_id_idx on match_requests (matchmaker_id)");
  await pool.query("create index if not exists match_requests_status_idx on match_requests (status)");
  await pool.query("create index if not exists chat_threads_request_id_idx on chat_threads (request_id)");
  await pool.query("create index if not exists chat_threads_type_idx on chat_threads (type)");
  await pool.query("create index if not exists chat_messages_thread_id_idx on chat_messages (thread_id)");
  await pool.query("create index if not exists chat_messages_created_at_idx on chat_messages (created_at)");
  await pool.query("create index if not exists matchmakers_agency_id_idx on matchmakers (agency_id)");
  await pool.query("create index if not exists promo_codes_used_by_idx on promo_codes (used_by)");
  await pool.query("create index if not exists blocks_blocker_id_idx on blocks (blocker_id)");
  await pool.query("create index if not exists blocks_blocked_id_idx on blocks (blocked_id)");
  await pool.query("create index if not exists reports_status_idx on reports (status)");
  await pool.query("create index if not exists reports_created_at_idx on reports (created_at)");
  const userCountRes = await pool.query("select count(*) from users");
  const count = Number(userCountRes.rows[0].count);
  if (count === 0) {
    // 生产环境不允许自动 seed 默认 123456 密码的演示账号
    if (process.env.NODE_ENV === "production") {
      throw new Error("生产环境数据库为空，禁止自动 seed 默认账号。请先通过 /api/auth/admin/login + /api/reset 注入业务数据，或显式设置 NODE_ENV!=production 后再启动一次。");
    }
    console.log("Database tables are empty. Seeding database with initial seedState...");
    await syncNormalizedState(seedState);
  }
}

function validateState(data) {
  const requiredArrays = ["agencies", "matchmakers", "users", "requests", "chatThreads", "chatMessages", "deals", "promoCodes"];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "state must be an object";
  }
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      return `${key} must be an array`;
    }
  }
  if (!data.splits || typeof data.splits !== "object") {
    return "splits must be an object";
  }
  return null;
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signToken(payload) {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const encoded = base64UrlEncode(body);
  const signature = crypto.createHmac("sha256", EFFECTIVE_TOKEN_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", EFFECTIVE_TOKEN_SECRET).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  const payload = base64UrlDecode(encoded);
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function getBearerToken(request) {
  return (request.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function requireAuth(roles = []) {
  return (request, response, next) => {
    const payload = verifyToken(getBearerToken(request));
    if (!payload) {
      response.status(401).json({ error: "unauthorized" });
      return;
    }
    if (roles.length && !roles.includes(payload.role)) {
      response.status(403).json({ error: "forbidden" });
      return;
    }
    request.user = payload;
    next();
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (!storedHash.startsWith("scrypt$")) {
    return password === storedHash;
  }
  const [, salt, hash] = storedHash.split("$");
  const current = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(current, Buffer.from(hash, "hex"));
}

function publicState(data, viewerRole = "admin", viewerId = null) {
  // 默认 viewerRole="admin" 保留全部数据，用于 admin 操作和登录/注册返回自己信息。
  // 非 admin 时：
  //   - users: 脱敏其他用户的 phone/email/realName
  //   - matchmakers: 脱敏 phone/email
  //   - chatMessages/chatThreads/deals/promoCodes: 只返回与 viewer 相关的子集
  const sanitizeUser = (rawUser) => {
    const { passwordHash, idCard, ...rest } = rawUser;
    if (viewerRole === "admin") return rest;
    if (rawUser.id === viewerId) return rest;
    const { phone, email, realName, ...publicFields } = rest;
    return publicFields;
  };
  const sanitizeMatchmaker = (rawMatchmaker) => {
    const { passwordHash, ...matchmaker } = ensureMatchmakerMetrics({ ...rawMatchmaker });
    if (viewerRole === "admin") return matchmaker;
    const { phone, email, ...publicFields } = matchmaker;
    return publicFields;
  };

  if (viewerRole === "admin") {
    return {
      ...data,
      users: (data.users || []).map(sanitizeUser),
      matchmakers: (data.matchmakers || []).map(sanitizeMatchmaker),
    };
  }

  // 非 admin: 只返回与 viewer 相关的数据子集
  const viewerMatchmakerIds = new Set(
    (data.matchmakers || [])
      .filter((mm) => mm.id === viewerId)
      .map((mm) => mm.id),
  );
  // 收集 viewer 参与的所有 request id
  const relatedRequestIds = new Set();
  for (const req of data.requests || []) {
    if (req.fromUserId === viewerId || req.toUserId === viewerId || req.matchmakerId === viewerId || viewerMatchmakerIds.has(req.matchmakerId)) {
      relatedRequestIds.add(req.id);
    }
  }
  // 收集 viewer 可访问的 thread id
  // 红娘只能看到自己参与的会话（participants 包含自己，或 thread.requestId 属于自己的 request）
  const relatedThreadIds = new Set();
  for (const thread of data.chatThreads || []) {
    const participants = Array.isArray(thread.participants) ? thread.participants : [];
    const participantIds = participants.map((p) => (typeof p === "object" ? p.id : p)).filter(Boolean);
    if (participantIds.includes(viewerId)) {
      relatedThreadIds.add(thread.id);
    } else if (thread.requestId && relatedRequestIds.has(thread.requestId)) {
      relatedThreadIds.add(thread.id);
    }
  }

  return {
    ...data,
    users: (data.users || []).map(sanitizeUser),
    matchmakers: (data.matchmakers || []).map(sanitizeMatchmaker),
    chatThreads: (data.chatThreads || []).filter((t) => relatedThreadIds.has(t.id)),
    chatMessages: (data.chatMessages || []).filter((m) => relatedThreadIds.has(m.threadId)),
    deals: (data.deals || []).filter((d) => relatedRequestIds.has(d.requestId) || d.userId === viewerId),
    promoCodes: (data.promoCodes || []).filter((p) => p.usedBy === viewerId),
  };
}

function ensureRequestDefaults(request) {
  const terminalStatus = ["已完成", "已拒绝"].includes(request.status) ? request.status : null;
  if (request.memberChatEnabled === undefined) request.memberChatEnabled = false;
  if (request.maleContacted === undefined) {
    request.maleContacted = request.status === "已联系双方" || request.status === "来和双方对话" || request.status === "已联系男方" || request.status === "联系男方";
  }
  if (request.femaleContacted === undefined) {
    request.femaleContacted = request.status === "已联系双方" || request.status === "来和双方对话" || request.status === "已联系女方" || request.status === "联系女方";
  }
  request.status = terminalStatus || getRequestContactStatus(request);
  return request;
}

function ensureUserDefaults(user) {
  user.matchmakerIds = Array.isArray(user.matchmakerIds) ? user.matchmakerIds.filter(Boolean) : [];
  if (!user.profileByMatchmaker || typeof user.profileByMatchmaker !== "object") {
    user.profileByMatchmaker = {};
  }
  if (!user.servicePlan && user.vip) {
    const expiresAt = user.vipExpiresAt ? new Date(user.vipExpiresAt) : new Date(Date.now() + LEGACY_SERVICE_PLAN.durationDays * 24 * 60 * 60 * 1000);
    user.servicePlan = createServicePlan(new Date(expiresAt.getTime() - LEGACY_SERVICE_PLAN.durationDays * 24 * 60 * 60 * 1000), "monthly", user.matchmakerIds[0] || null);
    user.servicePlan.expiresAt = expiresAt.toISOString();
  }
  if (user.servicePlan) {
    const currentWeek = serviceWeekKey();
    if (user.servicePlan.weekKey !== currentWeek) {
      user.servicePlan.weekKey = currentWeek;
      user.servicePlan.weeklyMatchUsed = 0;
      user.servicePlan.weeklyFollowupUsed = 0;
    }
    const definition = getServicePlan(user.servicePlan.id);
    user.servicePlan.weeklyMatchLimit ??= definition.weeklyMatchLimit;
    user.servicePlan.weeklyFollowupLimit ??= definition.weeklyFollowupLimit;
    user.servicePlan.weeklyMatchUsed ||= 0;
    user.servicePlan.weeklyFollowupUsed ||= 0;
    user.servicePlan.totalMatchUsed ||= 0;
  }
  ensureServiceSubscriptions(user);
  return user;
}

function buildMatchmakerProfilePayload(user) {
  return {
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
}

function getSharedMatchmakerId(viewer, target) {
  const viewerIds = new Set(getServiceMatchmakerIds(viewer));
  return (target.matchmakerIds || []).find((id) => viewerIds.has(id)) || null;
}

function applyPublishedProfile(user, matchmakerId = null) {
  matchmakerId ||= user.matchmakerIds?.[0] || null;
  const published = matchmakerId ? user.profileByMatchmaker?.[matchmakerId]?.published : null;
  return published ? { ...user, ...published } : { ...user };
}

// 脱敏自身用户对象：返回给用户本人的数据中不应包含 passwordHash 和完整 idCard
function sanitizeUserSelf(user) {
  if (!user || typeof user !== "object") return user;
  const { passwordHash, idCard, ...rest } = user;
  return rest;
}

function upsertUserVipMatchmaker(user, matchmakerId) {
  ensureUserDefaults(user);
  if (!matchmakerId) return user;
  if (!user.matchmakerIds.includes(matchmakerId)) user.matchmakerIds.push(matchmakerId);
  user.vip = true;
  return user;
}

function canViewTargetContact(viewer, target) {
  const viewerIds = getServiceMatchmakerIds(viewer);
  const targetIds = Array.isArray(target?.matchmakerIds) ? target.matchmakerIds : [];
  return targetIds.some((id) => viewerIds.includes(id));
}

function getRequestContactStatus(request) {
  if (request.maleContacted && request.femaleContacted) return "来和双方对话";
  if (request.maleContacted) return "联系男方";
  if (request.femaleContacted) return "联系女方";
  return "待红娘联系";
}

function isRequestTerminal(request) {
  return ["已完成", "已拒绝"].includes(request?.status);
}

function rejectTerminalRequest(request, response) {
  if (!isRequestTerminal(request)) return false;
  response.status(409).json({ error: "request_completed", message: "该牵线服务已结束，不能继续修改" });
  return true;
}

function normalizeClientMessageTime(value, now = new Date()) {
  if (!value) return now.toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return now.toISOString();
  const maxClockSkewMs = 5 * 60 * 1000;
  if (Math.abs(parsed.getTime() - now.getTime()) > maxClockSkewMs) return now.toISOString();
  return parsed.toISOString();
}

function isGroupChatAllowed(request) {
  return Boolean(request?.matchmakerId);
}

function ensureThreadDefaults(thread) {
  if (thread.status === undefined) thread.status = "active";
  if (!Array.isArray(thread.participants)) thread.participants = [];
  return thread;
}

function threadHasParticipant(thread, role, id) {
  return (thread.participants || []).some((participant) => participant.role === role && participant.id === id);
}

function canAccessThread(thread, auth) {
  if (!thread || !auth) return false;
  if (auth.role === "admin") return true;
  return threadHasParticipant(thread, auth.role, auth.sub);
}

function getRealtimeClientKey(auth) {
  return auth ? `${auth.role}:${auth.sub}` : "";
}

function registerRealtimeClient(socket, auth) {
  const key = getRealtimeClientKey(auth);
  if (!key) return;
  const sockets = realtimeClients.get(key) || new Set();
  sockets.add(socket);
  realtimeClients.set(key, sockets);
  // 心跳：每 30s 发一次 ping；客户端 60s 内未回 pong 则强制销毁，清理移动端断网残留连接。
  socket.isAlive = true;
  socket.on("pong", () => { socket.isAlive = true; });
}

function unregisterRealtimeClient(socket, auth) {
  const key = getRealtimeClientKey(auth);
  if (!key) return;
  const sockets = realtimeClients.get(key);
  if (!sockets) return;
  sockets.delete(socket);
  if (sockets.size === 0) {
    realtimeClients.delete(key);
  }
}

// 周期性向所有 WebSocket 客户端发 ping；超时未回 pong 的视为死连接，强制 terminate。
const realtimeHeartbeat = setInterval(() => {
  realtimeClients.forEach((sockets) => {
    sockets.forEach((socket) => {
      if (socket.isAlive === false) {
        try { socket.terminate(); } catch {}
        return;
      }
      socket.isAlive = false;
      try { socket.ping(); } catch {}
    });
  });
}, 30000);
realtimeHeartbeat.unref?.();

function sendRealtime(socket, payload) {
  if (!socket || socket.readyState !== 1) return;
  socket.send(JSON.stringify(payload));
}

function broadcastChatMessage(thread, message) {
  if (!thread || !message) return;
  const payload = { type: "chat_message", thread, message };
  const recipientKeys = new Set(
    (thread.participants || []).map((participant) => `${participant.role}:${participant.id}`),
  );
  recipientKeys.forEach((key) => {
    const sockets = realtimeClients.get(key);
    if (!sockets) return;
    sockets.forEach((socket) => sendRealtime(socket, payload));
  });
}

function getThreadOtherParticipant(thread, role, id) {
  return (thread.participants || []).find((participant) => !(participant.role === role && participant.id === id)) || null;
}

function buildMemberMatchmakerThreads(request, fromUser, toUser) {
  if (!request.matchmakerId) return [];
  const users = [fromUser, toUser];
  const maleUser = users.find((item) => item.gender === "男") || fromUser;
  const femaleUser = users.find((item) => item.gender === "女") || toUser;

  const baseId = `ct${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  
  const maleThread = ensureThreadDefaults({
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
  });

  const femaleThread = ensureThreadDefaults({
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
  });

  return [maleThread, femaleThread];
}

function buildMemberMemberThread(request) {
  return ensureThreadDefaults({
    id: `ct_gen_${request.id}_peer`,
    type: "member_member",
    requestId: request.id,
    status: "active",
    participants: [
      { role: "client", id: request.fromUserId },
      { role: "client", id: request.toUserId },
    ],
    createdAt: new Date().toISOString(),
    lastMessageAt: null,
    lastMessagePreview: "",
  });
}

function buildMatchmakerGroupThread(request) {
  return ensureThreadDefaults({
    id: `ct_gen_${request.id}_group`,
    type: "matchmaker_group",
    requestId: request.id,
    status: "active",
    participants: [
      { role: "matchmaker", id: request.matchmakerId },
      { role: "client", id: request.fromUserId },
      { role: "client", id: request.toUserId },
    ],
    createdAt: request.createdAt || new Date().toISOString(),
    lastMessageAt: null,
    lastMessagePreview: "",
  });
}

function normalizePhone(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  const email = String(value || "").trim();
  return email ? email.toLowerCase() : null;
}

// 输入格式校验：避免存入明显非法的字符串，DB 唯一索引兜底重复值
const PHONE_PATTERN = /^1[3-9]\d{9}$/; // 中国大陆手机号
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\u4e00-\u9fa5A-Za-z·\s]{1,30}$/; // 中文/英文/中间点，1-30 字
const WECHAT_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;
const ID_CARD_PATTERN = /^\d{17}[\dXx]$/;

function validatePhone(value) {
  const phone = normalizePhone(value);
  return PHONE_PATTERN.test(phone) ? phone : null;
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  return (email && EMAIL_PATTERN.test(email)) ? email : null;
}

function validateName(value) {
  const name = String(value || "").trim();
  return NAME_PATTERN.test(name) ? name : null;
}

function validatePhotoUrl(url) {
  if (!url) return null;
  const trimmed = String(url).trim().slice(0, 500);
  if (!trimmed) return null;
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return null;
  return trimmed;
}

function validateWechat(value) {
  const wechat = String(value || "").trim();
  if (!wechat) return null; // wechat 选填
  return WECHAT_PATTERN.test(wechat) ? wechat : null;
}

// 简单的内存缓存，减少频繁的全量数据库查询
let stateCache = null;
let stateCacheTime = 0;
const STATE_CACHE_TTL = 1000; // 1秒缓存

function invalidateStateCache() {
  stateCache = null;
  stateCacheTime = 0;
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readState() {
  const now = Date.now();
  if (stateCache && now - stateCacheTime < STATE_CACHE_TTL) {
    return cloneState(stateCache);
  }

  const [
    agenciesRes,
    matchmakersRes,
    usersRes,
    requestsRes,
    chatThreadsRes,
    chatMessagesRes,
    dealsRes,
    promoCodesRes,
    settingsRes,
  ] = await Promise.all([
    pool.query("select raw from agencies order by id"),
    pool.query("select raw from matchmakers order by id"),
    pool.query("select raw from users order by id"),
    pool.query("select raw from match_requests order by raw->>'createdAt' desc, id"),
    pool.query("select raw from chat_threads order by coalesce(raw->>'lastMessageAt', raw->>'createdAt') desc, id"),
    pool.query(`select raw from chat_messages
       order by created_at asc,
         case when raw ? 'seq' then (raw->>'seq')::int else null end asc nulls last,
         id`),
    pool.query("select raw from deals order by raw->>'createdAt' desc, id"),
    pool.query("select raw from promo_codes order by code"),
    pool.query("select data from app_settings where id = 'runtime'"),
  ]);

  const runtimeSettings = settingsRes.rows[0]?.data || {
    currentUserId: "u1",
    selectedMatchmakerId: null,
    adminLoggedIn: false,
    splits: { promo: 20, matchmaker: 35, platform: 45 }
  };

  const allThreads = chatThreadsRes.rows.map(r => ensureThreadDefaults(r.raw));
  const allUsers = usersRes.rows.map(r => ensureUserDefaults(r.raw));
  
  for (const request of requestsRes.rows.map(r => ensureRequestDefaults(r.raw))) {
    if (request.matchmakerId) {
      const fromUser = allUsers.find(u => u.id === request.fromUserId);
      const toUser = allUsers.find(u => u.id === request.toUserId);
      if (fromUser && toUser) {
        const users = [fromUser, toUser];
        const maleUser = users.find((item) => item.gender === "男") || fromUser;
        const femaleUser = users.find((item) => item.gender === "女") || toUser;
        
        // Check male 2-way
        let maleThread = allThreads.find(
          (t) =>
            t.requestId === request.id &&
            t.type === "member_matchmaker" &&
            t.participants.length === 2 &&
            t.participants.some((p) => p.id === maleUser.id),
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
          await pool.query(
            `insert into chat_threads (id, type, request_id, status, participants, raw)
             values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
             on conflict (id) do nothing`,
            [maleThread.id, maleThread.type, maleThread.requestId, maleThread.status, JSON.stringify(maleThread.participants), JSON.stringify(maleThread)]
          );
          allThreads.push(maleThread);
        }
        
        // Check female 2-way
        let femaleThread = allThreads.find(
          (t) =>
            t.requestId === request.id &&
            t.type === "member_matchmaker" &&
            t.participants.length === 2 &&
            t.participants.some((p) => p.id === femaleUser.id),
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
          await pool.query(
            `insert into chat_threads (id, type, request_id, status, participants, raw)
             values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
             on conflict (id) do nothing`,
            [femaleThread.id, femaleThread.type, femaleThread.requestId, femaleThread.status, JSON.stringify(femaleThread.participants), JSON.stringify(femaleThread)]
          );
          allThreads.push(femaleThread);
        }

        if (isGroupChatAllowed(request)) {
          let groupThread = allThreads.find(
            (t) =>
              t.requestId === request.id &&
              t.type === "matchmaker_group" &&
              t.participants.some((p) => p.role === "matchmaker" && p.id === request.matchmakerId) &&
              t.participants.some((p) => p.role === "client" && p.id === request.fromUserId) &&
              t.participants.some((p) => p.role === "client" && p.id === request.toUserId),
          );
          if (!groupThread) {
            groupThread = buildMatchmakerGroupThread(request);
            await pool.query(
              `insert into chat_threads (id, type, request_id, status, participants, raw)
               values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
               on conflict (id) do nothing`,
              [groupThread.id, groupThread.type, groupThread.requestId, groupThread.status, JSON.stringify(groupThread.participants), JSON.stringify(groupThread)]
            );
            allThreads.push(groupThread);
          }
        }
        
      }
    }

    if (request.memberChatEnabled) {
      let memberThread = allThreads.find(
        (t) => t.requestId === request.id && t.type === "member_member",
      );
      if (!memberThread) {
        memberThread = buildMemberMemberThread(request);
        await pool.query(
          `insert into chat_threads (id, type, request_id, status, participants, raw)
           values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
           on conflict (id) do nothing`,
          [memberThread.id, memberThread.type, memberThread.requestId, memberThread.status, JSON.stringify(memberThread.participants), JSON.stringify(memberThread)]
        );
        allThreads.push(memberThread);
      }
    }
  }

  stateCache = {
    currentUserId: runtimeSettings.currentUserId,
    selectedMatchmakerId: runtimeSettings.selectedMatchmakerId,
    adminLoggedIn: runtimeSettings.adminLoggedIn,
    splits: runtimeSettings.splits,
    agencies: agenciesRes.rows.map(r => r.raw),
    matchmakers: matchmakersRes.rows.map(r => r.raw),
    users: usersRes.rows.map(r => ensureUserDefaults(r.raw)),
    requests: requestsRes.rows.map(r => ensureRequestDefaults(r.raw)),
    chatThreads: allThreads,
    chatMessages: chatMessagesRes.rows.map(r => r.raw),
    deals: dealsRes.rows.map(r => r.raw),
    promoCodes: promoCodesRes.rows.map(r => r.raw),
  };
  stateCacheTime = Date.now();
  return cloneState(stateCache);
}

async function writeState(data) {
  await syncNormalizedState(data);
}

function asDate(value) {
  return value || null;
}

async function syncNormalizedState(data, existingClient = null) {
  const client = existingClient || (await pool.connect());
  const ownsClient = !existingClient;

  try {
    if (ownsClient) {
      await client.query("begin");
    }

    // 1. UPSERT agencies
    for (const agency of data.agencies || []) {
      await client.query(
        `
          insert into agencies (id, name, city, raw)
          values ($1, $2, $3, $4::jsonb)
          on conflict (id) do update set
            name = excluded.name,
            city = excluded.city,
            raw = excluded.raw,
            updated_at = now()
        `,
        [agency.id, agency.name, agency.city || null, JSON.stringify(agency)],
      );
    }

    // 2. UPSERT matchmakers
    for (const matchmaker of data.matchmakers || []) {
      await client.query(
        `
          insert into matchmakers (
            id, agency_id, name, code, phone, email, status, password_hash, registered_at, raw
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
          on conflict (id) do update set
            agency_id = excluded.agency_id,
            name = excluded.name,
            code = excluded.code,
            phone = excluded.phone,
            email = excluded.email,
            status = excluded.status,
            password_hash = excluded.password_hash,
            registered_at = excluded.registered_at,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          matchmaker.id,
          matchmaker.agencyId || null,
          matchmaker.name,
          matchmaker.code,
          matchmaker.phone || null,
          matchmaker.email || null,
          matchmaker.status || null,
          matchmaker.passwordHash || null,
          asDate(matchmaker.registeredAt),
          JSON.stringify(matchmaker),
        ],
      );
    }

    // 3. UPSERT users
    for (const user of data.users || []) {
      await client.query(
        `
          insert into users (
            id, name, gender, age, city, job, wechat, phone, email, vip,
            password_hash, account_status, registered_at, real_name_verified, raw
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
          on conflict (id) do update set
            name = excluded.name,
            gender = excluded.gender,
            age = excluded.age,
            city = excluded.city,
            job = excluded.job,
            wechat = excluded.wechat,
            phone = excluded.phone,
            email = excluded.email,
            vip = excluded.vip,
            password_hash = excluded.password_hash,
            account_status = excluded.account_status,
            registered_at = excluded.registered_at,
            real_name_verified = excluded.real_name_verified,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          user.id,
          user.name,
          user.gender || null,
          Number.isFinite(Number(user.age)) ? Number(user.age) : null,
          user.city || null,
          user.job || null,
          user.wechat || null,
          user.phone || null,
          user.email || null,
          Boolean(user.vip),
          user.passwordHash || null,
          user.accountStatus || null,
          asDate(user.registeredAt),
          Boolean(user.realNameVerified),
          JSON.stringify(user),
        ],
      );
    }

    // 4. UPSERT match_requests
    for (const request of data.requests || []) {
      await client.query(
        `
          insert into match_requests (
            id, from_user_id, to_user_id, matchmaker_id, status, created_at, raw
          )
          values ($1, $2, $3, $4, $5, $6, $7::jsonb)
          on conflict (id) do update set
            from_user_id = excluded.from_user_id,
            to_user_id = excluded.to_user_id,
            matchmaker_id = excluded.matchmaker_id,
            status = excluded.status,
            created_at = excluded.created_at,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          request.id,
          request.fromUserId || null,
          request.toUserId || null,
          request.matchmakerId || null,
          request.status || "待红娘联系",
          asDate(request.createdAt),
          JSON.stringify(request),
        ],
      );
    }

    // 5. UPSERT deals
    for (const thread of data.chatThreads || []) {
      await client.query(
        `
          insert into chat_threads (id, type, request_id, status, participants, raw)
          values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
          on conflict (id) do update set
            type = excluded.type,
            request_id = excluded.request_id,
            status = excluded.status,
            participants = excluded.participants,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          thread.id,
          thread.type,
          thread.requestId || null,
          thread.status || "active",
          JSON.stringify(thread.participants || []),
          JSON.stringify(thread),
        ],
      );
    }

    for (const message of data.chatMessages || []) {
      await client.query(
        `
          insert into chat_messages (id, thread_id, sender_role, sender_id, content, created_at, raw)
          values ($1, $2, $3, $4, $5, $6, $7::jsonb)
          on conflict (id) do update set
            thread_id = excluded.thread_id,
            sender_role = excluded.sender_role,
            sender_id = excluded.sender_id,
            content = excluded.content,
            created_at = excluded.created_at,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          message.id,
          message.threadId,
          message.senderRole,
          message.senderId,
          message.content,
          asDate(message.createdAt),
          JSON.stringify(message),
        ],
      );
    }

    // 5. UPSERT deals
    for (const deal of data.deals || []) {
      await client.query(
        `
          insert into deals (id, request_id, amount, created_at, raw)
          values ($1, $2, $3, $4, $5::jsonb)
          on conflict (id) do update set
            request_id = excluded.request_id,
            amount = excluded.amount,
            created_at = excluded.created_at,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          deal.id,
          deal.requestId || null,
          Number(deal.amount || 0),
          asDate(deal.createdAt),
          JSON.stringify(deal),
        ],
      );
    }

    // 6. UPSERT promo_codes
    for (const promoCode of data.promoCodes || []) {
      await client.query(
        `
          insert into promo_codes (code, matchmaker_id, used, used_by, infinite, raw)
          values ($1, $2, $3, $4, $5, $6::jsonb)
          on conflict (code) do update set
            matchmaker_id = excluded.matchmaker_id,
            used = excluded.used,
            used_by = excluded.used_by,
            infinite = excluded.infinite,
            raw = excluded.raw,
            updated_at = now()
        `,
        [
          promoCode.code,
          promoCode.matchmakerId || null,
          Boolean(promoCode.used),
          promoCode.usedBy || null,
          Boolean(promoCode.infinite),
          JSON.stringify(promoCode),
        ],
      );
    }

    // 7. UPSERT app_settings
    await client.query(
      `
        insert into app_settings (id, data)
        values ('runtime', $1::jsonb)
        on conflict (id) do update set
          data = excluded.data,
          updated_at = now()
      `,
      [
        JSON.stringify({
          currentUserId: data.currentUserId || null,
          selectedMatchmakerId: data.selectedMatchmakerId || null,
          adminLoggedIn: Boolean(data.adminLoggedIn),
          splits: data.splits || {},
        }),
      ],
    );

    // 8. DELETE missing rows (in reverse dependency order to prevent FK violations)
    const chatMessageIds = (data.chatMessages || []).map((m) => m.id);
    await client.query("delete from chat_messages where id not in (select unnest($1::text[]))", [chatMessageIds]);

    const chatThreadIds = (data.chatThreads || []).map((t) => t.id);
    await client.query("delete from chat_threads where id not in (select unnest($1::text[]))", [chatThreadIds]);

    const dealIds = (data.deals || []).map(d => d.id);
    await client.query("delete from deals where id not in (select unnest($1::text[]))", [dealIds]);

    const requestIds = (data.requests || []).map(r => r.id);
    await client.query("delete from match_requests where id not in (select unnest($1::text[]))", [requestIds]);

    const userIds = (data.users || []).map(u => u.id);
    await client.query("delete from users where id not in (select unnest($1::text[]))", [userIds]);

    const matchmakerIds = (data.matchmakers || []).map(m => m.id);
    await client.query("delete from matchmakers where id not in (select unnest($1::text[]))", [matchmakerIds]);

    const agencyIds = (data.agencies || []).map(a => a.id);
    await client.query("delete from agencies where id not in (select unnest($1::text[]))", [agencyIds]);

    const promoCodes = (data.promoCodes || []).map(p => p.code);
    await client.query("delete from promo_codes where code not in (select unnest($1::text[]))", [promoCodes]);

    if (ownsClient) {
      await client.query("commit");
    }
  } catch (error) {
    if (ownsClient) {
      await client.query("rollback");
    }
    throw error;
  } finally {
    if (ownsClient) {
      client.release();
    }
  }

  invalidateStateCache();
}

app.get("/api/health", async (_request, response) => {
  await pool.query("select 1");
  response.json({ ok: true });
});

app.post("/api/auth/admin/login", async (request, response) => {
  const { password } = request.body || {};
  // 定长比较，规避时序攻击
  const given = Buffer.from(String(password || ""));
  const expected = Buffer.from(EFFECTIVE_ADMIN_PASSWORD);
  const ok = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) {
    response.status(401).json({ error: "invalid_credentials" });
    return;
  }
  response.json({
    token: signToken({ role: "admin", sub: "admin" }),
    admin: { id: "admin", name: "平台管理员" },
  });
});

app.post("/api/auth/client/login", async (request, response) => {
  const { userId, account, password } = request.body || {};
  const state = await readState();
  const normalizedAccount = String(account || "").trim().toLowerCase();
  const user = state.users.find((item) => {
    if (userId && item.id === userId) return true;
    return (
      normalizedAccount &&
      [item.phone, item.email, item.wechat]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .includes(normalizedAccount)
    );
  });

  if (!user) {
    response.status(401).json({ error: "invalid_credentials" });
    return;
  }
  if (!user.passwordHash || !verifyPassword(String(password || ""), user.passwordHash)) {
    response.status(401).json({ error: "invalid_credentials" });
    return;
  }

  response.json({
    token: signToken({ role: "client", sub: user.id }),
    user: publicState({ ...state, users: [user] }).users[0],
  });
});

app.post("/api/auth/matchmaker/login", async (request, response) => {
  const { matchmakerId, account, password } = request.body || {};
  const state = await readState();
  const normalizedAccount = String(account || "").trim().toLowerCase();
  const matchmaker = state.matchmakers.find((item) => {
    if (matchmakerId && item.id === matchmakerId) return true;
    return (
      normalizedAccount &&
      [item.phone, item.email, item.code]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .includes(normalizedAccount)
    );
  });

  if (!matchmaker) {
    response.status(401).json({ error: "invalid_credentials" });
    return;
  }
  if (!matchmaker.passwordHash || !verifyPassword(String(password || ""), matchmaker.passwordHash)) {
    response.status(401).json({ error: "invalid_credentials" });
    return;
  }

  response.json({
    token: signToken({ role: "matchmaker", sub: matchmaker.id }),
    matchmaker: publicState({ ...state, matchmakers: [matchmaker] }).matchmakers[0],
  });
});

app.post("/api/auth/client/register", async (request, response) => {
  const input = request.body || {};
  // 必须二选一：手机号或邮箱；手机号需符合中国大陆号段，邮箱需符合基本格式
  const phone = validatePhone(input.phone);
  const email = validateEmail(input.email);
  if (!phone && !email) {
    response.status(400).json({ error: "phone_or_email_required", message: "请提供有效的手机号或邮箱" });
    return;
  }
  if (input.email && !email) {
    response.status(400).json({ error: "email_invalid", message: "邮箱格式不正确" });
    return;
  }
  // 姓名必填，限中文/英文
  const name = validateName(input.name);
  if (!name) {
    response.status(400).json({ error: "name_invalid", message: "请提供有效的姓名（中文或英文，1-30 字）" });
    return;
  }
  // 性别校验
  if (input.gender && !["男", "女"].includes(input.gender)) {
    response.status(400).json({ error: "gender_invalid", message: "性别只能是男或女" });
    return;
  }
  // 年龄范围
  const age = Number(input.age || 0);
  if (age && (age < 18 || age > 99)) {
    response.status(400).json({ error: "age_invalid", message: "年龄范围 18-99" });
    return;
  }
  // 密码长度
  const password = String(input.password || "");
  if (password.length < 6 || password.length > 64) {
    response.status(400).json({ error: "password_invalid", message: "密码长度 6-64 字符" });
    return;
  }
  // wechat 选填但若提供需符合格式
  if (input.wechat && !validateWechat(input.wechat)) {
    response.status(400).json({ error: "wechat_invalid", message: "微信号格式为 6-20 位字母数字下划线" });
    return;
  }
  // 字符串字段长度上限
  const trimStr = (value, max) => String(value || "").trim().slice(0, max);
  const matchmakerRes = await pool.query("select id from matchmakers order by id");
  const allMatchmakerIds = matchmakerRes.rows.map((item) => item.id);
  const validMatchmakerIds = new Set(allMatchmakerIds);
  const matchmakerIds = Array.isArray(input.matchmakerIds) && input.matchmakerIds.length
    ? [...new Set(input.matchmakerIds.filter((id) => validMatchmakerIds.has(id)))]
    : allMatchmakerIds;

  const user = {
    id: `u${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
    name,
    gender: input.gender || null,
    age,
    city: trimStr(input.city, 30),
    job: trimStr(input.job, 30),
    wechat: validateWechat(input.wechat) || null,
    phone: phone || null,
    email,
    passwordHash: hashPassword(password),
    registeredAt: new Date().toISOString(),
    accountStatus: "active",
    realNameVerified: false,
    realName: null,
    idCard: null,
    vip: false,
    matchmakerIds,
    profileByMatchmaker: {},
    bio: trimStr(input.bio, 500),
    requirements: trimStr(input.requirements, 500),
    photo: validatePhotoUrl(input.photo),
  };
  try {
    await pool.query(
      `insert into users (
         id, name, gender, age, city, job, wechat, phone, email, vip,
         password_hash, account_status, registered_at, real_name_verified, raw
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11, $12, false, $13::jsonb)`,
      [
        user.id, user.name, user.gender, user.age, user.city, user.job, user.wechat,
        user.phone, user.email, user.passwordHash, user.accountStatus, user.registeredAt,
        JSON.stringify(user),
      ],
    );
    invalidateStateCache();
    const state = await readState();
    response.status(201).json({
      token: signToken({ role: "client", sub: user.id }),
      user: publicState({ ...state, users: [user] }).users[0],
      state: publicState(state),
    });
  } catch (error) {
    if (error?.code === "23505") {
      const duplicate = error.constraint === "users_phone_unique" ? "phone_exists" : "email_exists";
      return response.status(409).json({ error: duplicate });
    }
    console.error("会员注册失败:", error);
    response.status(500).json({ error: "registration_failed" });
  }
});

app.post("/api/auth/matchmaker/register", async (request, response) => {
  const input = request.body || {};
  const phone = normalizePhone(input.phone);
  let email = normalizeEmail(input.email);
  const code = String(input.code || "").trim().toUpperCase();
  if (!phone || !code) {
    response.status(400).json({ error: "phone_and_code_required" });
    return;
  }
  // 密码校验（6-64位）
  const password = String(input.password || "");
  if (password.length < 6 || password.length > 64) {
    return response.status(400).json({ error: "password_length_invalid", message: "密码长度需为6-64位" });
  }
  // 姓名校验
  const validatedName = validateName(input.name);
  if (!validatedName) {
    return response.status(400).json({ error: "name_invalid", message: "姓名格式不正确（1-30字）" });
  }
  // 邮箱校验（如果提供了的话）
  if (input.email) {
    const validatedEmail = validateEmail(input.email);
    if (!validatedEmail) {
      return response.status(400).json({ error: "email_invalid", message: "邮箱格式不正确" });
    }
    email = validatedEmail;
  }
  const matchmaker = {
    id: `m${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
    name: validatedName,
    agencyId: input.agencyId || null,
    code,
    phone,
    email,
    passwordHash: hashPassword(password),
    status: "active",
    registeredAt: new Date().toISOString(),
  };
  try {
    await pool.query(
      `insert into matchmakers (
         id, agency_id, name, code, phone, email, status, password_hash, registered_at, raw
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        matchmaker.id, matchmaker.agencyId, matchmaker.name, matchmaker.code,
        matchmaker.phone, matchmaker.email, matchmaker.status, matchmaker.passwordHash,
        matchmaker.registeredAt, JSON.stringify(matchmaker),
      ],
    );
    invalidateStateCache();
    const state = await readState();
    response.status(201).json({
      token: signToken({ role: "matchmaker", sub: matchmaker.id }),
      matchmaker: publicState({ ...state, matchmakers: [matchmaker] }).matchmakers[0],
      state: publicState(state),
    });
  } catch (error) {
    if (error?.code === "23505") {
      const duplicate = error.constraint === "matchmakers_phone_unique"
        ? "phone_exists"
        : error.constraint === "matchmakers_email_unique"
          ? "email_exists"
          : "code_exists";
      return response.status(409).json({ error: duplicate });
    }
    if (error?.code === "23503") return response.status(400).json({ error: "agency_not_found" });
    console.error("红娘注册失败:", error);
    response.status(500).json({ error: "registration_failed" });
  }
});

app.get("/api/state", requireAuth(["admin", "client", "matchmaker"]), async (request, response) => {
  const state = await readState();
  response.json(publicState(state, request.user.role, request.user.sub));
});

app.put("/api/state", requireAuth(["admin"]), async (request, response) => {
  const error = validateState(request.body);
  if (error) {
    response.status(400).json({ error });
    return;
  }
  await writeState(request.body);
  response.json(publicState(await readState(), request.user.role, request.user.sub));
});

app.post("/api/reset", requireAuth(["admin"]), async (request, response) => {
  // 生产环境禁止重置数据库，防止误操作导致全量数据丢失
  if (process.env.NODE_ENV === "production") {
    return response.status(403).json({ error: "reset_disabled_in_production", message: "生产环境禁止重置数据库" });
  }
  // 非生产环境需二次确认
  if (request.body?.confirm !== "RESET") {
    return response.status(400).json({ error: "confirm_required", message: "请在请求体中传入 confirm: 'RESET' 以确认重置" });
  }
  await writeState(seedState);
  response.json(publicState(await readState(), request.user.role, request.user.sub));
});

// ==========================================
// 精细化业务 REST API
// ==========================================

// 1. 客户：修改个人资料
app.patch("/api/client/profile", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { name, gender, age, city, job, wechat, bio, requirements, photo, avatar } = request.body || {};

  // 字段格式校验：仅在用户提交了对应字段时才校验
  if (name !== undefined) {
    const normalizedName = validateName(name);
    if (!normalizedName) return response.status(400).json({ error: "name_invalid", message: "姓名为中文或英文，1-30 字" });
  }
  if (gender !== undefined && gender !== null && !["男", "女"].includes(gender)) {
    return response.status(400).json({ error: "gender_invalid", message: "性别只能是男或女" });
  }
  if (age !== undefined && age !== null) {
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99) {
      return response.status(400).json({ error: "age_invalid", message: "年龄范围 18-99" });
    }
  }
  if (wechat !== undefined && wechat !== null && wechat !== "" && !validateWechat(wechat)) {
    return response.status(400).json({ error: "wechat_invalid", message: "微信号格式为 6-20 位字母数字下划线" });
  }

  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const user = ensureUserDefaults(userRes.rows[0].raw);
  const previousPublishedProfile = buildMatchmakerProfilePayload(user);
  const trimStr = (value, max) => String(value || "").trim().slice(0, max);
  user.name = name !== undefined ? validateName(name) || user.name : user.name;
  user.gender = gender !== undefined ? gender : user.gender;
  const ageNum = Number(age);
  user.age = (age !== undefined && Number.isFinite(ageNum)) ? ageNum : user.age;
  user.city = city !== undefined ? trimStr(city, 30) : user.city;
  user.job = job !== undefined ? trimStr(job, 30) : user.job;
  user.wechat = wechat !== undefined ? (validateWechat(wechat) || user.wechat) : user.wechat;
  user.bio = bio !== undefined ? trimStr(bio, 500) : user.bio;
  user.requirements = requirements !== undefined ? trimStr(requirements, 500) : user.requirements;
  user.photo = photo !== undefined ? validatePhotoUrl(photo) : (avatar !== undefined ? validatePhotoUrl(avatar) : user.photo);

  const profilePayload = buildMatchmakerProfilePayload(user);
  for (const matchmakerId of user.matchmakerIds) {
    const currentProfile = user.profileByMatchmaker[matchmakerId] || {};
    user.profileByMatchmaker[matchmakerId] = {
      ...currentProfile,
      published: currentProfile.published || previousPublishedProfile,
      draft: profilePayload,
      status: "pending",
      updatedAt: new Date().toISOString(),
    };
  }

  await pool.query(
    `update users set name = $1, gender = $2, age = $3, city = $4, job = $5, wechat = $6, raw = $7, updated_at = now() where id = $8`,
    [user.name, user.gender, user.age, user.city, user.job, user.wechat, JSON.stringify(user), userId]
  );
  response.json({ user: sanitizeUserSelf(user), state: publicState(await readState(), request.user.role, request.user.sub) });
});

app.patch("/api/matchmaker/users/:id/profile-review", requireAuth(["matchmaker"]), async (request, response) => {
  const userId = request.params.id;
  const matchmakerId = request.user.sub;
  const action = request.body?.action;
  if (!["approve", "reject"].includes(action)) return response.status(400).json({ error: "invalid_action" });

  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });
  const user = ensureUserDefaults(userRes.rows[0].raw);
  const profile = user.profileByMatchmaker[matchmakerId];
  if (!profile) return response.status(404).json({ error: "profile_not_found" });

  if (action === "approve") {
    profile.published = profile.draft || buildMatchmakerProfilePayload(user);
    profile.status = "approved";
  } else {
    profile.status = "rejected";
  }
  profile.reviewedAt = new Date().toISOString();
  profile.reviewedBy = matchmakerId;
  user.profileByMatchmaker[matchmakerId] = profile;

  await pool.query("update users set raw = $1, updated_at = now() where id = $2", [JSON.stringify(user), userId]);
  // 红娘审核端点：脱敏客户敏感字段（passwordHash、idCard、phone、email、realName、diplomaNo）
  const { passwordHash: _ph, idCard: _idc, phone: _p, email: _e, realName: _rn, ...safeUser } = user;
  if (safeUser.education) {
    safeUser.education = { ...safeUser.education, diplomaNo: undefined };
  }
  response.json({ user: safeUser, state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 2. 客户：提交实名认证（公安二要素模拟 + 18岁门槛）
app.post("/api/client/real-name", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { realName, idCard, phone } = request.body || {};
  if (!realName || !idCard) return response.status(400).json({ error: "name_and_idcard_required" });

  // 真实姓名校验（1-30字）
  const validatedName = validateName(realName);
  if (!validatedName) {
    return response.status(400).json({ error: "name_invalid", message: "姓名格式不正确（1-30字）" });
  }

  // 手机号校验（如果提供了的话）
  if (phone) {
    const validatedPhone = validatePhone(phone);
    if (!validatedPhone) {
      return response.status(400).json({ error: "phone_invalid", message: "手机号格式不正确" });
    }
  }

  // 身份证号格式校验（18位，最后一位可为X）
  const idCardTrimmed = idCard.trim();
  const idCardRegex = /^\d{17}[\dXx]$/;
  if (!idCardRegex.test(idCardTrimmed)) {
    return response.status(400).json({ error: "idcard_format_invalid", message: "身份证号格式错误" });
  }

  // 从身份证号解析出生日期并校验年龄
  const birthYear = parseInt(idCardTrimmed.substring(6, 10), 10);
  const birthMonth = parseInt(idCardTrimmed.substring(10, 12), 10);
  const birthDay = parseInt(idCardTrimmed.substring(12, 14), 10);
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  if (
    birthDate.getFullYear() !== birthYear ||
    birthDate.getMonth() !== birthMonth - 1 ||
    birthDate.getDate() !== birthDay
  ) {
    return response.status(400).json({ error: "idcard_birthdate_invalid", message: "身份证出生日期无效" });
  }
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 18) {
    return response.status(400).json({ error: "underage", message: "未满18岁，无法完成实名认证" });
  }
  if (age > 100) {
    return response.status(400).json({ error: "invalid_age", message: "年龄异常，请检查身份证号" });
  }

  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const user = userRes.rows[0].raw;
  user.realName = validatedName;
  // 身份证号脱敏存储（只保留前6后4，中间用*代替）
  user.idCardMasked = idCardTrimmed.substring(0, 6) + "********" + idCardTrimmed.substring(14);
  user.idCard = idCardTrimmed; // 仍保留完整身份证号（仅服务端内部使用，不返回前端）
  user.realNameVerified = true;
  user.age = age;
  if (phone) {
    user.phone = validatePhone(phone);
  }

  await pool.query(
    `update users set phone = $1, age = $2, real_name_verified = true, raw = $3, updated_at = now() where id = $4`,
    [user.phone || null, age, JSON.stringify(user), userId]
  );
  response.json({ user: sanitizeUserSelf(user), state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 2.1 客户：提交学历认证（学信网模拟）
app.post("/api/client/education-verify", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { school, degree, major, graduationYear, diplomaNo } = request.body || {};
  if (!school || !degree || !major || !graduationYear) {
    return response.status(400).json({ error: "education_info_incomplete", message: "学历信息不完整" });
  }

  const validDegrees = ["高中", "大专", "本科", "硕士", "博士"];
  if (!validDegrees.includes(degree)) {
    return response.status(400).json({ error: "invalid_degree", message: "学历类型无效" });
  }

  const year = parseInt(graduationYear, 10);
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < 1950 || year > currentYear + 10) {
    return response.status(400).json({ error: "invalid_graduation_year", message: "毕业年份无效" });
  }

  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const user = userRes.rows[0].raw;
  if (!user.realNameVerified) {
    return response.status(400).json({ error: "realname_required_first", message: "请先完成实名认证" });
  }

  user.education = {
    school: school.trim(),
    degree,
    major: major.trim(),
    graduationYear: year,
    diplomaNo: diplomaNo ? diplomaNo.trim() : null,
    verified: true,
    verifiedAt: new Date().toISOString(),
  };

  await pool.query(
    `update users set raw = $1, updated_at = now() where id = $2`,
    [JSON.stringify(user), userId]
  );
  invalidateStateCache();
  response.json({ user: sanitizeUserSelf(user), state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 2.2 客户：提交视频认证（活体检测模拟）
app.post("/api/client/video-verify", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { videoToken, actions } = request.body || {};
  if (!videoToken) {
    return response.status(400).json({ error: "video_token_required", message: "视频认证凭证缺失" });
  }

  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const user = userRes.rows[0].raw;
  if (!user.realNameVerified) {
    return response.status(400).json({ error: "realname_required_first", message: "请先完成实名认证" });
  }

  // 模拟活体检测：要求至少完成眨眼+张嘴两个动作
  const requiredActions = ["blink", "open_mouth"];
  const completedActions = Array.isArray(actions) ? actions : [];
  const allCompleted = requiredActions.every((a) => completedActions.includes(a));
  if (!allCompleted) {
    return response.status(400).json({ error: "liveness_check_failed", message: "活体检测未通过，请重试" });
  }

  user.videoVerified = true;
  user.videoVerifiedAt = new Date().toISOString();

  await pool.query(
    `update users set raw = $1, updated_at = now() where id = $2`,
    [JSON.stringify(user), userId]
  );
  invalidateStateCache();
  response.json({ user: sanitizeUserSelf(user), state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 2.3 客户：获取自己的认证状态
app.get("/api/client/verify-status", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const user = userRes.rows[0].raw;
  response.json({
    realNameVerified: !!user.realNameVerified,
    educationVerified: !!(user.education && user.education.verified),
    videoVerified: !!user.videoVerified,
    age: user.age || null,
    education: user.education || null,
  });
});

// 3. 客户：卡密兑换/付费 VIP
app.post("/api/client/vip/redeem", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { code, referralCode, planId = "monthly" } = request.body || {};
  const client = await pool.connect();
  
  try {
    await client.query("begin");
    
    const userRes = await client.query("select raw from users where id = $1 for update", [userId]);
    if (userRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "user_not_found" });
    }
    const user = ensureUserDefaults(userRes.rows[0].raw);

    let matchmakerId = null;
    let selectedPlanId = "monthly";

    if (code) {
      // 兑换码核销
      const promoRes = await client.query(
        "select raw from promo_codes where upper(code) = upper($1) for update",
        [code.trim()],
      );
      if (promoRes.rows.length === 0) {
        await client.query("rollback");
        return response.status(404).json({ error: "invalid_code" });
      }
      const promo = promoRes.rows[0].raw;
      if (promo.used && !promo.infinite) {
        await client.query("rollback");
        return response.status(400).json({ error: "code_already_used" });
      }
      // infinite 兑换码也记录使用者列表，同一用户只能使用一次
      if (promo.infinite) {
        promo.usedByList = Array.isArray(promo.usedByList) ? promo.usedByList : [];
        if (promo.usedByList.includes(userId)) {
          await client.query("rollback");
          return response.status(409).json({ error: "code_already_redeemed", message: "您已使用过此兑换码" });
        }
        promo.usedByList.push(userId);
        promo.usedBy = userId;
        await client.query(
          "update promo_codes set used_by = $1, raw = $2, updated_at = now() where upper(code) = upper($3)",
          [userId, JSON.stringify(promo), code.trim()]
        );
      } else {
        promo.used = true;
        promo.usedBy = userId;
        await client.query(
          "update promo_codes set used = true, used_by = $1, raw = $2, updated_at = now() where upper(code) = upper($3)",
          [userId, JSON.stringify(promo), code.trim()]
        );
      }
      if (promo.matchmakerId) {
        matchmakerId = promo.matchmakerId;
      }
      // 兑换码的权益由后台签发时确定，不能由客户端自行升级套餐。
      selectedPlanId = promo.planId && SERVICE_PLANS[promo.planId] ? promo.planId : "monthly";
    } else if (referralCode) {
      // 推荐码路径：仅赠送体验卡，不允许客户端自行升级到高价套餐（需走真实支付流程）
      const mmRes = await client.query("select id from matchmakers where upper(code) = upper($1)", [referralCode.trim()]);
      if (mmRes.rows.length === 0) {
        await client.query("rollback");
        return response.status(404).json({ error: "invalid_referral_code" });
      }
      // 防止推荐码重复使用：每用户只能使用一次推荐码路径
      user.redeemedReferralCodes = Array.isArray(user.redeemedReferralCodes) ? user.redeemedReferralCodes : [];
      if (user.redeemedReferralCodes.length > 0) {
        await client.query("rollback");
        return response.status(409).json({ error: "referral_already_redeemed", message: "您已使用过推荐码领取体验卡" });
      }
      user.redeemedReferralCodes.push(referralCode.trim().toUpperCase());
      matchmakerId = mmRes.rows[0].id;
      selectedPlanId = "trial_3d";
    } else {
      await client.query("rollback");
      return response.status(400).json({ error: "code_or_referral_code_required" });
    }

    const definition = getServicePlan(selectedPlanId);
    ensureServiceSubscriptions(user);
    const activeLongPlan = user.servicePlans.find((plan) =>
      plan.status === "active" && new Date(plan.expiresAt) > new Date() && plan.exclusive
    );
    if (definition.exclusive && activeLongPlan && activeLongPlan.matchmakerId && activeLongPlan.matchmakerId !== matchmakerId) {
      await client.query("rollback");
      return response.status(409).json({ error: "exclusive_matchmaker_plan_exists", message: "月卡/季卡服务期内只能绑定 1 位专属红娘，请先到期或更换红娘" });
    }

    // 订阅服务订单：短周期可同时购买多位红娘，长周期仅保留一位专属红娘
    user.vip = true;
    const currentPlan = definition.exclusive && activeLongPlan && activeLongPlan.matchmakerId === matchmakerId ? activeLongPlan : null;
    const newPlan = currentPlan
      ? renewServicePlan(currentPlan, selectedPlanId, matchmakerId)
      : createServicePlan(new Date(), selectedPlanId, matchmakerId);
    user.servicePlans = currentPlan
      ? user.servicePlans.map((plan) => plan.subscriptionId === currentPlan.subscriptionId ? newPlan : plan)
      : [...user.servicePlans, newPlan];
    user.servicePlan = newPlan;
    user.vipExpiresAt = user.servicePlans
      .filter((plan) => plan.status === "active" && new Date(plan.expiresAt) > new Date())
      .reduce((latest, plan) => new Date(plan.expiresAt) > new Date(latest) ? plan.expiresAt : latest, newPlan.expiresAt)
      .slice(0, 10);
    if (matchmakerId) upsertUserVipMatchmaker(user, matchmakerId);
    await client.query(
      "update users set vip = true, raw = $1, updated_at = now() where id = $2",
      [JSON.stringify(user), userId]
    );

    // 写入流水
    const dealId = `d${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    const deal = {
      id: dealId,
      requestId: null,
      amount: definition.price,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await client.query(
      "insert into deals (id, request_id, amount, created_at, raw) values ($1, $2, $3, $4, $5::jsonb)",
      [dealId, null, definition.price, deal.createdAt, JSON.stringify({ ...deal, planId: selectedPlanId, servicePlan: user.servicePlan })]
    );

    await client.query("commit");
    invalidateStateCache();
    response.json({ user: sanitizeUserSelf(user), state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error(err);
    response.status(500).json({ error: "internal_server_error" });
  } finally {
    client.release();
  }
});

// 4. 客户：申请牵线
app.post("/api/client/match-requests", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  let { targetUserId, matchmakerId } = request.body || {};
  if (!targetUserId) return response.status(400).json({ error: "target_user_required" });
  if (targetUserId === userId) return response.status(400).json({ error: "cannot_match_self" });

  const client = await pool.connect();
  try {
    await client.query("begin");
    const usersRes = await client.query(
      "select id, raw from users where id = any($1::text[]) order by id for update",
      [[userId, targetUserId]],
    );
    const fromRow = usersRes.rows.find((row) => row.id === userId);
    const toRow = usersRes.rows.find((row) => row.id === targetUserId);
    if (!fromRow) {
      await client.query("rollback");
      return response.status(404).json({ error: "user_not_found" });
    }
    if (!toRow) {
      await client.query("rollback");
      return response.status(404).json({ error: "target_not_found" });
    }
    const fromUser = ensureUserDefaults(fromRow.raw);
    const toUser = ensureUserDefaults(toRow.raw);
    matchmakerId ||= toUser.matchmakerIds?.[0] || fromUser.matchmakerIds?.[0] || null;
    if (!matchmakerId) {
      await client.query("rollback");
      return response.status(400).json({ error: "matchmaker_required" });
    }
    if (!new Set(getServiceMatchmakerIds(fromUser)).has(matchmakerId)) {
      await client.query("rollback");
      return response.status(403).json({ error: "matchmaker_vip_required" });
    }
    if (!new Set(toUser.matchmakerIds.filter(Boolean)).has(matchmakerId)) {
      await client.query("rollback");
      return response.status(400).json({ error: "target_not_bound_to_matchmaker" });
    }

    const requestedPlan = getActiveServicePlan(fromUser, matchmakerId);
    if (!requestedPlan) {
      await client.query("rollback");
      return response.status(402).json({ error: "service_plan_required", message: "请先购买有效的红娘服务包" });
    }
    if (requestedPlan.totalMatchLimit !== null && requestedPlan.totalMatchUsed >= requestedPlan.totalMatchLimit) {
      await client.query("rollback");
      return response.status(429).json({ error: "match_quota_exhausted", message: `${requestedPlan.name}的牵线额度已用完` });
    }
    if (requestedPlan.weeklyMatchLimit !== null && requestedPlan.weeklyMatchUsed >= requestedPlan.weeklyMatchLimit) {
      await client.query("rollback");
      return response.status(429).json({ error: "weekly_match_quota_exhausted", message: `${requestedPlan.name}本周期推荐额度已用完` });
    }

    // 反向也视为重复：A→B 和 B→A 不能同时存在未完成的牵线
    const duplicateRes = await client.query(
      `select 1 from match_requests
       where matchmaker_id = $1 and status not in ('已完成', '已拒绝')
       and ((from_user_id = $2 and to_user_id = $3) or (from_user_id = $3 and to_user_id = $2))
       limit 1`,
      [matchmakerId, userId, targetUserId],
    );
    if (duplicateRes.rows.length > 0) {
      await client.query("rollback");
      return response.status(409).json({ error: "request_pending", message: "你们已有进行中的牵线申请" });
    }

    const reqId = `r${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    const matchReq = {
      id: reqId,
      fromUserId: userId,
      toUserId: targetUserId,
      matchmakerId,
      status: "待红娘联系",
      maleContacted: false,
      femaleContacted: false,
      memberChatEnabled: false,
      servicePlanId: requestedPlan.subscriptionId,
      serviceStage: "待首次推荐",
      followupCount: 0,
      matchOutcome: null,
      rewardLedger: { effectiveMatch: 0, followup: 0, success: 0, status: "pending" },
      createdAt: new Date().toISOString(),
    };
    requestedPlan.weeklyMatchUsed += 1;
    requestedPlan.totalMatchUsed += 1;
    await client.query("update users set raw = $1, updated_at = now() where id = $2", [JSON.stringify(fromUser), userId]);
    await client.query(
      `insert into match_requests (id, from_user_id, to_user_id, matchmaker_id, status, created_at, raw)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [reqId, userId, targetUserId, matchmakerId, matchReq.status, matchReq.createdAt, JSON.stringify(matchReq)],
    );

    const mmThreads = buildMemberMatchmakerThreads(matchReq, fromUser, toUser);
    const groupThread = buildMatchmakerGroupThread(matchReq);
    for (const thread of [...mmThreads, groupThread]) {
      await client.query(
        `insert into chat_threads (id, type, request_id, status, participants, raw)
         values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
         on conflict do nothing`,
        [thread.id, thread.type, thread.requestId, thread.status, JSON.stringify(thread.participants), JSON.stringify(thread)],
      );
    }
    await client.query("commit");
    invalidateStateCache();

    const myMatchmakerThread = mmThreads.find((thread) =>
      thread.participants.some((participant) => participant.role === "client" && participant.id === userId)
    );
    response.status(201).json({
      request: {
        ...matchReq,
        matchmakerThreadId: myMatchmakerThread?.id || null,
        memberChatEnabled: false,
        memberThreadId: null,
        groupThreadId: groupThread.id,
      },
      state: publicState(await readState(), request.user.role, request.user.sub),
    });
  } catch (error) {
    try { await client.query("rollback"); } catch (_) {}
    console.error("创建牵线请求失败:", error);
    response.status(500).json({ error: "match_request_create_failed" });
  } finally {
    client.release();
  }
});

// 5. 红娘：分别标记已联系男方/女方
app.patch("/api/matchmaker/requests/:id/contacted", requireAuth(["matchmaker"]), async (request, response) => {
  const requestId = request.params.id;
  const matchmakerId = request.user.sub;
  const side = request.body?.side;
  if (!["male", "female"].includes(side)) {
    return response.status(400).json({ error: "contact_side_required" });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const reqRes = await client.query("select raw from match_requests where id = $1 for update", [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "request_not_found" });
    }
    const req = ensureRequestDefaults(reqRes.rows[0].raw);

    if (req.matchmakerId !== matchmakerId) {
      await client.query("rollback");
      return response.status(403).json({ error: "forbidden" });
    }
    if (rejectTerminalRequest(req, response)) {
      await client.query("rollback");
      return;
    }

    if (side === "male") req.maleContacted = true;
    if (side === "female") req.femaleContacted = true;
    req.status = getRequestContactStatus(req);
    await client.query(
      "update match_requests set status = $1, raw = $2, updated_at = now() where id = $3",
      [req.status, JSON.stringify(req), requestId]
    );
    if (isGroupChatAllowed(req)) {
      const groupThread = buildMatchmakerGroupThread(req);
      await client.query(
        `insert into chat_threads (id, type, request_id, status, participants, raw)
         values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
         on conflict (id) do nothing`,
        [groupThread.id, groupThread.type, groupThread.requestId, groupThread.status, JSON.stringify(groupThread.participants), JSON.stringify(groupThread)]
      );
    }
    await client.query("commit");
    invalidateStateCache();
    response.json({ request: req, state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error("contacted error:", err);
    response.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

app.patch("/api/matchmaker/requests/:id/approve-member-chat", requireAuth(["matchmaker"]), async (request, response) => {
  const requestId = request.params.id;
  const matchmakerId = request.user.sub;

  const client = await pool.connect();
  try {
    await client.query("begin");
    const reqRes = await client.query("select raw from match_requests where id = $1 for update", [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "request_not_found" });
    }
    const req = ensureRequestDefaults(reqRes.rows[0].raw);
    if (req.matchmakerId !== matchmakerId) {
      await client.query("rollback");
      return response.status(403).json({ error: "forbidden" });
    }
    if (rejectTerminalRequest(req, response)) {
      await client.query("rollback");
      return;
    }
    req.memberChatEnabled = true;
    await client.query(
      "update match_requests set raw = $1, updated_at = now() where id = $2",
      [JSON.stringify(req), requestId]
    );

    const threadRes = await client.query(
      "select id from chat_threads where request_id = $1 and type = 'member_member' limit 1",
      [requestId]
    );
    if (threadRes.rows.length === 0) {
      const memberThread = buildMemberMemberThread(req);
      await client.query(
        `insert into chat_threads (id, type, request_id, status, participants, raw)
         values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
         on conflict do nothing`,
        [
          memberThread.id,
          memberThread.type,
          memberThread.requestId,
          memberThread.status,
          JSON.stringify(memberThread.participants),
          JSON.stringify(memberThread),
        ]
      );
    }

    const groupThreadRes = await client.query(
      "select id from chat_threads where request_id = $1 and type = 'matchmaker_group' limit 1",
      [requestId]
    );
    if (groupThreadRes.rows.length === 0) {
      const groupThread = buildMatchmakerGroupThread(req);
      await client.query(
        `insert into chat_threads (id, type, request_id, status, participants, raw)
         values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
         on conflict (id) do nothing`,
        [
          groupThread.id,
          groupThread.type,
          groupThread.requestId,
          groupThread.status,
          JSON.stringify(groupThread.participants),
          JSON.stringify(groupThread),
        ]
      );
    }

    await client.query("commit");
    invalidateStateCache();
    response.json({ request: req, state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error("approve-member-chat error:", err);
    response.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

app.patch("/api/matchmaker/requests/:id/member-chat", requireAuth(["matchmaker"]), async (request, response) => {
  const requestId = request.params.id;
  const matchmakerId = request.user.sub;
  const enabled = Boolean(request.body?.enabled);

  const client = await pool.connect();
  try {
    await client.query("begin");
    const reqRes = await client.query("select raw from match_requests where id = $1 for update", [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "request_not_found" });
    }
    const req = ensureRequestDefaults(reqRes.rows[0].raw);
    if (req.matchmakerId !== matchmakerId) {
      await client.query("rollback");
      return response.status(403).json({ error: "forbidden" });
    }
    if (rejectTerminalRequest(req, response)) {
      await client.query("rollback");
      return;
    }

    req.memberChatEnabled = enabled;
    await client.query(
      "update match_requests set raw = $1, updated_at = now() where id = $2",
      [JSON.stringify(req), requestId]
    );

    if (enabled) {
      const threadRes = await client.query(
        "select id from chat_threads where request_id = $1 and type = 'member_member' limit 1",
        [requestId]
      );
      if (threadRes.rows.length === 0) {
        const memberThread = buildMemberMemberThread(req);
        await client.query(
          `insert into chat_threads (id, type, request_id, status, participants, raw)
           values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
           on conflict do nothing`,
          [memberThread.id, memberThread.type, memberThread.requestId, memberThread.status, JSON.stringify(memberThread.participants), JSON.stringify(memberThread)]
        );
      }

      const groupThreadRes = await client.query(
        "select id from chat_threads where request_id = $1 and type = 'matchmaker_group' limit 1",
        [requestId]
      );
      if (groupThreadRes.rows.length === 0) {
        const groupThread = buildMatchmakerGroupThread(req);
        await client.query(
          `insert into chat_threads (id, type, request_id, status, participants, raw)
           values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
           on conflict (id) do nothing`,
          [groupThread.id, groupThread.type, groupThread.requestId, groupThread.status, JSON.stringify(groupThread.participants), JSON.stringify(groupThread)]
        );
      }
    }

    await client.query("commit");
    invalidateStateCache();
    response.json({ request: req, state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error("member-chat error:", err);
    response.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

// 红娘服务进度与奖励：奖励服务质量和用户确认的结果，不奖励拖延或隐瞒合适对象
app.patch("/api/matchmaker/requests/:id/service-progress", requireAuth(["matchmaker"]), async (request, response) => {
  const requestId = request.params.id;
  const matchmakerId = request.user.sub;
  const action = request.body?.action;
  const client = await pool.connect();
  try {
    await client.query("begin");
    // 锁定 request 行，防止并发修改
    const reqRes = await client.query("select raw from match_requests where id = $1 for update", [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "request_not_found" });
    }
    const req = ensureRequestDefaults(reqRes.rows[0].raw);
    if (req.matchmakerId !== matchmakerId) {
      await client.query("rollback");
      return response.status(403).json({ error: "forbidden" });
    }
    if (rejectTerminalRequest(req, response)) {
      await client.query("rollback");
      return;
    }

    // 锁定客户行，防止 weeklyFollowupUsed / servicePlans 并发更新丢失
    const fromRes = await client.query("select raw from users where id = $1 for update", [req.fromUserId]);
    const customer = fromRes.rows[0] ? ensureUserDefaults(fromRes.rows[0].raw) : null;
    if (!customer) {
      await client.query("rollback");
      return response.status(404).json({ error: "customer_not_found" });
    }
    const servicePlan = customer.servicePlans.find((plan) => plan.subscriptionId === req.servicePlanId) || customer.servicePlan;
    // 校验服务计划是否仍有效（未过期且 active）
    const now = Date.now();
    const isPlanActive = (plan) => {
      if (!plan) return false;
      if (plan.status && plan.status !== "active") return false;
      if (plan.expiresAt) {
        const exp = new Date(plan.expiresAt).getTime();
        if (!Number.isNaN(exp) && exp < now) return false;
      }
      return true;
    };
    if (!isPlanActive(servicePlan)) {
      await client.query("rollback");
      return response.status(409).json({ error: "service_plan_expired", message: "客户的服务包已过期，无法继续推进服务" });
    }

    req.rewardLedger ||= { effectiveMatch: 0, followup: 0, success: 0, status: "pending" };
    if (action === "follow_up") {
      if (!servicePlan || (servicePlan.weeklyFollowupLimit !== null && servicePlan.weeklyFollowupUsed >= servicePlan.weeklyFollowupLimit)) {
        await client.query("rollback");
        return response.status(429).json({ error: "weekly_followup_quota_exhausted", message: "该服务包的跟进权益已用完" });
      }
      servicePlan.weeklyFollowupUsed += 1;
      req.followupCount = Number(req.followupCount || 0) + 1;
      req.serviceStage = "红娘持续跟进中";
      req.rewardLedger.followup = 0;
    } else if (action === "effective_match") {
      if (!req.maleContacted || !req.femaleContacted) {
        await client.query("rollback");
        return response.status(409).json({ error: "both_sides_not_contacted", message: "请先分别联系男女双方" });
      }
      req.serviceStage = "已完成有效匹配";
      req.matchOutcome = "effective";
      req.rewardLedger.effectiveMatch = 0;
    } else if (action === "not_fit") {
      if (!servicePlan) {
        await client.query("rollback");
        return response.status(409).json({ error: "service_plan_not_found" });
      }
      // 已确认有效匹配后不能再标记为不合适，防止红娘恶意撤销
      if (req.matchOutcome === "effective") {
        await client.query("rollback");
        return response.status(409).json({ error: "effective_match_already_set", message: "已确认有效匹配，不能再标记为不合适" });
      }
      // not_fit 作为终态：不再允许原地复活为 effective_match。
      // 如果红娘误判，由客户重新发起牵线（这也是更合理的流程）。
      req.serviceStage = "不合适，等待重新匹配";
      req.matchOutcome = "not_fit";
      req.status = "已拒绝";
      if (!req.matchCreditReturned) {
        servicePlan.weeklyMatchUsed = Math.max(0, Number(servicePlan.weeklyMatchUsed || 0) - 1);
        servicePlan.totalMatchUsed = Math.max(0, Number(servicePlan.totalMatchUsed || 0) - 1);
        // 同时回退跟进额度，避免 weeklyFollowupUsed 残留
        servicePlan.weeklyFollowupUsed = Math.max(0, Number(servicePlan.weeklyFollowupUsed || 0) - Number(req.followupCount || 0));
        req.matchCreditReturned = true;
      }
    } else {
      await client.query("rollback");
      return response.status(400).json({ error: "invalid_service_action" });
    }

    await client.query("update users set raw = $1, updated_at = now() where id = $2", [JSON.stringify(customer), customer.id]);
    await client.query("update match_requests set status = $1, raw = $2, updated_at = now() where id = $3", [req.status, JSON.stringify(req), requestId]);
    await client.query("commit");
    invalidateStateCache();
    response.json({ request: req, state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error("service-progress error:", err);
    response.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

// 成功奖励必须由会员本人确认，红娘不能单方面把普通牵线标记为脱单
app.patch("/api/client/match-requests/:id/outcome", requireAuth(["client"]), async (request, response) => {
  const requestId = request.params.id;
  const outcome = request.body?.outcome;
  if (outcome !== "stable_progress") return response.status(400).json({ error: "invalid_outcome" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const reqRes = await client.query("select raw from match_requests where id = $1 for update", [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "request_not_found" });
    }
    const req = ensureRequestDefaults(reqRes.rows[0].raw);
    if (req.fromUserId !== request.user.sub) {
      await client.query("rollback");
      return response.status(403).json({ error: "forbidden" });
    }
    if (rejectTerminalRequest(req, response)) {
      await client.query("rollback");
      return;
    }
    if (req.matchOutcome !== "effective" || !req.maleContacted || !req.femaleContacted) {
      await client.query("rollback");
      return response.status(409).json({ error: "effective_match_required", message: "红娘确认有效匹配后才能确认稳定发展" });
    }
    const customerRes = await client.query("select raw from users where id = $1 for update", [req.fromUserId]);
    const customer = customerRes.rows[0] ? ensureUserDefaults(customerRes.rows[0].raw) : null;
    const servicePlan = customer?.servicePlans.find((plan) => plan.subscriptionId === req.servicePlanId) || customer?.servicePlan;
    req.rewardLedger ||= { effectiveMatch: 0, followup: 0, success: 0, status: "pending" };
    req.serviceStage = "双方稳定发展（用户确认）";
    req.matchOutcome = outcome;
    req.status = "已完成";
    req.rewardLedger.success = Number(servicePlan?.successReward || 0);
    req.rewardLedger.status = "eligible";
    await client.query(
      "update match_requests set status = $1, raw = $2, updated_at = now() where id = $3",
      [req.status, JSON.stringify(req), requestId],
    );
    // 将成功奖励写入 deals 流水并按 splits 分账
    if (req.rewardLedger.success > 0) {
      const settingsRes = await client.query("select data from app_settings where id = 'runtime'");
      const splits = settingsRes.rows[0]?.data?.splits || { promo: 20, matchmaker: 35, platform: 45 };
      const dealId = `d${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
      const deal = {
        id: dealId,
        requestId: requestId,
        amount: req.rewardLedger.success,
        type: "success_reward",
        matchmakerId: req.matchmakerId,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      await client.query(
        "insert into deals (id, request_id, amount, created_at, raw) values ($1, $2, $3, $4, $5::jsonb)",
        [dealId, requestId, req.rewardLedger.success, deal.createdAt, JSON.stringify({ ...deal, splits })]
      );
    }
    await client.query("commit");
    invalidateStateCache();
    response.json({ request: req, state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error("outcome error:", err);
    response.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

// 服务完成后由会员评价红娘，评分用于曝光和接单排序
app.patch("/api/client/match-requests/:id/rating", requireAuth(["client"]), async (request, response) => {
  const requestId = request.params.id;
  const rating = Number(request.body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return response.status(400).json({ error: "rating_invalid" });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const reqRes = await client.query("select raw from match_requests where id = $1 for update", [requestId]);
    if (reqRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "request_not_found" });
    }
    const req = ensureRequestDefaults(reqRes.rows[0].raw);
    if (req.fromUserId !== request.user.sub) {
      await client.query("rollback");
      return response.status(403).json({ error: "forbidden" });
    }
    if (req.status !== "已完成") {
      await client.query("rollback");
      return response.status(409).json({ error: "service_not_completed" });
    }
    if (req.customerRating) {
      await client.query("rollback");
      return response.status(409).json({ error: "rating_already_submitted" });
    }
    req.customerRating = rating;
    req.customerFeedback = String(request.body?.comment || "").trim().slice(0, 500);
    await client.query("update match_requests set raw = $1, updated_at = now() where id = $2", [JSON.stringify(req), requestId]);
    // 锁定红娘行，防止 ratingCount/ratingTotal 并发更新丢失
    const mmRes = await client.query("select raw from matchmakers where id = $1 for update", [req.matchmakerId]);
    if (mmRes.rows[0]) {
      const mm = mmRes.rows[0].raw;
      mm.ratingCount = Number(mm.ratingCount || 0) + 1;
      mm.ratingTotal = Number(mm.ratingTotal || 0) + rating;
      mm.serviceScore = Number((mm.ratingTotal / mm.ratingCount).toFixed(2));
      await client.query("update matchmakers set raw = $1, updated_at = now() where id = $2", [JSON.stringify(mm), req.matchmakerId]);
    }
    await client.query("commit");
    invalidateStateCache();
    response.json({ request: req, state: publicState(await readState(), request.user.role, request.user.sub) });
  } catch (err) {
    try { await client.query("rollback"); } catch {}
    console.error("rating error:", err);
    response.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

app.post("/api/chat/threads/:id/messages", requireAuth(["client", "matchmaker"]), async (request, response) => {
  const threadId = request.params.id;
  const content = String(request.body?.content || "").trim();
  const clientMsgNo = String(request.body?.clientMsgNo || "").trim().slice(0, 120) || null;
  const clientSeq = Number.isInteger(request.body?.clientSeq) ? request.body.clientSeq : null;
  const deviceId = String(request.body?.deviceId || "").trim() || null;
  const clientCreatedAt = request.body?.createdAt || null;
  if (!content) return response.status(400).json({ error: "content_required" });

  // 反欺诈：敏感词检测
  const sensitiveFound = findSensitiveWords(content);
  const maskedContent = sensitiveFound.length > 0 ? maskSensitiveWords(content) : content;

  const threadRes = await pool.query("select raw from chat_threads where id = $1", [threadId]);
  if (threadRes.rows.length === 0) return response.status(404).json({ error: "thread_not_found" });
  const thread = ensureThreadDefaults(threadRes.rows[0].raw);
  if (!canAccessThread(thread, request.user)) return response.status(403).json({ error: "forbidden" });
  if (thread.status !== "active") return response.status(400).json({ error: "thread_inactive" });

  // 检查发送者是否被拉黑
  const peerIds = (thread.participants || [])
    .filter((participant) => participant.id !== request.user.sub)
    .map((participant) => participant.id);
  const blockedRes = await pool.query(
    `select raw from blocks
     where (blocker_id = $1 and blocked_id = any($2::text[]))
        or (blocked_id = $1 and blocker_id = any($2::text[]))
     limit 1`,
    [request.user.sub, peerIds]
  );
  if (blockedRes.rows.length > 0) {
    return response.status(403).json({ error: "blocked_by_peer", message: "对方已拉黑你，无法发送消息" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // 锁住线程行，确保同一线程的消息插入串行化
    await client.query("select id from chat_threads where id = $1 for update", [threadId]);

    // 事务内重新校验 member_chat、servicePlan、request 终态，避免 TOCTOU 竞态
    if (thread.type === "member_member") {
      const reqRes = await client.query("select raw from match_requests where id = $1 for update", [thread.requestId]);
      const req = reqRes.rows[0] ? ensureRequestDefaults(reqRes.rows[0].raw) : null;
      if (!req?.memberChatEnabled) {
        await client.query("ROLLBACK");
        client.release();
        return response.status(403).json({ error: "member_chat_disabled" });
      }
      if (request.user.role === "client") {
        const senderRes = await client.query("select raw from users where id = $1", [request.user.sub]);
        if (senderRes.rows[0]) {
          const sender = ensureUserDefaults(senderRes.rows[0].raw);
          const hasActivePlan = (sender.servicePlans || []).some((plan) =>
            plan.status === "active" && new Date(plan.expiresAt) > new Date()
          );
          if (!hasActivePlan) {
            await client.query("ROLLBACK");
            client.release();
            return response.status(403).json({ error: "service_plan_expired", message: "服务套餐已过期，无法继续聊天" });
          }
        }
      }
    }
    // 所有 thread 类型都校验关联 request 是否已终态
    if (thread.requestId) {
      const terminalReqRes = await client.query("select raw from match_requests where id = $1 for update", [thread.requestId]);
      if (terminalReqRes.rows[0]) {
        const terminalReq = ensureRequestDefaults(terminalReqRes.rows[0].raw);
        if (["已完成", "已拒绝"].includes(terminalReq.status)) {
          await client.query("ROLLBACK");
          client.release();
          return response.status(403).json({ error: "request_terminated", message: "该牵线已结束，无法继续发送消息" });
        }
      }
    }

    if (clientMsgNo) {
      const existingRes = await client.query(
        "select raw from chat_messages where thread_id = $1 and raw->>'clientMsgNo' = $2 limit 1",
        [threadId, clientMsgNo],
      );
      if (existingRes.rows[0]) {
        await client.query("COMMIT");
        client.release();
        return response.json({ message: existingRes.rows[0].raw, thread, deduplicated: true });
      }
    }
    
    const seqRes = await client.query(
      "select coalesce(max((raw->>'seq')::int), 0) as max_seq from chat_messages where thread_id = $1",
      [threadId]
    );
    const nextSeq = (seqRes.rows[0]?.max_seq || 0) + 1;
    
    const serverNow = new Date();
    const message = {
      id: `cm${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
      threadId,
      seq: nextSeq,
      senderRole: request.user.role,
      senderId: request.user.sub,
      content: maskedContent,
      createdAt: normalizeClientMessageTime(clientCreatedAt, serverNow),
    };
    if (clientCreatedAt) message.clientCreatedAt = String(clientCreatedAt);
    if (sensitiveFound.length > 0) {
      message.sensitiveWords = sensitiveFound;
      message.originalContentMasked = true;
    }
    if (clientMsgNo) {
      message.clientMsgNo = clientMsgNo;
    }
    if (clientSeq != null && clientSeq > 0) {
      message.clientSeq = clientSeq;
    }
    if (deviceId) {
      message.deviceId = deviceId;
    }
    const previousLastMessageAt = thread.lastMessageAt ? new Date(thread.lastMessageAt) : null;
    thread.lastMessageAt = previousLastMessageAt && previousLastMessageAt > new Date(message.createdAt)
      ? previousLastMessageAt.toISOString()
      : message.createdAt;
    thread.lastMessagePreview = maskedContent.slice(0, 80);
  
    await client.query(
      "insert into chat_messages (id, thread_id, sender_role, sender_id, content, created_at, raw) values ($1, $2, $3, $4, $5, $6, $7::jsonb)",
      [message.id, message.threadId, message.senderRole, message.senderId, message.content, message.createdAt, JSON.stringify(message)]
    );
    await client.query(
      "update chat_threads set raw = $1, updated_at = now() where id = $2",
      [JSON.stringify(thread), threadId]
    );

    // 红娘真正发出消息时才记为"已联系"，避免仅打开会话就推进业务状态。
    // 一对一私聊标记对应性别；三方群聊同时标记男女双方。
    if (request.user.role === "matchmaker" && thread.requestId
        && (thread.type === "member_matchmaker" || thread.type === "matchmaker_group")) {
      const requestRes = await client.query("select raw from match_requests where id = $1 for update", [thread.requestId]);
      if (requestRes.rows[0]) {
        const matchRequest = ensureRequestDefaults(requestRes.rows[0].raw);
        if (!isRequestTerminal(matchRequest)) {
          const clientIds = (thread.participants || [])
            .filter((participant) => participant.role === "client")
            .map((participant) => participant.id);
          if (clientIds.length > 0) {
            const clientsRes = await client.query(
              "select gender from users where id = any($1::text[]) and gender is not null",
              [clientIds]
            );
            for (const row of clientsRes.rows) {
              if (row.gender === "男") matchRequest.maleContacted = true;
              if (row.gender === "女") matchRequest.femaleContacted = true;
            }
            matchRequest.status = getRequestContactStatus(matchRequest);
            await client.query(
              "update match_requests set status = $1, raw = $2, updated_at = now() where id = $3",
              [matchRequest.status, JSON.stringify(matchRequest), matchRequest.id],
            );
          }
        }
      }
    }
    
    await client.query("COMMIT");
    client.release();
    invalidateStateCache();
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    client.release();
    console.error("发送消息失败:", error);
    return response.status(500).json({ error: "send_failed" });
  }
  // 事务已提交：广播和响应放在 try/catch 之外，避免广播异常触发假 500 和双重 release
  try {
    broadcastChatMessage(thread, message);
  } catch (e) {
    console.error("broadcastChatMessage error:", e);
  }
  response.status(201).json({ message, thread, sensitiveWords: sensitiveFound.length > 0 ? sensitiveFound : undefined });
});

// 反欺诈：拉黑用户
app.post("/api/client/blocks", requireAuth(["client", "matchmaker"]), async (request, response) => {
  const blockerId = request.user.sub;
  const { blockedId, reason } = request.body || {};
  if (!blockedId) return response.status(400).json({ error: "blocked_id_required" });
  if (blockedId === blockerId) return response.status(400).json({ error: "cannot_block_self" });
  // 校验目标用户是否存在，避免孤儿数据
  const targetRes = await pool.query("select id from users where id = $1", [blockedId]);
  if (targetRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const blockId = `blk${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  const block = {
    id: blockId,
    blockerId,
    blockedId,
    reason: reason ? String(reason).slice(0, 500) : null,
    createdAt: new Date().toISOString(),
  };

  await pool.query(
    `insert into blocks (id, blocker_id, blocked_id, reason, raw) values ($1, $2, $3, $4, $5::jsonb)
     on conflict (blocker_id, blocked_id) do nothing`,
    [blockId, blockerId, blockedId, block.reason, JSON.stringify(block)]
  );
  response.status(201).json({ block });
});

// 反欺诈：取消拉黑
app.delete("/api/client/blocks/:blockedId", requireAuth(["client", "matchmaker"]), async (request, response) => {
  const blockerId = request.user.sub;
  const blockedId = request.params.blockedId;
  await pool.query("delete from blocks where blocker_id = $1 and blocked_id = $2", [blockerId, blockedId]);
  response.json({ ok: true });
});

// 反欺诈：举报用户
app.post("/api/client/reports", requireAuth(["client", "matchmaker"]), async (request, response) => {
  const reporterId = request.user.sub;
  const { reportedId, reason, detail } = request.body || {};
  if (!reportedId || !reason) return response.status(400).json({ error: "reported_id_and_reason_required" });
  if (reportedId === reporterId) return response.status(400).json({ error: "cannot_report_self" });
  // 校验目标用户是否存在，避免孤儿数据
  const targetRes = await pool.query("select id from users where id = $1", [reportedId]);
  if (targetRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });

  const validReasons = ["fraud", "harassment", "fake_profile", "spam", "inappropriate_content", "other"];
  if (!validReasons.includes(reason)) {
    return response.status(400).json({ error: "invalid_reason", message: "举报类型无效" });
  }

  const reportId = `rpt${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  const report = {
    id: reportId,
    reporterId,
    reportedId,
    reason,
    detail: detail ? String(detail).slice(0, 1000) : null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await pool.query(
    `insert into reports (id, reporter_id, reported_id, reason, detail, status, raw) values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [reportId, reporterId, reportedId, reason, report.detail, "pending", JSON.stringify(report)]
  );
  response.status(201).json({ report });
});

// 反欺诈：获取拉黑列表
app.get("/api/client/blocks", requireAuth(["client", "matchmaker"]), async (request, response) => {
  const blockerId = request.user.sub;
  const res = await pool.query("select raw from blocks where blocker_id = $1 order by created_at desc", [blockerId]);
  response.json({ list: res.rows.map(r => r.raw) });
});

// 管理员：获取举报列表
app.get("/api/admin/reports", requireAuth(["admin"]), async (request, response) => {
  const res = await pool.query("select raw from reports order by created_at desc limit 100");
  response.json({ list: res.rows.map(r => r.raw) });
});

// 管理员：处理举报
app.patch("/api/admin/reports/:id", requireAuth(["admin"]), async (request, response) => {
  const reportId = request.params.id;
  const { status } = request.body || {};
  const validStatus = ["pending", "processing", "resolved", "dismissed"];
  if (!validStatus.includes(status)) {
    return response.status(400).json({ error: "invalid_status" });
  }

  const res = await pool.query("select raw from reports where id = $1", [reportId]);
  if (res.rows.length === 0) return response.status(404).json({ error: "report_not_found" });

  const report = res.rows[0].raw;
  report.status = status;
  report.handledAt = new Date().toISOString();

  await pool.query(
    "update reports set status = $1, raw = $2 where id = $3",
    [status, JSON.stringify(report), reportId]
  );
  response.json({ report });
});

// 6. 管理员：添加机构
app.post("/api/admin/agencies", requireAuth(["admin"]), async (request, response) => {
  const { name, city } = request.body || {};
  if (!name || !city) return response.status(400).json({ error: "name_and_city_required" });

  const agencyId = `a${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  const agency = { id: agencyId, name: name.trim(), city: city.trim() };
  
  await pool.query(
    "insert into agencies (id, name, city, raw) values ($1, $2, $3, $4::jsonb)",
    [agencyId, agency.name, agency.city, JSON.stringify(agency)]
  );
  response.status(201).json({ agency, state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 7. 管理员：添加红娘
app.post("/api/admin/matchmakers", requireAuth(["admin"]), async (request, response) => {
  const { name, agencyId, code, password } = request.body || {};
  if (!name || !agencyId || !code) return response.status(400).json({ error: "missing_fields" });
  const trimmedPassword = String(password || "").trim();
  if (trimmedPassword.length < 6) return response.status(400).json({ error: "password_too_short", message: "红娘初始密码至少 6 位" });

  const codeUpper = code.trim().toUpperCase();
  const codeCheck = await pool.query("select 1 from matchmakers where upper(code) = $1", [codeUpper]);
  if (codeCheck.rows.length > 0) return response.status(409).json({ error: "code_exists" });

  const mmId = `m${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  const matchmaker = {
    id: mmId,
    name: name.trim(),
    agencyId,
    code: codeUpper,
    status: "active",
    passwordHash: hashPassword(trimmedPassword),
    registeredAt: new Date().toISOString()
  };
  
  await pool.query(
    `insert into matchmakers (id, agency_id, name, code, status, registered_at, raw)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [mmId, agencyId, matchmaker.name, codeUpper, matchmaker.status, matchmaker.registeredAt, JSON.stringify(matchmaker)]
  );
  response.status(201).json({ matchmaker, state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 8. 管理员：修改分成比例
app.patch("/api/admin/splits", requireAuth(["admin"]), async (request, response) => {
  const { promo, matchmaker, platform } = request.body || {};
  const values = [promo, matchmaker, platform].map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    return response.status(400).json({ error: "split_out_of_range", message: "分成比例必须在 0 到 100 之间" });
  }
  if (Math.abs(values[0] + values[1] + values[2] - 100) > 0.01) {
    return response.status(400).json({ error: "sum_must_be_100" });
  }

  const settingsRes = await pool.query("select data from app_settings where id = 'runtime'");
  const settings = settingsRes.rows[0]?.data || {};
  settings.splits = { promo: Number(promo), matchmaker: Number(matchmaker), platform: Number(platform) };

  await pool.query(
    "insert into app_settings (id, data, updated_at) values ('runtime', $1::jsonb, now()) on conflict (id) do update set data = excluded.data, updated_at = now()",
    [JSON.stringify(settings)]
  );
  response.json({ splits: settings.splits, state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 9. 管理员：随机生成卡密
app.post("/api/admin/promo-codes", requireAuth(["admin"]), async (request, response) => {
  const { code, matchmakerId, planId = "monthly" } = request.body || {};
  if (!code) return response.status(400).json({ error: "code_required" });
  if (!SERVICE_PLANS[planId]) return response.status(400).json({ error: "invalid_plan" });

  const codeUpper = code.trim().toUpperCase();
  const codeCheck = await pool.query("select 1 from promo_codes where upper(code) = $1", [codeUpper]);
  if (codeCheck.rows.length > 0) return response.status(409).json({ error: "code_exists" });

  const promoCode = {
    code: codeUpper,
    matchmakerId: matchmakerId || null,
    planId,
    used: false,
    usedBy: null
  };
  
  await pool.query(
    "insert into promo_codes (code, matchmaker_id, used, used_by, infinite, raw) values ($1, $2, $3, $4, $5, $6::jsonb)",
    [promoCode.code, promoCode.matchmakerId, false, null, false, JSON.stringify(promoCode)]
  );
  response.status(201).json({ promoCode, state: publicState(await readState(), request.user.role, request.user.sub) });
});

// 10. 管理员：模拟一笔成交记录
app.post("/api/admin/deals/simulate", requireAuth(["admin"]), async (request, response) => {
  const dealId = `d${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  const deal = {
    id: dealId,
    requestId: null,
    amount: 399,
    createdAt: new Date().toISOString().slice(0, 10)
  };
  
  await pool.query(
    "insert into deals (id, request_id, amount, created_at, raw) values ($1, $2, $3, $4, $5::jsonb)",
    [dealId, null, 399, deal.createdAt, JSON.stringify(deal)]
  );
  response.status(201).json({ deal, state: publicState(await readState(), request.user.role, request.user.sub) });
});

// ==========================================
// 客户端 REST API（统一返回格式）
// ==========================================

// 11. 获取当前登录用户资料
app.get("/api/client/me", requireAuth(["client"]), async (request, response) => {
  try {
    const userId = request.user.sub;

    // 从 users 表查询当前用户，raw 字段包含完整信息
    const userRes = await pool.query("select raw from users where id = $1", [userId]);
    if (userRes.rows.length === 0) {
      return response.status(404).json({ code: 404, message: "用户不存在" });
    }

    const raw = ensureUserDefaults(userRes.rows[0].raw);
    // 排除敏感字段：密码哈希和身份证号
    const { passwordHash, idCard, ...userInfo } = raw;

    response.json({ code: 0, data: { user: userInfo }, message: "ok" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 12. 分页获取异性资料列表
app.get("/api/client/profiles", requireAuth(["client"]), async (request, response) => {
  try {
    const userId = request.user.sub;
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize) || 20));
    const { gender, minAge, maxAge, city } = request.query;

    // 先查当前用户信息，确定性别以便默认筛选异性
    const meRes = await pool.query("select raw from users where id = $1", [userId]);
    if (meRes.rows.length === 0) {
      return response.status(404).json({ code: 404, message: "用户不存在" });
    }
    const me = ensureUserDefaults(meRes.rows[0].raw);
    const myGender = me.gender;

    // 构建查询条件：排除自己、默认筛选异性
    const conditions = ["id != $1"];
    const params = [userId];
    let paramIndex = 2;

    // 性别筛选：优先使用传入参数，否则默认异性
    const targetGender = gender || (myGender === "男" ? "女" : myGender === "女" ? "男" : null);
    if (targetGender) {
      conditions.push(`gender = $${paramIndex}`);
      params.push(targetGender);
      paramIndex++;
    }

    // 年龄范围筛选
    if (minAge) {
      conditions.push(`age >= $${paramIndex}`);
      params.push(parseInt(minAge));
      paramIndex++;
    }
    if (maxAge) {
      conditions.push(`age <= $${paramIndex}`);
      params.push(parseInt(maxAge));
      paramIndex++;
    }

    // 城市筛选
    if (city) {
      conditions.push(`city = $${paramIndex}`);
      params.push(city);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 先查询完整候选集，计算全局匹配度后再分页，避免只在当前页内部排序。
    const offset = (page - 1) * pageSize;
    const listRes = await pool.query(
      `SELECT raw FROM users ${whereClause}`,
      params,
    );

    const matchmakersRes = await pool.query("select raw from matchmakers");
    const matchmakerMap = new Map(matchmakersRes.rows.map((row) => [row.raw.id, row.raw]));

    // 匹配度评分算法（简单规则引擎）
    function calculateMatchScore(target, viewer) {
      let score = 0;
      // 同城加分（+30）
      if (target.city && viewer.city && target.city === viewer.city) {
        score += 30;
      }
      // 年龄差越小加分（25岁差内，每差1岁扣1分，最高+25）
      if (target.age && viewer.age) {
        const ageDiff = Math.abs(target.age - viewer.age);
        if (ageDiff <= 25) {
          score += (25 - ageDiff);
        }
      }
      // 实名认证加分（+10）
      if (target.realNameVerified) {
        score += 10;
      }
      // 学历认证加分（+8）
      if (target.education && target.education.verified) {
        score += 8;
      }
      // 视频认证加分（+7）
      if (target.videoVerified) {
        score += 7;
      }
      // 有效 VIP 服务包特权曝光（+15）
      if (getServiceMatchmakerIds(target).length > 0) {
        score += 15;
      }
      // 择偶要求匹配（+5，如果viewer.age在target.requirements提到的年龄范围内）
      if (target.requirements && viewer.age) {
        const ageMatch = target.requirements.match(/(\d+)\s*[-~]\s*(\d+)\s*岁/);
        if (ageMatch) {
          const minAge = parseInt(ageMatch[1], 10);
          const maxAge = parseInt(ageMatch[2], 10);
          if (viewer.age >= minAge && viewer.age <= maxAge) {
            score += 5;
          }
        }
      }
      return score;
    }

    // 处理返回数据：排除敏感字段，非 VIP 不返回 wechat，并计算匹配度
    const rankedList = listRes.rows.map((row) => {
      const target = ensureUserDefaults(row.raw);
      const visibleUser = applyPublishedProfile(target);
      const { passwordHash, idCard, profileByMatchmaker, phone, email, realName, ...userInfo } = visibleUser;
      // 剥离学历证书编号等敏感字段
      if (userInfo.education) {
        userInfo.education = { ...userInfo.education, diplomaNo: undefined };
      }
      if (!canViewTargetContact(me, target)) {
        delete userInfo.wechat;
      }
      userInfo.boundMatchmakers = (userInfo.matchmakerIds || [])
        .map((id) => matchmakerMap.get(id))
        .filter(Boolean)
        .map(({ passwordHash: _passwordHash, ...matchmaker }) => matchmaker);
      // 计算匹配度并加入返回
      userInfo.matchScore = calculateMatchScore(target, me);
      // 认证徽章
      userInfo.badges = {
        realName: !!row.raw.realNameVerified,
        education: !!(row.raw.education && row.raw.education.verified),
        video: !!row.raw.videoVerified,
      };
      return userInfo;
    });

    // 按匹配度降序排序（VIP 特权曝光）
    rankedList.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const total = rankedList.length;
    const list = rankedList.slice(offset, offset + pageSize);

    response.json({
      code: 0,
      data: { list, total, page, pageSize },
      message: "ok",
    });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 13. 获取指定用户详情
app.get("/api/client/profiles/:id", requireAuth(["client"]), async (request, response) => {
  try {
    const userId = request.user.sub;
    const targetId = request.params.id;

    // 查询当前用户的 VIP 状态
    const meRes = await pool.query("select raw from users where id = $1", [userId]);
    if (meRes.rows.length === 0) {
      return response.status(404).json({ code: 404, message: "当前用户不存在" });
    }
    const me = ensureUserDefaults(meRes.rows[0].raw);

    // 查询目标用户
    const targetRes = await pool.query("select raw from users where id = $1", [targetId]);
    if (targetRes.rows.length === 0) {
      return response.status(404).json({ code: 404, message: "用户不存在" });
    }

    // 排除敏感字段：任何情况下都不返回 passwordHash、idCard、profileByMatchmaker、
    // phone、email、realName 给其他用户。
    const target = ensureUserDefaults(targetRes.rows[0].raw);
    const visibleUser = applyPublishedProfile(target);
    const { passwordHash, idCard, profileByMatchmaker, phone, email, realName, ...userInfo } = visibleUser;
    // 剥离学历证书编号等敏感字段
    if (userInfo.education) {
      userInfo.education = { ...userInfo.education, diplomaNo: undefined };
    }
    // 非 VIP 用户不返回微信号
    if (!canViewTargetContact(me, target)) {
      delete userInfo.wechat;
    }
    const matchmakersRes = await pool.query("select raw from matchmakers");
    const matchmakerMap = new Map(matchmakersRes.rows.map((row) => [row.raw.id, row.raw]));
    userInfo.boundMatchmakers = (userInfo.matchmakerIds || [])
      .map((id) => matchmakerMap.get(id))
      .filter(Boolean)
      .map(({ passwordHash: _passwordHash, ...matchmaker }) => matchmaker);

    const matchRequestRes = await pool.query(
      `select raw from match_requests
       where ((from_user_id = $1 and to_user_id = $2) or (from_user_id = $2 and to_user_id = $1))
         and status != '已完成'
       order by created_at desc limit 1`,
      [userId, targetId],
    );
    if (matchRequestRes.rows.length > 0) {
      const matchRequest = ensureRequestDefaults(matchRequestRes.rows[0].raw);
      const [memberThreadRes, matchmakerThreadRes] = await Promise.all([
        pool.query(
          "select id from chat_threads where request_id = $1 and type = 'member_member' limit 1",
          [matchRequest.id],
        ),
        pool.query(
          "select id, raw from chat_threads where request_id = $1 and type = 'member_matchmaker'",
          [matchRequest.id],
        ),
      ]);
      let myMatchmakerThreadId = null;
      for (const row of matchmakerThreadRes.rows) {
        const thread = ensureThreadDefaults(row.raw);
        if ((thread.participants || []).some((p) => p.role === "client" && p.id === userId)) {
          myMatchmakerThreadId = thread.id;
          break;
        }
      }
      const groupThreadRes = await pool.query(
        "select id from chat_threads where request_id = $1 and type = 'matchmaker_group' limit 1",
        [matchRequest.id],
      );
      userInfo.matchRequest = {
        id: matchRequest.id,
        status: matchRequest.status,
        matchmakerId: matchRequest.matchmakerId,
        memberChatEnabled: matchRequest.memberChatEnabled,
        memberThreadId: memberThreadRes.rows[0]?.id || null,
        matchmakerThreadId: myMatchmakerThreadId,
        groupThreadId: groupThreadRes.rows[0]?.id || null,
      };
    }

    response.json({ code: 0, data: { user: userInfo }, message: "ok" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 14. 获取我的牵线记录（包含发起和接收的）
app.get("/api/client/match-requests", requireAuth(["client"]), async (request, response) => {
  try {
    const userId = request.user.sub;

    // 查询当前用户发起或接收的牵线请求，JOIN users 表获取对方基本信息
    const res = await pool.query(
      `SELECT
         mr.raw AS request_raw,
         mr.from_user_id,
         mr.to_user_id,
         CASE WHEN mr.from_user_id = $1 THEN mr.to_user_id ELSE mr.from_user_id END AS other_user_id,
         ou.id AS other_user_id_val,
         ou.name AS other_user_name,
         ou.gender AS other_user_gender,
         ou.age AS other_user_age,
         ou.city AS other_user_city,
         ou.raw->>'photo' AS other_user_photo
       FROM match_requests mr
       LEFT JOIN users ou ON ou.id = CASE WHEN mr.from_user_id = $1 THEN mr.to_user_id ELSE mr.from_user_id END
       WHERE mr.from_user_id = $1 OR mr.to_user_id = $1
       ORDER BY mr.created_at DESC`,
      [userId],
    );

    const list = res.rows.map((row) => ({
      ...row.request_raw,
      direction: row.from_user_id === userId ? "outgoing" : "incoming",
      toUser: {
        id: row.other_user_id_val,
        name: row.other_user_name,
        gender: row.other_user_gender,
        age: row.other_user_age,
        city: row.other_user_city,
        photo: row.other_user_photo,
      },
    }));

    response.json({ code: 0, data: { list }, message: "ok" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 15. 获取我的聊天线程列表
app.get("/api/client/chat/threads", requireAuth(["client"]), async (request, response) => {
  try {
    const userId = request.user.sub;

    // 从 participants jsonb 数组中查找包含当前用户 ID 的线程
    const res = await pool.query(
      `SELECT raw FROM chat_threads
       WHERE participants @> $1::jsonb
       ORDER BY COALESCE(raw->>'lastMessageAt', raw->>'createdAt') DESC`,
      [JSON.stringify([{ role: "client", id: userId }])],
    );

    // 查询所有参与者信息用于匹配对方名称
    const usersRes = await pool.query("SELECT id, name, raw->>'photo' as photo, 'client' as role FROM users");
    const matchmakersRes = await pool.query("SELECT id, name, raw->>'photo' as photo, 'matchmaker' as role FROM matchmakers");
    const participantMap = new Map(
      [...usersRes.rows, ...matchmakersRes.rows].map((r) => [r.id, { name: r.name, photo: r.photo, role: r.role }]),
    );

    const rawThreads = res.rows.map((row) => ensureThreadDefaults(row.raw));
    const requestIds = [
      ...new Set(rawThreads.filter((thread) => thread.requestId).map((thread) => thread.requestId)),
    ];
    let requestMap = new Map();
    if (requestIds.length > 0) {
      const requestRes = await pool.query("select id, raw from match_requests where id = any($1::text[])", [requestIds]);
      requestMap = new Map(requestRes.rows.map((row) => [row.id, ensureRequestDefaults(row.raw)]));
    }

    const visibleThreads = rawThreads.filter((thread) => {
      const matchRequest = requestMap.get(thread.requestId);
      if (thread.type === "member_member") return Boolean(matchRequest?.memberChatEnabled);
      if (thread.type === "matchmaker_group") return isGroupChatAllowed(matchRequest);
      return true;
    });

    const list = visibleThreads.map((thread) => {
      let otherParticipant = (thread.participants || []).find(p => p.id !== userId);
      let otherUser = otherParticipant ? participantMap.get(otherParticipant.id) : null;
      const matchRequest = requestMap.get(thread.requestId);

      if (thread.type === "member_matchmaker" && matchRequest) {
        const matchmakerParticipant = (thread.participants || []).find((p) => p.role === "matchmaker");
        const matchmakerInfo = matchmakerParticipant ? participantMap.get(matchmakerParticipant.id) : null;
        const otherClientId = matchRequest.fromUserId === userId ? matchRequest.toUserId : matchRequest.fromUserId;
        const otherClientInfo = participantMap.get(otherClientId);
        otherParticipant = matchmakerParticipant || otherParticipant;
        otherUser = {
          name: `${otherClientInfo?.name || "对方"}-红娘${matchmakerInfo?.name || ""}`,
          photo: matchmakerInfo?.photo || otherClientInfo?.photo || null,
          role: "matchmaker",
        };
      }

      if (thread.type === "matchmaker_group") {
        const matchmakerParticipant = (thread.participants || []).find((p) => p.role === "matchmaker");
        const otherClientParticipant = (thread.participants || []).find((p) => p.role === "client" && p.id !== userId);
        const matchmakerInfo = matchmakerParticipant ? participantMap.get(matchmakerParticipant.id) : null;
        const otherClientInfo = otherClientParticipant ? participantMap.get(otherClientParticipant.id) : null;
        otherParticipant = { id: thread.id, role: "group" };
        otherUser = {
          name: `${matchmakerInfo?.name || "红娘"}、${otherClientInfo?.name || "对方"}（三方群聊）`,
          photo: matchmakerInfo?.photo || otherClientInfo?.photo || null,
          role: "group",
        };
      }

      return {
        ...thread,
        otherUser: otherUser ? {
          id: otherParticipant.id,
          name: otherUser.name,
          photo: otherUser.photo,
          role: otherUser.role
        } : null
      };
    });

    response.json({ code: 0, data: { list }, message: "ok" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 16. 获取聊天消息
app.get("/api/client/chat/threads/:id/messages", requireAuth(["client"]), async (request, response) => {
  try {
    const userId = request.user.sub;
    const threadId = request.params.id;

    // 先验证用户是否是该线程的参与者
    const threadRes = await pool.query("select raw from chat_threads where id = $1", [threadId]);
    if (threadRes.rows.length === 0) {
      return response.status(404).json({ code: 404, message: "聊天线程不存在" });
    }

    const thread = threadRes.rows[0].raw;
    const isParticipant = (thread.participants || []).some(
      (p) => p.role === "client" && p.id === userId,
    );
    if (!isParticipant) {
      return response.status(403).json({ code: 403, message: "无权访问该聊天线程" });
    }

    // 按客户端创建时间排序，保证消息按真实发送顺序展示；同秒消息按ID排序保证稳定
    const msgRes = await pool.query(
      `SELECT raw FROM chat_messages 
       WHERE thread_id = $1 
       ORDER BY created_at ASC, id ASC`,
      [threadId],
    );

    const list = msgRes.rows.map((row) => row.raw);

    response.json({ code: 0, data: { list }, message: "ok" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 红娘/会员读取私聊或群聊消息。发送消息接口使用同一路径，读取也统一走通用线程权限校验。
app.get("/api/chat/threads/:id/messages", requireAuth(["client", "matchmaker"]), async (request, response) => {
  try {
    const threadId = request.params.id;
    const threadRes = await pool.query("select raw from chat_threads where id = $1", [threadId]);
    if (threadRes.rows.length === 0) {
      return response.status(404).json({ code: 404, message: "聊天线程不存在" });
    }

    const thread = ensureThreadDefaults(threadRes.rows[0].raw);
    if (!canAccessThread(thread, request.user)) {
      return response.status(403).json({ code: 403, message: "无权访问该聊天线程" });
    }

    const msgRes = await pool.query(
      `SELECT raw FROM chat_messages
       WHERE thread_id = $1
       ORDER BY created_at ASC, id ASC`,
      [threadId],
    );

    response.json({ code: 0, data: { list: msgRes.rows.map((row) => row.raw) }, message: "ok" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "internal server error" });
});

await initDatabase();

server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    const payload = verifyToken((url.searchParams.get("token") || "").trim());
    if (!payload || !["client", "matchmaker"].includes(payload.role)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.auth = payload;
      registerRealtimeClient(ws, payload);
      sendRealtime(ws, { type: "socket_ready" });
      // 应用层 ping/pong：兼容前端心跳
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "ping") {
            sendRealtime(ws, { type: "pong" });
          }
        } catch {
          // ignore invalid messages
        }
      });
      ws.on("close", () => {
        unregisterRealtimeClient(ws, payload);
      });
      ws.on("error", () => {
        unregisterRealtimeClient(ws, payload);
      });
    });
  } catch (error) {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`matchmaker api listening on ${PORT}`);
});
