import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

// 創建應用實例
const app = createApp(App)

// 創建 pinia 實例
const pinia = createPinia()

// 按順序初始化
const init = async () => {
  try {
    // 1. 先掛載 pinia
    app.use(pinia)
    
    // 2. 初始化 auth store
    const authStore = useAuthStore()
    await authStore.initialize()
    
    // 3. 掛載 router
    app.use(router)
    
    // 4. 最後掛載應用
    app.mount('#app')
  } catch (error) {
    console.error('應用初始化失敗:', error)
  }
}

// 啟動應用
init() 