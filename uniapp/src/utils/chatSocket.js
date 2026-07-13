import { getCurrentRole, readSession } from "./session";
const REMOTE_WS_HOST = "wss://uk.sbbz.tech:21314";
const listeners = new Set();

let socket = null;
let reconnectTimer = null;
let shouldReconnect = false;
let currentToken = "";
let reconnectAttempts = 0;
let pingInterval = null;
let pongTimeout = null;

const PING_INTERVAL_MS = 30000;
const PONG_TIMEOUT_MS = 60000;
const MAX_RECONNECT_DELAY_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;

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

function clearHeartbeat() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (pongTimeout) {
    clearTimeout(pongTimeout);
    pongTimeout = null;
  }
}

function startHeartbeat() {
  clearHeartbeat();
  pingInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
      // 设置 pong 超时，如果 60s 内没收到 pong 则强制关闭连接
      if (pongTimeout) clearTimeout(pongTimeout);
      pongTimeout = setTimeout(() => {
        // pong 超时，强制关闭连接，触发 onclose → reconnect
        try {
          socket.close();
        } catch (error) {
          // ignore close errors
        }
      }, PONG_TIMEOUT_MS);
    }
  }, PING_INTERVAL_MS);
}

function resetSocket() {
  clearHeartbeat();
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

function getReconnectDelay() {
  // 指数退避：1s, 2s, 4s, 8s, 16s, max 30s
  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY_MS
  );
  return delay;
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimer) return;
  const delay = getReconnectDelay();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempts++;
    ensureChatSocket();
  }, delay);
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
    reconnectAttempts = 0;
    startHeartbeat();
    emit({ type: "socket_open" });
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      // 收到 pong 时重置超时计时器
      if (payload.type === "pong" && pongTimeout) {
        clearTimeout(pongTimeout);
        pongTimeout = null;
      }
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
  reconnectAttempts = 0;
  clearReconnectTimer();
  resetSocket();
}

export function addChatSocketListener(listener) {
  listeners.add(listener);
}

export function removeChatSocketListener(listener) {
  listeners.delete(listener);
}
