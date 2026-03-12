<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'
import type { ApiResponse } from '../types/api'

const router = useRouter()
const auth = useAuthStore()
const username = ref('admin')
const password = ref('password')
const loading = ref(false)
const error = ref('')

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await http.post<ApiResponse<{ accessToken: string }>>('/api/auth/login', {
      username: username.value,
      password: password.value,
    })
    if (res.data.code !== 0) throw new Error(res.data.message)
    auth.setToken(res.data.data.accessToken)
    router.push('/library')
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page center">
    <div class="card login-card">
      <h2>Emby MVP 登录</h2>
      <input v-model="username" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" @keyup.enter="login" />
      <button :disabled="loading" @click="login">{{ loading ? '登录中...' : '登录' }}</button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>
