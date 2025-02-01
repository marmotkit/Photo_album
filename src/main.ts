import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

// 創建應用實例
const app = createApp(App)
const pinia = createPinia()

// 掛載 pinia
app.use(pinia)

// 掛載 router
app.use(router)

// 掛載應用
app.mount('#app')

// 初始化 auth store
const authStore = useAuthStore()
authStore.initialize().catch(error => {
  console.error('Auth 初始化失敗:', error)
}) 