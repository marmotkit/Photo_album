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

// 初始化 auth store
const authStore = useAuthStore()

// 等待初始化完成後再掛載應用
authStore.initialize()
  .then(() => {
    console.log('Auth 初始化完成')
    app.mount('#app')
  })
  .catch(error => {
    console.error('Auth 初始化失敗:', error)
    // 即使失敗也掛載應用，讓用戶可以看到錯誤信息
    app.mount('#app')
  }) 