<template>
  <view class="detail-container" v-if="profile">
    <view class="photo-section">
      <image class="main-photo" :src="profile.photo || profile.avatar || '/static/default-avatar.png'" mode="aspectFill" />
      <view class="photo-mask"></view>
    </view>
    
    <view class="info-card basic-info">
      <view class="header">
        <text class="name">{{ profile.name }}</text>
        <view v-if="profile.vip" class="vip-badge">VIP</view>
      </view>
      <view class="tags">
        <text class="tag">{{ profile.age }}岁</text>
        <text class="tag">{{ profile.city }}</text>
        <text class="tag">{{ profile.job }}</text>
      </view>
    </view>
    
    <view class="info-card">
      <view class="section-title">自我介绍</view>
      <text class="section-content">{{ profile.bio || '未填写' }}</text>
    </view>
    
    <view class="info-card">
      <view class="section-title">择偶要求</view>
      <text v-if="!detailLoading" class="section-content">{{ profile.requirements || '未填写' }}</text>
      <view v-else class="skeleton-line"></view>
    </view>
    
    <view class="info-card">
      <view class="section-title">联系方式</view>
      <text v-if="!detailLoading && profile.wechat" class="section-content">{{ profile.wechat }}</text>
      <text v-else-if="!detailLoading" class="section-content lock-text">VIP会员可见对方微信号</text>
      <view v-else class="skeleton-line short"></view>
    </view>

    <view class="info-card">
      <view class="section-title">选择牵线红娘</view>
      <template v-if="!detailLoading">
        <picker v-if="boundMatchmakers.length" mode="selector" :range="matchmakerNames" :value="selectedMatchmakerIndex" @change="handleMatchmakerChange">
          <view class="picker-field">{{ selectedMatchmakerLabel }}</view>
        </picker>
        <text v-else class="section-content lock-text">该会员暂未绑定红娘，无法申请牵线</text>
        <text v-if="selectedMatchmaker && !isVipForSelectedMatchmaker" class="vip-hint">
          申请前会先开通 {{ selectedMatchmaker.name }} 的专属 VIP
        </text>
      </template>
      <view v-else class="skeleton-line"></view>
    </view>
    
    <view class="bottom-action safe-area-bottom">
      <template v-if="hasMatchRequest">
        <button v-if="showGroupChatBtn" class="btn-secondary" @click="goToMemberChat">
          群聊
        </button>
        <button class="btn-primary" @click="goToMatchmakerChat">
          联系红娘
        </button>
      </template>
      <template v-else>
        <button class="btn-primary" @click="handleMatchRequest" :class="{ disabled: requesting }">
          {{ requesting ? '申请中...' : '申请牵线' }}
        </button>
      </template>
    </view>
  </view>
  <view v-else-if="loading" class="loading-wrapper">
    加载中...
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getProfileDetailApi, createMatchRequestApi, redeemVipApi } from '@/api/client';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const profile = ref(null);
const loading = ref(true);
const detailLoading = ref(true);
const requesting = ref(false);
const selectedMatchmakerIndex = ref(0);

const boundMatchmakers = computed(() => profile.value?.boundMatchmakers || []);
const matchmakerNames = computed(() => boundMatchmakers.value.map((item) => `${item.name} (${item.code})`));
const selectedMatchmaker = computed(() => boundMatchmakers.value[selectedMatchmakerIndex.value] || null);
const selectedMatchmakerLabel = computed(() => selectedMatchmaker.value ? `${selectedMatchmaker.value.name} (${selectedMatchmaker.value.code})` : '请选择红娘');
const isVipForSelectedMatchmaker = computed(() => {
  const servicePlans = userStore.profile?.servicePlans || [];
  return Boolean(selectedMatchmaker.value && servicePlans.some((plan) =>
    plan.status === 'active' && new Date(plan.expiresAt) > new Date() &&
    (!plan.matchmakerId || plan.matchmakerId === selectedMatchmaker.value.id)
  ));
});
const hasMatchRequest = computed(() => !!profile.value?.matchRequest);
const showGroupChatBtn = computed(() => {
  const mr = profile.value?.matchRequest;
  return mr?.memberChatEnabled && mr?.groupThreadId;
});

const buildPreviewProfile = (options) => {
  if (!options?.id) return null;
  return {
    id: options.id,
    name: options.name || '',
    age: options.age ? Number(options.age) : 0,
    city: options.city || '',
    job: options.job || '',
    bio: options.bio || '',
    photo: options.photo || '',
    vip: options.vip === '1'
  };
};

onLoad((options) => {
  const preview = buildPreviewProfile(options);
  if (preview) {
    profile.value = preview;
    loading.value = false;
  }
  if (options?.id) {
    loadProfile(options.id);
  }
});

