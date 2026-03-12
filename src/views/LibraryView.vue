<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'
import type { ApiResponse, MediaItem } from '../types/api'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const items = ref<MediaItem[]>([])
const page = ref(1)
const size = ref(20)
const error = ref('')

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get<ApiResponse<{ records: MediaItem[] }>>('/api/media', {
      params: { page: page.value, size: size.value },
    })
    if (res.data.code !== 0) throw new Error(res.data.message)
    items.value = res.data.data.records || []
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const logout = () => {
  auth.clear()
  router.push('/login')
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <header class="topbar">
      <h2>媒体库</h2>
      <div class="actions">
        <button @click="loadData">刷新</button>
        <button class="danger" @click="logout">退出</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <div class="grid">
      <div v-for="m in items" :key="m.id" class="card media" @click="router.push(`/media/${m.id}`)">
        <h4>{{ m.title }}</h4>
        <p>ID: {{ m.id }}</p>
        <p>{{ m.width || '-' }} x {{ m.height || '-' }}</p>
        <p>{{ m.codec || '-' }}</p>
      </div>
    </div>
  </div>
</template>
