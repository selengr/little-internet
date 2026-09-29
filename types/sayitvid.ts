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
  // sayitvid returns null for these when a clip has no metadata
  accent: string | null
  channel_name: string | null
  text_before: string | null
  text_after: string | null
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
