import { getCurrentRole, readSession } from "./session";
const REMOTE_WS_HOST = "wss://uk.sbbz.tech:21314";
const listeners = new Set();

let socket = null;
let reconnectTimer = null;
let shouldReconnect = false;
let currentToken = "";

function emit(event) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      // ignore listener errors
    }
  });
}

function getStoredSession() {
  try {
    return readSession(getCurrentRole());
  } catch (error) {
    return null;
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function resetSocket() {
  if (socket) {
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    try {
      socket.close();
    } catch (error) {
      // ignore close errors
    }
  }
  socket = null;
}

function getSocketUrl(token) {
  if (!token) return "";
  // #ifdef H5
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  // #endif

  // #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ || MP-KUAISHOU || MP-JD || MP-XHS || MP-LARK || MP-HARMONY || APP-PLUS || APP || APP-HARMONY
  return `${REMOTE_WS_HOST}/ws?token=${encodeURIComponent(token)}`;
  // #endif

  return "";
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ensureChatSocket();
  }, 1000);
}

export function ensureChatSocket() {
  const session = getStoredSession();
  const token = session?.token || "";
  const url = getSocketUrl(token);

  if (!token || !url) {
    closeChatSocket();
    return;
  }

  if (socket && currentToken === token && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  shouldReconnect = true;
  currentToken = token;
  clearReconnectTimer();
  resetSocket();

  socket = new WebSocket(url);

  socket.onopen = () => {
    emit({ type: "socket_open" });
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      emit(payload);
    } catch (error) {
      // ignore invalid payloads
    }
  };

  socket.onerror = () => {
    emit({ type: "socket_error" });
  };

  socket.onclose = () => {
    emit({ type: "socket_close" });
    resetSocket();
    if (shouldReconnect) {
      scheduleReconnect();
    }
  };
}

export function closeChatSocket() {
  shouldReconnect = false;
  currentToken = "";
  clearReconnectTimer();
  resetSocket();
}

export function addChatSocketListener(listener) {
  listeners.add(listener);
}

export function removeChatSocketListener(listener) {
  listeners.delete(listener);
}
