<template>
  <view class="login-container">
    <view class="brand-section">
      <view class="brand-mark">缘</view>
      <text class="brand-title">MatchMaker</text>
      <text class="brand-subtitle">真实安全的单身交友平台</text>
    </view>
    <view class="form-section">
      <view class="form-group">
        <text class="form-label">账号</text>
        <input class="form-input" v-model="form.account" placeholder="请输入账号" @input="clearError" />
      </view>
      <view class="form-group">
        <text class="form-label">密码</text>
        <input class="form-input" v-model="form.password" type="password" placeholder="请输入密码" @input="clearError" />
      </view>
      <view v-if="errorMessage" class="login-error" role="alert">
        {{ errorMessage }}
      </view>
      <button class="btn-primary" @click="handleLogin" :class="{ disabled: loading }">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <view class="register-link" @click="goToRegister">
        还没有账号？立即注册
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { loginApi } from '@/api/auth';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const form = reactive({
  account: '',
  password: ''
});
const loading = ref(false);
const errorMessage = ref('');

const clearError = () => {
  errorMessage.value = '';
};

const handleLogin = async () => {
  if (!form.account || !form.password) {
    errorMessage.value = '请输入账号和密码';
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
  errorMessage.value = '';
  loading.value = true;
  try {
    const res = await loginApi(form);
    const token = res.data?.token || res.token;
    const user = res.data?.user || res.user || { id: res.data?.userId || res.userId };
    if (token) {
      userStore.setLogin({ token, user });
      uni.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } else {
      throw new Error('登录失败，未获取到凭证');
    }
  } catch (error) {
    errorMessage.value = error?.message || '登录失败，请检查账号和密码';
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/register/index' });
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.login-container {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f8fa 0%, $color-bg 100%);
  padding: 80rpx $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 680rpx;
  margin-bottom: 64rpx;

  .brand-mark {
    width: 120rpx;
    height: 120rpx;
    background: #f2b84b;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60rpx;
    font-weight: bold;
    color: #18212d;
    margin-bottom: $spacing-md;
  }

  .brand-title {
    font-size: $font-title;
    font-weight: bold;
    color: $color-ink;
    margin-bottom: $spacing-xs;
  }

  .brand-subtitle {
    font-size: $font-base;
    color: $color-muted;
  }
}

.form-section {
  box-sizing: border-box;
  width: 100%;
  max-width: 680rpx;
  padding: 48rpx;
  background: $color-panel;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;

  .login-error {
    box-sizing: border-box;
    width: 100%;
    margin: -8rpx 0 $spacing-md;
    padding: 16rpx 20rpx;
    color: #b42318;
    background: #fff1f0;
    border: 2rpx solid #fecdca;
    border-radius: $radius-sm;
    font-size: $font-sm;
    line-height: 1.5;
  }

  .register-link {
    text-align: center;
    margin-top: $spacing-md;
    color: $color-primary;
    font-size: $font-sm;
  }
}
</style>
