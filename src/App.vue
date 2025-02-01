<template>
  <div id="app">
    <div v-if="authStore.initializationError" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      初始化失敗：{{ authStore.initializationError }}
    </div>
    <div v-else-if="!authStore.isAuthenticated" class="login-container">
      <div class="login-box">
        <h1>KT的相簿</h1>
        <p>請登入以繼續使用</p>
        <button @click="login" class="login-button">
          <i class="fab fa-microsoft"></i>
          使用 Microsoft 帳戶登入
        </button>
      </div>
    </div>
    <router-view v-else></router-view>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

const login = async () => {
  try {
    await authStore.login()
  } catch (error) {
    console.error('登入失敗:', error)
  }
}
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

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.login-box h1 {
  color: #0078d4;
  margin-bottom: 20px;
  font-size: 2em;
}

.login-box p {
  color: #666;
  margin-bottom: 30px;
}

.login-button {
  background: #0078d4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: #006cbd;
  transform: translateY(-2px);
}

.login-button i {
  font-size: 1.2em;
}
</style> 