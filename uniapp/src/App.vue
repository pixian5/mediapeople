<script setup>
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { useUserStore } from "./store/user";
import { getCurrentPagePath, getInitialPagePath, getRoleForPath } from "./utils/session";

// 页面路径所属的角色前缀
const MATCHMAKER_PAGES = "/pages/matchmaker/";
const ADMIN_PAGES = "/pages/admin/";
const CLIENT_LOGIN_PAGE = "/pages/login/index";
const MATCHMAKER_LOGIN_PAGE = "/pages/matchmaker/login/index";
const ADMIN_LOGIN_PAGE = "/pages/admin/login/index";
const CLIENT_HOME = "/pages/index/index";
const MATCHMAKER_HOME = "/pages/matchmaker/workbench/index";
const ADMIN_HOME = "/pages/admin/console/index";
const INITIAL_PAGE_PATH = getInitialPagePath();

function getPagePath() {
  return getCurrentPagePath();
}

function isLoginPage(path) {
  return path === CLIENT_LOGIN_PAGE || path === MATCHMAKER_LOGIN_PAGE || path === ADMIN_LOGIN_PAGE;
}

function belongsToRole(path, role) {
  if (role === "matchmaker") return path.startsWith(MATCHMAKER_PAGES);
  if (role === "admin") return path.startsWith(ADMIN_PAGES);
  // client 属于其余非 matchmaker/admin 的页面
  return !path.startsWith(MATCHMAKER_PAGES) && !path.startsWith(ADMIN_PAGES);
}

function redirectByRole(role) {
  if (role === "matchmaker") return MATCHMAKER_HOME;
  if (role === "admin") return ADMIN_HOME;
  return CLIENT_HOME;
}

function loginByPath(path) {
  const role = getRoleForPath(path);
  if (role === "matchmaker") return MATCHMAKER_LOGIN_PAGE;
  if (role === "admin") return ADMIN_LOGIN_PAGE;
  return CLIENT_LOGIN_PAGE;
}

function redirectTo(path) {
  // H5 启动阶段 uni.reLaunch 可能早于 vue-router 就绪，回退到默认会员首页。
  // 直接更新 hash 可确保角色入口不被默认首页覆盖。
  if (typeof window !== "undefined" && window.location.hash !== `#${path}`) {
    window.location.hash = `#${path}`;
    return;
  }
  uni.reLaunch({ url: path });
}

function checkRedirect(userStore, requestedPath = getPagePath()) {
  const path = requestedPath;
  const { isLoggedIn, role } = userStore;

  // 未登录：只允许停留在登录页
  if (!isLoggedIn) {
    if (!path || isLoginPage(path)) return;
    redirectTo(loginByPath(path));
    return;
  }

  // 已登录：角色与当前页面不匹配则重定向到对应首页
  if (path && !belongsToRole(path, role)) {
    redirectTo(redirectByRole(role));
  }
}

onLaunch(() => {
  // 启动时恢复登录态
  const userStore = useUserStore();
  userStore.restoreSession(getRoleForPath(INITIAL_PAGE_PATH || getPagePath()));
  // 延迟执行角色页面校验，避免启动时页面栈为空
  setTimeout(() => {
    checkRedirect(userStore, INITIAL_PAGE_PATH || getPagePath());
  }, 0);
});

onShow(() => {
  // 每次显示时校验角色与页面匹配
  const userStore = useUserStore();
  const path = getPagePath();
  userStore.restoreSession(getRoleForPath(path));
  checkRedirect(userStore);
});
</script>

<style lang="scss">
@import "./styles/global.scss";
</style>
