import express from "express";
import pg from "pg";
import crypto from "crypto";

const { Pool } = pg;
const PORT = Number(process.env.PORT || 3000);
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.ADMIN_API_TOKEN || "mediapeople-dev-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

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
  if (!u.delegatedMatchmakerIds) {
    u.delegatedMatchmakerIds = u.referralMatchmakerId ? [u.referralMatchmakerId] : ["m1", "m2"];
  }
});

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || "mediapeople",
        user: process.env.PGUSER || "mediapeople",
        password: process.env.PGPASSWORD,
      },
);

const app = express();
app.use(express.json({ limit: "2mb" }));

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
      referral_matchmaker_id text references matchmakers(id) on delete set null,
      password_hash text,
      account_status text,
      registered_at timestamptz,
      real_name_verified boolean not null default false,
      raw jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
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
  const userCountRes = await pool.query("select count(*) from users");
  const count = Number(userCountRes.rows[0].count);
  if (count === 0) {
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
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
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

function publicState(data) {
  return {
    ...data,
    users: (data.users || []).map(({ passwordHash, idCard, ...user }) => user),
    matchmakers: (data.matchmakers || []).map(({ passwordHash, ...matchmaker }) => matchmaker),
  };
}

function ensureRequestDefaults(request) {
  if (request.memberChatEnabled === undefined) request.memberChatEnabled = false;
  if (request.maleContacted === undefined) {
    request.maleContacted = request.status === "已联系双方";
  }
  if (request.femaleContacted === undefined) {
    request.femaleContacted = request.status === "已联系双方";
  }
  request.status = getRequestContactStatus(request);
  return request;
}

function getRequestContactStatus(request) {
  if (request.maleContacted && request.femaleContacted) return "已联系双方";
  if (request.maleContacted) return "已联系男方";
  if (request.femaleContacted) return "已联系女方";
  return "待红娘联系";
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

function getThreadOtherParticipant(thread, role, id) {
  return (thread.participants || []).find((participant) => !(participant.role === role && participant.id === id)) || null;
}

function buildMemberMatchmakerThread(request) {
  if (!request.matchmakerId) return null;
  return ensureThreadDefaults({
    id: `ct${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
    type: "member_matchmaker",
    requestId: request.id,
    status: "active",
    participants: [
      { role: "matchmaker", id: request.matchmakerId },
      { role: "client", id: request.fromUserId },
      { role: "client", id: request.toUserId },
    ],
    createdAt: new Date().toISOString(),
    lastMessageAt: null,
    lastMessagePreview: "",
  });
}

function buildMemberMemberThread(request) {
  return ensureThreadDefaults({
    id: `ct${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
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

function normalizePhone(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  const email = String(value || "").trim();
  return email ? email.toLowerCase() : null;
}

async function readState() {
  const agenciesRes = await pool.query("select raw from agencies order by id");
  const matchmakersRes = await pool.query("select raw from matchmakers order by id");
  const usersRes = await pool.query("select raw from users order by id");
  const requestsRes = await pool.query("select raw from match_requests order by raw->>'createdAt' desc, id");
  const chatThreadsRes = await pool.query("select raw from chat_threads order by coalesce(raw->>'lastMessageAt', raw->>'createdAt') desc, id");
  const chatMessagesRes = await pool.query("select raw from chat_messages order by created_at asc, id");
  const dealsRes = await pool.query("select raw from deals order by raw->>'createdAt' desc, id");
  const promoCodesRes = await pool.query("select raw from promo_codes order by code");
  const settingsRes = await pool.query("select data from app_settings where id = 'runtime'");

  const runtimeSettings = settingsRes.rows[0]?.data || {
    currentUserId: "u1",
    selectedMatchmakerId: null,
    adminLoggedIn: false,
    splits: { promo: 20, matchmaker: 35, platform: 45 }
  };

  return {
    currentUserId: runtimeSettings.currentUserId,
    selectedMatchmakerId: runtimeSettings.selectedMatchmakerId,
    adminLoggedIn: runtimeSettings.adminLoggedIn,
    splits: runtimeSettings.splits,
    agencies: agenciesRes.rows.map(r => r.raw),
    matchmakers: matchmakersRes.rows.map(r => r.raw),
    users: usersRes.rows.map(r => {
      const u = r.raw;
      if (!u.delegatedMatchmakerIds) {
        u.delegatedMatchmakerIds = u.referralMatchmakerId ? [u.referralMatchmakerId] : ["m1", "m2"];
      }
      return u;
    }),
    requests: requestsRes.rows.map(r => ensureRequestDefaults(r.raw)),
    chatThreads: chatThreadsRes.rows.map(r => ensureThreadDefaults(r.raw)),
    chatMessages: chatMessagesRes.rows.map(r => r.raw),
    deals: dealsRes.rows.map(r => r.raw),
    promoCodes: promoCodesRes.rows.map(r => r.raw),
  };
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
            referral_matchmaker_id, password_hash, account_status, registered_at,
            real_name_verified, raw
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
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
            referral_matchmaker_id = excluded.referral_matchmaker_id,
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
          user.referralMatchmakerId || null,
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
}

app.get("/api/health", async (_request, response) => {
  await pool.query("select 1");
  response.json({ ok: true });
});

app.post("/api/auth/admin/login", async (request, response) => {
  const { password } = request.body || {};
  if (String(password || "") !== ADMIN_PASSWORD) {
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
  if (user.passwordHash && !verifyPassword(String(password || ""), user.passwordHash)) {
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
  if (matchmaker.passwordHash && !verifyPassword(String(password || ""), matchmaker.passwordHash)) {
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
  const state = await readState();
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  if (!phone && !email) {
    response.status(400).json({ error: "phone_or_email_required" });
    return;
  }
  if (phone && state.users.some((user) => user.phone === phone)) {
    response.status(409).json({ error: "phone_exists" });
    return;
  }
  if (email && state.users.some((user) => normalizeEmail(user.email) === email)) {
    response.status(409).json({ error: "email_exists" });
    return;
  }

  const delegatedMatchmakerIds = Array.isArray(input.delegatedMatchmakerIds) ? input.delegatedMatchmakerIds : [];
  const referralMatchmakerId = delegatedMatchmakerIds[0] || null;

  const user = {
    id: `u${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
    name: String(input.name || "").trim(),
    gender: input.gender || null,
    age: Number(input.age || 0),
    city: String(input.city || "").trim(),
    job: String(input.job || "").trim(),
    wechat: String(input.wechat || "").trim(),
    phone: phone || null,
    email,
    passwordHash: hashPassword(String(input.password || "")),
    registeredAt: new Date().toISOString(),
    accountStatus: "active",
    realNameVerified: false,
    realName: null,
    idCard: null,
    vip: false,
    referralMatchmakerId,
    delegatedMatchmakerIds,
    bio: String(input.bio || "").trim(),
    requirements: String(input.requirements || "").trim(),
    photo: input.photo || null,
  };
  state.users.push(user);
  await writeState(state);
  response.status(201).json({
    token: signToken({ role: "client", sub: user.id }),
    user: publicState({ ...state, users: [user] }).users[0],
    state: publicState(await readState()),
  });
});

app.post("/api/auth/matchmaker/register", async (request, response) => {
  const input = request.body || {};
  const state = await readState();
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const code = String(input.code || "").trim().toUpperCase();
  if (!phone || !code) {
    response.status(400).json({ error: "phone_and_code_required" });
    return;
  }
  if (state.matchmakers.some((matchmaker) => matchmaker.code?.toUpperCase() === code)) {
    response.status(409).json({ error: "code_exists" });
    return;
  }
  if (state.matchmakers.some((matchmaker) => matchmaker.phone === phone)) {
    response.status(409).json({ error: "phone_exists" });
    return;
  }
  if (email && state.matchmakers.some((matchmaker) => normalizeEmail(matchmaker.email) === email)) {
    response.status(409).json({ error: "email_exists" });
    return;
  }

  const matchmaker = {
    id: `m${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
    name: String(input.name || "").trim(),
    agencyId: input.agencyId || null,
    code,
    phone,
    email,
    passwordHash: hashPassword(String(input.password || "")),
    status: "active",
    registeredAt: new Date().toISOString(),
  };
  state.matchmakers.push(matchmaker);
  await writeState(state);
  response.status(201).json({
    token: signToken({ role: "matchmaker", sub: matchmaker.id }),
    matchmaker: publicState({ ...state, matchmakers: [matchmaker] }).matchmakers[0],
    state: publicState(await readState()),
  });
});

app.get("/api/state", async (_request, response) => {
  response.json(publicState(await readState()));
});

app.put("/api/state", requireAuth(["admin", "client", "matchmaker"]), async (request, response) => {
  const error = validateState(request.body);
  if (error) {
    response.status(400).json({ error });
    return;
  }
  await writeState(request.body);
  response.json(publicState(await readState()));
});

app.post("/api/reset", requireAuth(["admin"]), async (_request, response) => {
  await writeState(seedState);
  response.json(publicState(await readState()));
});

// ==========================================
// 精细化业务 REST API
// ==========================================

// 1. 客户：修改个人资料
app.patch("/api/client/profile", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { name, gender, age, city, job, wechat, bio, requirements, delegatedMatchmakerIds } = request.body || {};
  
  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });
  
  const user = userRes.rows[0].raw;
  user.name = name !== undefined ? name.trim() : user.name;
  user.gender = gender !== undefined ? gender : user.gender;
  user.age = Number.isFinite(Number(age)) ? Number(age) : user.age;
  user.city = city !== undefined ? city.trim() : user.city;
  user.job = job !== undefined ? job.trim() : user.job;
  user.wechat = wechat !== undefined ? wechat.trim() : user.wechat;
  user.bio = bio !== undefined ? bio.trim() : user.bio;
  user.requirements = requirements !== undefined ? requirements.trim() : user.requirements;
  
  if (Array.isArray(delegatedMatchmakerIds)) {
    user.delegatedMatchmakerIds = delegatedMatchmakerIds;
    user.referralMatchmakerId = delegatedMatchmakerIds[0] || null;
  }
  
  await pool.query(
    `update users set name = $1, gender = $2, age = $3, city = $4, job = $5, wechat = $6, referral_matchmaker_id = $7, raw = $8, updated_at = now() where id = $9`,
    [user.name, user.gender, user.age, user.city, user.job, user.wechat, user.referralMatchmakerId || null, JSON.stringify(user), userId]
  );
  response.json({ user, state: publicState(await readState()) });
});

// 2. 客户：提交实名认证
app.post("/api/client/real-name", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { realName, idCard, phone } = request.body || {};
  if (!realName || !idCard) return response.status(400).json({ error: "name_and_idcard_required" });

  const userRes = await pool.query("select raw from users where id = $1", [userId]);
  if (userRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });
  
  const user = userRes.rows[0].raw;
  user.realName = realName.trim();
  user.idCard = idCard.trim();
  user.realNameVerified = true;
  if (phone) {
    user.phone = phone.trim();
  }
  
  await pool.query(
    `update users set phone = $1, real_name_verified = true, raw = $2, updated_at = now() where id = $3`,
    [user.phone || null, JSON.stringify(user), userId]
  );
  response.json({ user, state: publicState(await readState()) });
});

// 3. 客户：卡密兑换/付费 VIP
app.post("/api/client/vip/redeem", requireAuth(["client"]), async (request, response) => {
  const userId = request.user.sub;
  const { code, referralCode } = request.body || {};
  const client = await pool.connect();
  
  try {
    await client.query("begin");
    
    const userRes = await client.query("select raw from users where id = $1", [userId]);
    if (userRes.rows.length === 0) {
      await client.query("rollback");
      return response.status(404).json({ error: "user_not_found" });
    }
    const user = userRes.rows[0].raw;

    let matchmakerId = null;

    if (code) {
      // 兑换码核销
      const promoRes = await client.query("select raw from promo_codes where upper(code) = upper($1)", [code.trim()]);
      if (promoRes.rows.length === 0) {
        await client.query("rollback");
        return response.status(404).json({ error: "invalid_code" });
      }
      const promo = promoRes.rows[0].raw;
      if (promo.used && !promo.infinite) {
        await client.query("rollback");
        return response.status(400).json({ error: "code_already_used" });
      }

      if (!promo.infinite) {
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
    } else if (referralCode) {
      // 推荐码支付
      const mmRes = await client.query("select id from matchmakers where upper(code) = upper($1)", [referralCode.trim()]);
      if (mmRes.rows.length === 0) {
        await client.query("rollback");
        return response.status(404).json({ error: "invalid_referral_code" });
      }
      matchmakerId = mmRes.rows[0].id;
    } else {
      await client.query("rollback");
      return response.status(400).json({ error: "code_or_referral_code_required" });
    }

    // 升级 VIP
    user.vip = true;
    user.vipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (matchmakerId) {
      user.referralMatchmakerId = matchmakerId;
    }
    await client.query(
      "update users set vip = true, referral_matchmaker_id = $1, raw = $2, updated_at = now() where id = $3",
      [user.referralMatchmakerId, JSON.stringify(user), userId]
    );

    // 写入流水
    const dealId = `d${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    const deal = {
      id: dealId,
      requestId: null,
      amount: 399,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await client.query(
      "insert into deals (id, request_id, amount, created_at, raw) values ($1, $2, $3, $4, $5::jsonb)",
      [dealId, null, 399, deal.createdAt, JSON.stringify(deal)]
    );

    await client.query("commit");
    response.json({ user, state: publicState(await readState()) });
  } catch (err) {
    await client.query("rollback");
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

  const fromUserRes = await pool.query("select raw from users where id = $1", [userId]);
  if (fromUserRes.rows.length === 0) return response.status(404).json({ error: "user_not_found" });
  const fromUser = fromUserRes.rows[0].raw;
  if (!fromUser.vip) return response.status(403).json({ error: "vip_required" });

  const toUserRes = await pool.query("select raw from users where id = $1", [targetUserId]);
  if (toUserRes.rows.length === 0) return response.status(404).json({ error: "target_not_found" });
  const toUser = toUserRes.rows[0].raw;

  const duplicateRes = await pool.query(
    "select 1 from match_requests where from_user_id = $1 and to_user_id = $2 and status != '已完成'",
    [userId, targetUserId]
  );
  if (duplicateRes.rows.length > 0) return response.status(409).json({ error: "request_pending" });

  const reqId = `r${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
  if (!matchmakerId) {
    matchmakerId = fromUser.referralMatchmakerId || toUser.referralMatchmakerId || null;
  }
  const matchReq = {
    id: reqId,
    fromUserId: userId,
    toUserId: targetUserId,
    matchmakerId,
    status: "待红娘联系",
    maleContacted: false,
    femaleContacted: false,
    memberChatEnabled: false,
    createdAt: new Date().toISOString()
  };

  await pool.query(
    `insert into match_requests (id, from_user_id, to_user_id, matchmaker_id, status, created_at, raw)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [reqId, userId, targetUserId, matchmakerId, matchReq.status, matchReq.createdAt, JSON.stringify(matchReq)]
  );

  const mmThread = buildMemberMatchmakerThread(matchReq);
  if (mmThread) {
    await pool.query(
      `insert into chat_threads (id, type, request_id, status, participants, raw)
       values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
      [mmThread.id, mmThread.type, mmThread.requestId, mmThread.status, JSON.stringify(mmThread.participants), JSON.stringify(mmThread)]
    );
  }

  response.status(201).json({ request: matchReq, state: publicState(await readState()) });
});

// 5. 红娘：分别标记已联系男方/女方
app.patch("/api/matchmaker/requests/:id/contacted", requireAuth(["matchmaker"]), async (request, response) => {
  const requestId = request.params.id;
  const matchmakerId = request.user.sub;
  const side = request.body?.side;
  if (!["male", "female"].includes(side)) {
    return response.status(400).json({ error: "contact_side_required" });
  }

  const reqRes = await pool.query("select raw from match_requests where id = $1", [requestId]);
  if (reqRes.rows.length === 0) return response.status(404).json({ error: "request_not_found" });
  const req = ensureRequestDefaults(reqRes.rows[0].raw);

  if (req.matchmakerId !== matchmakerId) return response.status(403).json({ error: "forbidden" });

  if (side === "male") req.maleContacted = true;
  if (side === "female") req.femaleContacted = true;
  req.status = getRequestContactStatus(req);
  await pool.query(
    "update match_requests set status = $1, raw = $2, updated_at = now() where id = $3",
    [req.status, JSON.stringify(req), requestId]
  );
  response.json({ request: req, state: publicState(await readState()) });
});

app.patch("/api/matchmaker/requests/:id/approve-member-chat", requireAuth(["matchmaker"]), async (request, response) => {
  const requestId = request.params.id;
  const matchmakerId = request.user.sub;

  const reqRes = await pool.query("select raw from match_requests where id = $1", [requestId]);
  if (reqRes.rows.length === 0) return response.status(404).json({ error: "request_not_found" });
  const req = ensureRequestDefaults(reqRes.rows[0].raw);
  if (req.matchmakerId !== matchmakerId) return response.status(403).json({ error: "forbidden" });
  if (req.status !== "已联系双方") return response.status(400).json({ error: "contact_first_required" });

  req.memberChatEnabled = true;
  await pool.query(
    "update match_requests set raw = $1, updated_at = now() where id = $2",
    [JSON.stringify(req), requestId]
  );

  const threadRes = await pool.query(
    "select id from chat_threads where request_id = $1 and type = 'member_member' limit 1",
    [requestId]
  );
  if (threadRes.rows.length === 0) {
    const memberThread = buildMemberMemberThread(req);
    await pool.query(
      `insert into chat_threads (id, type, request_id, status, participants, raw)
       values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
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

  response.json({ request: req, state: publicState(await readState()) });
});

app.post("/api/chat/threads/:id/messages", requireAuth(["client", "matchmaker", "admin"]), async (request, response) => {
  const threadId = request.params.id;
  const content = String(request.body?.content || "").trim();
  if (!content) return response.status(400).json({ error: "content_required" });

  const threadRes = await pool.query("select raw from chat_threads where id = $1", [threadId]);
  if (threadRes.rows.length === 0) return response.status(404).json({ error: "thread_not_found" });
  const thread = ensureThreadDefaults(threadRes.rows[0].raw);
  if (!canAccessThread(thread, request.user)) return response.status(403).json({ error: "forbidden" });
  if (thread.status !== "active") return response.status(400).json({ error: "thread_inactive" });

  const message = {
    id: `cm${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`,
    threadId,
    senderRole: request.user.role,
    senderId: request.user.sub,
    content,
    createdAt: new Date().toISOString(),
  };
  thread.lastMessageAt = message.createdAt;
  thread.lastMessagePreview = content.slice(0, 80);

  await pool.query(
    "insert into chat_messages (id, thread_id, sender_role, sender_id, content, created_at, raw) values ($1, $2, $3, $4, $5, $6, $7::jsonb)",
    [message.id, message.threadId, message.senderRole, message.senderId, message.content, message.createdAt, JSON.stringify(message)]
  );
  await pool.query(
    "update chat_threads set raw = $1, updated_at = now() where id = $2",
    [JSON.stringify(thread), threadId]
  );

  response.status(201).json({ message, state: publicState(await readState()) });
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
  response.status(201).json({ agency, state: publicState(await readState()) });
});

// 7. 管理员：添加红娘
app.post("/api/admin/matchmakers", requireAuth(["admin"]), async (request, response) => {
  const { name, agencyId, code } = request.body || {};
  if (!name || !agencyId || !code) return response.status(400).json({ error: "missing_fields" });

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
    registeredAt: new Date().toISOString()
  };
  
  await pool.query(
    `insert into matchmakers (id, agency_id, name, code, status, registered_at, raw)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [mmId, agencyId, matchmaker.name, codeUpper, matchmaker.status, matchmaker.registeredAt, JSON.stringify(matchmaker)]
  );
  response.status(201).json({ matchmaker, state: publicState(await readState()) });
});

// 8. 管理员：修改分成比例
app.patch("/api/admin/splits", requireAuth(["admin"]), async (request, response) => {
  const { promo, matchmaker, platform } = request.body || {};
  if (Number(promo) + Number(matchmaker) + Number(platform) !== 100) {
    return response.status(400).json({ error: "sum_must_be_100" });
  }

  const settingsRes = await pool.query("select data from app_settings where id = 'runtime'");
  const settings = settingsRes.rows[0]?.data || {};
  settings.splits = { promo: Number(promo), matchmaker: Number(matchmaker), platform: Number(platform) };

  await pool.query(
    "insert into app_settings (id, data, updated_at) values ('runtime', $1::jsonb, now()) on conflict (id) do update set data = excluded.data, updated_at = now()",
    [JSON.stringify(settings)]
  );
  response.json({ splits: settings.splits, state: publicState(await readState()) });
});

// 9. 管理员：随机生成卡密
app.post("/api/admin/promo-codes", requireAuth(["admin"]), async (request, response) => {
  const { code, matchmakerId } = request.body || {};
  if (!code) return response.status(400).json({ error: "code_required" });

  const codeUpper = code.trim().toUpperCase();
  const codeCheck = await pool.query("select 1 from promo_codes where upper(code) = $1", [codeUpper]);
  if (codeCheck.rows.length > 0) return response.status(409).json({ error: "code_exists" });

  const promoCode = {
    code: codeUpper,
    matchmakerId: matchmakerId || null,
    used: false,
    usedBy: null
  };
  
  await pool.query(
    "insert into promo_codes (code, matchmaker_id, used, used_by, infinite, raw) values ($1, $2, $3, $4, $5, $6::jsonb)",
    [promoCode.code, promoCode.matchmakerId, false, null, false, JSON.stringify(promoCode)]
  );
  response.status(201).json({ promoCode, state: publicState(await readState()) });
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
  response.status(201).json({ deal, state: publicState(await readState()) });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "internal server error" });
});

await initDatabase();

app.listen(PORT, () => {
  console.log(`mediapeople api listening on ${PORT}`);
});
