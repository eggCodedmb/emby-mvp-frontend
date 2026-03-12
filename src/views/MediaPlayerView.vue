<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import http from '../api/http'
import type { ApiResponse, MediaItem } from '../types/api'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const media = ref<MediaItem | null>(null)
const error = ref('')
const streamUrl = ref('')
const currentSec = ref(0)
let timer: number | undefined

const playerOptions = reactive({
  width: '100%',
  height: '72vh',
  color: '#409eff',
  title: '',
  src: '',
  poster: '',
  muted: false,
  webFullScreen: true,
  autoPlay: false,
  loop: false,
  speedRate: ['2.0', '1.5', '1.25', '1.0', '0.75'],
  control: true,
})

const posterUrl = computed(() => {
  if (!media.value?.posterUrl) return ''
  const token = localStorage.getItem('accessToken') || ''
  return `${media.value.posterUrl}?access_token=${encodeURIComponent(token)}`
})

const loadDetail = async () => {
  const res = await http.get<ApiResponse<MediaItem>>(`/api/media/${id}`)
  if (res.data.code !== 0) throw new Error(res.data.message)
  media.value = res.data.data
  playerOptions.title = media.value.title
}

const loadProgress = async () => {
  const res = await http.get<ApiResponse<{ positionSec: number }>>(`/api/playback/${id}/progress`)
  if (res.data.code === 0) {
    currentSec.value = Number(res.data.data.positionSec || 0)
  }
}

const saveProgress = async () => {
  await http.post(`/api/playback/${id}/progress`, {
    positionSec: Math.floor(currentSec.value || 0),
  })
}

const onTimeupdate = (ev: Event) => {
  const video = ev.target as HTMLVideoElement
  if (!video) return
  currentSec.value = Number(video.currentTime || 0)
}

onMounted(async () => {
  try {
    await loadDetail()
    const token = localStorage.getItem('accessToken') || ''
    streamUrl.value = `/api/media/${id}/stream?access_token=${encodeURIComponent(token)}`
    await loadProgress()

    playerOptions.src = streamUrl.value
    playerOptions.poster = posterUrl.value
    ;(playerOptions as any).currentTime = currentSec.value

    timer = window.setInterval(saveProgress, 10000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || '加载失败'
    ElMessage.error(error.value)
  }
})

onBeforeUnmount(async () => {
  if (timer) window.clearInterval(timer)
  await saveProgress()
})
</script>

<template>
  <div class="page player-page">
    <div class="player-topbar">
      <button @click="router.push('/library')">← 返回媒体库</button>
      <span class="player-title">{{ media?.title || '播放器' }}</span>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="media" class="player-shell">
      <vue3VideoPlay v-bind="playerOptions" @timeupdate="onTimeupdate" />
    </div>

    <div v-if="media" class="player-meta card">
      <p><strong>分辨率：</strong>{{ media.width || '-' }} × {{ media.height || '-' }}</p>
      <p><strong>编码：</strong>{{ media.codec || '-' }}</p>
      <p><strong>路径：</strong>{{ media.filePath }}</p>
    </div>
  </div>
</template>
