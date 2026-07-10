<template>
  <view class="mine-container">
    <view class="profile-card" v-if="userStore.isLoggedIn" @click="goToEdit">
      <image class="avatar" :src="userStore.avatar || '/static/default-avatar.png'" mode="aspectFill" />
      <view class="info">
        <view class="header">
          <text class="name">{{ userStore.name }}</text>
          <view v-if="userStore.vipActive" class="vip-badge">VIP</view>
        </view>
        <text class="sub-info">{{ userStore.city }} | {{ userStore.profile?.job || '未知' }}</text>
      </view>
      <view class="arrow">></view>
    </view>
    
    <view class="profile-card login-card" v-else @click="goToLogin">
      <view class="avatar-placeholder"></view>
      <view class="info">
        <text class="name">点击登录/注册</text>
        <text class="sub-info">登录后体验更多功能</text>
      </view>
    </view>
    
    <view class="menu-list" v-if="userStore.isLoggedIn">
      <view class="list-item" @click="navigateTo('/pages/profile-edit/index')">
        <text class="title">编辑资料</text>
        <view class="arrow">></view>
      </view>
      <view class="list-item" @click="navigateTo('/pages/realname/index')">
        <text class="title">实名认证</text>
        <text class="status" v-if="userStore.profile?.realNameVerified">已认证</text>
        <view class="arrow" v-else>></view>
      </view>
      <view class="list-item" @click="navigateTo('/pages/vip/index')">
        <text class="title">VIP 会员</text>
        <text class="status gold" v-if="userStore.vipActive">已开通</text>
        <view class="arrow" v-else>></view>
      </view>
      <view class="list-item" @click="navigateTo('/pages/my-requests/index')">
        <text class="title">牵线记录</text>
        <view class="arrow">></view>
      </view>
    </view>
    
    <view class="action-section" v-if="userStore.isLoggedIn">
      <button class="btn-logout" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store/user';
import { onShow } from '@dcloudio/uni-app';

const userStore = useUserStore();

onShow(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile();
  }
});

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const goToEdit = () => {
  uni.navigateTo({ url: '/pages/profile-edit/index' });
};

const navigateTo = (url) => {
  uni.navigateTo({ url });
};

const handleLogout = () => {
  userStore.logout();
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.mine-container {
  min-height: 100vh;
  padding: $spacing-md;
}

.profile-card {
  display: flex;
  align-items: center;
  background: $color-panel;
  padding: $spacing-lg;
  border-radius: $radius-md;
  box-shadow: $shadow-card;
  margin-bottom: $spacing-lg;
  
  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    margin-right: $spacing-md;
    background: $color-bg;
  }
  
  .avatar-placeholder {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    margin-right: $spacing-md;
    background: $color-line;
  }
  
  .info {
    flex: 1;
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: $spacing-xs;
      
      .name {
        font-size: $font-xl;
        font-weight: bold;
        color: $color-ink;
        margin-right: $spacing-sm;
      }
    }
    
    .sub-info {
      font-size: $font-sm;
      color: $color-muted;
    }
  }
  
  .arrow {
    color: $color-muted;
    font-size: $font-lg;
  }
}

.menu-list {
  background: $color-panel;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: $shadow-card;
  margin-bottom: $spacing-lg;
  
  .list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1rpx solid $color-line;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background: $color-paper;
    }
    
    .title {
      font-size: $font-base;
      color: $color-ink;
    }
    
    .status {
      font-size: $font-sm;
      color: $color-muted;
      margin-right: $spacing-xs;
      
      &.gold {
        color: $color-gold;
      }
    }
    
    .arrow {
      color: $color-muted;
    }
  }
}

.action-section {
  margin-top: $spacing-xl;
  
  .btn-logout {
    background: $color-panel;
    color: $color-coral;
    font-size: $font-base;
    border: none;
    border-radius: $radius-md;
    
    &::after {
      border: none;
    }
    
    &:active {
      background: $color-paper;
    }
  }
}
</style>
