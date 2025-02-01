import * as Vue from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = Vue.createApp(App)
const pinia = createPinia()

// 先掛載 pinia
app.use(pinia)

// 再掛載 router
app.use(router)

// 使用立即執行的異步函數
;(async () => {
  try {
    const authStore = useAuthStore()
    await authStore.initialize()
    app.mount('#app')
  } catch (error) {
    console.error('初始化失敗:', error)
  }
})() 