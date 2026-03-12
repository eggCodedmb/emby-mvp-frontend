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
const scanFolderPath = ref('')
const scanDepth = ref<number | null>(0)
const folderDialog = ref(false)
const folderCurrentPath = ref('')
const folderParentPath = ref('')
const folderList = ref<Array<{ name: string; path: string }>>([])

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

const loadFolders = async (path = '') => {
  const res = await http.get<ApiResponse<{ currentPath: string; parentPath: string; folders: Array<{ name: string; path: string }> }>>('/api/library/folders', {
    params: { path },
  })
  if (res.data.code !== 0) throw new Error(res.data.message)
  folderCurrentPath.value = res.data.data.currentPath || ''
  folderParentPath.value = res.data.data.parentPath || ''
  folderList.value = res.data.data.folders || []
}

const openFolderDialog = async () => {
  try {
    await loadFolders(scanFolderPath.value || '')
    folderDialog.value = true
  } catch (e: any) {
    scanMsg.value = e?.response?.data?.message || e.message || '读取目录失败'
  }
}

const chooseFolder = (path: string) => {
  scanFolderPath.value = path
  folderDialog.value = false
}

const scanLibrary = async () => {
  scanLoading.value = true
  scanMsg.value = ''
  try {
    const res = await http.post<ApiResponse<{ totalFiles: number; successCount: number; failCount: number }>>('/api/library/scan', {
      folderPath: scanFolderPath.value || null,
      depth: scanDepth.value ?? 0,
    })
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
        <input v-model="scanFolderPath" placeholder="扫描目录(可选，如 movies)" style="width: 260px" />
        <button @click="openFolderDialog">选择目录</button>
        <input v-model.number="scanDepth" type="number" min="0" placeholder="深度(0=不限)" style="width: 130px" />
        <button :disabled="scanLoading" @click="scanLibrary">{{ scanLoading ? '扫描中...' : '扫描媒体库' }}</button>
        <button @click="loadData">刷新</button>
        <button class="danger" @click="logout">退出</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="scanMsg" :class="scanMsg.includes('失败') ? 'error' : ''">{{ scanMsg }}</p>
    <p v-if="loading">加载中...</p>

    <div v-if="folderDialog" class="card" style="margin: 10px 0;">
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
        <strong>选择扫描目录：</strong>
        <code>{{ folderCurrentPath || '/' }}</code>
        <button @click="loadFolders(folderParentPath)" :disabled="!folderCurrentPath">上一级</button>
        <button @click="chooseFolder(folderCurrentPath)">选中当前目录</button>
        <button class="danger" @click="folderDialog=false">关闭</button>
      </div>
      <div style="display:grid; gap:6px; max-height:220px; overflow:auto;">
        <button v-for="f in folderList" :key="f.path" style="text-align:left" @click="loadFolders(f.path)">📁 {{ f.name }}</button>
      </div>
    </div>

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
