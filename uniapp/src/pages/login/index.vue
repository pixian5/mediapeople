<template>
  <view class="login-container">
    <view class="brand-section">
      <view class="brand-mark">缘</view>
      <text class="brand-title">缘定传媒人</text>
      <text class="brand-subtitle">传媒行业专属交友平台</text>
    </view>
    <view class="form-section">
      <view class="form-group">
        <text class="form-label">账号</text>
        <input class="form-input" v-model="form.account" placeholder="请输入账号" />
      </view>
      <view class="form-group">
        <text class="form-label">密码</text>
        <input class="form-input" v-model="form.password" type="password" placeholder="请输入密码" />
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

const handleLogin = async () => {
  if (!form.account || !form.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
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
    // 错误在 request 拦截器中已经提示
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
  min-height: 100vh;
  background-color: $color-panel;
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
}

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100rpx;
  margin-bottom: 80rpx;

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
  .register-link {
    text-align: center;
    margin-top: $spacing-md;
    color: $color-primary;
    font-size: $font-sm;
  }
}
</style>
