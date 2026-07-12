/**
 * 认证相关接口
 */
import { post } from "./request";
import { getCurrentRole, removeSession } from "../utils/session";

// 客户端登录
export const loginApi = (data) => post("/auth/client/login", data, { noAuth: true });

// 客户端注册
export const registerApi = (data) => post("/auth/client/register", data, { noAuth: true });

// 红娘登录（选择已有红娘一键登录，也支持账号密码）
export const matchmakerLoginApi = (data) => post("/auth/matchmaker/login", data, { noAuth: true });

// 红娘注册
export const matchmakerRegisterApi = (data) => post("/auth/matchmaker/register", data, { noAuth: true });

// 管理员登录
export const adminLoginApi = (data) => post("/auth/admin/login", data, { noAuth: true });

// 登出（本地清除即可）
export const logoutApi = (role = getCurrentRole()) => {
  removeSession(role);
};
