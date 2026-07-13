<template>
  <view class="chat-detail-container">
    <scroll-view ref="messageListRef" class="message-list" scroll-y :scroll-into-view="scrollToId" :scroll-top="scrollTop" scroll-with-animation @scroll="handleScroll">
      <view v-if="!loading && messages.length === 0" class="chat-empty">
        <view class="empty-mark">聊</view>
        <text class="empty-title">还没有消息</text>
        <text class="empty-desc">和会员沟通牵线进度，推动缘分发展。</text>
      </view>
      <view v-for="msg in messages" :key="msg.id" :id="'msg-' + msg.id" class="message-item" :class="{ 'is-me': isMine(msg) }">
        <view class="bubble-wrap">
          <view class="bubble">{{ msg.content }}</view>
          <text class="message-time">{{ formatTime(msg.createdAt) }}</text>
        </view>
      </view>
      <view id="scroll-bottom" style="height: 40rpx;"></view>
    </scroll-view>

    <view class="input-bar safe-area-bottom">
      <input
        ref="messageInputRef"
        class="msg-input"
        v-model="inputText"
        :focus="inputFocused"
        :placeholder="inputPlaceholder"
        @confirm="handleSend"
        @keydown.enter.prevent="handleSend"
        confirm-type="send"
      />
      <button class="btn-send" :class="{ disabled: !canSend }" @mousedown.prevent @click="handleSend">发送</button>
    </view>
    <button v-if="newMessageCount > 0" class="new-message-button" @click="jumpToLatest">
      {{ newMessageCount > 99 ? '99+' : newMessageCount }} 条新消息
    </button>
  </view>
</template>

<script setup>
import { computed, nextTick, ref, onUnmounted } from 'vue';
import { getMatchmakerMessagesApi, sendMatchmakerMessageApi } from '@/api/matchmaker';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/appStore';
import { addChatSocketListener, ensureChatSocket, removeChatSocketListener } from '@/utils/chatSocket';
import { onLoad, onShow, onHide } from '@dcloudio/uni-app';

const userStore = useUserStore();
const appStore = useAppStore();

const threadId = ref('');
const chatTitle = ref('聊天');
const messages = ref([]);
const inputText = ref('');
const sending = ref(false);
const loading = ref(true);
const scrollToId = ref('');
const scrollTop = ref(0);
const messageListRef = ref(null);
const isAtBottom = ref(true);
const newMessageCount = ref(0);
const inputFocused = ref(false);
const messageInputRef = ref(null);
const tempMessageIds = ref(new Set());
const pendingSendCount = ref(0);
let pollTimer = null;

const POLL_INTERVAL = 10000;
const canSend = computed(() => Boolean(inputText.value.trim()));
const isH5Runtime = typeof window !== 'undefined';

const thread = computed(() => appStore.getThreadById(threadId.value));
const inputPlaceholder = computed(() => {
  return thread.value?.type === 'matchmaker_group' ? '发送到三方群聊' : '给会员发送消息';
});

onLoad((options) => {
  if (options.threadId) {
    threadId.value = options.threadId;
    updateChatTitle();
    loadMessages();
  }
});

const getChatTitle = () => {
  const currentThread = thread.value;
  if (!currentThread) return '聊天';
  const participants = currentThread.participants || [];
  if (currentThread.type === 'matchmaker_group') {
    const names = participants
      .filter((participant) => participant.role === 'client')
      .map((participant) => appStore.getUserById(participant.id)?.name || participant.name)
      .filter(Boolean);
    return names.length ? `三方群聊（${names.join('、')}）` : '三方群聊';
  }
  const client = participants.find((participant) => participant.role === 'client');
  return appStore.getUserById(client?.id)?.name || client?.name || '会员聊天';
};

const updateChatTitle = async () => {
  chatTitle.value = getChatTitle();
  uni.setNavigationBarTitle({ title: chatTitle.value });
  if (chatTitle.value !== '聊天' && chatTitle.value !== '会员聊天' && chatTitle.value !== '三方群聊') return;
  await appStore.fetchState();
  chatTitle.value = getChatTitle();
  uni.setNavigationBarTitle({ title: chatTitle.value });
};

