<template>
  <view class="workbench-container">
    <!-- 顶部红娘信息 -->
    <view class="header-card">
      <view class="header-top">
        <view class="info">
          <text class="name">{{ userStore.matchmakerName || '红娘工作台' }}</text>
          <text class="meta">服务评分 {{ Number(userStore.matchmakerRating || 0).toFixed(1) }} · 评价 {{ userStore.matchmakerRatingCount || 0 }} 次</text>
        </view>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </view>
      <view class="notification-bar">
        <text class="notice-title">待处理通知</text>
        <text class="notice-count">{{ pendingCount }} 条</text>
      </view>
    </view>

    <!-- 待处理通知列表 -->
    <view class="section-card">
      <view class="section-title">牵线请求与资料审核</view>
      <view v-if="notificationList.length === 0" class="empty-tip">暂无待处理通知</view>
      <view v-for="item in notificationList" :key="item.key" class="request-card">
        <view class="card-header">
          <text class="status-pill">{{ item.statusText }}</text>
          <text class="time">{{ formatTime(item.createdAt) }}</text>
        </view>
        <view class="card-body">
          <text class="title">{{ item.title }}</text>
          <text v-if="item.desc" class="desc">{{ item.desc }}</text>
        </view>
        <!-- 请求操作区 -->
        <view v-if="item.type === 'request'" class="card-actions">
          <button class="btn-sm btn-secondary" @click="contactSide(item.id, 'male')">私聊男方</button>
          <button class="btn-sm btn-secondary" @click="contactSide(item.id, 'female')">私聊女方</button>
          <button v-if="hasGroupThread(item.id)" class="btn-sm btn-primary" @click="openChat(threadForGroup(item.id)?.id)">三方群聊</button>
        </view>
        <view v-if="item.type === 'request'" class="card-extra">
          <view class="chat-toggle">
            <text>男女双方私聊：{{ item.memberChatEnabled ? '已开启' : '已关闭' }}</text>
            <button class="btn-sm btn-ghost" @click="toggleMemberChat(item.id, !item.memberChatEnabled)">
              {{ item.memberChatEnabled ? '关闭双方私聊' : '开启双方私聊' }}
            </button>
          </view>
          <view class="progress-actions">
            <text class="progress-text">进度：{{ item.serviceStage || '待首次推荐' }}</text>
            <view class="btn-row">
              <button class="btn-sm btn-secondary" @click="updateProgress(item.id, 'follow_up')">记录跟进</button>
              <button class="btn-sm btn-secondary" @click="updateProgress(item.id, 'effective_match')">有效匹配</button>
              <button class="btn-sm btn-ghost" @click="updateProgress(item.id, 'not_fit')">不合适</button>
            </view>
          </view>
        </view>
        <!-- 资料审核操作区 -->
        <view v-if="item.type === 'profile'" class="card-actions">
          <button class="btn-sm btn-primary" @click="reviewProfile(item.userId, 'approve')">审核通过</button>
          <button class="btn-sm btn-ghost" @click="reviewProfile(item.userId, 'reject')">退回修改</button>
        </view>
      </view>
    </view>

    <!-- 双方联系信息 -->
    <view class="section-card">
      <view class="section-title">双方联系信息（仅红娘可见）</view>
      <view v-if="contactList.length === 0" class="empty-tip">接到牵线请求后会显示双方微信</view>
      <view v-for="contact in contactList" :key="contact.requestId" class="contact-card">
        <text class="contact-title">{{ contact.fromName }} 与 {{ contact.toName }}</text>
        <text class="contact-line">{{ contact.fromName }} 微信：{{ contact.fromWechat || '-' }}</text>
        <text class="contact-line">{{ contact.toName }} 微信：{{ contact.toWechat || '-' }}</text>
      </view>
    </view>

    <!-- 红娘聊天会话 -->
    <view class="section-card">
      <view class="section-title">会员会话</view>
      <view v-if="threads.length === 0" class="empty-tip">牵线单创建后，这里会自动出现会员聊天</view>
      <view v-for="thread in threads" :key="thread.id" class="chat-thread" @click="openChat(thread.id)">
        <view class="thread-info">
          <text class="thread-name">{{ threadDisplayName(thread) }}</text>
          <text class="thread-subtitle">{{ threadSubtitle(thread) }}</text>
        </view>
        <text class="thread-preview">{{ thread.lastMessagePreview || '点击进入聊天' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/appStore';
import {
  toggleMemberChatApi,
  updateServiceProgressApi,
  reviewProfileApi
} from '@/api/matchmaker';

const userStore = useUserStore();
const appStore = useAppStore();

const mmId = computed(() => userStore.matchmakerId);

onShow(() => {
  loadData();
});

onPullDownRefresh(() => {
  loadData();
});

const loadData = async () => {
  await appStore.fetchState();
  uni.stopPullDownRefresh();
};

// 当前红娘的请求
const requests = computed(() => appStore.requestsForMatchmaker(mmId.value));

// 当前红娘待审核的资料
const pendingProfiles = computed(() => appStore.pendingProfilesForMatchmaker(mmId.value));

// 当前红娘的聊天会话
const threads = computed(() => appStore.threadsForMatchmaker(mmId.value));

// 通知列表合并请求和资料审核
const notificationList = computed(() => {
  const list = [];
  requests.value.forEach((request) => {
    const from = appStore.getUserById(request.fromUserId);
    const to = appStore.getUserById(request.toUserId);
    list.push({
      key: `req-${request.id}`,
      type: 'request',
      id: request.id,
      statusText: request.status || '待处理',
      title: `${from?.name || '未知'} 申请认识 ${to?.name || '未知'}`,
      desc: '点击私聊男方/女方，直接进入对应会员的一对一聊天',
      createdAt: request.createdAt,
      memberChatEnabled: Boolean(request.memberChatEnabled),
      serviceStage: request.serviceStage
    });
  });
  pendingProfiles.value.forEach(({ user, profile }) => {
    const draft = profile?.draft || user;
    list.push({
      key: `profile-${user.id}`,
      type: 'profile',
      userId: user.id,
      statusText: '资料待审核',
      title: `${draft?.name || user.name} 的资料更新`,
      desc: `${draft?.gender || user.gender || '-'} · ${draft?.age || user.age || '-'} 岁 · ${draft?.city || user.city || '-'}`,
      createdAt: profile?.updatedAt || user.updatedAt
    });
  });
  return list;
});

const pendingCount = computed(() => notificationList.value.length);

// 联系信息卡片
const contactList = computed(() => {
  return requests.value.map((request) => {
    const from = appStore.getUserById(request.fromUserId);
    const to = appStore.getUserById(request.toUserId);
    return {
      requestId: request.id,
      fromName: from?.name || '未知',
      toName: to?.name || '未知',
      fromWechat: from?.wechat,
      toWechat: to?.wechat
    };
  });
});

// 根据性别拆分男女双方（简单逻辑：from/to 中男性为男方，女性为女方）
const getGenderParticipants = (request) => {
  const from = appStore.getUserById(request.fromUserId);
  const to = appStore.getUserById(request.toUserId);
  const maleUser = from?.gender === '男' ? from : to?.gender === '男' ? to : null;
  const femaleUser = from?.gender === '女' ? from : to?.gender === '女' ? to : null;
  return { maleUser, femaleUser };
};

const hasGroupThread = (requestId) => {
  return threads.value.some((t) => t.type === 'matchmaker_group' && t.requestId === requestId);
};

const threadForGroup = (requestId) => {
  return threads.value.find((t) => t.type === 'matchmaker_group' && t.requestId === requestId);
};

const threadDisplayName = (thread) => {
  const participants = thread.participants || [];
  const names = participants
    .filter((p) => p.role !== 'matchmaker')
    .map((p) => appStore.getUserById(p.id)?.name || p.name || '会员');
  if (thread.type === 'matchmaker_group') return `三方群聊（${names.join('、')}）`;
  return names[0] || '会员聊天';
};

const threadSubtitle = (thread) => {
  return thread.type === 'matchmaker_group' ? '红娘与男女双方' : '红娘与会员一对一';
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const contactSide = (requestId, side) => {
  const request = appStore.getRequestById(requestId);
  if (!request) return;

  const { maleUser, femaleUser } = getGenderParticipants(request);
  const target = side === 'male' ? maleUser : femaleUser;
  const thread = threads.value.find((item) => {
    if (item.type !== 'member_matchmaker' || item.requestId !== requestId || !target) return false;
    return item.participants?.some((participant) => participant.role === 'client' && participant.id === target.id);
  });

  if (!thread) {
    uni.showToast({ title: '私聊会话尚未创建，请刷新后重试', icon: 'none' });
    return;
  }
  openChat(thread.id);
};

const toggleMemberChat = async (requestId, enabled) => {
  try {
    await toggleMemberChatApi(requestId, enabled);
    await appStore.fetchState();
    uni.showToast({ title: enabled ? '已开启男女双方私聊' : '已关闭男女双方私聊', icon: 'none' });
  } catch (error) {}
};

const updateProgress = async (requestId, action) => {
  try {
    await updateServiceProgressApi(requestId, action);
    await appStore.fetchState();
    uni.showToast({ title: '服务进度已更新', icon: 'none' });
  } catch (error) {}
};

const reviewProfile = async (userId, action) => {
  try {
    await reviewProfileApi(userId, action);
    await appStore.fetchState();
    uni.showToast({ title: action === 'approve' ? '资料已审核通过' : '资料已退回修改', icon: 'none' });
  } catch (error) {}
};

const openChat = (threadId) => {
  if (!threadId) return;
  uni.navigateTo({ url: `/pages/matchmaker/chat-detail/index?threadId=${threadId}` });
};

const handleLogout = () => {
  userStore.logout();
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.workbench-container {
  min-height: 100vh;
  padding: $spacing-md;
  background: $color-bg;
}

.header-card {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  color: #ffffff;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    .info {
      display: flex;
      flex-direction: column;

      .name {
        font-size: $font-xl;
        font-weight: bold;
        margin-bottom: $spacing-xs;
      }

      .meta {
        font-size: $font-sm;
        opacity: 0.9;
      }
    }

    .btn-logout {
      height: 56rpx;
      padding: 0 $spacing-md;
      line-height: 56rpx;
      font-size: $font-sm;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: $radius-round;
      margin: 0;

      &::after {
        display: none;
      }
    }
  }

  .notification-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    padding: $spacing-sm $spacing-md;

    .notice-title {
      font-size: $font-sm;
    }

    .notice-count {
      font-size: $font-sm;
      font-weight: bold;
    }
  }
}

.section-card {
  background: $color-panel;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-card;

  .section-title {
    font-size: $font-md;
    font-weight: bold;
    color: $color-ink;
    margin-bottom: $spacing-md;
  }

  .empty-tip {
    text-align: center;
    padding: $spacing-lg 0;
    color: $color-muted;
    font-size: $font-sm;
  }
}

.request-card {
  border: 2rpx solid $color-line;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;

  &:last-child {
    margin-bottom: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 4rpx 14rpx;
      background: $color-primary-light;
      color: $color-primary-dark;
      border-radius: $radius-round;
      font-size: $font-xs;
      font-weight: 600;
    }

    .time {
      font-size: $font-xs;
      color: $color-muted;
    }
  }

  .card-body {
    margin-bottom: $spacing-sm;

    .title {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $color-ink;
      margin-bottom: $spacing-xs;
    }

    .desc {
      display: block;
      font-size: $font-sm;
      color: $color-muted;
    }
  }

  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  .card-extra {
    margin-top: $spacing-sm;

    .chat-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-sm;
      background: rgba(15, 118, 110, 0.06);
      border-radius: $radius-md;
      margin-bottom: $spacing-sm;
      font-size: $font-sm;
      color: $color-ink;
    }

    .progress-actions {
      padding: $spacing-sm;
      background: rgba(251, 191, 36, 0.1);
      border-radius: $radius-md;

      .progress-text {
        display: block;
        font-size: $font-sm;
        font-weight: 600;
        color: $color-ink;
        margin-bottom: $spacing-xs;
      }

      .btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;
      }
    }
  }
}

.contact-card {
  background: $color-paper;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;

  .contact-title {
    display: block;
    font-size: $font-base;
    font-weight: 600;
    color: $color-ink;
    margin-bottom: $spacing-xs;
  }

  .contact-line {
    display: block;
    font-size: $font-sm;
    color: $color-muted;
    margin-bottom: 4rpx;
  }
}

.chat-thread {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  background: $color-paper;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;

  .thread-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;

    .thread-name {
      font-size: $font-base;
      font-weight: 600;
      color: $color-ink;
      margin-bottom: 4rpx;
    }

    .thread-subtitle {
      font-size: $font-xs;
      color: $color-muted;
    }
  }

  .thread-preview {
    max-width: 45%;
    font-size: $font-xs;
    color: $color-muted;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.btn-sm {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  font-size: $font-sm;
  border-radius: $radius-round;
  margin: 0;

  &::after {
    display: none;
  }
}

.btn-secondary {
  background: $color-panel;
  color: $color-primary;
  border: 2rpx solid $color-primary;
}

.btn-ghost {
  background: transparent;
  color: $color-muted;
  border: 2rpx solid $color-line;
}
</style>
