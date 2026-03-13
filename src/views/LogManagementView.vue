<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '../api/http'
import type { ApiResponse, OperationLog } from '../types/api'

interface LogPageData {
  records: OperationLog[]
  total: number
}

const { t } = useI18n()

const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const items = ref<OperationLog[]>([])

const filters = reactive({
  type: '',
  startAt: '',
  endAt: '',
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await http.get<ApiResponse<LogPageData>>('/api/logs', {
      params: {
        page: page.value,
        size: size.value,
        type: filters.type || undefined,
        startAt: filters.startAt ? new Date(filters.startAt).toISOString() : undefined,
        endAt: filters.endAt ? new Date(filters.endAt).toISOString() : undefined,
      },
    })
    if (res.data.code !== 0) throw new Error(res.data.message)
    items.value = res.data.data.records || []
    total.value = Number(res.data.data.total || 0)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || t('logs.loadFailed'))
  } finally {
    loading.value = false
  }
}

const search = async () => {
  page.value = 1
  await loadData()
}

const handlePageChange = async () => {
  await loadData()
}

const handleSizeChange = async () => {
  page.value = 1
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <section class="card toolbar">
      <h1 class="page-title">{{ t('logs.title') }}</h1>
      <div class="filters">
        <el-select v-model="filters.type" clearable :placeholder="t('logs.type')" style="width: 140px">
          <el-option label="SCAN" value="SCAN" />
          <el-option label="MEDIA" value="MEDIA" />
          <el-option label="SYSTEM" value="SYSTEM" />
        </el-select>
        <input v-model="filters.startAt" type="datetime-local" class="dt" />
        <input v-model="filters.endAt" type="datetime-local" class="dt" />
        <el-button type="primary" @click="search">{{ t('logs.search') }}</el-button>
      </div>
    </section>

    <section class="card">
      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column prop="createdAt" :label="t('logs.time')" min-width="180" />
        <el-table-column prop="type" :label="t('logs.type')" width="120" />
        <el-table-column prop="content" :label="t('logs.content')" min-width="360" show-overflow-tooltip />
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  display: grid;
  gap: 10px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dt {
  border: 1px solid #d9dfe9;
  border-radius: 8px;
  height: 32px;
  padding: 0 8px;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
