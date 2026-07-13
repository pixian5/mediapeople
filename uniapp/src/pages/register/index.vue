<template>
  <view class="register-container">
    <view class="form-section">
      <view class="form-group">
        <text class="form-label">账号 (手机号或英文)</text>
        <input class="form-input" v-model="form.account" placeholder="请输入账号" />
      </view>
      <view class="form-group">
        <text class="form-label">昵称</text>
        <input class="form-input" v-model="form.name" placeholder="请输入昵称" />
      </view>
      <view class="form-group">
        <text class="form-label">性别</text>
        <view class="gender-options">
          <view class="gender-btn" :class="{ active: form.gender === '男' }" @click="form.gender = '男'">男</view>
          <view class="gender-btn" :class="{ active: form.gender === '女' }" @click="form.gender = '女'">女</view>
        </view>
      </view>
      <view class="form-group">
        <text class="form-label">年龄</text>
        <input class="form-input" type="number" v-model="form.age" placeholder="请输入年龄" />
      </view>
      <view class="form-group">
        <text class="form-label">所在城市</text>
        <input class="form-input" v-model="form.city" placeholder="请输入所在城市" />
      </view>
      <view class="form-group">
        <text class="form-label">职业</text>
        <input class="form-input" v-model="form.job" placeholder="请输入职业" />
      </view>
      <view class="form-group">
        <text class="form-label">密码</text>
        <input class="form-input" v-model="form.password" type="password" password placeholder="请输入至少6位密码" />
      </view>
      <view class="form-group">
        <text class="form-label">确认密码</text>
        <input class="form-input" v-model="form.passwordConfirm" type="password" password placeholder="请再次输入密码" />
      </view>
      
      <button class="btn-primary" @click="handleRegister" :class="{ disabled: loading }">
        {{ loading ? '注册中...' : '注册' }}
      </button>
      
      <view class="login-link" @click="goToLogin">
        已有账号？去登录
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { registerApi, loginApi } from '@/api/auth';
import { useUserStore } from '@/store/user';
import { consumeReturnUrl } from '@/utils/session';

const userStore = useUserStore();

const form = reactive({
  account: '',
  name: '',
  gender: '',
  age: '',
  city: '',
  job: '',
  password: '',
  passwordConfirm: ''
});
const loading = ref(false);

const handleRegister = async () => {
  if (!form.account || !form.name || !form.gender || !form.password) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  if (form.name.length > 30) {
    uni.showToast({ title: '昵称不能超过30字', icon: 'none' });
    return;
  }
  if (form.age && (Number(form.age) < 18 || Number(form.age) > 99)) {
    uni.showToast({ title: '年龄需在18-99之间', icon: 'none' });
    return;
  }
  if (form.password.length < 6 || form.password.length > 64) {
    uni.showToast({ title: '密码长度需为6-64位', icon: 'none' });
    return;
  }
  if (form.password !== form.passwordConfirm) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    // 提交注册数据，去掉 passwordConfirm
    const { passwordConfirm, ...submitData } = form;
    // 根据账号格式智能判断是手机号还是邮箱
    const isPhone = /^1[3-9]\d{9}$/.test(form.account);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.account);
    if (isPhone) {
      submitData.phone = form.account;
    } else if (isEmail) {
      submitData.email = form.account;
    } else {
      uni.showToast({ title: '账号需为有效手机号或邮箱', icon: 'none' });
      loading.value = false;
      return;
    }
    await registerApi(submitData);
    
    uni.showToast({ title: '注册成功，正在登录...', icon: 'success' });
    
    // 自动登录
    const loginRes = await loginApi({ account: form.account, password: form.password });
    const token = loginRes.data?.token || loginRes.token;
    const user = loginRes.data?.user || loginRes.user || { id: loginRes.data?.userId || loginRes.userId };
    if (token) {
      userStore.setLogin({ token, user });
      const returnUrl = consumeReturnUrl();
      setTimeout(() => {
        if (returnUrl) {
          window.location.hash = returnUrl;
        } else {
          uni.switchTab({ url: '/pages/index/index' });
        }
      }, 1000);
    }
  } catch (error) {
    // error handled by request interceptor
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  uni.redirectTo({ url: '/pages/login/index' });
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.register-container {
  min-height: 100vh;
  background-color: $color-panel;
  padding: $spacing-xl $spacing-lg;
}

.gender-options {
  display: flex;
  gap: $spacing-md;
  
  .gender-btn {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid $color-line;
    border-radius: $radius-md;
    font-size: $font-base;
    color: $color-muted;
    
    &.active {
      border-color: $color-primary;
      background: $color-primary-light;
      color: $color-primary;
    }
  }
}

.login-link {
  text-align: center;
  margin-top: $spacing-md;
  color: $color-primary;
  font-size: $font-sm;
}
</style>
