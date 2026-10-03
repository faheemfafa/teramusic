import { SyncData } from '../types';

const STORAGE_SYNC_ID = 'teramusic_sync_id';
const STORAGE_LOCAL_BACKUP = 'teramusic_local_backup_v1';

export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TERA-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getOrCreateSyncCode(): string {
  // Check if URL has ?sync=CODE
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlSync = params.get('sync');
    if (urlSync && urlSync.trim().length >= 4) {
      const code = urlSync.trim().toUpperCase();
      localStorage.setItem(STORAGE_SYNC_ID, code);
      return code;
    }

    const saved = localStorage.getItem(STORAGE_SYNC_ID);
    if (saved) return saved;

    const newCode = generateSyncCode();
    localStorage.setItem(STORAGE_SYNC_ID, newCode);
    return newCode;
  }
  return 'TERA-1001';
}

export function setCustomSyncCode(code: string): void {
  localStorage.setItem(STORAGE_SYNC_ID, code.toUpperCase().trim());
}

export async function pushSyncData(data: SyncData): Promise<boolean> {
  // Always backup locally
  try {
    localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage quota warning:', e);
  }

  // Push to server sync API
  try {
    const response = await fetch(`/api/sync/${data.syncId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (err) {
    console.warn('Cloud sync push offline, cached locally:', err);
    return false;
  }
}

export async function pullSyncData(syncId: string): Promise<SyncData | null> {
  try {
    const response = await fetch(`/api/sync/${syncId}`);
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return json.data as SyncData;
      }
    }
  } catch (err) {
    console.warn('Cloud sync pull failed, trying local fallback:', err);
  }

  // Fallback to local backup if syncId matches
  try {
    const local = localStorage.getItem(STORAGE_LOCAL_BACKUP);
    if (local) {
      const parsed = JSON.parse(local) as SyncData;
      if (parsed.syncId === syncId) return parsed;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export function exportLibraryJson(data: SyncData): string {
  return JSON.stringify(data, null, 2);
}

export function importLibraryJson(jsonText: string): SyncData | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && Array.isArray(parsed.playlists)) {
      return parsed as SyncData;
    }
  } catch (e) {
    console.error('Invalid library JSON:', e);
  }
  return null;
}
