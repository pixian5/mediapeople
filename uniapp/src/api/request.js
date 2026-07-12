/**
 * API 请求封装 — 基于 uni.request
 * 自动挂载 Token、统一错误处理、基础地址切换
 */

import { getCurrentRole, readSession, removeSession } from "../utils/session";

// 线上 API 域名（小程序 / App 等非 H5 平台需要完整 HTTPS 地址）
const REMOTE_API_BASE = "https://uk.sbbz.tech:21314/api";

// 根据平台自动切换 API 基础地址
function getBaseUrl() {
  // #ifdef H5
  // H5 环境下使用相对路径，由 Nginx/Vite 代理转发
  return "/api";
  // #endif

  // #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ || MP-KUAISHOU || MP-JD || MP-XHS || MP-LARK || MP-HARMONY
  // 小程序环境使用完整 HTTPS 域名
  return REMOTE_API_BASE;
  // #endif

  // #ifdef APP-PLUS || APP || APP-HARMONY
  // App 环境使用完整 HTTPS 域名
  return REMOTE_API_BASE;
  // #endif

  // #ifndef H5 || MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ || MP-KUAISHOU || MP-JD || MP-XHS || MP-LARK || MP-HARMONY || APP-PLUS || APP || APP-HARMONY
  return "/api";
  // #endif
}

const BASE_URL = getBaseUrl();

function getFriendlyErrorMessage(value, fallback) {
  const messages = {
    invalid_credentials: "账号或密码错误",
    account_not_found: "账号不存在",
    account_disabled: "账号已被停用",
    unauthorized: "请先登录",
  };
  return messages[value] || value || fallback;
}

/**
 * 统一请求方法
 * @param {Object} options - 请求配置
 * @param {string} options.url - 接口路径（不含 /api 前缀）
 * @param {string} options.method - 请求方法
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.noAuth - 是否跳过 Token
 * @returns {Promise}
 */
export function request(options = {}) {
  return new Promise((resolve, reject) => {
    const { url, method = "GET", data, noAuth = false, header = {} } = options;

    // 获取 Token
    if (!noAuth) {
      try {
        const session = readSession(getCurrentRole());
        if (session && session.token) {
          header["Authorization"] = `Bearer ${session.token}`;
        }
      } catch (e) {
        // 忽略存储读取错误
      }
    }

    header["Content-Type"] = header["Content-Type"] || "application/json";

    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        const { statusCode, data: resData } = res;

        if (statusCode === 401) {
          const msg = getFriendlyErrorMessage(
            resData?.message || resData?.error,
            "登录已过期，请重新登录"
          );

          // 登录/注册等 noAuth 请求的 401 是业务校验失败，不能按
          // “已有会话过期”处理，否则会重新加载登录页并清掉页面错误提示。
          if (noAuth) {
            uni.showToast({ title: msg, icon: "none" });
            reject(new Error(msg));
            return;
          }

          // Token 失效，清除登录态并按角色跳转登录页
          let loginUrl = "/pages/login/index";
          try {
            const session = readSession(getCurrentRole());
            if (session?.role === "matchmaker") loginUrl = "/pages/matchmaker/login/index";
            if (session?.role === "admin") loginUrl = "/pages/admin/login/index";
            removeSession(getCurrentRole());
          } catch (e) {}
          uni.reLaunch({ url: loginUrl });
          reject(new Error(msg));
          return;
        }

        if (statusCode === 403) {
          uni.showToast({ title: "没有权限", icon: "none" });
          reject(new Error("没有权限"));
          return;
        }

        if (statusCode >= 400) {
          const msg = getFriendlyErrorMessage(
            resData?.message || resData?.error,
            `请求失败 (${statusCode})`
          );
          uni.showToast({ title: msg, icon: "none" });
          reject(new Error(msg));
          return;
        }

        // 成功返回 — 归一化响应格式
        // 新格式: { code: 0, data: {...}, message: "ok" }
        // 旧格式: { token, user } / { request, state } / { message, state }
        if (resData && typeof resData === 'object' && 'code' in resData) {
          if (resData.code === 0) {
            resolve(resData);
          } else {
            const msg = getFriendlyErrorMessage(
              resData.message,
              `请求失败 (${resData.code})`
            );
            uni.showToast({ title: msg, icon: "none" });
            reject(new Error(msg));
          }
        } else {
          // 旧格式直接透传
          resolve(resData);
        }
      },
      fail: (err) => {
        uni.showToast({ title: "网络连接失败", icon: "none" });
        reject(new Error(err.errMsg || "网络错误"));
      },
    });
  });
}

// 快捷方法
export const get = (url, data, options = {}) =>
  request({ url, method: "GET", data, ...options });

export const post = (url, data, options = {}) =>
  request({ url, method: "POST", data, ...options });

export const patch = (url, data, options = {}) =>
  request({ url, method: "PATCH", data, ...options });

export const put = (url, data, options = {}) =>
  request({ url, method: "PUT", data, ...options });

export const del = (url, data, options = {}) =>
  request({ url, method: "DELETE", data, ...options });