onShow(() => {
  addChatSocketListener(handleRealtimeMessage);
  ensureChatSocket();
  syncLatestMessages(true);
  startPolling();
  restoreInputFocus();
});

onHide(() => {
  removeChatSocketListener(handleRealtimeMessage);
  stopPolling();
});

onUnmounted(() => {
  removeChatSocketListener(handleRealtimeMessage);
  stopPolling();
});

const isMine = (msg) => {
  return msg.senderRole === 'matchmaker' && msg.senderId === userStore.matchmakerId;
};

const startPolling = () => {
  stopPolling();
  if (threadId.value) {
    pollTimer = setInterval(() => {
      syncLatestMessages();
    }, POLL_INTERVAL);
  }
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const loadMessages = async () => {
  loading.value = true;
  try {
    const res = await getMatchmakerMessagesApi(threadId.value);
    const newMessages = res.data?.list || [];
    mergeMessages(newMessages);
    scrollToBottom();
  } catch (error) {
    //
  } finally {
    loading.value = false;
  }
};

const syncLatestMessages = async (force = false) => {
  if (!threadId.value || (pendingSendCount.value > 0 && !force)) return;
  try {
    const res = await getMatchmakerMessagesApi(threadId.value);
    const newMessages = res.data?.list || [];
    const existingIds = new Set(messages.value.map((message) => message.id));
    const prevCount = messages.value.filter((msg) => !tempMessageIds.value.has(msg.id)).length;
    mergeMessages(newMessages);
    const currentCount = messages.value.filter((msg) => !tempMessageIds.value.has(msg.id)).length;
    if (currentCount > prevCount) {
      const incomingCount = newMessages.filter((message) => !existingIds.has(message.id) && !isMine(message)).length;
      if (incomingCount > 0) notifyIncomingMessage(incomingCount);
    }
  } catch (error) {
    //
  }
};

const compareMessages = (a, b) => {
  // 同一发送者 + 同一设备：按客户端序号排序（保证用户视角的发送顺序）
  if (a.senderRole === b.senderRole && a.senderId === b.senderId
      && a.deviceId && a.deviceId === b.deviceId
      && a.clientSeq != null && b.clientSeq != null) {
    return a.clientSeq - b.clientSeq;
  }
  // 跨设备或不同发送者：按客户端创建时间排序（保证真实发送顺序）
  const timeDiff = new Date(a.createdAt) - new Date(b.createdAt);
  if (timeDiff !== 0) return timeDiff;
  // 同秒消息：按消息ID排序（保证稳定排序）
  return a.id.localeCompare(b.id);
};

const mergeMessages = (newMessages) => {
  const serverIds = new Set(newMessages.map((msg) => msg.id));
  const serverClientMsgNos = new Set(
    newMessages.filter((m) => m.clientMsgNo).map((m) => m.clientMsgNo)
  );
  const localOnlyMessages = messages.value.filter((msg) => {
    if (serverIds.has(msg.id)) return false;
    if (msg.clientMsgNo && serverClientMsgNos.has(msg.clientMsgNo)) return false;
    return true;
  });

  const merged = [...newMessages, ...localOnlyMessages];
  merged.sort(compareMessages);

  const seenIds = new Set();
  const seenClientMsgNos = new Set();
  messages.value = merged.filter((msg) => {
    if (msg.clientMsgNo) {
      if (seenClientMsgNos.has(msg.clientMsgNo)) return false;
      seenClientMsgNos.add(msg.clientMsgNo);
    }
    if (seenIds.has(msg.id)) return false;
    seenIds.add(msg.id);
    return true;
  });

  const tempIds = new Set(tempMessageIds.value);
  tempMessageIds.value = new Set(
    messages.value.filter((msg) => tempIds.has(msg.id)).map((msg) => msg.id)
  );
};

const removeTempMessage = (tempId) => {
  tempMessageIds.value.delete(tempId);
  messages.value = messages.value.filter((msg) => msg.id !== tempId);
};

const reconcileTempMessage = (message) => {
  const matchedTempMessage = messages.value.find((item) => {
    if (!tempMessageIds.value.has(item.id)) return false;
    if (message.clientMsgNo && item.clientMsgNo === message.clientMsgNo) return true;
    if (item.senderId !== message.senderId || item.content !== message.content) return false;
    return Math.abs(new Date(item.createdAt).getTime() - new Date(message.createdAt).getTime()) < 15000;
  });
  if (matchedTempMessage) {
    removeTempMessage(matchedTempMessage.id);
  }
};

const upsertMessage = (message) => {
  if (!message?.id) return;
  reconcileTempMessage(message);
  const nextMessages = messages.value.filter((msg) => {
    if (msg.id === message.id) return false;
    if (message.clientMsgNo && msg.clientMsgNo === message.clientMsgNo) return false;
    return true;
  });
  nextMessages.push(message);
  nextMessages.sort(compareMessages);
  messages.value = nextMessages;
};

const handleRealtimeMessage = (event) => {
  if (event?.type === 'socket_open') {
    // socket 重连成功后补拉最新消息，避免漏掉断线期间的消息
    syncLatestMessages(true);
    return;
  }
  if (event?.type !== 'chat_message') return;
  if (event.message?.threadId !== threadId.value) return;
  reconcileTempMessage(event.message);
  upsertMessage(event.message);
  if (!isMine(event.message)) notifyIncomingMessage();
};

const handleScroll = (event) => {
  const detail = event?.detail || {};
  const element = messageListRef.value?.$el || messageListRef.value;
  const scrollTopValue = Number(detail.scrollTop ?? element?.scrollTop ?? 0);
  const scrollHeight = Number(detail.scrollHeight ?? element?.scrollHeight ?? 0);
  const clientHeight = Number(detail.clientHeight ?? element?.clientHeight ?? element?.offsetHeight ?? 0);
  if (!scrollHeight || !clientHeight) return;
  isAtBottom.value = scrollHeight - scrollTopValue - clientHeight <= 80;
  if (isAtBottom.value) newMessageCount.value = 0;
};

const notifyIncomingMessage = (count = 1) => {
  if (isAtBottom.value) scrollToBottom();
  else newMessageCount.value += count;
};

const scrollToBottom = () => {
  isAtBottom.value = true;
  newMessageCount.value = 0;
  scrollToId.value = '';
  nextTick(() => {
    setTimeout(() => {
      scrollTop.value += 100000;
      scrollToId.value = 'scroll-bottom';
    }, 30);
  });
};

const jumpToLatest = () => scrollToBottom();

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const restoreInputFocus = () => {
  if (isH5Runtime) {
    const focusInput = () => messageInputRef.value?.focus?.();
    nextTick(() => {
      focusInput();
      // 点击发送按钮后，浏览器可能在当前事件结束时再次把焦点交给按钮。
      setTimeout(focusInput, 0);
      setTimeout(focusInput, 80);
      setTimeout(focusInput, 180);
    });
    return;
  }

  inputFocused.value = false;
  nextTick(() => {
    inputFocused.value = true;
  });
};

const generateClientMsgNo = () => {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

const getDeviceId = () => {
  const key = `chat_device_id_mm_${userStore.matchmakerId}`;
  let deviceId = uni.getStorageSync(key);
  if (!deviceId) {
    deviceId = `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    uni.setStorageSync(key, deviceId);
  }
  return deviceId;
};

const nextClientSeq = () => {
  const key = `chat_client_seq_mm_${userStore.matchmakerId}`;
  const next = Number(uni.getStorageSync(key) || 0) + 1;
  uni.setStorageSync(key, next);
  return next;
};

const handleSend = async () => {
  const content = inputText.value.trim();
  if (!content) return;
  pendingSendCount.value += 1;

  const clientMsgNo = generateClientMsgNo();
  const clientSeq = nextClientSeq();
  const deviceId = getDeviceId();
  const tempId = `temp_${clientMsgNo}`;
  tempMessageIds.value.add(tempId);

  const tempMessage = {
    id: tempId,
    clientMsgNo,
    clientSeq,
    deviceId,
    content,
    senderId: userStore.matchmakerId,
    senderRole: 'matchmaker',
    createdAt: new Date().toISOString()
  };
  messages.value.push(tempMessage);
  inputText.value = '';
  scrollToBottom();
  restoreInputFocus();

  try {
    const res = await sendMatchmakerMessageApi(threadId.value, {
      content,
      senderRole: 'matchmaker',
      senderId: userStore.matchmakerId,
      clientMsgNo,
      clientSeq,
      deviceId,
      createdAt: tempMessage.createdAt
    });
    const realMessage = res.message || res.data?.message;
    if (realMessage) {
      if (!realMessage.clientMsgNo) realMessage.clientMsgNo = clientMsgNo;
      if (!realMessage.deviceId) realMessage.deviceId = deviceId;
      upsertMessage(realMessage);
    }
    syncLatestMessages();
  } catch (error) {
    // 不删除临时消息，标记为发送失败状态，便于用户重试
    messages.value = messages.value.map((msg) =>
      msg.id === tempId ? { ...msg, sendFailed: true } : msg
    );
    uni.showToast({ title: '发送失败', icon: 'none' });
  } finally {
    pendingSendCount.value = Math.max(0, pendingSendCount.value - 1);
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.chat-detail-container {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 44px);
  max-height: calc(100dvh - 44px);
  overflow: hidden;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 20% 0%, rgba(15, 118, 110, 0.08), transparent 34%),
    linear-gradient(180deg, #f8fbfb 0%, $color-bg 100%);
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: $spacing-lg $spacing-md;
  box-sizing: border-box;
  overflow: hidden;
}

.chat-empty {
  min-height: 58vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: $color-muted;

  .empty-mark {
    width: 112rpx;
    height: 112rpx;
    margin-bottom: $spacing-md;
    border-radius: 34rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f766e, #14b8a6);
    color: #fff;
    font-size: 52rpx;
    font-weight: 800;
    box-shadow: 0 18rpx 44rpx rgba(15, 118, 110, 0.18);
  }

  .empty-title {
    font-size: $font-lg;
    font-weight: 700;
    color: $color-ink;
    margin-bottom: $spacing-xs;
  }

  .empty-desc {
    max-width: 520rpx;
    font-size: $font-sm;
    line-height: 1.7;
  }
}

.message-item {
  display: flex;
  margin-bottom: $spacing-lg;

  .bubble-wrap {
    max-width: 76%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .bubble {
    padding: 18rpx 24rpx;
    border-radius: 8rpx 28rpx 28rpx 28rpx;
    font-size: $font-base;
    line-height: 1.5;
    background: #ffffff;
    color: $color-ink;
    box-shadow: 0 10rpx 28rpx rgba(30, 38, 51, 0.06);
    word-break: break-word;
  }

  .message-time {
    margin-top: 8rpx;
    font-size: 20rpx;
    color: #9aa6b2;
  }

  &.is-me {
    justify-content: flex-end;

    .bubble-wrap {
      align-items: flex-end;
    }

    .bubble {
      border-radius: 28rpx 8rpx 28rpx 28rpx;
      background: linear-gradient(135deg, #0f766e, #149381);
      color: #fff;
      box-shadow: 0 12rpx 30rpx rgba(15, 118, 110, 0.22);
    }
  }
}

.input-bar {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.94);
  border-top: 1rpx solid rgba(223, 229, 236, 0.9);
  box-shadow: 0 -12rpx 36rpx rgba(30, 38, 51, 0.06);
  backdrop-filter: blur(18px);

  .msg-input {
    flex: 1;
    height: 76rpx;
    min-width: 0;
    background: #f3f7f8;
    border-radius: $radius-round;
    padding: 0 28rpx;
    font-size: $font-base;
    color: $color-ink;
  }

  .btn-send {
    width: 128rpx;
    height: 76rpx;
    flex-shrink: 0;
    background: linear-gradient(135deg, #0f766e, #14b8a6);
    color: #fff;
    border-radius: $radius-round;
    font-size: $font-sm;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    box-shadow: 0 12rpx 28rpx rgba(15, 118, 110, 0.22);

    &::after {
      border: none;
    }

    &.disabled {
      opacity: 0.48;
      box-shadow: none;
    }
  }
}

.new-message-button {
  position: fixed;
  right: 24rpx;
  bottom: 132rpx;
  z-index: 10;
  min-width: 180rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border: 0;
  border-radius: 32rpx;
  background: #0f766e;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 64rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 118, 110, 0.28);

  &::after {
    border: none;
  }
}
</style>
