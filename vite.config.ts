import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Photo_album/' : '/',
  publicDir: 'public',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'KT的相簿',
        short_name: 'KT相簿',
        theme_color: '#0078d4',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/Photo_album/',
        start_url: '/Photo_album/',
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          // 可以添加更多尺寸的圖示
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
}); 