import { defineStore } from 'pinia'
import { api } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    /**
     * 登录
     */
    async login(password) {
      try {
        const response = await api.auth.login(password)
        
        if (response.success) {
          this.token = response.data.token
          localStorage.setItem('token', response.data.token)
          return response
        } else {
          throw new Error(response.error?.message || '登录失败')
        }
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    /**
     * 验证 Token
     */
    async verify() {
      try {
        const response = await api.auth.verify()
        
        if (response.success) {
          this.user = response.data.user
          return true
        } else {
          this.logout()
          return false
        }
      } catch (error) {
        console.error('Token 验证失败:', error)
        this.logout()
        return false
      }
    },

    /**
     * 登出
     */
    async logout() {
      try {
        await api.auth.logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.token = ''
        this.user = null
        localStorage.removeItem('token')
      }
    }
  }
})