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
const scanLoading = ref(false)
const scanMsg = ref('')

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

const scanLibrary = async () => {
  scanLoading.value = true
  scanMsg.value = ''
  try {
    const res = await http.post<ApiResponse<{ totalFiles: number; successCount: number; failCount: number }>>('/api/library/scan')
    if (res.data.code !== 0) throw new Error(res.data.message)
    const d = res.data.data
    scanMsg.value = `扫描完成：总 ${d.totalFiles}，成功 ${d.successCount}，失败 ${d.failCount}`
    await loadData()
  } catch (e: any) {
    scanMsg.value = e?.response?.data?.message || e.message || '扫描失败'
  } finally {
    scanLoading.value = false
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
        <button :disabled="scanLoading" @click="scanLibrary">{{ scanLoading ? '扫描中...' : '扫描媒体库' }}</button>
        <button @click="loadData">刷新</button>
        <button class="danger" @click="logout">退出</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="scanMsg" :class="scanMsg.includes('失败') ? 'error' : ''">{{ scanMsg }}</p>
    <p v-if="loading">加载中...</p>

    <div class="grid">
      <div v-for="m in items" :key="m.id" class="card media" @click="router.push(`/media/${m.id}`)">
        <div class="cover">
          <img v-if="m.posterUrl" :src="`${m.posterUrl}?access_token=${encodeURIComponent(auth.token)}`" :alt="m.title" />
          <span v-else>{{ (m.title || '?').slice(0, 1).toUpperCase() }}</span>
        </div>
        <h4>{{ m.title }}</h4>
        <p>ID: {{ m.id }}</p>
        <p>{{ m.width || '-' }} x {{ m.height || '-' }}</p>
        <p>{{ m.codec || '-' }}</p>
      </div>
    </div>
  </div>
</template>
