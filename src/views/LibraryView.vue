<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'
import type { ApiResponse, MediaItem } from '../types/api'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

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
    error.value = e?.response?.data?.message || e.message || t('library.loadFailed')
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
    ElMessage.error(e?.response?.data?.message || e.message || t('library.readFoldersFailed'))
  }
}

const selectCurrentFolder = () => {
  selectedFolderPath.value = folderCurrentPath.value
}

const startScan = async () => {
  if (!selectedFolderPath.value) {
    ElMessage.warning(t('library.chooseFolderFirst'))
    return
  }

  scanLoading.value = true
  try {
    const res = await http.post<ApiResponse<{ successCount: number; failCount: number }>>('/api/library/scan', {
      folderPath: selectedFolderPath.value,
      depth: 0,
    })
    if (res.data.code !== 0) throw new Error(res.data.message)
    const data = res.data.data
    ElMessage.success(t('library.scanResult', {
      success: data.successCount ?? 0,
      fail: data.failCount ?? 0,
    }))
    scanDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || t('library.scanFailed'))
  } finally {
    scanLoading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <section class="card library-toolbar">
      <h1 class="page-title">{{ t('library.title') }}</h1>
      <el-button type="primary" @click="openScanDialog">{{ t('library.scanMedia') }}</el-button>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">{{ t('common.loading') }}</p>

    <div v-if="scanDialog" class="modal-mask" @click.self="scanDialog = false">
      <div class="modal-card">
        <h3>{{ t('library.scanDialogTitle') }}</h3>
        <p class="muted">{{ t('library.currentPath') }}: {{ folderCurrentPath || t('library.driveList') }}</p>
        <p class="muted">{{ t('library.selectedPath') }}: {{ selectedFolderPath || t('library.notSelected') }}</p>

        <div class="modal-actions-top">
          <button class="btn btn-secondary" @click="loadFolders(folderParentPath)" :disabled="!folderCurrentPath">{{ t('library.parentFolder') }}</button>
          <button class="btn" @click="selectCurrentFolder">{{ t('library.selectCurrentFolder') }}</button>
        </div>

        <div class="folder-list">
          <button v-for="folder in folderList" :key="folder.path" class="btn btn-light folder-item" @click="loadFolders(folder.path)">
            {{ folder.name }}
          </button>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="scanDialog = false">{{ t('common.cancel') }}</button>
          <button class="btn" :disabled="scanLoading" @click="startScan">
            {{ scanLoading ? t('library.scanning') : t('library.startScan') }}
          </button>
        </div>
      </div>
    </div>

    <div class="media-grid">
      <button v-for="item in items" :key="item.id" type="button" class="card media-card" @click="router.push(`/media/${item.id}`)">
        <div class="cover">
          <img v-if="item.posterUrl" :src="`${item.posterUrl}?access_token=${encodeURIComponent(auth.token)}`" :alt="item.title" />
          <span v-else>{{ (item.title || '?').slice(0, 1).toUpperCase() }}</span>
        </div>
        <h4>{{ item.title }}</h4>
        <p>{{ t('library.resolutionCodec', { width: item.width || '-', height: item.height || '-', codec: item.codec || '-' }) }}</p>
      </button>
    </div>
  </div>
</template>

<style scoped>
.library-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.folder-item {
  justify-content: flex-start;
  width: 100%;
}

.media-card {
  border: 0;
  text-align: left;
}

@media (max-width: 620px) {
  .library-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
