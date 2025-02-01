import { createApp } from 'vue/dist/vue.esm-bundler.js'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

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

// 初始化 auth store
const authStore = useAuthStore()

console.log('開始初始化 Auth Store...')

// 等待初始化完成後再掛載應用
authStore.initialize()
  .then(() => {
    console.log('Auth 初始化完成，開始掛載應用')
    app.mount('#app')
    console.log('應用掛載完成')
  })
  .catch(error => {
    console.error('Auth 初始化失敗:', error)
    alert(`Auth 初始化失敗！\n${error.message}`)
    // 即使失敗也掛載應用，讓用戶可以看到錯誤信息
    app.mount('#app')
  }) 