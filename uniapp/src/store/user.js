/**
 * Pinia 用户状态管理
 * 仅存储全局共享数据：登录态、用户基础信息、VIP 状态
 */
import { defineStore } from "pinia";
import { getMeApi } from "../api/client";

const SESSION_KEY = "mediapeople_session";

export const useUserStore = defineStore("user", {
  state: () => ({
    // 登录态
    isLoggedIn: false,
    token: "",
    // 用户基础信息
    userId: "",
    name: "",
    gender: "",
    age: 0,
    city: "",
    avatar: "",
    // VIP 状态
    isVip: false,
    vipExpiresAt: "",
    // 完整资料（懒加载）
    profile: null,
  }),

  getters: {
    // VIP 是否有效
    vipActive() {
      if (!this.isVip) return false;
      if (!this.vipExpiresAt) return this.isVip;
      return new Date(this.vipExpiresAt) > new Date();
    },
  },

  actions: {
    // 从本地存储恢复登录态
    restoreSession() {
      try {
        const session = uni.getStorageSync(SESSION_KEY);
        if (session && session.token) {
          this.isLoggedIn = true;
          this.token = session.token;
          this.userId = session.userId || "";
          this.name = session.name || "";
          this.gender = session.gender || "";
          // 异步刷新用户信息
          this.fetchProfile();
        }
      } catch (e) {
        // 忽略
      }
    },

    // 登录成功后保存
    setLogin(data) {
      const { token, user } = data;
      this.isLoggedIn = true;
      this.token = token;
      this.userId = user.id;
      this.name = user.name || "";
      this.gender = user.gender || "";
      this.age = user.age || 0;
      this.city = user.city || "";
      this.avatar = user.photo || user.avatar || "";
      this.isVip = !!user.vip;
      this.vipExpiresAt = user.vipExpiresAt || "";
      this.profile = user;

      // 持久化
      try {
        uni.setStorageSync(SESSION_KEY, {
          token,
          userId: user.id,
          name: user.name,
          gender: user.gender,
        });
      } catch (e) {}
    },

    // 刷新用户资料
    async fetchProfile() {
      try {
        const res = await getMeApi();
        const user = res.data?.user || res.data || res;
        this.userId = user.id || this.userId;
        this.name = user.name || this.name;
        this.gender = user.gender || this.gender;
        this.age = user.age || this.age;
        this.city = user.city || this.city;
        this.avatar = user.photo || user.avatar || this.avatar;
        this.isVip = !!user.vip;
        this.vipExpiresAt = user.vipExpiresAt || "";
        this.profile = user;
      } catch (e) {
        // 获取失败不影响使用
      }
    },

    // 退出登录
    logout() {
      this.isLoggedIn = false;
      this.token = "";
      this.userId = "";
      this.name = "";
      this.gender = "";
      this.age = 0;
      this.city = "";
      this.avatar = "";
      this.isVip = false;
      this.vipExpiresAt = "";
      this.profile = null;
      try {
        uni.removeStorageSync(SESSION_KEY);
      } catch (e) {}
      uni.reLaunch({ url: "/pages/login/index" });
    },

    // 更新 VIP 状态
    updateVip(isVip, expiresAt) {
      this.isVip = isVip;
      this.vipExpiresAt = expiresAt || "";
    },
  },
});
