<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="24"><User /></el-icon>
          <span>个人中心</span>
        </div>
      </template>

      <div class="profile-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户角色">
            <el-tag type="success">管理员</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="登录时间">
            {{ loginTime }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div class="action-section">
          <h3>账户操作</h3>
          <el-button
            type="primary"
            :icon="Lock"
            @click="showResetDialog = true"
          >
            修改密码
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 密码重置对话框 -->
    <el-dialog
      v-model="showResetDialog"
      title="修改密码"
      width="450px"
      @close="resetResetForm"
    >
      <el-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-width="100px"
        @submit.prevent="handleResetPassword"
        @keyup.enter="handleResetPassword"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input
            v-model="resetForm.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            show-password
            autocomplete="off"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showResetDialog = false" :disabled="resetting">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="resetting"
          :disabled="resetting"
          @click="handleResetPassword"
        >
          {{ resetting ? '修改中...' : '确定' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 登录时间
const loginTime = computed(() => {
  const now = new Date()
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 密码重置相关
const showResetDialog = ref(false)
const resetFormRef = ref(null)
const resetting = ref(false)

const resetForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== resetForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const resetRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleResetPassword = async () => {
  if (!resetFormRef.value || resetting.value) return
  
  try {
    await resetFormRef.value.validate()
    resetting.value = true
    
    try {
      await api.auth.resetPassword(resetForm.oldPassword, resetForm.newPassword)
      ElMessage.success('密码修改成功')
      showResetDialog.value = false
      resetResetForm()
      
      // 提示用户需要重新登录
      try {
        await ElMessageBox.confirm(
          '密码已修改成功，需要重新登录。是否立即退出登录？',
          '提示',
          {
            confirmButtonText: '立即退出',
            cancelButtonText: '稍后退出',
            type: 'success'
          }
        )
        
        // 退出登录
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        // 用户选择稍后退出，不做任何操作
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.error?.message || '密码修改失败')
    } finally {
      resetting.value = false
    }
  } catch (error) {
    // 表单验证失败，不做任何操作
  }
}

const resetResetForm = () => {
  if (resetFormRef.value) {
    resetFormRef.value.resetFields()
  }
  Object.assign(resetForm, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
}
</script>

<style scoped>
.profile-container {
  padding: 0;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}

.profile-content {
  padding: 20px 0;
}

.action-section {
  margin-top: 20px;
}

.action-section h3 {
  margin: 0 0 15px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>