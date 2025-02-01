import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 使用立即執行的異步函數
(async () => {
  const authStore = useAuthStore()
  await authStore.initialize()
  app.mount('#app')
})() 