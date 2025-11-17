<template>
  <div class="backup-container">
    <!-- 操作工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-alert
            title="备份说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>定期备份数据库可以防止数据丢失。建议每周至少备份一次。</p>
            </template>
          </el-alert>
        </el-col>
        <el-col :xs="24" :sm="12" class="toolbar-buttons">
          <el-button
            type="primary"
            :icon="Plus"
            :loading="creating"
            @click="handleCreateBackup"
          >
            {{ creating ? '创建中...' : '创建备份' }}
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            @click="handleCleanOldBackups"
          >
            清理过期备份
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 备份列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>备份列表</span>
          <el-tag type="info">共 {{ backups.length }} 个备份</el-tag>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="backups"
        style="width: 100%"
      >
        <el-table-column prop="filename" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="filename">
              <el-icon><Document /></el-icon>
              <span>{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="size" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="备份类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isAuto" type="success" size="small">自动</el-tag>
            <el-tag v-else type="primary" size="small">手动</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Download"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
            <el-button
              type="success"
              size="small"
              :icon="RefreshRight"
              @click="handleRestore(row)"
            >
              恢复
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && backups.length === 0"
        description="暂无备份文件"
      />
    </el-card>

    <!-- 备份配置 -->
    <el-card class="config-card">
      <template #header>
        <span>备份配置</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="自动备份">
          <el-tag type="success">已启用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备份周期">
          每天凌晨 3:00
        </el-descriptions-item>
        <el-descriptions-item label="保留天数">
          30 天
        </el-descriptions-item>
        <el-descriptions-item label="备份路径">
          /data/backups/
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Delete, Download, RefreshRight, Document
} from '@element-plus/icons-vue'
import { api } from '@/api'

const loading = ref(false)
const creating = ref(false)
const backups = ref([])

// 加载备份列表
const loadBackups = async () => {
  loading.value = true
  try {
    const response = await api.backup.getList()
    if (response.success) {
      backups.value = response.data.backups || []
    }
  } catch (error) {
    ElMessage.error('加载备份列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 创建备份
const handleCreateBackup = async () => {
  creating.value = true
  try {
    const response = await api.backup.create()
    if (response.success) {
      ElMessage.success('备份创建成功')
      loadBackups()
    }
  } catch (error) {
    ElMessage.error('创建备份失败')
    console.error(error)
  } finally {
    creating.value = false
  }
}

// 下载备份
const handleDownload = async (row) => {
  try {
    const blob = await api.backup.download(row.filename)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = row.filename
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
    console.error(error)
  }
}

// 恢复备份
const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份"${row.filename}"吗？当前数据将被覆盖，此操作不可撤销！`,
      '警告',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )
    
    // 二次确认
    await ElMessageBox.confirm(
      '请再次确认：恢复备份将覆盖当前所有数据！',
      '最终确认',
      {
        confirmButtonText: '我已知晓风险，确定恢复',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    const response = await api.backup.restore(row.filename)
    if (response.success) {
      ElMessage.success('备份恢复成功，建议刷新页面')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('恢复备份失败')
      console.error(error)
    }
  }
}

// 删除备份
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份"${row.filename}"吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await api.backup.delete(row.filename)
    if (response.success) {
      ElMessage.success('删除成功')
      loadBackups()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 清理过期备份
const handleCleanOldBackups = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清理超过30天的备份文件吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await api.backup.clean()
    if (response.success) {
      ElMessage.success(response.data.message || '清理完成')
      loadBackups()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理失败')
      console.error(error)
    }
  }
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadBackups()
})
</script>

<style scoped>
.backup-container {
  padding: 0;
}

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
}

.table-card {
  margin-bottom: 20px;
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filename {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-card {
  margin-bottom: 20px;
}

:deep(.el-alert__content) {
  padding: 0;
}

:deep(.el-alert__content p) {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .toolbar-buttons {
    margin-top: 10px;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .toolbar-buttons .el-button {
    flex: 1;
    min-width: 120px;
  }
}
</style>