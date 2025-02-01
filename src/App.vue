<template>
  <div id="app">
    <div v-if="authStore.initializationError" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      初始化失敗：{{ authStore.initializationError }}
    </div>
    <router-view v-else-if="authStore.isAuthenticated"></router-view>
    <div v-else class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      載入中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
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

.error-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #dc3545;
  font-size: 1.2em;
  gap: 10px;
  padding: 20px;
  text-align: center;
}
</style> 