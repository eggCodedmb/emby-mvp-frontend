<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '../api/http'
import type { ApiResponse, MediaItem, MediaUpdateRequest } from '../types/api'

interface MediaPageData {
  records: MediaItem[]
  total: number
}

interface EditFormModel {
  title: string
  codec: string
  width?: number
  height?: number
  durationSec?: number
  bitrateKbps?: number
  posterUrl: string
}

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const items = ref<MediaItem[]>([])
const error = ref('')
const isMobile = ref(false)

const editDialogVisible = ref(false)
const editingId = ref<number | null>(null)
const editForm = reactive<EditFormModel>({
  title: '',
  codec: '',
  width: undefined,
  height: undefined,
  durationSec: undefined,
  bitrateKbps: undefined,
  posterUrl: '',
})

let mobileQueryList: MediaQueryList | null = null

const paginationLayout = computed(() => {
  return isMobile.value ? 'prev, pager, next' : 'total, sizes, prev, pager, next'
})

const formatResolution = (item: MediaItem) => {
  if (!item.width || !item.height) return '-'
  return `${item.width} x ${item.height}`
}

const updateMobileState = (event?: MediaQueryListEvent) => {
  if (event) {
    isMobile.value = event.matches
    return
  }

  if (mobileQueryList) {
    isMobile.value = mobileQueryList.matches
    return
  }

  isMobile.value = window.innerWidth < 900
}

const bindMobileQuery = () => {
  mobileQueryList = window.matchMedia('(max-width: 899px)')
  updateMobileState()
  if (typeof mobileQueryList.addEventListener === 'function') {
    mobileQueryList.addEventListener('change', updateMobileState)
  } else {
    mobileQueryList.addListener(updateMobileState)
  }
}

const unbindMobileQuery = () => {
  if (!mobileQueryList) return
  if (typeof mobileQueryList.removeEventListener === 'function') {
    mobileQueryList.removeEventListener('change', updateMobileState)
  } else {
    mobileQueryList.removeListener(updateMobileState)
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get<ApiResponse<MediaPageData>>('/api/media', {
      params: { page: page.value, size: size.value },
    })
    if (res.data.code !== 0) throw new Error(res.data.message)
    items.value = res.data.data.records || []
    total.value = Number(res.data.data.total || 0)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || t('mediaManagement.loadFailed')
  } finally {
    loading.value = false
  }
}

const resetEditForm = () => {
  editForm.title = ''
  editForm.codec = ''
  editForm.width = undefined
  editForm.height = undefined
  editForm.durationSec = undefined
  editForm.bitrateKbps = undefined
  editForm.posterUrl = ''
}

const openEditDialog = (item: MediaItem) => {
  editingId.value = item.id
  editForm.title = item.title || ''
  editForm.codec = item.codec || ''
  editForm.width = item.width
  editForm.height = item.height
  editForm.durationSec = item.durationSec
  editForm.bitrateKbps = item.bitrateKbps
  editForm.posterUrl = item.posterUrl || ''
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  editingId.value = null
  resetEditForm()
}

const toNullableString = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const toNullableNumber = (value?: number) => {
  return typeof value === 'number' ? value : null
}

const submitEdit = async () => {
  if (editingId.value === null) return
  const title = editForm.title.trim()
  if (!title) {
    ElMessage.warning(t('mediaManagement.titleRequired'))
    return
  }

  saving.value = true
  try {
    const payload: MediaUpdateRequest = {
      title,
      codec: toNullableString(editForm.codec),
      width: toNullableNumber(editForm.width),
      height: toNullableNumber(editForm.height),
      durationSec: toNullableNumber(editForm.durationSec),
      bitrateKbps: toNullableNumber(editForm.bitrateKbps),
      posterUrl: toNullableString(editForm.posterUrl),
    }
    const res = await http.put<ApiResponse<MediaItem>>(`/api/media/${editingId.value}`, payload)
    if (res.data.code !== 0) throw new Error(res.data.message)
    ElMessage.success(t('mediaManagement.updateSuccess'))
    closeEditDialog()
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || t('mediaManagement.updateFailed'))
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: MediaItem) => {
  try {
    await ElMessageBox.confirm(
      t('mediaManagement.deleteConfirmMessage', { title: item.title }),
      t('mediaManagement.deleteConfirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('mediaManagement.delete'),
        cancelButtonText: t('common.cancel'),
      },
    )

    const res = await http.delete<ApiResponse<null>>(`/api/media/${item.id}`)
    if (res.data.code !== 0) throw new Error(res.data.message)
    ElMessage.success(t('mediaManagement.deleteSuccess'))

    if (items.value.length === 1 && page.value > 1) page.value -= 1
    await loadData()
  } catch (e: any) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error(e?.response?.data?.message || e.message || t('mediaManagement.deleteFailed'))
  }
}

