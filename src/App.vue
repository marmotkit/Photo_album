<template>
  <div id="app">
    <div v-if="!isInitialized" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      載入中...
    </div>
    <router-view v-else></router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const isInitialized = ref(false)
const authStore = useAuthStore()

onMounted(() => {
  // 直接監聽登入狀態變化
  authStore.$subscribe((mutation, state) => {
    console.log('Auth 狀態變更:', state.isAuthenticated)
    isInitialized.value = true
  })
  
  // 如果已經登入，直接設置初始化完成
  if (authStore.isAuthenticated) {
    console.log('已經登入')
    isInitialized.value = true
  }
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2em;
  gap: 10px;
}

.loading i {
  color: #0078d4;
}
</style> 