import { createApp as _createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { msalInstance } from './auth/msalConfig'

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
const app = _createApp(App)
const pinia = createPinia()

// 掛載 pinia
app.use(pinia)

// 掛載 router
app.use(router)

// 初始化 MSAL
msalInstance.initialize().then(() => {
  console.log('MSAL 初始化完成')
  
  // 初始化 auth store
  const authStore = useAuthStore()
  
  // 掛載應用
  app.mount('#app')
}).catch(error => {
  console.error('MSAL 初始化失敗:', error)
  alert(`MSAL 初始化失敗！\n${error.message}`)
  
  // 即使失敗也掛載應用，讓用戶可以看到錯誤信息
  app.mount('#app')
}) 