import { createRouter, createWebHistory } from 'vue-router'
import PhotoUploader from '../components/PhotoUploader.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PhotoUploader
    }
  ]
})

export default router 