import { createApp } from '@vue/runtime-dom'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { initializeMsal } from './auth/msalConfig'

// 全局錯誤處理
window.onerror = function(msg, url, line, col, error) {
  alert(`發生錯誤！\n${msg}\n在 ${url} 第 ${line} 行`)
  console.error('全局錯誤:', { msg, url, line, col, error })
  return false
}

// 捕獲未處理的 Promise 錯誤
window.addEventListener('unhandledrejection', function(event) {
  alert(`Promise 錯誤！\n${event.reason}`)
  console.error('未處理的 Promise 錯誤:', event.reason)
})

console.log('開始創建應用...')

// 創建應用實例
const app = createApp(App)
const pinia = createPinia()

// 掛載 pinia
app.use(pinia)

// 掛載 router
app.use(router)

// 初始化 MSAL 和 auth store
async function initializeApp() {
  try {
    await initializeMsal()
    
    // 初始化 auth store
    const authStore = useAuthStore()
    console.log('開始初始化 Auth Store...')
    
    await authStore.initialize()
    console.log('Auth 初始化完成，開始掛載應用')
    
    app.mount('#app')
    console.log('應用掛載完成')
  } catch (error) {
    console.error('初始化失敗:', error)
    alert(`初始化失敗！\n${error.message}`)
    app.mount('#app')
  }
}

// 啟動應用
initializeApp() 