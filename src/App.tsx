import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PlayerBar } from './components/PlayerBar';
import { QueueDrawer } from './components/QueueDrawer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { EqualizerModal } from './components/EqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { DriveFolderModal } from './components/DriveFolderModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { DeleteAllOfflineModal } from './components/DeleteAllOfflineModal';
import { SyncModal } from './components/SyncModal';

import { HomeView } from './components/views/HomeView';
import { SearchView } from './components/views/SearchView';
import { LibraryView } from './components/views/LibraryView';
import { OfflineView } from './components/views/OfflineView';
import { LikedSongsView } from './components/views/LikedSongsView';
import { FolderDetailView } from './components/views/FolderDetailView';
import { PlaylistDetailView } from './components/views/PlaylistDetailView';
import { CommunityView } from './components/views/CommunityView';

import { ActiveView, DriveFolder, Playlist, RepeatMode, SyncData, Track, ViewType } from './types';
import { INITIAL_DRIVE_FOLDERS, INITIAL_TRACKS } from './services/curatedTracks';
import {
  deleteAllOfflineTracks,
  downloadTrackOffline,
  getAllOfflineTracks,
  getOfflineTrackAudioUrl,
  removeTrackOffline,
} from './services/offlineStorage';
import { audioEngine, EQ_PRESETS } from './services/audioEngine';
import {
  getOrCreateSyncCode,
  pullSyncData,
  pushSyncData,
  setCustomSyncCode,
} from './services/syncService';

