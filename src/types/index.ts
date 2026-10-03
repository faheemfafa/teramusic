export type TrackSource = 'google_drive' | 'demo' | 'local';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string; // direct audio stream or object URL
  source: TrackSource;
  driveFileId?: string;
  driveFolderId?: string;
  folderName?: string;
  coverUrl?: string;
  genre?: string;
  year?: number;
  size?: number; // size in bytes
  addedAt: number;
  isOffline?: boolean;
  offlineBlobSize?: number;
  mimeType?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  trackCount: number;
  coverUrl?: string;
  color?: string;
  description?: string;
  url?: string;
  isCustom?: boolean;
  folderId?: string; // original Google Drive folder ID
  isOpenToAnyoneWithLink?: boolean;
  isCommunityShared?: boolean;
  author?: string;
  tracks?: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  volume: number;
  isMuted: boolean;
  eqPreset: string;
  eqGains: number[]; // 5 frequency bands: 60Hz, 230Hz, 910Hz, 3600Hz, 14000Hz
  playbackSpeed: number;
  crossfade: boolean;
  offlineOnlyMode: boolean;
}

export interface SyncData {
  syncId: string;
  lastSyncedAt: number;
  playlists: Playlist[];
  likedTrackIds: string[];
  customFolders: DriveFolder[];
  customTracks: Track[];
  history: { trackId: string; playedAt: number }[];
  settings: Partial<UserSettings>;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type ViewType = 'home' | 'search' | 'library' | 'liked' | 'offline' | 'folder' | 'playlist' | 'community';

export interface ActiveView {
  type: ViewType;
  id?: string; // folder ID or playlist ID
}
