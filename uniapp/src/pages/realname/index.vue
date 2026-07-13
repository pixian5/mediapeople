<template>
  <view class="realname-container">
    <view class="notice-card">
      <text class="notice-text">实名认证后可获得更多信任，提升匹配成功率</text>
    </view>
    
    <view class="form-section">
      <view class="form-group">
        <text class="form-label">真实姓名</text>
        <input class="form-input" v-model="form.realName" placeholder="请输入真实姓名" />
      </view>
      <view class="form-group">
        <text class="form-label">身份证号</text>
        <input class="form-input" v-model="form.idCard" placeholder="请输入18位身份证号" />
      </view>
      <view class="form-group">
        <text class="form-label">手机号</text>
        <input class="form-input" v-model="form.phone" type="number" placeholder="请输入常用手机号" />
      </view>
      
      <button class="btn-primary" @click="handleSubmit" :class="{ disabled: loading }">
        {{ loading ? '提交中...' : '提交认证' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { submitRealNameApi } from '@/api/client';
import { useUserStore } from '@/store/user';
import { onLoad } from '@dcloudio/uni-app';

const userStore = useUserStore();
const loading = ref(false);

const form = reactive({
  realName: '',
  idCard: '',
  phone: ''
});

onLoad(() => {
  if (userStore.profile) {
    if (userStore.profile.realNameVerified) {
      uni.showToast({ title: '您已完成实名认证', icon: 'none' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
    // 不预填身份证号（敏感信息不回显），仅预填姓名
    form.realName = userStore.profile.realName || '';
  }
});

const handleSubmit = async () => {
  if (!form.realName || !form.idCard || !form.phone) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' });
    return;
  }
  if (!/^\d{17}[\dXx]$/.test(form.idCard)) {
    uni.showToast({ title: '身份证号格式不正确', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await submitRealNameApi(form);
    uni.showToast({ title: '提交成功，审核中', icon: 'success' });
    userStore.fetchProfile();
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    //
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.realname-container {
  min-height: 100vh;
  padding: $spacing-lg;
  background: $color-panel;
}

.notice-card {
  background: $color-primary-light;
  padding: $spacing-md;
  border-radius: $radius-md;
  margin-bottom: $spacing-xl;
  
  .notice-text {
    color: $color-primary-dark;
    font-size: $font-sm;
  }
}
</style>
