import { defineStore } from 'pinia';
import { msalInstance, loginRequest } from '../auth/msalConfig';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    accessToken: null as string | null,
    account: null as any,
    initializationError: null as string | null
  }),

  actions: {
    async initialize() {
      console.log('Auth Store: 開始初始化')
      this.initializationError = null
      
      try {
        // 檢查 MSAL 實例
        if (!msalInstance) {
          throw new Error('MSAL 實例未正確載入，請重新整理頁面')
        }

        // 檢查是否有現有的登入狀態
        const accounts = msalInstance.getAllAccounts()
        console.log('Auth Store: 現有帳戶', accounts)

        if (accounts.length > 0) {
          this.account = accounts[0]
          console.log('Auth Store: 找到現有帳戶', this.account.username)

          try {
            // 嘗試獲取新的 token
            const tokenResponse = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account: this.account
            })
            
            console.log('Auth Store: Token 獲取成功')
            this.accessToken = tokenResponse.accessToken
            this.isAuthenticated = true
          } catch (tokenError) {
            console.error('Auth Store: Token 獲取失敗', tokenError)
            throw new Error(`Token 獲取失敗: ${tokenError.message}`)
          }
        } else {
          console.log('Auth Store: 沒有找到現有帳戶')
          this.isAuthenticated = false
        }
      } catch (error) {
        console.error('Auth Store: 初始化失敗', error)
        this.initializationError = error.message
        this.isAuthenticated = false
        throw error
      }
    },

    async login() {
      console.log('Auth Store: 開始登入流程')
      try {
        const loginResponse = await msalInstance.loginPopup(loginRequest)
        this.account = loginResponse.account
        console.log('Auth Store: 登入成功', this.account)

        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: this.account
        })
        
        this.accessToken = tokenResponse.accessToken
        this.isAuthenticated = true
        console.log('Auth Store: Token 獲取成功')
      } catch (error) {
        console.error('Auth Store: 登入失敗', error)
        alert(`登入失敗！\n${error.message}`)
        throw error
      }
    },

    async logout() {
      console.log('Auth Store: 開始登出')
      try {
        await msalInstance.logout()
        this.isAuthenticated = false
        this.accessToken = null
        this.account = null
        console.log('Auth Store: 登出成功')
      } catch (error) {
        console.error('Auth Store: 登出失敗', error)
        alert(`登出失敗！\n${error.message}`)
        throw error
      }
    }
  }
}); 