<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon :size="30"><Link /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalLinks || 0 }}</div>
              <div class="stat-label">总链接数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon :size="30"><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeLinks || 0 }}</div>
              <div class="stat-label">启用链接</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon :size="30"><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalViews || 0 }}</div>
              <div class="stat-label">总访问量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon :size="30"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayViews || 0 }}</div>
              <div class="stat-label">今日访问</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>访问趋势</span>
              <el-radio-group v-model="trendPeriod" size="small" @change="loadStats">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div v-loading="loading" style="height: 300px;">
            <div v-if="!loading && chartData.length === 0" class="empty-chart">
              暂无数据
            </div>
            <v-chart v-else :option="chartOption" style="height: 100%;" />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <span>热门链接 TOP 5</span>
          </template>
          <div v-loading="loading" style="min-height: 300px;">
            <el-empty v-if="!loading && topLinks.length === 0" description="暂无数据" />
            <div v-else class="top-links">
              <div v-for="(link, index) in topLinks" :key="link.id" class="top-link-item">
                <div class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
                <div class="link-info">
                  <div class="link-name">{{ link.name }}</div>
                  <div class="link-code">{{ link.shortCode }}</div>
                </div>
                <div class="link-views">{{ link.views }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" :icon="Plus" @click="$router.push('/links')">
              创建链接
            </el-button>
            <el-button type="success" :icon="Download" @click="$router.push('/backup')">
              数据备份
            </el-button>
            <el-button type="info" :icon="TrendCharts" @click="$router.push('/stats')">
              查看统计
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, Select, View, TrendCharts, Plus, Download } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { api } from '@/api'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const loading = ref(false)
const trendPeriod = ref('7d')
const stats = ref({
  totalLinks: 0,
  activeLinks: 0,
  totalViews: 0,
  todayViews: 0
})
const chartData = ref([])
const topLinks = ref([])

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: chartData.value.map(item => item.date)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '访问量',
      type: 'line',
      smooth: true,
      data: chartData.value.map(item => item.views),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#409EFF'
      }
    }
  ]
}))

const loadStats = async () => {
  loading.value = true
  try {
    const response = await api.stats.getOverview()
    if (response.success) {
      stats.value = response.data
      
      // 模拟图表数据（实际应该从后端获取）
      const days = trendPeriod.value === '7d' ? 7 : 30
      chartData.value = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          views: Math.floor(Math.random() * 100)
        }
      })
      
      // 模拟热门链接（实际应该从后端获取）
      topLinks.value = [
        { id: 1, name: '客服微信', shortCode: 'wx001', views: 1234 },
        { id: 2, name: '推广活动', shortCode: 'promo01', views: 987 },
        { id: 3, name: '社群入口', shortCode: 'group01', views: 756 },
        { id: 4, name: '产品介绍', shortCode: 'product', views: 543 },
        { id: 5, name: '联系我们', shortCode: 'contact', views: 321 }
      ]
    }
  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-chart {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.top-links {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.top-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: all 0.3s;
}

.top-link-item:hover {
  background: #e8edf3;
  transform: translateX(5px);
}

.rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  background: #909399;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.rank-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.rank-3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-code {
  font-size: 12px;
  color: #909399;
}

.link-views {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
  flex-shrink: 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 24px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .quick-actions .el-button {
    width: 100%;
  }
}
</style>