const loadProfile = async (id) => {
  try {
    const res = await getProfileDetailApi(id);
    const fullProfile = res.data?.user || res.data || res;
    profile.value = { ...profile.value, ...fullProfile };
    selectedMatchmakerIndex.value = 0;
  } catch (error) {
    if (!profile.value) {
      loading.value = false;
    }
  } finally {
    detailLoading.value = false;
  }
};

const handleMatchmakerChange = (event) => {
  selectedMatchmakerIndex.value = Number(event.detail.value || 0);
};

const handleMatchRequest = async () => {
  if (requesting.value) return;
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  requesting.value = true;
  try {
    if (!userStore.profile) {
      await userStore.fetchProfile();
    }
    if (!selectedMatchmaker.value) {
      uni.showToast({ title: '该会员暂未绑定红娘', icon: 'none' });
      return;
    }
    await submitMatchRequest(!isVipForSelectedMatchmaker.value);
  } finally {
    requesting.value = false;
  }
};

const submitMatchRequest = async (needRedeemVip) => {
  if (!selectedMatchmaker.value) return;
  try {
    if (needRedeemVip) {
      const redeemRes = await redeemVipApi({ referralCode: selectedMatchmaker.value.code });
      const user = redeemRes.data?.user || redeemRes.user;
      if (user) {
        userStore.applyUser(user);
      }
    }
    const res = await createMatchRequestApi({
      targetUserId: profile.value.id,
      matchmakerId: selectedMatchmaker.value.id
    });
    const requestData = res.data?.request || res.request;
    if (requestData) {
      profile.value = {
        ...profile.value,
        matchRequest: {
          id: requestData.id,
          status: requestData.status,
          matchmakerId: requestData.matchmakerId,
          memberChatEnabled: requestData.memberChatEnabled || false,
          memberThreadId: requestData.memberThreadId || null,
          matchmakerThreadId: requestData.matchmakerThreadId || null,
          groupThreadId: requestData.groupThreadId || null,
        },
      };
    }
    uni.showToast({ title: '申请成功', icon: 'success' });
  } catch (error) {
    // handled by request interceptor
  }
};

const goToMatchmakerChat = () => {
  const threadId = profile.value?.matchRequest?.matchmakerThreadId;
  if (!threadId) {
    uni.showToast({ title: '聊天会话不存在', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/chat-detail/index?threadId=${threadId}` });
};

const goToMemberChat = () => {
  const threadId = profile.value?.matchRequest?.groupThreadId;
  if (!threadId) {
    uni.showToast({ title: '群聊未开启', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/chat-detail/index?threadId=${threadId}` });
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.detail-container {
  min-height: 100vh;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 50% 0%, rgba(15, 118, 110, 0.08), transparent 34%),
    $color-bg;
}

.photo-section {
  position: relative;
  width: 100%;
  height: 430rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #dfe8eb 0%, #f8fbfb 100%);

  .main-photo {
    width: 100%;
    height: 100%;
  }

  .photo-mask {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 180rpx;
    background: linear-gradient(to bottom, rgba(238,242,245,0), rgba(238,242,245,1));
  }
}

.info-card {
  margin: 0 $spacing-md $spacing-md;
  background: $color-panel;
  border-radius: $radius-md;
  padding: $spacing-md;
  position: relative;
  z-index: 2;
  box-shadow: $shadow-card;
  
  &.basic-info {
    margin-top: -64rpx;
  }

  .header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;
    
    .name {
      font-size: $font-title;
      font-weight: bold;
      color: $color-ink;
      margin-right: $spacing-sm;
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    
    .tag {
      font-size: $font-sm;
      color: $color-muted;
      background: $color-bg;
      padding: 6rpx 16rpx;
      border-radius: $radius-sm;
    }
  }

  .section-title {
    font-size: $font-lg;
    font-weight: bold;
    color: $color-ink;
    margin-bottom: $spacing-sm;
  }

  .section-content {
    font-size: $font-base;
    color: $color-muted;
    line-height: 1.6;
    
    &.lock-text {
      color: $color-gold;
    }
  }

  .picker-field {
    padding: 20rpx 24rpx;
    border-radius: $radius-sm;
    background: $color-bg;
    font-size: $font-base;
    color: $color-ink;
  }

  .vip-hint {
    display: block;
    margin-top: $spacing-sm;
    font-size: $font-sm;
    color: $color-gold;
  }
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $color-panel;
  padding: $spacing-sm $spacing-md;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 10;
  display: flex;
  gap: $spacing-sm;

  .btn-primary,
  .btn-secondary {
    flex: 1;
    margin: 0;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: $radius-round;
  }
}

.skeleton-line {
  height: 32rpx;
  border-radius: $radius-sm;
  background: linear-gradient(90deg, $color-bg 25%, #eef2f5 50%, $color-bg 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;

  &.short {
    width: 40%;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media screen and (min-width: 520px) {
  .bottom-action {
    left: 50%;
    right: auto;
    width: 430px;
    box-sizing: border-box;
    transform: translateX(-50%);
  }
}
</style>
