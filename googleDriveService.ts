import { DriveFolder, Track } from '../types';

export interface DriveFetchResult {
  folder: DriveFolder;
  tracks: Track[];
}


// ---- Standalone-app helpers (work without any server) ----
export const isNativeApp = (): boolean => !!(window as any).Capacitor?.isNativePlatform?.();
const KEY_STORE = 'teramusic_drive_key';
export const getDriveKey = (): string => { try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; } };
export const setDriveKey = (k: string) => { try { localStorage.setItem(KEY_STORE, k.trim()); } catch { /* ignore */ } };

/** Direct Drive API stream when a key is saved on this device; otherwise via the web server's proxy. */
export function driveStreamUrl(fileId: string): string {
  const key = getDriveKey();
  if (key) return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true&key=${key}`;
  return `/api/proxy-audio?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}`;
}

const AUDIO_RE = /\.(mp3|wav|m4a|flac|ogg|aac|opus)$/i;
async function driveGet(url: string): Promise<any> {
  const r = await fetch(url);
  if (!r.ok) {
    let m = '';
    try { m = (await r.json())?.error?.message || ''; } catch { /* ignore */ }
    throw new Error(m || `Drive API ${r.status}`);
  }
  return r.json();
}
async function listFolderWithKey(rootId: string, key: string) {
  const files: { id: string; name: string; size?: number }[] = [];
  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
  let calls = 0;
  while (queue.length && calls < 30 && files.length < 500) {
    const { id, depth } = queue.shift()!;
    let pageToken = '';
    do {
      calls++;
      const q = encodeURIComponent(`'${id}' in parents and trashed = false`);
      const j = await driveGet(
        `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=nextPageToken,files(id,name,mimeType,size)&key=${key}` +
          (pageToken ? `&pageToken=${pageToken}` : '')
      );
      for (const f of j.files || []) {
        if (f.mimeType === 'application/vnd.google-apps.folder') { if (depth < 2) queue.push({ id: f.id, depth: depth + 1 }); }
        else if ((f.mimeType || '').startsWith('audio/') || AUDIO_RE.test(f.name || ''))
          files.push({ id: f.id, name: f.name, size: f.size ? Number(f.size) : undefined });
      }
      pageToken = j.nextPageToken || '';
    } while (pageToken && files.length < 500);
  }
  return files;
}

export function extractDriveFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern 1: https://drive.google.com/drive/folders/ID or /u/0/folders/ID or /mobile/folders/ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // Pattern 2: id=ID query param (e.g. open?id=ID or drive/folders?id=ID)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  // Pattern 3: raw ID (typically 25-50 alphanumeric characters with underscores and hyphens)
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export async function inspectPublicDriveFolder(folderId: string): Promise<{
  folderName: string;
  filesFound: { id: string; name: string; size?: number }[];
  isOpenToAnyoneWithLink: boolean;
  error?: string;
}> {
  const key = getDriveKey();
  if (key) {
    try {
      const meta = await driveGet(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=name&supportsAllDrives=true&key=${key}`);
      const filesFound = await listFolderWithKey(folderId, key);
      return { folderName: meta.name || `Drive Folder (${folderId.slice(0, 6)})`, filesFound, isOpenToAnyoneWithLink: true };
    } catch (e: any) {
      return { folderName: `Drive Folder (${folderId.slice(0, 6)})`, filesFound: [], isOpenToAnyoneWithLink: true, error: e?.message || 'Drive error' };
    }
  }
  if (isNativeApp()) {
    return { folderName: `Drive Folder (${folderId.slice(0, 6)})`, filesFound: [], isOpenToAnyoneWithLink: true, error: 'Paste your Google API key below to load songs' };
  }
  try {
    const res = await fetch(`/api/drive/inspect-public?id=${folderId}`);
    if (res.ok) {
      const data = await res.json();
      return {
        folderName: data.folderName || `External Drive Folder (${folderId.slice(0, 6)})`,
        filesFound: data.filesFound || [],
        isOpenToAnyoneWithLink: data.isOpenToAnyoneWithLink ?? true,
        error: data.error,
      };
    }
  } catch (e) {
    console.warn('Inspect error:', e);
  }
  return {
    folderName: `Public Drive Folder (${folderId.slice(0, 6)})`,
    filesFound: [],
    isOpenToAnyoneWithLink: true,
  };
}

export async function fetchCommunityDriveFolders(): Promise<DriveFolder[]> {
  if (isNativeApp()) return []; // community list needs the web server
  try {
    const res = await fetch('/api/drive/community-folders');
    if (res.ok) {
      const data = await res.json();
      return data.folders || [];
    }
  } catch (err) {
    console.warn('Failed to fetch community folders:', err);
  }
  return [];
}

export async function publishDriveFolderToCommunity(
  folder: DriveFolder,
  tracks: Track[],
  authorName: string = 'Community Curator'
): Promise<boolean> {
  try {
    const payload = {
      ...folder,
      author: authorName,
      isCommunityShared: true,
      isOpenToAnyoneWithLink: true,
      tracks,
    };
    const res = await fetch('/api/drive/community-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to publish folder to community:', err);
    return false;
  }
}

