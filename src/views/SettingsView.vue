<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import http from '../api/http'
import type { ApiResponse, MediaItem } from '../types/api'

const router = useRouter()
const autoEnabled = ref(false)
const intervalMinutes = ref(60)
const missing = ref<MediaItem[]>([])
const loading = ref(false)

const loadAuto = async () => {
  const res = await http.get<ApiResponse<{ enabled: boolean; intervalMinutes: number }>>('/api/settings/posters/auto')
  if (res.data.code !== 0) throw new Error(res.data.message)
  autoEnabled.value = !!res.data.data.enabled
  intervalMinutes.value = Number(res.data.data.intervalMinutes || 60)
}

const loadMissing = async () => {
  loading.value = true
  try {
    const res = await http.get<ApiResponse<{ records: MediaItem[] }>>('/api/settings/posters/missing', { params: { page: 1, size: 100 } })
    if (res.data.code !== 0) throw new Error(res.data.message)
    missing.value = res.data.data.records || []
  } finally {
    loading.value = false
  }
}

const saveAuto = async () => {
  await http.post('/api/settings/posters/auto', {
    enabled: autoEnabled.value,
    intervalMinutes: intervalMinutes.value,
  })
  ElMessage.success('自动获取封面设置已保存')
}

const fetchMissing = async () => {
  const res = await http.post<ApiResponse<{ success: number }>>('/api/settings/posters/fetch-missing?limit=100')
  if (res.data.code !== 0) throw new Error(res.data.message)
  ElMessage.success(`已成功获取 ${res.data.data.success} 个封面`)
  await loadMissing()
}

onMounted(async () => {
  try {
    await loadAuto()
    await loadMissing()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || '加载失败')
  }
})
</script>

<template>
  <div class="page">
    <header class="topbar">
      <h2>设置</h2>
      <div class="actions">
        <button @click="router.push('/library')">返回媒体库</button>
      </div>
    </header>

    <div class="card" style="margin-bottom: 12px;">
      <h3>封面设置</h3>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <label><input type="checkbox" v-model="autoEnabled" /> 自动获取封面（定时任务）</label>
        <input type="number" min="1" v-model.number="intervalMinutes" style="width:120px" />
        <span>分钟/次</span>
        <button @click="saveAuto">保存设置</button>
        <button @click="fetchMissing">手动获取封面</button>
      </div>
    </div>

    <div class="card">
      <h3>未有封面的视频（{{ missing.length }}）</h3>
      <p v-if="loading">加载中...</p>
      <ul v-else>
        <li v-for="m in missing" :key="m.id">{{ m.title }}（{{ m.filePath }}）</li>
      </ul>
    </div>
  </div>
</template>
