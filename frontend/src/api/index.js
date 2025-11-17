import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      // 处理不同的错误状态
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(data?.error?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// API 接口
export const api = {
  // 认证相关
  auth: {
    login: (password) => request.post('/auth/login', { password }),
    verify: () => request.get('/auth/verify'),
    logout: () => request.post('/auth/logout')
  },

  // 链接管理
  links: {
    getList: (params) => request.get('/links', { params }),
    getById: (id) => request.get(`/links/${id}`),
    create: (data) => request.post('/links', data),
    update: (id, data) => request.put(`/links/${id}`, data),
    delete: (id) => request.delete(`/links/${id}`),
    batchOperation: (action, ids) => request.post('/links/batch', { action, ids }),
    checkAvailability: (shortCode) => request.get(`/links/check/${shortCode}`)
  },

  // 二维码
  qrcode: {
    get: (id, params) => request.get(`/links/${id}/qrcode`, { 
      params,
      responseType: 'blob'
    }),
    batchDownload: (ids, options) => request.post('/qrcodes/batch', { ids, ...options }, {
      responseType: 'blob'
    })
  },

  // 统计
  stats: {
    getLinkStats: (id, period) => request.get(`/links/${id}/stats`, { params: { period } }),
    getOverview: () => request.get('/stats/overview'),
    getAccessLogs: (id, params) => request.get(`/links/${id}/logs`, { params }),
    getTrend: (id, period) => request.get(`/links/${id}/trend`, { params: { period } }),
    export: (id, period) => request.get(`/links/${id}/export`, { 
      params: { period },
      responseType: 'blob'
    }),
    cleanOldLogs: (days) => request.post('/stats/clean', { days })
  },

  // 备份
  backup: {
    create: () => request.post('/backup'),
    getList: () => request.get('/backups'),
    restore: (filename) => request.post('/backup/restore', { filename }),
    delete: (filename) => request.delete(`/backups/${filename}`),
    download: (filename) => request.get(`/backups/${filename}/download`, {
      responseType: 'blob'
    }),
    clean: () => request.post('/backups/clean')
  },

  // 系统
  system: {
    health: () => request.get('/health')
  }
}

export default request