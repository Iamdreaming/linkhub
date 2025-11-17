<template>
  <div class="stats-container">
    <!-- 链接选择器 -->
    <el-card class="selector-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="16">
          <el-select
            v-model="selectedLinkId"
            placeholder="选择要查看的链接"
            filterable
            style="width: 100%"
            @change="loadStats"
          >
            <el-option
              v-for="link in links"
              :key="link.id"
              :label="`${link.name} (${link.shortCode})`"
              :value="link.id"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-radio-group v-model="period" @change="loadStats">
            <el-radio-button label="7d">近7天</el-radio-button>
            <el-radio-button label="30d">近30天</el-radio-button>
            <el-radio-button label="90d">近90天</el-radio-button>
          </el-radio-group>
        </el-col>
      </el-row>
    </el-card>

    <div v-if="selectedLinkId">
      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #409EFF;">
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
              <div class="stat-icon" style="background: #67C23A;">
                <el-icon :size="30"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.todayViews || 0 }}</div>
                <div class="stat-label">今日访问</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #E6A23C;">
                <el-icon :size="30"><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.uniqueVisitors || 0 }}</div>
                <div class="stat-label">独立访客</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :lg="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: #F56C6C;">
                <el-icon :size="30"><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.avgDailyViews || 0 }}</div>
                <div class="stat-label">日均访问</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 访问趋势图表 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>访问趋势</span>
                <el-button
                  type="primary"
                  size="small"
                  :icon="Download"
                  @click="exportStats"
                >
                  导出数据
                </el-button>
              </div>
            </template>
            <div v-loading="loading" style="height: 400px;">
              <div v-if="!loading && trendData.length === 0" class="empty-chart">
                暂无数据
              </div>
              <v-chart v-else :option="trendChartOption" style="height: 100%;" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 访问时段分布 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <span>访问时段分布</span>
            </template>
            <div v-loading="loading" style="height: 300px;">
              <v-chart v-if="!loading" :option="hourChartOption" style="height: 100%;" />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <span>最近访问记录</span>
            </template>
            <div v-loading="loading" style="max-height: 300px; overflow-y: auto;">
              <el-empty v-if="!loading && accessLogs.length === 0" description="暂无访问记录" />
              <el-timeline v-else>
                <el-timeline-item
                  v-for="log in accessLogs"
                  :key="log.id"
                  :timestamp="formatDate(log.accessedAt)"
                  placement="top"
                >
                  <div class="log-item">
                    <div class="log-ip">IP: {{ log.ip }}</div>
                    <div class="log-ua">{{ log.userAgent || '未知设备' }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty
      v-else
      description="请选择一个链接查看统计数据"
      :image-size="200"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View, TrendCharts, User, Clock, Download } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { api } from '@/api'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const loading = ref(false)
const links = ref([])
const selectedLinkId = ref(null)
const period = ref('7d')
const stats = reactive({
  totalViews: 0,
  todayViews: 0,
  uniqueVisitors: 0,
  avgDailyViews: 0
})
const trendData = ref([])
const hourData = ref([])
const accessLogs = ref([])

// 趋势图表配置
const trendChartOption = computed(() => ({
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
    data: trendData.value.map(item => item.date)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '访问量',
      type: 'line',
      smooth: true,
      data: trendData.value.map(item => item.views),
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

// 时段分布图表配置
const hourChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: hourData.value.map(item => `${item.hour}:00`)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '访问量',
      type: 'bar',
      data: hourData.value.map(item => item.views),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#66b1ff' }
          ]
        }
      }
    }
  ]
}))

// 加载链接列表
const loadLinks = async () => {
  try {
    const response = await api.links.getList({ limit: 1000 })
    if (response.success) {
      // 后端返回的数据结构：{ links: [], pagination: {...} }
      links.value = response.data.links || []
      if (links.value.length > 0 && !selectedLinkId.value) {
        selectedLinkId.value = links.value[0].id
        loadStats()
      }
    }
  } catch (error) {
    ElMessage.error('加载链接列表失败')
    console.error(error)
  }
}

// 加载统计数据
const loadStats = async () => {
  if (!selectedLinkId.value) return
  
  loading.value = true
  try {
    // 加载统计概览
    const statsResponse = await api.stats.getLinkStats(selectedLinkId.value, period.value)
    if (statsResponse.success) {
      Object.assign(stats, statsResponse.data)
    }

    // 加载趋势数据
    const trendResponse = await api.stats.getTrend(selectedLinkId.value, period.value)
    if (trendResponse.success) {
      trendData.value = trendResponse.data.trend || []
      hourData.value = trendResponse.data.hourly || []
    }

    // 加载访问日志
    const logsResponse = await api.stats.getAccessLogs(selectedLinkId.value, { limit: 10 })
    if (logsResponse.success) {
      accessLogs.value = logsResponse.data.items || []
    }
  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 导出统计数据
const exportStats = async () => {
  if (!selectedLinkId.value) return
  
  try {
    const blob = await api.stats.export(selectedLinkId.value, period.value)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stats-${selectedLinkId.value}-${period.value}.csv`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadLinks()
})
</script>

<style scoped>
.stats-container {
  padding: 0;
}

.selector-card {
  margin-bottom: 20px;
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

.log-item {
  font-size: 13px;
}

.log-ip {
  color: #303133;
  margin-bottom: 4px;
}

.log-ua {
  color: #909399;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 24px;
  }
}
</style>