<template>
  <view class="edit-container">
    <view class="avatar-section" @click="chooseAvatar">
      <image class="avatar" :src="form.avatar || form.photo || '/static/default-avatar.png'" mode="aspectFill" />
      <view class="change-text">点击更换头像</view>
    </view>
    
    <view class="form-section">
      <view class="form-group">
        <text class="form-label">昵称</text>
        <input class="form-input" v-model="form.name" placeholder="请输入昵称" />
      </view>
      <view class="form-group">
        <text class="form-label">性别 (不可修改)</text>
        <input class="form-input disabled" v-model="form.gender" disabled />
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
        <text class="form-label">手机号</text>
        <input class="form-input" v-model="form.phone" placeholder="请输入手机号" />
      </view>
      <view class="form-group">
        <text class="form-label">微信号</text>
        <input class="form-input" v-model="form.wechat" placeholder="请输入微信号" />
      </view>
      <view class="form-group">
        <text class="form-label">自我介绍</text>
        <textarea class="form-textarea" v-model="form.bio" placeholder="介绍一下自己" />
      </view>
      <view class="form-group">
        <text class="form-label">择偶要求</text>
        <textarea class="form-textarea" v-model="form.requirements" placeholder="你的理想型是？" />
      </view>
      
      <button class="btn-primary" @click="handleSave" :class="{ disabled: loading }">
        {{ loading ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { updateProfileApi } from '@/api/client';
import { useUserStore } from '@/store/user';
import { onLoad } from '@dcloudio/uni-app';

const userStore = useUserStore();
const loading = ref(false);

const form = reactive({
  name: '',
  gender: '',
  age: '',
  city: '',
  job: '',
  phone: '',
  wechat: '',
  bio: '',
  requirements: '',
  avatar: ''
});

onLoad(() => {
  if (userStore.profile) {
    const p = userStore.profile;
    form.name = p.name || '';
    form.gender = p.gender || '';
    form.age = p.age || '';
    form.city = p.city || '';
    form.job = p.job || '';
    form.phone = p.phone || '';
    form.wechat = p.wechat || '';
    form.bio = p.bio || '';
    form.requirements = p.requirements || '';
    form.avatar = p.avatar || p.photo || '';
  }
});

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      // In a real app, we would upload the image to a server first
      // Here we just set the local path to preview
      form.avatar = res.tempFilePaths[0];
      uni.showToast({ title: '头像是本地预览，需对接上传接口', icon: 'none' });
    }
  });
};

const handleSave = async () => {
  if (!form.name) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' });
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
  if (form.wechat && !/^[a-zA-Z0-9_]{6,20}$/.test(form.wechat)) {
    uni.showToast({ title: '微信号格式不正确（6-20位字母数字下划线）', icon: 'none' });
    return;
  }
  if (form.bio && form.bio.length > 500) {
    uni.showToast({ title: '个人简介不能超过500字', icon: 'none' });
    return;
  }
  if (form.requirements && form.requirements.length > 500) {
    uni.showToast({ title: '择偶要求不能超过500字', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await updateProfileApi(form);
    uni.showToast({ title: '保存成功', icon: 'success' });
    userStore.fetchProfile();
    setTimeout(() => {
      uni.navigateBack();
    }, 1000);
  } catch (error) {
    //
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.edit-container {
  min-height: 100vh;
  background: $color-panel;
  padding: $spacing-lg;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $spacing-xl;
  
  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: $color-bg;
    margin-bottom: $spacing-sm;
  }
  
  .change-text {
    font-size: $font-sm;
    color: $color-primary;
  }
}

.form-input.disabled {
  background: $color-bg;
  color: $color-muted;
}
</style>
