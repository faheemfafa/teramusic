import { Track } from '../types';

const DB_NAME = 'Teramusic_Offline_Store_v1';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';
const STORE_BLOBS = 'audio_blobs';

let dbInstance: IDBDatabase | null = null;
const objectUrlCache = new Map<string, string>();

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveTrackOffline(track: Track, audioBlob: Blob): Promise<void> {
  const db = await getDB();
  const blobSize = audioBlob.size;
  const updatedTrack: Track = {
    ...track,
    isOffline: true,
    offlineBlobSize: blobSize,
    size: track.size || blobSize,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const tracksStore = transaction.objectStore(STORE_TRACKS);
    const blobsStore = transaction.objectStore(STORE_BLOBS);

    tracksStore.put(updatedTrack);
    blobsStore.put(audioBlob, track.id);

    transaction.oncomplete = () => {
      // Clear any previous object URL for this track so fresh one is created
      if (objectUrlCache.has(track.id)) {
        URL.revokeObjectURL(objectUrlCache.get(track.id)!);
        objectUrlCache.delete(track.id);
      }
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function getOfflineTrackBlob(trackId: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_BLOBS], 'readonly');
    const blobsStore = transaction.objectStore(STORE_BLOBS);
    const request = blobsStore.get(trackId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getOfflineTrackAudioUrl(trackId: string): Promise<string | null> {
  if (objectUrlCache.has(trackId)) {
    return objectUrlCache.get(trackId)!;
  }
  const blob = await getOfflineTrackBlob(trackId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrlCache.set(trackId, url);
  return url;
}

export async function isTrackOffline(trackId: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_TRACKS], 'readonly');
    const store = transaction.objectStore(STORE_TRACKS);
    const request = store.get(trackId);

    request.onsuccess = () => {
      resolve(Boolean(request.result));
    };

    request.onerror = () => {
      resolve(false);
    };
  });
}

export async function removeTrackOffline(trackId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const tracksStore = transaction.objectStore(STORE_TRACKS);
    const blobsStore = transaction.objectStore(STORE_BLOBS);

    tracksStore.delete(trackId);
    blobsStore.delete(trackId);

    transaction.oncomplete = () => {
      if (objectUrlCache.has(trackId)) {
        URL.revokeObjectURL(objectUrlCache.get(trackId)!);
        objectUrlCache.delete(trackId);
      }
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function getAllOfflineTracks(): Promise<Track[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TRACKS], 'readonly');
    const store = transaction.objectStore(STORE_TRACKS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getOfflineStats(): Promise<{ count: number; totalSizeBytes: number }> {
  const tracks = await getAllOfflineTracks();
  const totalSizeBytes = tracks.reduce((acc, t) => acc + (t.offlineBlobSize || t.size || 0), 0);
  return {
    count: tracks.length,
    totalSizeBytes,
  };
}

export async function deleteAllOfflineTracks(): Promise<number> {
  const db = await getDB();
  const tracks = await getAllOfflineTracks();
  const count = tracks.length;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const tracksStore = transaction.objectStore(STORE_TRACKS);
    const blobsStore = transaction.objectStore(STORE_BLOBS);

    tracksStore.clear();
    blobsStore.clear();

    transaction.oncomplete = () => {
      objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
      objectUrlCache.clear();
      resolve(count);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function downloadTrackOffline(
  track: Track,
  token?: string,
  onProgress?: (progress: number) => void
): Promise<Track> {
  const streamUrl = track.url;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(streamUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch audio stream: ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get('content-length')) || 0;
  let receivedBytes = 0;

  if (response.body && contentLength > 0 && onProgress) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        const progress = Math.min(100, Math.round((receivedBytes / contentLength) * 100));
        onProgress(progress);
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: track.mimeType || 'audio/mpeg' });
    await saveTrackOffline(track, blob);
    return {
      ...track,
      isOffline: true,
      offlineBlobSize: blob.size,
    };
  } else {
    // Fallback if ReadableStream is not available
    const blob = await response.blob();
    if (onProgress) onProgress(100);
    await saveTrackOffline(track, blob);
    return {
      ...track,
      isOffline: true,
      offlineBlobSize: blob.size,
    };
  }
}
