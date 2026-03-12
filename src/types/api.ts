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
}
