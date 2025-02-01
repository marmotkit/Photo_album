<template>
  <div class="home">
    <header>
      <h1>我的相簿</h1>
      <button v-if="!authStore.isAuthenticated" @click="login" class="login-btn">
        登入 Microsoft 帳號
      </button>
      <button v-else @click="authStore.logout" class="logout-btn">
        登出
      </button>
    </header>

    <main>
      <PhotoUploader v-if="authStore.isAuthenticated" />
      <div v-else class="login-prompt">
        請先登入以使用相簿功能
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import PhotoUploader from '../components/PhotoUploader.vue';

const authStore = useAuthStore();

const login = async () => {
  try {
    await authStore.login();
  } catch (error) {
    console.error('登入失敗:', error);
  }
};
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.login-prompt {
  text-align: center;
  padding: 40px;
  color: #666;
}

.login-btn, .logout-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-btn {
  background: #0078d4;
  color: white;
}

.logout-btn {
  background: #f0f0f0;
  color: #333;
}
</style> 