export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface MediaItem {
  id: number
  title: string
  filePath: string
  fileSize?: number
  durationSec?: number
  width?: number
  height?: number
  codec?: string
  bitrateKbps?: number
  posterUrl?: string
}

export interface MediaUpdateRequest {
  title: string
  codec?: string | null
  width?: number | null
  height?: number | null
  durationSec?: number | null
  bitrateKbps?: number | null
  posterUrl?: string | null
}
