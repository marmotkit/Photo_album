<template>
  <div id="app">
    <router-view v-if="initialized"></router-view>
    <div v-else class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      載入中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const initialized = ref(false)
const authStore = useAuthStore()

onMounted(async () => {
  try {
    await authStore.initialize()
    initialized.value = true
  } catch (error) {
    console.error('初始化失敗:', error)
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