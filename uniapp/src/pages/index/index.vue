<template>
  <view class="discover-container">
    <view class="filter-bar">
      <input class="filter-input" v-model="filters.city" placeholder="输入城市" @confirm="handleSearch" />
      <picker class="filter-picker" mode="selector" :range="ageRanges" @change="handleAgeChange">
        <view class="picker-value">{{ selectedAgeRange || '年龄不限' }}</view>
      </picker>
      <button class="btn-reset" @click="resetFilters">重置</button>
    </view>

    <view class="list-container">
      <view class="user-card" v-for="item in list" :key="item.id" @click="goToDetail(item)">
        <image class="avatar" :src="item.photo || item.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="info">
          <view class="header">
            <text class="name">{{ item.name }}</text>
            <view v-if="item.vip" class="vip-badge">VIP</view>
          </view>
          <view class="tags">
            <text class="tag">{{ item.age }}岁</text>
            <text class="tag">{{ item.city }}</text>
            <text class="tag">{{ item.job }}</text>
          </view>
          <text class="bio">{{ item.bio || '这个人很懒，什么都没写' }}</text>
        </view>
      </view>
      
      <view v-if="loading" class="loading-wrapper">加载中...</view>
      <view v-else-if="list.length === 0" class="empty-state">
        <text class="empty-text">暂无合适的嘉宾</text>
      </view>
      <view v-else-if="!hasMore" class="loading-wrapper">没有更多了</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { getProfilesApi } from '@/api/client';
import { useUserStore } from '@/store/user';
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';

const userStore = useUserStore();

const list = ref([]);
const loading = ref(false);
const hasMore = ref(true);

const filters = reactive({
  city: '',
  minAge: '',
  maxAge: '',
  page: 1,
  pageSize: 10
});

const ageRanges = ['不限', '18-25', '26-30', '31-35', '36-40', '40以上'];
const selectedAgeRange = ref('');

const loadData = async (reset = false) => {
  if (loading.value) return;
  if (reset) {
    filters.page = 1;
    hasMore.value = true;
    list.value = [];
  }
  if (!hasMore.value) return;

  loading.value = true;
  try {
    const res = await getProfilesApi(filters);
    const dataList = res.data?.list || [];
    if (dataList.length < filters.pageSize) {
      hasMore.value = false;
    }
    list.value = reset ? dataList : [...list.value, ...dataList];
    filters.page++;
  } catch (error) {
    // request interceptor handles toast
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const handleSearch = () => {
  loadData(true);
};

const handleAgeChange = (e) => {
  const index = e.detail.value;
  selectedAgeRange.value = ageRanges[index];
  if (index == 0) {
    filters.minAge = '';
    filters.maxAge = '';
  } else if (index == 1) {
    filters.minAge = 18;
    filters.maxAge = 25;
  } else if (index == 2) {
    filters.minAge = 26;
    filters.maxAge = 30;
  } else if (index == 3) {
    filters.minAge = 31;
    filters.maxAge = 35;
  } else if (index == 4) {
    filters.minAge = 36;
    filters.maxAge = 40;
  } else if (index == 5) {
    filters.minAge = 40;
    filters.maxAge = 99;
  }
  loadData(true);
};

const resetFilters = () => {
  filters.city = '';
  filters.minAge = '';
  filters.maxAge = '';
  selectedAgeRange.value = '';
  loadData(true);
};

const goToDetail = (item) => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  const params = new URLSearchParams({
    id: item.id,
    name: item.name || '',
    age: String(item.age || ''),
    city: item.city || '',
    job: item.job || '',
    bio: item.bio || '',
    photo: item.photo || item.avatar || '',
    vip: item.vip ? '1' : '0'
  });
  uni.navigateTo({ url: `/pages/detail/index?${params.toString()}` });
};

onShow(() => {
  if (list.value.length === 0) {
    loadData(true);
  }
});

onPullDownRefresh(() => {
  loadData(true);
});

onReachBottom(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.discover-container {
  min-height: 100vh;
}

.filter-bar {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  background: $color-panel;
  position: sticky;
  top: 0;
  z-index: 10;
  gap: $spacing-sm;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);

  .filter-input {
    flex: 1;
    min-width: 0;
    height: 64rpx;
    background: $color-bg;
    border-radius: $radius-round;
    padding: 0 $spacing-md;
    font-size: $font-sm;
  }

  .filter-picker {
    box-sizing: border-box;
    flex: 0 0 auto;
    height: 64rpx;
    background: $color-bg;
    border-radius: $radius-round;
    padding: 0 $spacing-md;
    display: flex;
    align-items: center;
    font-size: $font-sm;
    color: $color-ink;

    .picker-value {
      width: auto;
      height: 64rpx;
      padding: 0;
      background: transparent;
      border: none;
      white-space: nowrap;
    }
  }

  .btn-reset {
    flex: 0 0 auto;
    font-size: $font-sm;
    color: $color-muted;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    &::after {
      display: none;
    }
  }
}

.list-container {
  padding: $spacing-md;
  
  .user-card {
    display: flex;
    background: $color-panel;
    border-radius: $radius-md;
    padding: $spacing-md;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-card;
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      background: $color-bg;
      margin-right: $spacing-md;
      flex-shrink: 0;
    }
    
    .info {
      flex: 1;
      overflow: hidden;
      
      .header {
        display: flex;
        align-items: center;
        margin-bottom: $spacing-xs;
        
        .name {
          font-size: $font-lg;
          font-weight: bold;
          margin-right: $spacing-sm;
          color: $color-ink;
        }
      }
      
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-xs;
        margin-bottom: $spacing-sm;
        
        .tag {
          font-size: $font-xs;
          color: $color-muted;
          background: $color-bg;
          padding: 4rpx 12rpx;
          border-radius: $radius-sm;
        }
      }
      
      .bio {
        font-size: $font-sm;
        color: $color-muted;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
  }
}
</style>