const handlePageChange = async () => {
  await loadData()
}

const handleSizeChange = async () => {
  page.value = 1
  await loadData()
}

onMounted(() => {
  bindMobileQuery()
  loadData()
})

onBeforeUnmount(() => {
  unbindMobileQuery()
})
</script>

<template>
  <div class="page">
    <section class="card manager-toolbar">
      <h1 class="page-title">{{ t('mediaManagement.title') }}</h1>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="card manager-card">
      <div class="manager-desktop">
        <el-table v-loading="loading" :data="items" border stripe>
          <el-table-column prop="title" :label="t('mediaManagement.tableTitle')" min-width="180" />
          <el-table-column prop="filePath" :label="t('mediaManagement.tablePath')" min-width="320" show-overflow-tooltip />
          <el-table-column :label="t('mediaManagement.tableCodec')" min-width="120">
            <template #default="{ row }">
              <span>{{ row.codec || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('mediaManagement.tableResolution')" min-width="130">
            <template #default="{ row }">
              <span>{{ formatResolution(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('mediaManagement.tableActions')" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEditDialog(row)">{{ t('mediaManagement.edit') }}</el-button>
              <el-button type="danger" link @click="confirmDelete(row)">{{ t('mediaManagement.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="manager-mobile">
        <p v-if="loading" class="muted">{{ t('common.loading') }}</p>
        <p v-else-if="items.length === 0" class="muted">{{ t('mediaManagement.empty') }}</p>
        <div v-else class="manager-mobile-list">
          <article v-for="item in items" :key="item.id" class="card manager-mobile-item">
            <h3>{{ item.title }}</h3>
            <p>{{ t('mediaManagement.filePath') }}: {{ item.filePath }}</p>
            <p>{{ t('mediaManagement.tableCodec') }}: {{ item.codec || '-' }}</p>
            <p>{{ t('mediaManagement.tableResolution') }}: {{ formatResolution(item) }}</p>
            <div class="manager-mobile-actions">
              <button class="btn btn-secondary" @click="openEditDialog(item)">{{ t('mediaManagement.edit') }}</button>
              <button class="btn btn-danger" @click="confirmDelete(item)">{{ t('mediaManagement.delete') }}</button>
            </div>
          </article>
        </div>
      </div>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          :layout="paginationLayout"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="editDialogVisible" :title="t('mediaManagement.dialogTitle')" width="min(560px, 92vw)" @close="closeEditDialog">
      <el-form label-width="110px" label-position="left">
        <el-form-item :label="t('mediaManagement.fieldTitle')" required>
          <el-input v-model="editForm.title" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('mediaManagement.fieldCodec')">
          <el-input v-model="editForm.codec" maxlength="64" />
        </el-form-item>
        <el-form-item :label="t('mediaManagement.fieldWidth')">
          <el-input-number v-model="editForm.width" :min="1" :step="1" />
        </el-form-item>
        <el-form-item :label="t('mediaManagement.fieldHeight')">
          <el-input-number v-model="editForm.height" :min="1" :step="1" />
        </el-form-item>
        <el-form-item :label="t('mediaManagement.fieldDurationSec')">
          <el-input-number v-model="editForm.durationSec" :min="0" :step="1" />
        </el-form-item>
        <el-form-item :label="t('mediaManagement.fieldBitrate')">
          <el-input-number v-model="editForm.bitrateKbps" :min="0" :step="1" />
        </el-form-item>
        <el-form-item :label="t('mediaManagement.fieldPosterUrl')">
          <el-input v-model="editForm.posterUrl" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="saving" @click="submitEdit">{{ t('common.save') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.manager-toolbar {
  margin-bottom: 12px;
}

.manager-card {
  margin-top: 12px;
  display: grid;
  gap: 14px;
}

.manager-desktop {
  display: none;
}

.manager-mobile-list {
  display: grid;
  gap: 10px;
}

.manager-mobile-item {
  display: grid;
  gap: 6px;
  padding: 12px;
}

.manager-mobile-item h3,
.manager-mobile-item p {
  margin: 0;
  word-break: break-word;
}

.manager-mobile-actions {
  margin-top: 6px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pager {
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (min-width: 900px) {
  .manager-desktop {
    display: block;
  }

  .manager-mobile {
    display: none;
  }

  .pager {
    justify-content: flex-end;
  }
}
</style>
