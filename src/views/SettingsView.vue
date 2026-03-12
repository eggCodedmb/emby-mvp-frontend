<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '../api/http'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import type { ApiResponse, MediaItem } from '../types/api'

const { t } = useI18n()

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
  try {
    await http.post('/api/settings/posters/auto', {
      enabled: autoEnabled.value,
      intervalMinutes: intervalMinutes.value,
    })
    ElMessage.success(t('settings.saveSuccess'))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || t('settings.loadFailed'))
  }
}

const fetchMissing = async () => {
  try {
    const res = await http.post<ApiResponse<{ success: number }>>('/api/settings/posters/fetch-missing?limit=100')
    if (res.data.code !== 0) throw new Error(res.data.message)
    ElMessage.success(t('settings.fetchSuccess', { count: res.data.data.success }))
    await loadMissing()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || t('settings.loadFailed'))
  }
}

onMounted(async () => {
  try {
    await loadAuto()
    await loadMissing()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e.message || t('settings.loadFailed'))
  }
})
</script>

<template>
  <div class="page">
    <section class="card settings-heading">
      <h1 class="page-title">{{ t('settings.title') }}</h1>
    </section>

    <section class="card settings-card settings-card--language">
      <h2>{{ t('common.language') }}</h2>
      <LanguageSwitcher />
    </section>

    <section class="card settings-card">
      <h2>{{ t('settings.posterSettings') }}</h2>
      <div class="settings-controls">
        <label class="switch-item">
          <input type="checkbox" v-model="autoEnabled" />
          <span>{{ t('settings.autoFetchPoster') }}</span>
        </label>
        <div class="interval-row">
          <input type="number" min="1" v-model.number="intervalMinutes" />
          <span>{{ t('settings.minutesPerRun') }}</span>
        </div>
        <button class="btn" @click="saveAuto">{{ t('settings.saveSettings') }}</button>
        <button class="btn btn-secondary" @click="fetchMissing">{{ t('settings.fetchMissing') }}</button>
      </div>
    </section>

    <section class="card">
      <h2>{{ t('settings.missingPosterList', { count: missing.length }) }}</h2>
      <p v-if="loading" class="muted">{{ t('common.loading') }}</p>
      <ul v-else class="missing-list">
        <li v-for="item in missing" :key="item.id">
          <strong>{{ item.title }}</strong>
          <span>{{ item.filePath }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.settings-heading {
  margin-bottom: 12px;
}

.settings-card {
  margin-bottom: 12px;
}

.settings-card--language {
  display: grid;
  gap: 10px;
}

.settings-card h2,
.card h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.05rem;
}

.settings-controls {
  display: grid;
  gap: 10px;
}

.switch-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  line-height: 1.4;
}

.interval-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interval-row input {
  width: 120px;
}

.missing-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.missing-list li {
  display: grid;
  gap: 3px;
}

.missing-list span {
  word-break: break-word;
  color: #5e667e;
}

@media (min-width: 768px) {
  .settings-controls {
    grid-template-columns: minmax(280px, 1fr) auto auto auto;
    align-items: center;
  }

  .switch-item {
    align-items: center;
  }
}
</style>
