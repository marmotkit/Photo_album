import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'OneDrive 相簿',
        short_name: '相簿',
        theme_color: '#4CAF50',
        icons: [],
        display: 'standalone',
        background_color: '#ffffff'
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
}); 