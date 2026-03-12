<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
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
const scanDialog = ref(false)
const folderCurrentPath = ref('')
const folderParentPath = ref('')
const folderList = ref<Array<{ name: string; path: string }>>([])
const selectedFolderPath = ref('')

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

const openScanDialog = async () => {
  selectedFolderPath.value = ''
  try {
    await loadFolders('')
    scanDialog.value = true
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || '读取目录失败')
  }
}

const selectCurrentFolder = () => {
  selectedFolderPath.value = folderCurrentPath.value
}

const startScan = async () => {
  if (!selectedFolderPath.value) {
    ElMessage.warning('请先选择目录')
    return
  }
  scanLoading.value = true
  try {
    const res = await http.post<ApiResponse<{ successCount: number; failCount: number }>>('/api/library/scan', {
      folderPath: selectedFolderPath.value,
      depth: 0,
    })
    if (res.data.code !== 0) throw new Error(res.data.message)
    const d = res.data.data
    ElMessage.success(`成功（${d.successCount ?? 0}）/失败（${d.failCount ?? 0}）`)
    scanDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || '扫描失败')
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
        <button @click="openScanDialog">扫描媒体</button>
        <button title="设置" @click="router.push('/settings')">⚙️</button>
        <button class="danger" @click="logout">退出</button>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading">加载中...</p>

    <div v-if="scanDialog" class="modal-mask">
      <div class="modal-card">
        <h3>选择扫描目录</h3>
        <p class="muted">当前：{{ folderCurrentPath || '盘符列表' }}</p>
        <p class="muted">已选：{{ selectedFolderPath || '未选择' }}</p>

        <div class="modal-actions-top">
          <button @click="loadFolders(folderParentPath)" :disabled="!folderCurrentPath">上一级</button>
          <button @click="selectCurrentFolder">选中当前目录</button>
        </div>

        <div class="folder-list">
          <button v-for="f in folderList" :key="f.path" class="folder-item" @click="loadFolders(f.path)">
            📁 {{ f.name }}
          </button>
        </div>

        <div class="modal-footer">
          <button class="danger" @click="scanDialog = false">取消</button>
          <button :disabled="scanLoading" @click="startScan">{{ scanLoading ? '扫描中...' : '开始扫描' }}</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <div v-for="m in items" :key="m.id" class="card media" @click="router.push(`/media/${m.id}`)">
        <div class="cover">
          <img v-if="m.posterUrl" :src="`${m.posterUrl}?access_token=${encodeURIComponent(auth.token)}`" :alt="m.title" />
          <span v-else>{{ (m.title || '?').slice(0, 1).toUpperCase() }}</span>
        </div>
        <h4>{{ m.title }}</h4>
        <p>{{ m.width || '-' }} × {{ m.height || '-' }} · {{ m.codec || '-' }}</p>
      </div>
    </div>
  </div>
</template>
