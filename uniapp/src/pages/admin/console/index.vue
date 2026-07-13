<template>
  <view class="console-container">
    <!-- 顶部工具栏 -->
    <view class="toolbar">
      <text class="toolbar-title">管理平台</text>
      <view class="toolbar-actions">
        <button class="btn-simulate" @click="simulateDeal">模拟成交</button>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </view>
    </view>

    <!-- 菜单 -->
    <scroll-view class="menu-bar" scroll-x>
      <view v-for="item in menuList" :key="item.key" class="menu-item" :class="{ active: currentSection === item.key }" @click="currentSection = item.key">
        {{ item.label }}
      </view>
    </scroll-view>

    <!-- 概览 -->
    <view v-if="currentSection === 'overview'" class="panel">
      <view class="metrics-grid">
        <view class="metric-card">
          <text class="metric-label">客户数量</text>
          <text class="metric-value">{{ appStore.users.length }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">VIP 数量</text>
          <text class="metric-value">{{ vipCount }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">成交数量</text>
          <text class="metric-value">{{ appStore.deals.length }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">总金额</text>
          <text class="metric-value">¥{{ totalAmount }}</text>
        </view>
      </view>
      <view class="section-title">业务趋势</view>
      <view class="chart-panel">
        <view v-for="row in chartRows" :key="row.label" class="bar-row">
          <text class="bar-label">{{ row.label }}</text>
          <view class="bar-track"><view class="bar-fill" :style="{ width: row.width + '%' }"></view></view>
          <text class="bar-value">{{ row.display }}</text>
        </view>
      </view>
    </view>

    <!-- 分成比例 -->
    <view v-if="currentSection === 'splits'" class="panel">
      <view class="section-title">分成比例设置</view>
      <view class="form-group">
        <text class="form-label">介绍推广费 (%)</text>
        <input class="form-input" v-model.number="splitForm.promo" type="number" placeholder="0-100" />
      </view>
      <view class="form-group">
        <text class="form-label">红娘牵线费 (%)</text>
        <input class="form-input" v-model.number="splitForm.matchmaker" type="number" placeholder="0-100" />
      </view>
      <view class="form-group">
        <text class="form-label">平台服务费 (%)</text>
        <input class="form-input" v-model.number="splitForm.platform" type="number" placeholder="0-100" />
      </view>
      <view class="split-total" :class="{ error: splitTotal !== 100 }">当前合计：{{ splitTotal }}%</view>
      <button class="btn-primary" @click="saveSplits">保存分成比例</button>
      <view class="split-preview">
        <view v-for="row in splitPreview" :key="row.label" class="split-row">
          <text>{{ row.label }}</text>
          <view class="bar-track"><view class="bar-fill" :style="{ width: row.value + '%', background: row.color }"></view></view>
          <text>{{ row.value }}%</text>
        </view>
      </view>
    </view>

    <!-- 机构管理 -->
    <view v-if="currentSection === 'agencies'" class="panel">
      <view class="section-title">添加机构</view>
      <view class="form-group">
        <text class="form-label">机构名称</text>
        <input class="form-input" v-model="agencyForm.name" placeholder="请输入机构名称" />
      </view>
      <view class="form-group">
        <text class="form-label">城市</text>
        <input class="form-input" v-model="agencyForm.city" placeholder="请输入城市" />
      </view>
      <button class="btn-primary" @click="addAgency">添加机构</button>
      <view class="section-title" style="margin-top: 32rpx;">机构列表（{{ appStore.agencies.length }} 家）</view>
      <view v-if="appStore.agencies.length === 0" class="empty-tip">暂无机构</view>
      <view v-for="agency in appStore.agencies" :key="agency.id" class="plain-item">
        <text class="item-title">{{ agency.name }}</text>
        <text class="item-sub">{{ agency.city }}</text>
      </view>
    </view>

    <!-- 红娘管理 -->
    <view v-if="currentSection === 'matchmakers'" class="panel">
      <view class="section-title">添加红娘</view>
      <view class="form-group">
        <text class="form-label">姓名</text>
        <input class="form-input" v-model="matchmakerForm.name" placeholder="请输入红娘姓名" />
      </view>
      <view class="form-group">
        <text class="form-label">所属机构</text>
        <picker mode="selector" :range="agencyOptions" :value="matchmakerAgencyIndex" @change="handleMatchmakerAgencyChange">
          <view class="picker-value">{{ agencyOptions[matchmakerAgencyIndex] || '请选择机构' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-label">推荐码</text>
        <input class="form-input" v-model="matchmakerForm.code" placeholder="如 HM-LILI" />
      </view>
      <button class="btn-primary" @click="addMatchmaker">添加红娘</button>
      <view class="section-title" style="margin-top: 32rpx;">红娘列表（{{ appStore.matchmakers.length }} 位）</view>
      <view v-if="appStore.matchmakers.length === 0" class="empty-tip">暂无红娘</view>
      <view v-for="mm in appStore.matchmakers" :key="mm.id" class="plain-item">
        <text class="item-title">{{ mm.name }}</text>
        <text class="item-sub">{{ getAgencyName(mm.agencyId) }} · {{ mm.code }}</text>
      </view>
    </view>

    <!-- 客户信息 -->
    <view v-if="currentSection === 'customers'" class="panel">
      <view class="section-title">客户信息（{{ appStore.users.length }} 位）</view>
      <view v-if="appStore.users.length === 0" class="empty-tip">暂无客户</view>
      <view v-for="user in appStore.users" :key="user.id" class="customer-card">
        <view class="customer-header">
          <text class="customer-name">{{ user.name }} · {{ user.gender }} · {{ user.age }}岁</text>
          <text class="customer-vip" :class="{ vip: user.vip }">{{ user.vip ? 'VIP' : '普通' }}</text>
        </view>
        <text class="customer-line">城市：{{ user.city || '-' }}</text>
        <text class="customer-line">红娘：{{ getMatchmakerName(user.matchmakerIds?.[0]) || '-' }}</text>
        <text class="customer-line">微信：{{ user.wechat || '-' }}</text>
        <text class="customer-line">联系方式：{{ user.phone || '-' }} / {{ user.email || '-' }}</text>
        <text class="customer-line">实名：{{ user.realNameVerified ? `已实名 (${user.realName})` : '未实名' }}</text>
      </view>
    </view>

    <!-- 兑换码 -->
    <view v-if="currentSection === 'promoCodes'" class="panel">
      <view class="section-title">兑换码管理</view>
      <button class="btn-primary" @click="generatePromoCode">随机生成兑换码</button>
      <view v-if="appStore.promoCodes.length === 0" class="empty-tip">暂无兑换码</view>
      <view v-for="code in appStore.promoCodes" :key="code.code" class="plain-item">
        <text class="item-title">{{ code.code }}</text>
        <text class="item-sub">{{ code.used ? '已使用' : '未使用' }} · {{ getMatchmakerName(code.matchmakerId) || '平台通用' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/appStore';
import {
  simulateDealApi,
  addAgencyApi,
  addMatchmakerApi,
  saveSplitsApi,
  generatePromoCodeApi
} from '@/api/admin';

const userStore = useUserStore();
const appStore = useAppStore();

const currentSection = ref('overview');
const menuList = [
  { key: 'overview', label: '概览' },
  { key: 'splits', label: '分成比例' },
  { key: 'agencies', label: '机构管理' },
  { key: 'matchmakers', label: '红娘管理' },
  { key: 'customers', label: '客户信息' },
  { key: 'promoCodes', label: '兑换码' }
];

const splitForm = reactive({
  promo: 20,
  matchmaker: 35,
  platform: 45
});

const agencyForm = reactive({
  name: '',
  city: ''
});

const matchmakerForm = reactive({
  name: '',
  agencyId: '',
  code: ''
});
const matchmakerAgencyIndex = ref(0);

onShow(() => {
  loadData();
});

onPullDownRefresh(() => {
  loadData();
});

const loadData = async () => {
  await appStore.fetchState();
  // 同步分成比例到表单
  if (appStore.splits) {
    splitForm.promo = appStore.splits.promo ?? 20;
    splitForm.matchmaker = appStore.splits.matchmaker ?? 35;
    splitForm.platform = appStore.splits.platform ?? 45;
  }
  uni.stopPullDownRefresh();
};

const vipCount = computed(() => appStore.users.filter((u) => u.vip).length);
const totalAmount = computed(() => appStore.deals.reduce((sum, d) => sum + Number(d.amount || 0), 0));

const chartRows = computed(() => {
  const max = Math.max(
    appStore.users.length,
    appStore.requests.length,
    appStore.deals.length,
    totalAmount.value / 100,
    1
  );
  return [
    { label: '客户', value: appStore.users.length, display: appStore.users.length, width: Math.max((appStore.users.length / max) * 100, 4) },
    { label: '牵线', value: appStore.requests.length, display: appStore.requests.length, width: Math.max((appStore.requests.length / max) * 100, 4) },
    { label: '成交', value: appStore.deals.length, display: appStore.deals.length, width: Math.max((appStore.deals.length / max) * 100, 4) },
    { label: '金额', value: totalAmount.value / 100, display: `¥${totalAmount.value}`, width: Math.max((totalAmount.value / 100 / max) * 100, 4) }
  ];
});

const splitTotal = computed(() => Number(splitForm.promo || 0) + Number(splitForm.matchmaker || 0) + Number(splitForm.platform || 0));

const splitPreview = computed(() => [
  { label: '介绍推广费', value: Number(splitForm.promo || 0), color: '#dc6b5c' },
  { label: '红娘牵线费', value: Number(splitForm.matchmaker || 0), color: '#0f766e' },
  { label: '平台服务费', value: Number(splitForm.platform || 0), color: '#3867d6' }
]);

const agencyOptions = computed(() => appStore.agencies.map((a) => `${a.name}（${a.city}）`));

const getAgencyName = (id) => appStore.getAgencyById(id)?.name;
const getMatchmakerName = (id) => appStore.getMatchmakerById(id)?.name;

const handleMatchmakerAgencyChange = (e) => {
  matchmakerAgencyIndex.value = e.detail.value;
  matchmakerForm.agencyId = appStore.agencies[matchmakerAgencyIndex.value]?.id || '';
};

const simulateDeal = async () => {
  try {
    await simulateDealApi();
    await appStore.fetchState();
    uni.showToast({ title: '已模拟新增一笔成交', icon: 'none' });
  } catch (error) {}
};

const saveSplits = async () => {
  if (splitTotal.value !== 100) {
    uni.showToast({ title: `当前合计为 ${splitTotal.value}%，请调整为 100%`, icon: 'none' });
    return;
  }
  try {
    await saveSplitsApi({
      promo: Number(splitForm.promo),
      matchmaker: Number(splitForm.matchmaker),
      platform: Number(splitForm.platform)
    });
    await appStore.fetchState();
    uni.showToast({ title: '分成比例已保存', icon: 'success' });
  } catch (error) {}
};

const addAgency = async () => {
  const { name, city } = agencyForm;
  if (!name || !city) {
    uni.showToast({ title: '请填写机构名称和城市', icon: 'none' });
    return;
  }
  try {
    await addAgencyApi({ name, city });
    agencyForm.name = '';
    agencyForm.city = '';
    await appStore.fetchState();
    uni.showToast({ title: '机构已添加', icon: 'success' });
  } catch (error) {}
};

const addMatchmaker = async () => {
  const { name, code } = matchmakerForm;
  if (!name || !code) {
    uni.showToast({ title: '请填写姓名和推荐码', icon: 'none' });
    return;
  }
  const agency = appStore.agencies[matchmakerAgencyIndex.value];
  try {
    await addMatchmakerApi({
      name,
      agencyId: agency?.id || null,
      code: code.toUpperCase()
    });
    matchmakerForm.name = '';
    matchmakerForm.code = '';
    await appStore.fetchState();
    uni.showToast({ title: '红娘已添加', icon: 'success' });
  } catch (error) {}
};

const generatePromoCode = async () => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomCode = '';
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const matchmakers = appStore.matchmakers;
    const matchmakerId = matchmakers.length > 0 && Math.random() > 0.3
      ? matchmakers[Math.floor(Math.random() * matchmakers.length)].id
      : null;
    await generatePromoCodeApi({ code: randomCode, matchmakerId });
    await appStore.fetchState();
    uni.showToast({ title: `已生成兑换码：${randomCode}`, icon: 'none' });
  } catch (error) {}
};

const handleLogout = () => {
  userStore.logout();
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.console-container {
  min-height: 100vh;
  background: $color-bg;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  background: linear-gradient(135deg, #3867d6, #6b8eef);
  color: #ffffff;

  .toolbar-title {
    font-size: $font-lg;
    font-weight: bold;
  }

  .toolbar-actions {
    display: flex;
    gap: $spacing-sm;

    button {
      height: 56rpx;
      line-height: 56rpx;
      padding: 0 22rpx;
      font-size: $font-sm;
      border-radius: $radius-round;
      margin: 0;
      border: none;
      color: #ffffff;

      &::after {
        display: none;
      }
    }

    .btn-simulate {
      background: rgba(255, 255, 255, 0.25);
    }

    .btn-logout {
      background: rgba(220, 107, 92, 0.9);
    }
  }
}

.menu-bar {
  white-space: nowrap;
  background: $color-panel;
  padding: 0 $spacing-md;
  border-bottom: 1rpx solid $color-line;

  .menu-item {
    display: inline-block;
    padding: $spacing-md $spacing-lg;
    font-size: $font-base;
    color: $color-muted;

    &.active {
      color: $color-blue;
      font-weight: 600;
      border-bottom: 4rpx solid $color-blue;
    }
  }
}

.panel {
  padding: $spacing-lg;
}

.section-title {
  font-size: $font-md;
  font-weight: bold;
  color: $color-ink;
  margin-bottom: $spacing-md;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .metric-card {
    background: $color-panel;
    border-radius: $radius-md;
    padding: $spacing-lg;
    box-shadow: $shadow-card;
    display: flex;
    flex-direction: column;

    .metric-label {
      font-size: $font-sm;
      color: $color-muted;
      margin-bottom: $spacing-xs;
    }

    .metric-value {
      font-size: $font-xl;
      font-weight: bold;
      color: $color-ink;
    }
  }
}

.chart-panel,
.split-preview {
  background: $color-panel;
  border-radius: $radius-md;
  padding: $spacing-lg;
  box-shadow: $shadow-card;

  .bar-row,
  .split-row {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-md;

    &:last-child {
      margin-bottom: 0;
    }

    text {
      font-size: $font-sm;
      color: $color-ink;
      width: 120rpx;
      flex-shrink: 0;

      &:last-child {
        width: 100rpx;
        text-align: right;
      }
    }

    .bar-track {
      flex: 1;
      height: 24rpx;
      background: $color-bg;
      border-radius: $radius-round;
      margin: 0 $spacing-sm;
      overflow: hidden;

      .bar-fill {
        height: 100%;
        background: $color-blue;
        border-radius: $radius-round;
        min-width: 4rpx;
      }
    }
  }
}

.split-total {
  font-size: $font-sm;
  color: $color-muted;
  margin-bottom: $spacing-md;

  &.error {
    color: $color-coral;
  }
}

.picker-value {
  width: 100%;
  height: 80rpx;
  padding: 0 $spacing-md;
  background: $color-paper;
  border: 2rpx solid $color-line;
  border-radius: $radius-md;
  font-size: $font-base;
  color: $color-ink;
  display: flex;
  align-items: center;
}

.plain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  background: $color-panel;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;
  box-shadow: $shadow-card;

  .item-title {
    font-size: $font-base;
    color: $color-ink;
    font-weight: 600;
  }

  .item-sub {
    font-size: $font-sm;
    color: $color-muted;
  }
}

.customer-card {
  background: $color-panel;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-card;

  .customer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;

    .customer-name {
      font-size: $font-base;
      font-weight: 600;
      color: $color-ink;
    }

    .customer-vip {
      font-size: $font-xs;
      color: $color-muted;
      background: $color-bg;
      padding: 4rpx 14rpx;
      border-radius: $radius-round;

      &.vip {
        color: $color-gold;
        background: $color-gold-bg;
      }
    }
  }

  .customer-line {
    display: block;
    font-size: $font-sm;
    color: $color-muted;
    margin-bottom: 4rpx;
  }
}

.empty-tip {
  text-align: center;
  padding: $spacing-lg 0;
  color: $color-muted;
  font-size: $font-sm;
}
</style>
