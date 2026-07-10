<template>
  <view class="chat-detail-container">
    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollToId" scroll-with-animation>
      <view v-for="msg in messages" :key="msg.id" :id="'msg-' + msg.id" class="message-item" :class="{ 'is-me': msg.senderId === userStore.userId }">
        <view class="bubble">{{ msg.content }}</view>
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
import { ref } from 'vue';
import { getChatMessagesApi, sendMessageApi } from '@/api/chat';
import { useUserStore } from '@/store/user';
import { onLoad } from '@dcloudio/uni-app';

const userStore = useUserStore();
const threadId = ref('');
const messages = ref([]);
const inputText = ref('');
const sending = ref(false);
const scrollToId = ref('');

onLoad((options) => {
  if (options.threadId) {
    threadId.value = options.threadId;
    if (options.draft) {
      inputText.value = decodeURIComponent(options.draft);
    }
    loadMessages();
  }
});

const loadMessages = async () => {
  try {
    const res = await getChatMessagesApi(threadId.value);
    messages.value = res.data?.list || [];
    setTimeout(() => {
      scrollToId.value = 'scroll-bottom';
    }, 100);
  } catch (error) {
    //
  }
};

const handleSend = async () => {
  if (!inputText.value || sending.value) return;
  const content = inputText.value;
  sending.value = true;
  
  // Optimistic UI
  const tempId = Date.now().toString();
  const tempMessage = {
    id: tempId,
    content,
    senderId: userStore.userId,
    senderRole: 'client',
    createdAt: new Date().toISOString()
  };
  messages.value.push(tempMessage);
  inputText.value = '';
  setTimeout(() => {
    scrollToId.value = 'msg-' + tempId;
  }, 50);
  
  try {
    const res = await sendMessageApi(threadId.value, { content, senderRole: 'client', senderId: userStore.userId });
    // 用服务器返回的真实消息替换临时消息
    const realMessage = res.message || res.data?.message;
    if (realMessage) {
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value[index] = realMessage;
      }
    }
  } catch (error) {
    // 发送失败，移除临时消息
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
  height: 100vh;
  background: $color-bg;
}

.message-list {
  flex: 1;
  padding: $spacing-md;
  box-sizing: border-box;
}

.message-item {
  display: flex;
  margin-bottom: $spacing-md;
  
  .bubble {
    max-width: 70%;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    font-size: $font-base;
    line-height: 1.5;
    background: #f0f2f5;
    color: $color-ink;
  }
  
  &.is-me {
    justify-content: flex-end;
    
    .bubble {
      background: $color-primary-light;
      color: $color-primary-dark;
    }
  }
}

.input-bar {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-panel;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  
  .msg-input {
    flex: 1;
    height: 72rpx;
    background: $color-bg;
    border-radius: $radius-round;
    padding: 0 $spacing-md;
    font-size: $font-base;
    margin-right: $spacing-sm;
  }
  
  .btn-send {
    width: 120rpx;
    height: 72rpx;
    background: $color-primary;
    color: #fff;
    border-radius: $radius-round;
    font-size: $font-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    
    &::after {
      border: none;
    }
    
    &.disabled {
      opacity: 0.5;
    }
  }
}
</style>
