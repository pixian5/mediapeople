<template>
  <view class="chat-detail-container">
    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollToId" :scroll-top="scrollTop" scroll-with-animation>
      <view v-if="!loading && messages.length === 0" class="chat-empty">
        <view class="empty-mark">缘</view>
        <text class="empty-title">还没有消息</text>
        <text class="empty-desc">可以先把你的想法发给红娘，她会帮你推进沟通。</text>
      </view>
      <view v-for="msg in messages" :key="msg.id" :id="'msg-' + msg.id" class="message-item" :class="{ 'is-me': msg.senderId === userStore.userId }">
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
        placeholder="发送消息"
        @confirm="handleSend"
        confirm-type="send"
      />
      <button
        class="btn-send"
        :class="{ disabled: !canSend }"
        @click="handleSend"
      >发送</button>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref, onUnmounted } from 'vue';
import { getChatMessagesApi, sendMessageApi } from '@/api/chat';
import { useUserStore } from '@/store/user';
import { addChatSocketListener, ensureChatSocket, removeChatSocketListener } from '@/utils/chatSocket';
import { onLoad, onShow, onHide } from '@dcloudio/uni-app';

const userStore = useUserStore();
const threadId = ref('');
const messages = ref([]);
const inputText = ref('');
const sending = ref(false);
const loading = ref(true);
const scrollToId = ref('');
const scrollTop = ref(0);
const inputFocused = ref(false);
const messageInputRef = ref(null);
const tempMessageIds = ref(new Set());
const pendingSendCount = ref(0);
let pollTimer = null;

const POLL_INTERVAL = 10000;
const canSend = computed(() => Boolean(inputText.value.trim()));
const isH5Runtime = typeof window !== 'undefined';

onLoad((options) => {
  if (options.threadId) {
    threadId.value = options.threadId;
    if (options.draft) {
      inputText.value = decodeURIComponent(options.draft);
    }
    loadMessages();
  }
});

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
    const res = await getChatMessagesApi(threadId.value);
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
    const res = await getChatMessagesApi(threadId.value);
    const newMessages = res.data?.list || [];
    const shouldScroll = newMessages.length > messages.value.filter((msg) => !tempMessageIds.value.has(msg.id)).length;
    mergeMessages(newMessages);
    if (shouldScroll) {
      scrollToBottom();
    }
  } catch (error) {
    //
  }
};

const compareMessages = (a, b) => {
  if (a.seq != null && b.seq != null) return a.seq - b.seq;
  if (a.seq != null) return -1;
  if (b.seq != null) return 1;
  return new Date(a.createdAt) - new Date(b.createdAt);
};

const mergeMessages = (newMessages) => {
  const tempIds = new Set(tempMessageIds.value);
  const serverIds = new Set(newMessages.map((msg) => msg.id));
  const pendingTempMessages = messages.value.filter((msg) => tempIds.has(msg.id) && !serverIds.has(msg.id));
  const merged = [...newMessages, ...pendingTempMessages];

  merged.sort(compareMessages);
  messages.value = merged.filter((msg, index, list) => list.findIndex((item) => item.id === msg.id) === index);
  tempMessageIds.value = new Set(pendingTempMessages.map((msg) => msg.id));
};

const removeTempMessage = (tempId) => {
  tempMessageIds.value.delete(tempId);
  messages.value = messages.value.filter((msg) => msg.id !== tempId);
};

const reconcileTempMessage = (message) => {
  const matchedTempMessage = messages.value.find((item) => {
    if (!tempMessageIds.value.has(item.id)) return false;
    if (item.senderId !== message.senderId || item.content !== message.content) return false;
    return Math.abs(new Date(item.createdAt).getTime() - new Date(message.createdAt).getTime()) < 15000;
  });
  if (matchedTempMessage) {
    removeTempMessage(matchedTempMessage.id);
  }
};

const upsertMessage = (message) => {
  if (!message?.id) return;
  const nextMessages = messages.value.filter((msg) => msg.id !== message.id);
  nextMessages.push(message);
  nextMessages.sort(compareMessages);
  messages.value = nextMessages;
};

const handleRealtimeMessage = (event) => {
  if (event?.type !== 'chat_message') return;
  if (event.message?.threadId !== threadId.value) return;
  reconcileTempMessage(event.message);
  upsertMessage(event.message);
  scrollToBottom();
};

const scrollToBottom = () => {
  scrollToId.value = '';
  nextTick(() => {
    setTimeout(() => {
      scrollTop.value += 100000;
      scrollToId.value = 'scroll-bottom';
    }, 30);
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const restoreInputFocus = () => {
  inputFocused.value = false;
  nextTick(() => {
    inputFocused.value = true;
    if (isH5Runtime && typeof messageInputRef.value?.focus === 'function') {
      messageInputRef.value.focus();
    }
  });
};

const handleSend = async () => {
  const content = inputText.value.trim();
  if (!content) return;
  pendingSendCount.value += 1;
  
  const tempId = Date.now().toString();
  tempMessageIds.value.add(tempId);
  const maxSeq = messages.value.reduce((max, msg) => msg.seq > max ? msg.seq : max, 0);
  const tempMessage = {
    id: tempId,
    seq: maxSeq + 1,
    content,
    senderId: userStore.userId,
    senderRole: 'client',
    createdAt: new Date().toISOString()
  };
  messages.value.push(tempMessage);
  inputText.value = '';
  scrollToBottom();
  restoreInputFocus();
  
  try {
    const res = await sendMessageApi(threadId.value, { content, senderRole: 'client', senderId: userStore.userId });
    const realMessage = res.message || res.data?.message;
    if (realMessage) {
      removeTempMessage(tempId);
      upsertMessage(realMessage);
    }
    await syncLatestMessages(true);
  } catch (error) {
    removeTempMessage(tempId);
    uni.showToast({ title: '发送失败', icon: 'none' });
  } finally {
    pendingSendCount.value = Math.max(0, pendingSendCount.value - 1);
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

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
</style>
