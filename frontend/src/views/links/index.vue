<template>
  <div class="links-container">
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索链接名称或短链代码"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 100%"
            @change="loadLinks"
          >
            <el-option label="全部" value="" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" class="toolbar-buttons">
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            创建链接
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 链接列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="links"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="name" label="链接名称" min-width="150">
          <template #default="{ row }">
            <div class="link-name">
              <el-icon v-if="row.isActive" style="color: #67C23A"><Select /></el-icon>
              <el-icon v-else style="color: #909399"><Close /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="shortCode" label="短链代码" width="120">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.shortCode }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="targetUrl" label="目标链接" min-width="200" show-overflow-tooltip />

        <el-table-column prop="views" label="访问量" width="100" align="center">
          <template #default="{ row }">
            <el-text type="primary">{{ row.views || 0 }}</el-text>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="View"
              @click="handleViewQRCode(row)"
            >
              二维码
            </el-button>
            <el-button
              type="success"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
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

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLinks"
          @current-change="loadLinks"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="链接名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入链接名称" />
        </el-form-item>

        <el-form-item label="短链代码" prop="shortCode">
          <el-input
            v-model="form.shortCode"
            placeholder="请输入短链代码（如：wx001）"
            :disabled="isEdit"
          >
            <template #append>
              <el-button
                v-if="!isEdit"
                :icon="Refresh"
                @click="generateShortCode"
              >
                随机生成
              </el-button>
            </template>
          </el-input>
          <div class="form-tip">
            短链代码只能包含字母、数字、下划线和连字符
          </div>
        </el-form-item>

        <el-form-item label="目标链接" prop="targetUrl">
          <el-input
            v-model="form.targetUrl"
            type="textarea"
            :rows="3"
            placeholder="请输入微信链接"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入链接描述（可选）"
          />
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="form.isActive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确定' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 二维码对话框 -->
    <el-dialog
      v-model="qrcodeDialogVisible"
      title="二维码"
      width="400px"
    >
      <div class="qrcode-container">
        <div class="qrcode-info">
          <h3>{{ currentLink?.name }}</h3>
          <el-tag type="primary">{{ currentLink?.shortCode }}</el-tag>
        </div>
        <div v-loading="qrcodeLoading" class="qrcode-image">
          <img v-if="qrcodeUrl" :src="qrcodeUrl" alt="二维码" />
        </div>
        <div class="qrcode-actions">
          <el-button type="primary" :icon="Download" @click="downloadQRCode">
            下载二维码
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Delete, Edit, View, Select, Close, Refresh, Download
} from '@element-plus/icons-vue'
import { api } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const selectedIds = ref([])
const links = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = reactive({
  name: '',
  shortCode: '',
  targetUrl: '',
  description: '',
  isActive: true
})

const qrcodeDialogVisible = ref(false)
const qrcodeLoading = ref(false)
const qrcodeUrl = ref('')
const currentLink = ref(null)

const dialogTitle = computed(() => isEdit.value ? '编辑链接' : '创建链接')

const formRules = {
  name: [
    { required: true, message: '请输入链接名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  shortCode: [
    { required: true, message: '请输入短链代码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  targetUrl: [
    { required: true, message: '请输入目标链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ]
}

// 加载链接列表
const loadLinks = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      search: searchQuery.value,
      status: statusFilter.value
    }
    
    const response = await api.links.getList(params)
    if (response.success) {
      // 后端返回的数据结构：{ links: [], pagination: { total, page, limit, totalPages } }
      links.value = response.data.links || []
      pagination.total = response.data.pagination?.total || 0
      
      // 处理 views 字段（后端返回的是 accessCount）
      links.value = links.value.map(link => ({
        ...link,
        views: link.accessCount || 0
      }))
    }
  } catch (error) {
    ElMessage.error('加载链接列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadLinks()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 创建链接
const handleCreate = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑链接
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    shortCode: row.shortCode,
    targetUrl: row.targetUrl,
    description: row.description || '',
    isActive: row.isActive
  })
  dialogVisible.value = true
}

// 删除链接
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除链接"${row.name}"吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await api.links.delete(row.id)
    ElMessage.success('删除成功')
    loadLinks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个链接吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await api.links.batchOperation('delete', selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    loadLinks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await api.links.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await api.links.create(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadLinks()
      } catch (error) {
        ElMessage.error(error.response?.data?.error?.message || '操作失败')
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    name: '',
    shortCode: '',
    targetUrl: '',
    description: '',
    isActive: true
  })
}

// 生成随机短链代码
const generateShortCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.shortCode = code
}

// 查看二维码
const handleViewQRCode = async (row) => {
  currentLink.value = row
  qrcodeDialogVisible.value = true
  qrcodeLoading.value = true
  
  try {
    // 获取当前网站的baseUrl（协议 + 域名 + 端口）
    const baseUrl = window.location.origin
    
    const blob = await api.qrcode.get(row.id, {
      size: 300,
      baseUrl: baseUrl  // 传递当前网站地址
    })
    qrcodeUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    ElMessage.error('加载二维码失败')
    console.error(error)
  } finally {
    qrcodeLoading.value = false
  }
}

// 下载二维码
const downloadQRCode = () => {
  if (!qrcodeUrl.value) return
  
  const link = document.createElement('a')
  link.href = qrcodeUrl.value
  link.download = `${currentLink.value.shortCode}-qrcode.png`
  link.click()
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
    minute: '2-digit'
  })
}

onMounted(() => {
  loadLinks()
})
</script>

<style scoped>
.links-container {
  padding: 0;
}

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.table-card {
  min-height: 400px;
}

.link-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.qrcode-container {
  text-align: center;
}

.qrcode-info {
  margin-bottom: 20px;
}

.qrcode-info h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #303133;
}

.qrcode-image {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.qrcode-image img {
  max-width: 100%;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
}

.qrcode-actions {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .toolbar-buttons {
    margin-top: 10px;
    justify-content: flex-start;
  }
  
  .toolbar-buttons .el-button {
    flex: 1;
  }
}
</style>