<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import http from '../api/http'
import type { ApiResponse, MediaItem } from '../types/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const id = Number(route.params.id)
const media = ref<MediaItem | null>(null)
const error = ref('')
const streamUrl = ref('')
const currentSec = ref(0)
const playerShellRef = ref<HTMLElement | null>(null)
const isBoosting = ref(false)
let timer: number | undefined
let longPressTimer: number | undefined
let normalPlaybackRate = 1

const LONG_PRESS_MS = 300
const BOOST_RATE = 3

const playerOptions = reactive({
  width: '100%',
  height: '72vh',
  color: '#409eff',
  title: '',
  src: '',
  poster: '',
  muted: false,
  webFullScreen: false,
  autoPlay: false,
  loop: false,
  speedRate: ['2.0', '1.5', '1.25', '1.0', '0.75'],
  control: true,
  controlBtns: ['audioTrack', 'quality', 'speedRate', 'volume', 'setting', 'pip'],
})

const updatePlayerHeight = () => {
  playerOptions.height = window.innerWidth < 768 ? '40vh' : '72vh'
}

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

const onTimeupdate = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (!video) return
  currentSec.value = Number(video.currentTime || 0)
}

const getPlayerVideoElement = () => {
  return playerShellRef.value?.querySelector('video') as HTMLVideoElement | null
}

const clearLongPressTimer = () => {
  if (longPressTimer) {
    window.clearTimeout(longPressTimer)
    longPressTimer = undefined
  }
}

const beginBoost = () => {
  const video = getPlayerVideoElement()
  if (!video) return
  normalPlaybackRate = video.playbackRate || 1
  video.playbackRate = BOOST_RATE
  isBoosting.value = true
}

const stopBoost = () => {
  clearLongPressTimer()
  const video = getPlayerVideoElement()
  if (isBoosting.value && video) {
    video.playbackRate = normalPlaybackRate || 1
  }
  isBoosting.value = false
}

const onTouchStart = () => {
  clearLongPressTimer()
  longPressTimer = window.setTimeout(() => {
    beginBoost()
  }, LONG_PRESS_MS)
}

onMounted(async () => {
  updatePlayerHeight()
  window.addEventListener('resize', updatePlayerHeight)

  try {
    await loadDetail()
    const token = localStorage.getItem('accessToken') || ''
    streamUrl.value = `/api/media/${id}/stream?access_token=${encodeURIComponent(token)}`
    await loadProgress()

    playerOptions.src = streamUrl.value
    playerOptions.poster = posterUrl.value
    ;(playerOptions as { currentTime?: number }).currentTime = currentSec.value

    timer = window.setInterval(saveProgress, 10000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || t('playback.loadFailed')
    ElMessage.error(error.value)
  }
})

onBeforeUnmount(async () => {
  window.removeEventListener('resize', updatePlayerHeight)
  if (timer) window.clearInterval(timer)
  stopBoost()
  await saveProgress()
})
</script>

<template>
  <div class="page player-page">
    <section class="card player-toolbar">
      <el-button text type="primary" @click="router.push('/library')">{{ t('common.backToLibrary') }}</el-button>
      <h1 class="page-title page-title--player">{{ media?.title || t('playback.player') }}</h1>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <div
      v-if="media"
      ref="playerShellRef"
      class="player-shell"
      @touchstart.passive="onTouchStart"
      @touchend="stopBoost"
      @touchcancel="stopBoost"
    >
      <vue3VideoPlay v-bind="playerOptions" @timeupdate="onTimeupdate" />
      <div v-if="isBoosting" class="boost-tip">{{ t('playback.boostingTip') }}</div>
    </div>

    <div v-if="media" class="player-meta card">
      <div class="meta-row">
        <span>{{ t('playback.resolution') }}</span>
        <strong>{{ media.width || '-' }} x {{ media.height || '-' }}</strong>
      </div>
      <div class="meta-row">
        <span>{{ t('playback.codec') }}</span>
        <strong>{{ media.codec || '-' }}</strong>
      </div>
      <div class="meta-row meta-row--path">
        <span>{{ t('playback.path') }}</span>
        <strong>{{ media.filePath }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-toolbar {
  margin-bottom: 12px;
  display: grid;
  gap: 8px;
}

.player-shell {
  position: relative;
}

.page-title--player {
  word-break: break-word;
  font-size: clamp(1.15rem, 4.5vw, 1.6rem);
}

.boost-tip {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 10;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: none;
}

.player-meta {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #2f3a56;
}

.meta-row strong {
  text-align: right;
  max-width: 65%;
  word-break: break-word;
}

.meta-row--path {
  flex-direction: column;
}

.meta-row--path strong {
  max-width: 100%;
  text-align: left;
}

@media (min-width: 768px) {
  .player-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .meta-row--path {
    grid-column: 1 / -1;
  }
}
</style>
