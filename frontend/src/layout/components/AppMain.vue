<template>
  <div class="app-main">
    <el-scrollbar>
      <div class="app-main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
// 主内容区域组件
</script>

<style scoped>
.app-main {
  flex: 1;
  overflow: hidden;
  background-color: #f0f2f5;
}

.app-main-content {
  padding: 20px;
  min-height: calc(100vh - 60px);
}

/* 路由切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>