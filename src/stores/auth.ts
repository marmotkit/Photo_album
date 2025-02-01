import { defineStore } from 'pinia';
import { msalInstance, loginRequest } from '../auth/msalConfig';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    accessToken: null as string | null,
    account: null as any
  }),

  actions: {
    async initialize() {
      console.log('開始初始化 Auth Store')
      try {
        // 檢查是否有現有的登入狀態
        const account = this.msalInstance.getAllAccounts()[0]
        if (account) {
          console.log('找到現有帳戶:', account.username)
          this.account = account
          // 嘗試獲取新的 token
          await this.getAccessToken()
          console.log('成功獲取 token')
          this.isAuthenticated = true
        } else {
          console.log('沒有找到現有帳戶')
          this.isAuthenticated = false
        }
      } catch (error) {
        console.error('初始化失敗:', error)
        this.isAuthenticated = false
        throw error
      }
    },

    async login() {
      try {
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        this.account = loginResponse.account;
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: this.account
        });
        this.accessToken = tokenResponse.accessToken;
        this.isAuthenticated = true;
        console.log('Login successful');
        console.log('Account info:', this.account);
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async logout() {
      await msalInstance.logout();
      this.isAuthenticated = false;
      this.accessToken = null;
      this.account = null;
    }
  }
}); 