import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/LoginView.vue') },
    {
      path: '/',
      component: () => import('../layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/library' },
        { path: 'library', component: () => import('../views/LibraryView.vue') },
        { path: 'settings', component: () => import('../views/SettingsView.vue') },
        { path: 'logs', component: () => import('../views/LogManagementView.vue') },
        { path: 'media-management', component: () => import('../views/MediaManagementView.vue') },
        { path: 'media/:id', component: () => import('../views/MediaPlayerView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/library' },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken')
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  if (requiresAuth && !token) return '/login'
  if (to.path === '/login' && token) return '/library'
})

export default router
