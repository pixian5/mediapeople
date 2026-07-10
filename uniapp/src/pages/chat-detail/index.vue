<template>
  <view class="chat-detail-container">
    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollToId" scroll-with-animation>
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
      <input class="msg-input" v-model="inputText" placeholder="发送消息" @confirm="handleSend" confirm-type="send" />
      <button class="btn-send" @click="handleSend" :class="{ disabled: !inputText || sending }">发送</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { getChatMessagesApi, sendMessageApi } from '@/api/chat';
import { useUserStore } from '@/store/user';
import { onLoad, onShow, onHide } from '@dcloudio/uni-app';

const userStore = useUserStore();
const threadId = ref('');
const messages = ref([]);
const inputText = ref('');
const sending = ref(false);
const loading = ref(true);
const scrollToId = ref('');
const tempMessageIds = ref(new Set());
let pollTimer = null;

const POLL_INTERVAL = 3000;

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
  startPolling();
});

onHide(() => {
  stopPolling();
});

onUnmounted(() => {
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
  if (!threadId.value || (sending.value && !force)) return;
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

const mergeMessages = (newMessages) => {
  const tempIds = new Set(tempMessageIds.value);
  const serverIds = new Set(newMessages.map((msg) => msg.id));
  const pendingTempMessages = messages.value.filter((msg) => tempIds.has(msg.id) && !serverIds.has(msg.id));
  const merged = [...newMessages, ...pendingTempMessages];

  merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  messages.value = merged;
  tempMessageIds.value = new Set(pendingTempMessages.map((msg) => msg.id));
};

const scrollToBottom = () => {
  setTimeout(() => {
    scrollToId.value = 'scroll-bottom';
  }, 50);
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const handleSend = async () => {
  if (!inputText.value || sending.value) return;
  const content = inputText.value;
  sending.value = true;
  
  const tempId = Date.now().toString();
  tempMessageIds.value.add(tempId);
  const tempMessage = {
    id: tempId,
    content,
    senderId: userStore.userId,
    senderRole: 'client',
    createdAt: new Date().toISOString()
  };
  messages.value.push(tempMessage);
  inputText.value = '';
  scrollToBottom();
  
  try {
    const res = await sendMessageApi(threadId.value, { content, senderRole: 'client', senderId: userStore.userId });
    const realMessage = res.message || res.data?.message;
    await syncLatestMessages(true);
    if (realMessage) {
      tempMessageIds.value.delete(tempId);
      messages.value = messages.value.filter((msg) => msg.id !== tempId);
      mergeMessages([...messages.value, realMessage]);
    }
  } catch (error) {
    tempMessageIds.value.delete(tempId);
    messages.value = messages.value.filter(m => m.id !== tempId);
    uni.showToast({ title: '发送失败', icon: 'none' });
  } finally {
    sending.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.chat-detail-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 44px);
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 0%, rgba(15, 118, 110, 0.08), transparent 34%),
    linear-gradient(180deg, #f8fbfb 0%, $color-bg 100%);
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: $spacing-lg $spacing-md;
  box-sizing: border-box;
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
