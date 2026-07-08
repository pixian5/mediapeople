/**
 * API 请求封装 — 基于 uni.request
 * 自动挂载 Token、统一错误处理、基础地址切换
 */

const SESSION_KEY = "mediapeople_session";

// 根据平台自动切换 API 基础地址
function getBaseUrl() {
  // #ifdef H5
  // H5 环境下使用相对路径，由 Nginx/Vite 代理转发
  return "/api";
  // #endif

  // #ifdef MP-WEIXIN
  // 小程序环境使用完整 HTTPS 域名
  return "https://uk.sbbz.tech:9446/api";
  // #endif

  // #ifndef H5 || MP-WEIXIN
  return "/api";
  // #endif
}

const BASE_URL = getBaseUrl();

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
        const session = uni.getStorageSync(SESSION_KEY);
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
          // Token 失效，清除登录态，跳转登录页
          try {
            uni.removeStorageSync(SESSION_KEY);
          } catch (e) {}
          uni.reLaunch({ url: "/pages/login/index" });
          reject(new Error("登录已过期，请重新登录"));
          return;
        }

        if (statusCode === 403) {
          uni.showToast({ title: "没有权限", icon: "none" });
          reject(new Error("没有权限"));
          return;
        }

        if (statusCode >= 400) {
          const msg = resData?.message || resData?.error || `请求失败 (${statusCode})`;
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
            const msg = resData.message || `请求失败 (${resData.code})`;
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