export function parseTrackInfoFromFileName(filename: string): { title: string; artist: string; album: string } {
  // Strip extension (.mp3, .wav, .m4a, .flac, .ogg, .aac)
  const cleanName = filename.replace(/\.(mp3|wav|m4a|flac|ogg|aac|opus|webm)$/i, '').trim();

  // Pattern: "Artist - Title" or "Artist – Title"
  const splitDash = cleanName.split(/\s*[-–—]\s*/);
  if (splitDash.length >= 2) {
    const artist = splitDash[0].replace(/^\d+[\s._-]+/, '').trim(); // Remove leading track numbers e.g. "01 "
    const title = splitDash.slice(1).join(' - ').trim();
    return {
      artist: artist || 'Unknown Artist',
      title: title || cleanName,
      album: 'Drive Library',
    };
  }

  // Remove leading track numbers: "01. Song Name" or "1 - Song"
  const titleWithoutNum = cleanName.replace(/^\d+[\s._-]+/, '').trim();
  return {
    artist: 'Google Drive',
    title: titleWithoutNum || cleanName,
    album: 'Google Drive Audio',
  };
}

export function getAudioStreamUrl(fileId: string, accessToken?: string): string {
  if (accessToken) {
    // Via Google Drive API media endpoint
    const directUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    return isNativeApp() ? directUrl : `/api/proxy-audio?url=${encodeURIComponent(directUrl)}`;
  }
  return driveStreamUrl(fileId);
}

export async function fetchDriveFolderContents(
  folderId: string,
  options: {
    folderName?: string;
    apiKey?: string;
    accessToken?: string;
  } = {}
): Promise<DriveFetchResult> {
  const { folderName, apiKey, accessToken } = options;

  let name = folderName || `Drive Folder (${folderId.slice(0, 6)}...)`;
  let tracks: Track[] = [];

  // If we have an API key or access token, query Google Drive v3 API
  if (apiKey || accessToken) {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // 1. Fetch Folder metadata if name wasn't provided
      if (!folderName) {
        let metaUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name`;
        if (apiKey) metaUrl += `&key=${apiKey}`;
        const metaRes = await fetch(metaUrl, { headers });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.name) name = metaData.name;
        }
      }

      // 2. Fetch Audio files in folder
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      let listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,createdTime)&pageSize=100`;
      if (apiKey) listUrl += `&key=${apiKey}`;

      const listRes = await fetch(listUrl, { headers });
      if (!listRes.ok) {
        const errorText = await listRes.text();
        throw new Error(`Google Drive API error: ${listRes.status} - ${errorText}`);
      }

      const listData = await listRes.json();
      const files = listData.files || [];

      // Filter audio files
      const audioFiles = files.filter((f: any) => {
        const mime = f.mimeType || '';
        const lowerName = f.name?.toLowerCase() || '';
        return (
          mime.startsWith('audio/') ||
          lowerName.endsWith('.mp3') ||
          lowerName.endsWith('.wav') ||
          lowerName.endsWith('.m4a') ||
          lowerName.endsWith('.flac') ||
          lowerName.endsWith('.ogg') ||
          lowerName.endsWith('.aac')
        );
      });

      tracks = audioFiles.map((f: any, index: number) => {
        const parsed = parseTrackInfoFromFileName(f.name);
        const streamUrl = getAudioStreamUrl(f.id, accessToken);
        return {
          id: `gdrive-${f.id}`,
          title: parsed.title,
          artist: parsed.artist,
          album: name,
          duration: 180 + (index * 15) % 120, // default placeholder until audio metadata loads
          url: streamUrl,
          source: 'google_drive' as const,
          driveFileId: f.id,
          driveFolderId: `folder-${folderId}`,
          folderName: name,
          coverUrl: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80`,
          size: f.size ? Number(f.size) : undefined,
          addedAt: Date.now(),
          mimeType: f.mimeType,
        };
      });
    } catch (err: any) {
      console.warn('Google Drive API fetch failed, falling back:', err);
      throw err;
    }
  } else {
    // If no API key/token provided, create a connected folder representation
    // with placeholder tracks or allow user to stream if they provide direct file IDs
    name = folderName || `Shared Drive (${folderId.slice(0, 8)})`;
    tracks = [
      {
        id: `gdrive-${folderId}-demo1`,
        title: `${name} - Track 01`,
        artist: 'Google Drive Stream',
        album: name,
        duration: 210,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverending_Story.mp3',
        source: 'google_drive',
        driveFileId: folderId,
        driveFolderId: `folder-${folderId}`,
        folderName: name,
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80',
        size: 4200000,
        addedAt: Date.now(),
      },
      {
        id: `gdrive-${folderId}-demo2`,
        title: `${name} - Track 02`,
        artist: 'Google Drive Stream',
        album: name,
        duration: 175,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-_Be_There.mp3',
        source: 'google_drive',
        driveFileId: folderId,
        driveFolderId: `folder-${folderId}`,
        folderName: name,
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
        size: 3800000,
        addedAt: Date.now(),
      },
    ];
  }

  const folder: DriveFolder = {
    id: `folder-${folderId}`,
    name,
    trackCount: tracks.length,
    coverUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    color: '#10b981',
    description: `Google Drive synced folder: ${name}`,
    url: `https://drive.google.com/drive/folders/${folderId}`,
    isCustom: true,
  };

  return { folder, tracks };
}
