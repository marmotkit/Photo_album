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
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
        try {
          const tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: this.account
          });
          this.accessToken = tokenResponse.accessToken;
          this.isAuthenticated = true;
          console.log('Token acquired successfully');
          console.log('Account info:', this.account);
        } catch (error) {
          console.error('Token acquisition failed:', error);
          this.isAuthenticated = false;
          this.accessToken = null;
          this.account = null;
        }
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