export default function App() {
  // Navigation & Views
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' });
  const [navHistory, setNavHistory] = useState<ActiveView[]>([{ type: 'home' }]);
  const [navIndex, setNavIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Core Library State
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>(INITIAL_DRIVE_FOLDERS);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'pl-favorites-mix',
      name: 'Drive Essentials',
      description: 'The best synth & lofi tracks from cloud storage.',
      coverColor: '#1db954',
      trackIds: ['track-neon-horizon', 'track-rainy-coffee', 'track-orbital-decay'],
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now(),
    },
  ]);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([
    'track-neon-horizon',
    'track-rainy-coffee',
  ]);

  // Offline Management State
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [downloadingTrackIds, setDownloadingTrackIds] = useState<Record<string, number>>({});
  const [offlineOnlyMode, setOfflineOnlyMode] = useState<boolean>(false);
  const [totalOfflineBytes, setTotalOfflineBytes] = useState<number>(0);

  // Cross-Platform Device Sync State
  const [syncCode, setSyncCode] = useState<string>(getOrCreateSyncCode());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(undefined);

  // Playback & Audio Engine State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0]?.duration || 180);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [queue, setQueue] = useState<Track[]>(INITIAL_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  // Equalizer State
  const [eqPreset, setEqPreset] = useState<string>('Flat');
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0]);

  // Sleep Timer State
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sleepTimerType, setSleepTimerType] = useState<string | null>(null);

  // Modals & Panels
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Toast / feedback notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load: Load Offline IndexedDB Tracks
  useEffect(() => {
    getAllOfflineTracks()
      .then((savedOffline) => {
        if (savedOffline.length > 0) {
          const idSet = new Set(savedOffline.map((t) => t.id));
          setOfflineTrackIds(idSet);

          const bytes = savedOffline.reduce(
            (acc, t) => acc + (t.offlineBlobSize || t.size || 0),
            0
          );
          setTotalOfflineBytes(bytes);

          // Merge any custom saved tracks into main track list if not present
          setTracks((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newTracks = savedOffline.filter((o) => !existingIds.has(o.id));
            return [...prev, ...newTracks];
          });
        }
      })
      .catch((err) => console.warn('Could not load offline tracks:', err));
  }, []);

  // 2. Initial Cloud Sync Pull & Folder Link param detection
  useEffect(() => {
    const code = getOrCreateSyncCode();
    setSyncCode(code);
    setIsSyncing(true);

    // Check if URL has ?folder=ID
    const urlParams = new URLSearchParams(window.location.search);
    const sharedFolderParam = urlParams.get('folder');

    pullSyncData(code)
      .then((data) => {
        if (data) {
          if (data.playlists?.length) setPlaylists(data.playlists);
          if (data.likedTrackIds?.length) setLikedTrackIds(data.likedTrackIds);
          if (data.customFolders?.length) {
            setDriveFolders((prev) => {
              const existingIds = new Set(prev.map((f) => f.id));
              const additions = data.customFolders.filter((f) => !existingIds.has(f.id));
              return [...prev, ...additions];
            });
          }
          if (data.customTracks?.length) {
            setTracks((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const additions = data.customTracks.filter((t) => !existingIds.has(t.id));
              return [...prev, ...additions];
            });
          }
          if (data.settings?.eqPreset) setEqPreset(data.settings.eqPreset);
          if (data.settings?.eqGains) setEqGains(data.settings.eqGains);
          setLastSyncedAt(data.lastSyncedAt || Date.now());
        }
      })
      .finally(() => {
        setIsSyncing(false);
        if (sharedFolderParam) {
          showToast(`Opening shared Google Drive folder...`);
          navigateTo('folder', `folder-${sharedFolderParam}`);
        }
      });
  }, []);

  // 3. Debounced Auto-Sync to Cloud
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      const customFolders = driveFolders.filter((f) => f.isCustom);
      const customTracks = tracks.filter((t) => t.source === 'google_drive' || t.source === 'local');

      const payload: SyncData = {
        syncId: syncCode,
        lastSyncedAt: Date.now(),
        playlists,
        likedTrackIds,
        customFolders,
        customTracks,
        history: [],
        settings: {
          volume,
          eqPreset,
          eqGains,
          playbackSpeed,
          crossfade: false,
          offlineOnlyMode,
        },
      };

      setIsSyncing(true);
      pushSyncData(payload).then((success) => {
        setIsSyncing(false);
        if (success) setLastSyncedAt(Date.now());
      });
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [playlists, likedTrackIds, driveFolders, tracks, eqPreset, eqGains, volume, playbackSpeed, offlineOnlyMode, syncCode]);

  // 4. Sleep Timer Countdown Interval
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;

    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Timer finished: pause playback!
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          setSleepTimerType(null);
          showToast('Sleep timer expired. Audio paused.');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  // 5. Initialize Web Audio Engine with HTML Audio Element
  const ensureAudioEngineInit = useCallback(() => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current);
      audioEngine.resume();
      audioEngine.setEqGains(eqGains);
    }
  }, [eqGains]);

  // 6. MediaSession API (Lockscreen Controls)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: currentTrack.coverUrl ? [{ src: currentTrack.coverUrl, sizes: '512x512' }] : [],
      });

      navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('pause', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
    }
  }, [currentTrack]);

  // 7. Navigation Management
  const navigateTo = (type: ViewType, id?: string) => {
    const newView: ActiveView = { type, id };
    const newHistory = navHistory.slice(0, navIndex + 1);
    newHistory.push(newView);
    setNavHistory(newHistory);
    setNavIndex(newHistory.length - 1);
    setActiveView(newView);
    if (type === 'search' && !searchQuery) {
      setSearchQuery('');
    }
  };

  const handleGoBack = () => {
    if (navIndex > 0) {
      const targetIndex = navIndex - 1;
      setNavIndex(targetIndex);
      setActiveView(navHistory[targetIndex]);
    }
  };

  const handleGoForward = () => {
    if (navIndex < navHistory.length - 1) {
      const targetIndex = navIndex + 1;
      setNavIndex(targetIndex);
      setActiveView(navHistory[targetIndex]);
    }
  };

  // 8. Playback Handlers
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    ensureAudioEngineInit();

    let targetUrl = track.url;

    // If track is saved offline, load direct from IndexedDB Blob for true offline playback!
    if (offlineTrackIds.has(track.id)) {
      const offlineUrl = await getOfflineTrackAudioUrl(track.id);
      if (offlineUrl) {
        targetUrl = offlineUrl;
      }
    }

    setCurrentTrack(track);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }

    if (audioRef.current) {
      audioRef.current.src = targetUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error (browser policy or source error):', err);
          setIsPlaying(false);
        });
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    ensureAudioEngineInit();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play error:', e));
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIndex);
      playTrack(queue[randomIndex]);
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      playTrack(queue[nextIndex]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      playTrack(queue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      setQueueIndex(prevIndex);
      playTrack(queue[prevIndex]);
    } else {
      setQueueIndex(queue.length - 1);
      playTrack(queue[queue.length - 1]);
    }
  };

  const handleSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      setIsMuted(false);
      audioRef.current.volume = volume > 0 ? volume : 0.8;
    } else {
      setIsMuted(true);
      audioRef.current.volume = 0;
    }
  };

  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
    showToast(!isShuffle ? 'Shuffle turned on' : 'Shuffle turned off');
  };

  const handleToggleRepeat = () => {
    const nextRepeat: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(nextRepeat);
    showToast(`Repeat: ${nextRepeat}`);
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    showToast(`Speed set to ${speed}x`);
  };

  const handleShufflePlay = (list: Track[]) => {
    if (list.length === 0) return;
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setIsShuffle(true);
    playTrack(shuffled[0], shuffled);
  };

  // Audio element events
  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (!isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
    }
  };

  const handleAudioEnded = () => {
    if (sleepTimerType === 'end_of_track') {
      setIsPlaying(false);
      setSleepTimerType(null);
      setSleepTimerRemaining(null);
      showToast('Sleep timer: playback paused at end of track.');
      return;
    }

    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  // 9. Liked Songs Management
  const handleToggleLike = (trackId: string) => {
    setLikedTrackIds((prev) => {
      const isAlready = prev.includes(trackId);
      const updated = isAlready ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      showToast(isAlready ? 'Removed from Liked Songs' : 'Added to Liked Songs');
      return updated;
    });
  };

  // 10. Offline Download & Management Handlers
  const handleDownloadTrack = async (track: Track) => {
    setDownloadingTrackIds((prev) => ({ ...prev, [track.id]: 0 }));
    try {
      const saved = await downloadTrackOffline(track, undefined, (progress) => {
        setDownloadingTrackIds((prev) => ({ ...prev, [track.id]: progress }));
      });

      setOfflineTrackIds((prev) => new Set([...prev, track.id]));
      setTotalOfflineBytes((prev) => prev + (saved.offlineBlobSize || saved.size || 0));

      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isOffline: true, offlineBlobSize: saved.offlineBlobSize } : t))
      );

      showToast(`Downloaded "${track.title}" for offline playback!`);
    } catch (err: any) {
      console.error('Download failed:', err);
      showToast(`Download failed: ${err?.message || 'Check connection'}`);
    } finally {
      setDownloadingTrackIds((prev) => {
        const copy = { ...prev };
        delete copy[track.id];
        return copy;
      });
    }
  };

  const handleRemoveTrackOffline = async (trackId: string) => {
    try {
      await removeTrackOffline(trackId);
      setOfflineTrackIds((prev) => {
        const copy = new Set(prev);
        copy.delete(trackId);
        return copy;
      });
      // Recalculate total bytes
      const updatedOffline = await getAllOfflineTracks();
      const bytes = updatedOffline.reduce(
        (acc, t) => acc + (t.offlineBlobSize || t.size || 0),
        0
      );
      setTotalOfflineBytes(bytes);
      showToast('Removed track from offline downloads.');
    } catch (err) {
      console.warn('Remove error:', err);
    }
  };

  const handleDownloadAllTracks = async (trackList: Track[]) => {
    showToast(`Downloading ${trackList.length} tracks to offline storage...`);
    for (const t of trackList) {
      if (!offlineTrackIds.has(t.id)) {
        await handleDownloadTrack(t);
      }
    }
    showToast('Batch download complete!');
  };

  const handleDeleteAllOffline = async () => {
    try {
      const count = await deleteAllOfflineTracks();
      setOfflineTrackIds(new Set());
      setTotalOfflineBytes(0);
      showToast(`Deleted ${count} offline downloads successfully.`);
    } catch (err) {
      console.error('Failed to delete offline tracks:', err);
    }
  };

  // 11. Folder & Playlist Handlers
  const handleAddFolderWithTracks = (folder: DriveFolder, newTracks: Track[]) => {
    setDriveFolders((prev) => [folder, ...prev]);
    setTracks((prev) => [...newTracks, ...prev]);
    showToast(`Added Google Drive folder "${folder.name}" (${newTracks.length} tracks)`);
    navigateTo('folder', folder.id);
  };

  const handleDeleteFolder = (folderId: string) => {
    setDriveFolders((prev) => prev.filter((f) => f.id !== folderId));
    setTracks((prev) => prev.filter((t) => t.driveFolderId !== folderId));
    showToast('Google Drive folder removed.');
    navigateTo('library');
  };

  const handleCreatePlaylist = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    showToast(`Playlist "${newPlaylist.name}" created!`);
    navigateTo('playlist', newPlaylist.id);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    showToast('Playlist deleted.');
    navigateTo('library');
  };

  // 12. Cross-Platform Sync Pairing
  const handlePairSyncCode = async (targetCode: string): Promise<boolean> => {
    const data = await pullSyncData(targetCode);
    if (!data) return false;

    setSyncCode(targetCode);
    setCustomSyncCode(targetCode);
    if (data.playlists) setPlaylists(data.playlists);
    if (data.likedTrackIds) setLikedTrackIds(data.likedTrackIds);
    if (data.customFolders) {
      setDriveFolders((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const additions = data.customFolders.filter((f) => !existingIds.has(f.id));
        return [...prev, ...additions];
      });
    }
    if (data.customTracks) {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const additions = data.customTracks.filter((t) => !existingIds.has(t.id));
        return [...prev, ...additions];
      });
    }
    if (data.settings?.eqPreset) setEqPreset(data.settings.eqPreset);
    if (data.settings?.eqGains) setEqGains(data.settings.eqGains);
    setLastSyncedAt(Date.now());
    showToast(`Synced library from device ${targetCode}!`);
    return true;
  };

  const handleRestoreBackup = (data: SyncData) => {
    if (data.playlists) setPlaylists(data.playlists);
    if (data.likedTrackIds) setLikedTrackIds(data.likedTrackIds);
    if (data.customFolders) setDriveFolders(data.customFolders);
    if (data.customTracks) setTracks(data.customTracks);
    showToast('Library successfully restored!');
  };

  // 13. Equalizer Preset Handler
  const handleSelectEqPreset = (presetName: string) => {
    setEqPreset(presetName);
    const gains = EQ_PRESETS[presetName] || [0, 0, 0, 0, 0];
    setEqGains(gains);
    audioEngine.setEqGains(gains);
  };

  const handleChangeEqGains = (gains: number[]) => {
    setEqGains(gains);
    setEqPreset('Custom');
    audioEngine.setEqGains(gains);
  };

  // 14. Sleep Timer Handler
  const handleSetSleepTimer = (val: number | 'end_of_track') => {
    if (val === 'end_of_track') {
      setSleepTimerType('end_of_track');
      setSleepTimerRemaining(null);
      showToast('Sleep timer set: Pauses at end of track');
    } else {
      setSleepTimerType(String(val));
      setSleepTimerRemaining(val * 60);
      showToast(`Sleep timer set for ${val} minutes`);
    }
  };

  const handleCancelSleepTimer = () => {
    setSleepTimerType(null);
    setSleepTimerRemaining(null);
    showToast('Sleep timer turned off');
  };

  // Filtered tracks for Offline-Only Mode
  const displayedTracks = offlineOnlyMode
    ? tracks.filter((t) => offlineTrackIds.has(t.id))
    : tracks;

  const offlineTracksList = tracks.filter((t) => offlineTrackIds.has(t.id));
  const likedTracksList = displayedTracks.filter((t) => likedTrackIds.includes(t.id));

  // Current view resolution
  const renderCurrentView = () => {
    switch (activeView.type) {
      case 'home':
        return (
          <HomeView
            tracks={displayedTracks}
            driveFolders={driveFolders}
            playlists={playlists}
            likedCount={likedTrackIds.length}
            offlineTracks={offlineTracksList}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onPlayTrack={playTrack}
            onNavigate={navigateTo}
            onOpenAddFolder={() => setIsAddFolderOpen(true)}
          />
        );

      case 'search':
        return (
          <SearchView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tracks={displayedTracks}
            driveFolders={driveFolders}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            offlineTrackIds={offlineTrackIds}
            downloadingTrackIds={downloadingTrackIds}
            onPlayTrack={playTrack}
            onToggleLike={handleToggleLike}
            onDownloadTrack={handleDownloadTrack}
            onRemoveTrackOffline={handleRemoveTrackOffline}
            onNavigate={navigateTo}
          />
        );

      case 'library':
        return (
          <LibraryView
            playlists={playlists}
            driveFolders={driveFolders}
            tracks={displayedTracks}
            likedCount={likedTrackIds.length}
            offlineCount={offlineTrackIds.size}
            onNavigate={navigateTo}
            onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
            onOpenAddFolder={() => setIsAddFolderOpen(true)}
          />
        );

      case 'liked':
        return (
          <LikedSongsView
            likedTracks={likedTracksList}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            offlineTrackIds={offlineTrackIds}
            downloadingTrackIds={downloadingTrackIds}
            onPlayTrack={playTrack}
            onShufflePlay={handleShufflePlay}
            onToggleLike={handleToggleLike}
            onDownloadTrack={handleDownloadTrack}
            onRemoveTrackOffline={handleRemoveTrackOffline}
            onDownloadAllLiked={() => handleDownloadAllTracks(likedTracksList)}
          />
        );

      case 'offline':
        return (
          <OfflineView
            offlineTracks={offlineTracksList}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            offlineOnlyMode={offlineOnlyMode}
            downloadingTrackIds={downloadingTrackIds}
            onPlayTrack={playTrack}
            onShufflePlay={handleShufflePlay}
            onToggleLike={handleToggleLike}
            onRemoveTrackOffline={handleRemoveTrackOffline}
            onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
            onToggleOfflineOnly={() => setOfflineOnlyMode(!offlineOnlyMode)}
          />
        );

      case 'folder': {
        const folder = driveFolders.find((f) => f.id === activeView.id);
        if (!folder) return <div className="p-8 text-neutral-400">Folder not found.</div>;
        const folderTracks = displayedTracks.filter((t) => t.driveFolderId === folder.id);
        return (
          <FolderDetailView
            folder={folder}
            folderTracks={folderTracks}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            offlineTrackIds={offlineTrackIds}
            downloadingTrackIds={downloadingTrackIds}
            onPlayTrack={playTrack}
            onShufflePlay={handleShufflePlay}
            onToggleLike={handleToggleLike}
            onDownloadTrack={handleDownloadTrack}
            onRemoveTrackOffline={handleRemoveTrackOffline}
            onDownloadAllFolder={() => handleDownloadAllTracks(folderTracks)}
            onDeleteFolder={handleDeleteFolder}
          />
        );
      }

      case 'playlist': {
        const playlist = playlists.find((p) => p.id === activeView.id);
        if (!playlist) return <div className="p-8 text-neutral-400">Playlist not found.</div>;
        const playlistTracks = displayedTracks.filter((t) => playlist.trackIds.includes(t.id));
        return (
          <PlaylistDetailView
            playlist={playlist}
            playlistTracks={playlistTracks}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            offlineTrackIds={offlineTrackIds}
            downloadingTrackIds={downloadingTrackIds}
            onPlayTrack={playTrack}
            onShufflePlay={handleShufflePlay}
            onToggleLike={handleToggleLike}
            onDownloadTrack={handleDownloadTrack}
            onRemoveTrackOffline={handleRemoveTrackOffline}
            onDownloadAllPlaylist={() => handleDownloadAllTracks(playlistTracks)}
            onDeletePlaylist={handleDeletePlaylist}
          />
        );
      }

      case 'community':
        return (
          <CommunityView
            onOpenAddFolder={() => setIsAddFolderOpen(true)}
            onPlayFolder={(folder, folderTracks) => {
              if (folderTracks.length > 0) {
                // If folder is not in driveFolders, also add it
                if (!driveFolders.some((f) => f.id === folder.id)) {
                  setDriveFolders((prev) => [folder, ...prev]);
                  setTracks((prev) => [...folderTracks, ...prev]);
                }
                playTrack(folderTracks[0], folderTracks);
              }
            }}
            onAddToLibrary={(folder, folderTracks) => {
              if (!driveFolders.some((f) => f.id === folder.id)) {
                setDriveFolders((prev) => [folder, ...prev]);
                setTracks((prev) => [...folderTracks, ...prev]);
                showToast(`Saved "${folder.name}" to your library!`);
              } else {
                showToast(`"${folder.name}" is already in your library.`);
              }
            }}
            savedFolderIds={new Set(driveFolders.map((f) => f.id))}
          />
        );

      default:
        return null;
    }
  };

  // Keyboard shortcut listener for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.current) handleSeek(Math.max(0, audioRef.current.currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current) handleSeek(Math.min(duration, audioRef.current.currentTime + 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.05));
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'l' || e.key === 'L') {
        if (currentTrack) handleToggleLike(currentTrack.id);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreenOpen(!isFullscreenOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, duration, currentTrack, isFullscreenOpen]);

  const totalOfflineMB = totalOfflineBytes / (1024 * 1024);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#000000] text-white">
      {/* Hidden HTML5 Audio Element for playback */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={activeView.type}
          selectedId={activeView.id}
          playlists={playlists}
          driveFolders={driveFolders}
          likedCount={likedTrackIds.length}
          offlineCount={offlineTrackIds.size}
          offlineOnlyMode={offlineOnlyMode}
          syncCode={syncCode}
          isSyncing={isSyncing}
          onNavigate={navigateTo}
          onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onOpenAddDriveFolder={() => setIsAddFolderOpen(true)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onToggleOfflineOnly={() => setOfflineOnlyMode(!offlineOnlyMode)}
        />

        {/* Center Scrollable Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#121212] overflow-hidden relative">
          <TopBar
            currentView={activeView.type}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (activeView.type !== 'search') {
                navigateTo('search');
              }
            }}
            canGoBack={navIndex > 0}
            canGoForward={navIndex < navHistory.length - 1}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onOpenAddFolder={() => setIsAddFolderOpen(true)}
            onOpenSync={() => setIsSyncModalOpen(true)}
            onOpenEq={() => setIsEqOpen(true)}
            syncCode={syncCode}
            isSyncing={isSyncing}
            totalOfflineMB={totalOfflineMB}
          />

          <main className="flex-1 overflow-y-auto">
            {renderCurrentView()}
          </main>
        </div>

        {/* Slide-out Queue Drawer */}
        <QueueDrawer
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          queue={queue}
          queueIndex={queueIndex}
          onSelectQueueIndex={(idx) => {
            setQueueIndex(idx);
            playTrack(queue[idx]);
          }}
          onRemoveFromQueue={(idx) => {
            setQueue((prev) => prev.filter((_, i) => i !== idx));
          }}
          onMoveQueueItem={(from, to) => {
            setQueue((prev) => {
              const copy = [...prev];
              const [moved] = copy.splice(from, 1);
              copy.splice(to, 0, moved);
              return copy;
            });
          }}
          onClearQueue={() => {
            setQueue(currentTrack ? [currentTrack] : []);
            setQueueIndex(0);
          }}
        />
      </div>

      {/* Bottom Persistent Spotify Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
        isOffline={currentTrack ? offlineTrackIds.has(currentTrack.id) : false}
        playbackSpeed={playbackSpeed}
        activeSleepTimerMinutes={
          sleepTimerRemaining !== null ? Math.ceil(sleepTimerRemaining / 60) : null
        }
        isQueueOpen={isQueueOpen}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleLike={() => currentTrack && handleToggleLike(currentTrack.id)}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onOpenEq={() => setIsEqOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onChangeSpeed={handleChangeSpeed}
      />

      {/* Fullscreen Now Playing Modal */}
      <FullscreenPlayer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
        isOffline={currentTrack ? offlineTrackIds.has(currentTrack.id) : false}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleLike={() => currentTrack && handleToggleLike(currentTrack.id)}
        onOpenEq={() => setIsEqOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
      />

      {/* Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        gains={eqGains}
        currentPreset={eqPreset}
        onChangeGains={handleChangeEqGains}
        onSelectPreset={handleSelectEqPreset}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        activeTimerRemaining={sleepTimerRemaining}
        activeTimerType={sleepTimerType}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={handleCancelSleepTimer}
      />

      {/* Google Drive Connect / Add Folder Modal */}
      <DriveFolderModal
        isOpen={isAddFolderOpen}
        onClose={() => setIsAddFolderOpen(false)}
        onAddFolderWithTracks={handleAddFolderWithTracks}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={handleCreatePlaylist}
      />

      {/* Delete All Downloads Modal */}
      <DeleteAllOfflineModal
        isOpen={isDeleteAllModalOpen}
        trackCount={offlineTrackIds.size}
        totalSizeBytes={totalOfflineBytes}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllOffline}
      />

      {/* Cross-Platform Device Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncCode={syncCode}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        currentSyncData={{
          syncId: syncCode,
          lastSyncedAt: Date.now(),
          playlists,
          likedTrackIds,
          customFolders: driveFolders.filter((f) => f.isCustom),
          customTracks: tracks.filter((t) => t.source === 'google_drive' || t.source === 'local'),
          history: [],
          settings: {
            volume,
            eqPreset,
            eqGains,
            playbackSpeed,
            crossfade: false,
            offlineOnlyMode,
          },
        }}
        onPairSyncCode={handlePairSyncCode}
        onRestoreBackup={handleRestoreBackup}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-26 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#282828] border border-neutral-700 text-white text-xs font-semibold rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
