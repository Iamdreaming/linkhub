<template>
  <div class="navbar">
    <div class="left-menu">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="breadcrumbTitle">{{ breadcrumbTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="right-menu">
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          <el-icon><User /></el-icon>
          <span class="username">管理员</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const breadcrumbTitle = computed(() => {
  const titleMap = {
    '/dashboard': '数据概览',
    '/links': '链接管理',
    '/stats': '统计分析',
    '/backup': '备份管理'
  }
  return titleMap[route.path] || ''
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await authStore.logout()
      ElMessage.success('退出成功')
      router.push('/login')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('退出登录失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.navbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.left-menu {
  flex: 1;
}

.right-menu {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.el-dropdown-link:hover {
  color: #409EFF;
}

.username {
  margin: 0 5px;
}

:deep(.el-breadcrumb__inner) {
  color: #606266;
  font-weight: normal;
}

:deep(.el-breadcrumb__inner.is-link) {
  color: #409EFF;
  font-weight: normal;
}

:deep(.el-breadcrumb__inner.is-link:hover) {
  color: #66b1ff;
}
</style>