import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'DataAnalysis' }
      }
    ]
  },
  {
    path: '/links',
    component: Layout,
    redirect: '/links/index',
    children: [
      {
        path: 'index',
        name: 'Links',
        component: () => import('@/views/links/index.vue'),
        meta: { title: '链接管理', icon: 'Link' }
      }
    ]
  },
  {
    path: '/stats',
    component: Layout,
    redirect: '/stats/index',
    children: [
      {
        path: 'index',
        name: 'Stats',
        component: () => import('@/views/stats/index.vue'),
        meta: { title: '统计分析', icon: 'TrendCharts' }
      }
    ]
  },
  {
    path: '/backup',
    component: Layout,
    redirect: '/backup/index',
    children: [
      {
        path: 'index',
        name: 'Backup',
        component: () => import('@/views/backup/index.vue'),
        meta: { title: '备份管理', icon: 'FolderOpened' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - LinkHub` : 'LinkHub'
  
  if (to.path === '/login') {
    // 如果已登录，跳转到首页
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    // 需要登录的页面
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router