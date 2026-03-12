import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('accessToken') || '',
    user: null as null | { id: number; username: string; role: string },
  }),
  getters: {
    isLogin: (s) => !!s.token,
  },
  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('accessToken', token)
    },
    clear() {
      this.token = ''
      this.user = null
      localStorage.removeItem('accessToken')
    },
  },
})
