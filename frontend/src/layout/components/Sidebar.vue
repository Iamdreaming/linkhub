<template>
  <div class="sidebar">
    <div class="logo-container">
      <h1 class="logo-title">
        <el-icon><Link /></el-icon>
        LinkHub
      </h1>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard" @click="handleMenuClick('/dashboard')">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>

        <el-menu-item index="/links" @click="handleMenuClick('/links')">
          <el-icon><Link /></el-icon>
          <template #title>链接管理</template>
        </el-menu-item>

        <el-menu-item index="/stats" @click="handleMenuClick('/stats')">
          <el-icon><TrendCharts /></el-icon>
          <template #title>统计分析</template>
        </el-menu-item>

        <el-menu-item index="/backup" @click="handleMenuClick('/backup')">
          <el-icon><FolderOpened /></el-icon>
          <template #title>备份管理</template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Link, DataAnalysis, TrendCharts, FolderOpened } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  const { path } = route
  return path
})

const handleMenuClick = (path) => {
  router.push(path)
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  border-bottom: 1px solid #1f2d3d;
}

.logo-title {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-menu {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #263445 !important;
}

:deep(.el-menu-item:hover) {
  background-color: #263445 !important;
}
</style>