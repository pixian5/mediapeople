/**
 * Pinia 用户状态管理
 * 支持多角色：client（客户端）、matchmaker（红娘端）、admin（管理后台）
 */
import { defineStore } from "pinia";
import { getMeApi } from "../api/client";
import { getCurrentRole, getSessionKey, readSession, removeSession, redirectToPath } from "../utils/session";

export const useUserStore = defineStore("user", {
  state: () => ({
    // 当前角色：client | matchmaker | admin
    role: "",
    // 登录态
    isLoggedIn: false,
    token: "",
    // 客户端用户基础信息
    userId: "",
    name: "",
    gender: "",
    age: 0,
    city: "",
    avatar: "",
    // VIP 状态
    isVip: false,
    vipExpiresAt: "",
    servicePlan: null,
    // 完整资料（懒加载）
    profile: null,
    // 红娘信息
    matchmakerId: "",
    matchmakerName: "",
    matchmakerCode: "",
    agencyId: "",
    matchmakerRating: 0,
    matchmakerRatingCount: 0,
    // 管理员信息
    adminLoggedIn: false,
    adminId: "",
    adminName: "",
  }),

  getters: {
    // VIP 是否有效
    vipActive() {
      if (!this.isVip) return false;
      if (!this.vipExpiresAt) return this.isVip;
      return new Date(this.vipExpiresAt) > new Date();
    },

    // 当前是否为客户端用户
    isClient() {
      return this.role === "client";
    },

    // 当前是否为红娘
    isMatchmaker() {
      return this.role === "matchmaker";
    },

    // 当前是否为管理员
    isAdmin() {
      return this.role === "admin";
    },

    // 当前主页路径
    homePath() {
      if (this.role === "matchmaker") return "/pages/matchmaker/workbench/index";
      if (this.role === "admin") return "/pages/admin/console/index";
      return "/pages/index/index";
    },

    // 当前登录页路径
    loginPath() {
      if (this.role === "matchmaker") return "/pages/matchmaker/login/index";
      if (this.role === "admin") return "/pages/admin/login/index";
      return "/pages/login/index";
    },
  },

  actions: {
    // 从本地存储恢复登录态
    restoreSession(role = getCurrentRole()) {
      try {
        const session = readSession(role);
        this.isLoggedIn = false;
        this.token = "";
        this.role = "";
        this.userId = "";
        this.name = "";
        this.gender = "";
        this.age = 0;
        this.city = "";
        this.avatar = "";
        this.isVip = false;
        this.vipExpiresAt = "";
        this.servicePlan = null;
        this.profile = null;
        this.matchmakerId = "";
        this.matchmakerName = "";
        this.matchmakerCode = "";
        this.agencyId = "";
        this.adminLoggedIn = false;
        this.adminId = "";
        this.adminName = "";

        if (session?.token) {
          this.isLoggedIn = true;
          this.token = session.token;
          this.role = session.role || role;
          this.userId = session.userId || "";
          this.name = session.name || "";
          this.gender = session.gender || "";
          this.matchmakerId = session.matchmakerId || "";
          this.matchmakerName = session.matchmakerName || "";
          this.matchmakerCode = session.matchmakerCode || "";
          this.agencyId = session.agencyId || "";
          this.adminLoggedIn = session.role === "admin";
          this.adminId = session.adminId || "";
          this.adminName = session.adminName || "";
          // 异步刷新对应角色资料
          this.fetchProfile();
        }
      } catch (e) {
        // 忽略
      }
    },

    // 登录成功后保存（支持不同角色）
    setLogin(data, role = "client") {
      const { token, user, matchmaker, admin } = data;
      this.role = role;
      this.isLoggedIn = true;
      this.token = token;

      const payload = { token, role };

      if (role === "client" && user) {
        this.userId = user.id;
        this.name = user.name || "";
        this.gender = user.gender || "";
        this.age = user.age || 0;
        this.city = user.city || "";
        this.avatar = user.photo || user.avatar || "";
        this.applyUser(user);
        payload.userId = user.id;
        payload.name = user.name;
        payload.gender = user.gender;
      }

      if (role === "matchmaker" && matchmaker) {
        this.matchmakerId = matchmaker.id;
        this.matchmakerName = matchmaker.name || "";
        this.matchmakerCode = matchmaker.code || "";
        this.agencyId = matchmaker.agencyId || "";
        this.matchmakerRating = Number(matchmaker.serviceScore || 0);
        this.matchmakerRatingCount = Number(matchmaker.ratingCount || 0);
        payload.matchmakerId = matchmaker.id;
        payload.matchmakerName = matchmaker.name;
        payload.matchmakerCode = matchmaker.code;
        payload.agencyId = matchmaker.agencyId;
      }

      if (role === "admin" && admin) {
        this.adminLoggedIn = true;
        this.adminId = admin.id || "admin";
        this.adminName = admin.name || "平台管理员";
        payload.adminId = this.adminId;
        payload.adminName = this.adminName;
      }

      // 持久化
      try {
        uni.setStorageSync(getSessionKey(role), payload);
      } catch (e) {}
    },

    // 用接口返回的 user 对象同步全局状态（登录、刷新、VIP 兑换后复用）
    applyUser(user) {
      if (!user) return;
      this.userId = user.id || this.userId;
      this.name = user.name || this.name;
      this.gender = user.gender || this.gender;
      this.age = user.age || this.age;
      this.city = user.city || this.city;
      this.avatar = user.photo || user.avatar || this.avatar;
      this.isVip = !!user.vip;
      this.vipExpiresAt = user.vipExpiresAt || "";
      this.servicePlan = user.servicePlan || null;
      this.profile = user;
    },

    // 刷新用户资料
    async fetchProfile() {
      if (!this.isLoggedIn) return;
      try {
        if (this.role === "client") {
          const res = await getMeApi();
          const user = res.data?.user || res.data || res;
          this.applyUser(user);
        }
        // 红娘/管理员资料在登录时已保存，暂不单独刷新
      } catch (e) {
        // 获取失败不影响使用
      }
    },

    // 退出登录
    logout() {
      const role = this.role;
      this.isLoggedIn = false;
      this.token = "";
      this.role = "";
      this.userId = "";
      this.name = "";
      this.gender = "";
      this.age = 0;
      this.city = "";
      this.avatar = "";
      this.isVip = false;
      this.vipExpiresAt = "";
      this.servicePlan = null;
      this.profile = null;
      this.matchmakerId = "";
      this.matchmakerName = "";
      this.matchmakerCode = "";
      this.agencyId = "";
      this.matchmakerRating = 0;
      this.matchmakerRatingCount = 0;
      this.adminLoggedIn = false;
      this.adminId = "";
      this.adminName = "";
      try {
        removeSession(role);
      } catch (e) {}

      // 按角色跳转到对应登录页
      let url = "/pages/login/index";
      if (role === "matchmaker") url = "/pages/matchmaker/login/index";
      if (role === "admin") url = "/pages/admin/login/index";
      redirectToPath(url);
    },

    // 更新 VIP 状态
    updateVip(isVip, expiresAt) {
      this.isVip = isVip;
      this.vipExpiresAt = expiresAt || "";
    },
  },
});
