import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/', redirect: '/library' },
    { path: '/library', component: () => import('../views/LibraryView.vue') },
    { path: '/settings', component: () => import('../views/SettingsView.vue') },
    { path: '/media/:id', component: () => import('../views/MediaPlayerView.vue') },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken')
  if (to.path !== '/login' && !token) return '/login'
  if (to.path === '/login' && token) return '/library'
})

export default router
