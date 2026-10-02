export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: { total: number }
  images: SpotifyImage[]
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  album_type: string
  release_date: string
  total_tracks: number
  images: SpotifyImage[]
  external_urls: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  popularity: number
  track_number: number
  explicit: boolean
  external_urls: { spotify: string }
  album: {
    id: string
    name: string
    images: SpotifyImage[]
  }
  artists: { id: string; name: string }[]
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  owner: { display_name: string | null }
  tracks: { total: number }
  external_urls: { spotify: string }
}

export interface MusicArtistView {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: number
  image: string | null
  url: string
}

export interface MusicTrackView {
  id: string
  name: string
  durationMs: number
  previewUrl: string | null
  popularity: number
  albumName: string
  albumImage: string | null
  artists: string
  url: string
}

export interface MusicAlbumView {
  id: string
  name: string
  year: string
  type: string
  tracks: number
  image: string | null
  url: string
}

export interface MusicPlaylistView {
  id: string
  name: string
  description: string
  image: string | null
  owner: string
  tracks: number
  url: string
}

export interface MusicExplorerPayload {
  artist: MusicArtistView
  topTracks: MusicTrackView[]
  albums: MusicAlbumView[]
  similar: MusicArtistView[]
  playlists: MusicPlaylistView[]
}
