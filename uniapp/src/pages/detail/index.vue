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
      <text class="section-content">{{ profile.requirements || '未填写' }}</text>
    </view>
    
    <view class="info-card">
      <view class="section-title">联系方式</view>
      <text class="section-content" v-if="profile.wechat">{{ profile.wechat }}</text>
      <text class="section-content lock-text" v-else>VIP会员可见对方微信号</text>
    </view>

    <view class="info-card">
      <view class="section-title">选择牵线红娘</view>
      <picker v-if="boundMatchmakers.length" mode="selector" :range="matchmakerNames" :value="selectedMatchmakerIndex" @change="handleMatchmakerChange">
        <view class="picker-field">{{ selectedMatchmakerLabel }}</view>
      </picker>
      <text v-else class="section-content lock-text">该会员暂未绑定红娘，无法申请牵线</text>
      <text v-if="selectedMatchmaker && !isVipForSelectedMatchmaker" class="vip-hint">
        申请前会先开通 {{ selectedMatchmaker.name }} 的专属 VIP
      </text>
    </view>
    
    <view class="bottom-action safe-area-bottom">
      <button class="btn-primary" @click="handleMatchRequest" :class="{ disabled: requesting }">
        {{ requesting ? '申请中...' : '申请牵线' }}
      </button>
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
const requesting = ref(false);
const selectedMatchmakerIndex = ref(0);

const boundMatchmakers = computed(() => profile.value?.delegatedMatchmakers || []);
const matchmakerNames = computed(() => boundMatchmakers.value.map((item) => `${item.name} (${item.code})`));
const selectedMatchmaker = computed(() => boundMatchmakers.value[selectedMatchmakerIndex.value] || null);
const selectedMatchmakerLabel = computed(() => selectedMatchmaker.value ? `${selectedMatchmaker.value.name} (${selectedMatchmaker.value.code})` : '请选择红娘');
const isVipForSelectedMatchmaker = computed(() => {
  const vipIds = userStore.profile?.vipMatchmakerIds || [];
  return selectedMatchmaker.value ? vipIds.includes(selectedMatchmaker.value.id) : false;
});

onLoad((options) => {
  if (options.id) {
    loadProfile(options.id);
  }
});

const loadProfile = async (id) => {
  try {
    const res = await getProfileDetailApi(id);
    profile.value = res.data?.user || res.data || res;
    selectedMatchmakerIndex.value = 0;
  } catch (error) {
    // handled by interceptor
  } finally {
    loading.value = false;
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
      await redeemVipApi({ referralCode: selectedMatchmaker.value.code });
      await userStore.fetchProfile();
    }
    await createMatchRequestApi({
      targetUserId: profile.value.id,
      matchmakerId: selectedMatchmaker.value.id
    });
    uni.showToast({ title: '申请成功', icon: 'success' });
  } catch (error) {
    // handled by request interceptor
  }
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
