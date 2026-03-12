<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../api/http'
import type { ApiResponse, MediaItem } from '../types/api'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const media = ref<MediaItem | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const error = ref('')
let timer: number | undefined

const loadDetail = async () => {
  const res = await http.get<ApiResponse<MediaItem>>(`/api/media/${id}`)
  if (res.data.code !== 0) throw new Error(res.data.message)
  media.value = res.data.data
}

const loadProgress = async () => {
  const res = await http.get<ApiResponse<{ positionSec: number }>>(`/api/playback/${id}/progress`)
  if (res.data.code === 0 && videoEl.value) {
    videoEl.value.currentTime = res.data.data.positionSec || 0
  }
}

const saveProgress = async () => {
  if (!videoEl.value) return
  await http.post(`/api/playback/${id}/progress`, {
    positionSec: Math.floor(videoEl.value.currentTime),
  })
}

onMounted(async () => {
  try {
    await loadDetail()
    await loadProgress()
    timer = window.setInterval(saveProgress, 10000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message || '加载失败'
  }
})

onBeforeUnmount(async () => {
  if (timer) window.clearInterval(timer)
  await saveProgress()
})
</script>

<template>
  <div class="page">
    <button @click="router.push('/library')">← 返回媒体库</button>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="media" class="card">
      <h3>{{ media.title }}</h3>
      <video
        ref="videoEl"
        controls
        style="width: 100%; max-height: 70vh"
        :src="`http://localhost:8080/api/media/${id}/stream`"
      />
    </div>
  </div>
</template>
