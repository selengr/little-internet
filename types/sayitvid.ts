export type SayItVidAccent = 'all' | 'us' | 'uk' | 'aus'

export interface SayItVidQuota {
  remaining: number
  limit: number
  count: number
  resets_in_seconds?: number
  allowed?: boolean
}

export interface SayItVidHit {
  id: string
  video_id: string
  text: string
  start_time: number
  duration: number
  accent: string
  channel_name: string
  text_before: string
  text_after: string
}

export interface SayItVidSearchResponse {
  query: string
  clean_query: string
  accent: string
  total_estimated_hits: number
  hits: SayItVidHit[]
  quota: SayItVidQuota
}

export interface SayItVidQuotaResponse {
  quota: SayItVidQuota
}

export interface SayItVidProxyError {
  error: string
  code?: 'missing_key' | 'quota' | 'upstream' | 'bad_request'
  quota?: SayItVidQuota
}
