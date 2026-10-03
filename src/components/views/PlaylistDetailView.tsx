import React, { useState } from 'react';
import { ListMusic, Play, Shuffle, Download, Trash2, Edit3, Music } from 'lucide-react';
import { Playlist, Track } from '../../types';
import { TrackRow } from '../TrackRow';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  playlistTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  likedTrackIds: string[];
  offlineTrackIds: Set<string>;
  downloadingTrackIds: Record<string, number>;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onShufflePlay: (queueList: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onDownloadTrack: (track: Track) => void;
  onRemoveTrackOffline: (trackId: string) => void;
  onDownloadAllPlaylist: (tracks: Track[]) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveTrackFromPlaylist?: (trackId: string) => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  playlistTracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  offlineTrackIds,
  downloadingTrackIds,
  onPlayTrack,
  onShufflePlay,
  onToggleLike,
  onDownloadTrack,
  onRemoveTrackOffline,
  onDownloadAllPlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const totalDuration = playlistTracks.reduce((acc, t) => acc + t.duration, 0);
  const totalMins = Math.floor(totalDuration / 60);
  const downloadedCount = playlistTracks.filter((t) => offlineTrackIds.has(t.id)).length;
  const isFullyDownloaded = playlistTracks.length > 0 && downloadedCount === playlistTracks.length;

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Hero Header */}
      <div
        className="relative p-6 md:p-8 flex flex-col md:flex-row items-end gap-6"
        style={{
          background: `linear-gradient(to bottom, ${playlist.coverColor || '#1db954'}40, #121212)`,
        }}
      >
        <div
          className="w-44 h-44 md:w-52 md:h-52 rounded-xl overflow-hidden shadow-2xl shrink-0 flex items-center justify-center text-black"
          style={{ backgroundColor: playlist.coverColor || '#1db954' }}
        >
          <ListMusic className="w-24 h-24" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-1 block">
            Custom Playlist
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 truncate">
            {playlist.name}
          </h1>
          <p className="text-xs text-neutral-300 mb-3 max-w-xl">
            {playlist.description || 'Personal music mix synced across devices.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-neutral-300">
            <span className="font-semibold text-white">Teramusic</span>
            <span>•</span>
            <span className="text-[#1db954] font-bold">{playlistTracks.length} tracks</span>
            {playlistTracks.length > 0 && (
              <>
                <span>•</span>
                <span className="text-neutral-400">{totalMins} min</span>
              </>
            )}
            {downloadedCount > 0 && (
              <>
                <span>•</span>
                <span className="text-[#1db954]">{downloadedCount} saved offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {playlistTracks.length > 0 && (
            <>
              <button
                onClick={() => onPlayTrack(playlistTracks[0], playlistTracks)}
                className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl shadow-[#1db954]/30 hover:scale-105 transition-all"
                title="Play playlist"
              >
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </button>

              <button
                onClick={() => onShufflePlay(playlistTracks)}
                className="p-3 text-neutral-400 hover:text-white transition-colors"
                title="Shuffle playlist"
              >
                <Shuffle className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Download Entire Playlist to Offline */}
          {playlistTracks.length > 0 && (
            <button
              onClick={() => onDownloadAllPlaylist(playlistTracks)}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                isFullyDownloaded
                  ? 'bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Download entire playlist for offline listening"
            >
              <Download className="w-4 h-4" />
              {isFullyDownloaded ? 'Playlist Downloaded' : 'Download All to Offline'}
            </button>
          )}
        </div>

        {/* Delete Playlist button */}
        <div>
          {showConfirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete playlist?</span>
              <button
                onClick={() => onDeletePlaylist(playlist.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-bold text-white"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
              title="Delete this playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tracks Table */}
      <div className="px-6">
        {playlistTracks.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800/80 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-500">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">This playlist is empty</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Add songs to this playlist from your Google Drive folders or search view.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 border-b border-neutral-800/80 uppercase tracking-wider">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Title</span>
              <span className="hidden md:block w-48">Album</span>
              <span className="w-10">Status</span>
              <span className="w-6"></span>
              <span className="w-12 text-right">Time</span>
              <span className="w-6"></span>
            </div>

            {playlistTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isPlaying={isPlaying && currentTrackId === track.id}
                isCurrent={currentTrackId === track.id}
                isLiked={likedTrackIds.includes(track.id)}
                isOffline={offlineTrackIds.has(track.id)}
                isDownloading={Boolean(downloadingTrackIds[track.id] !== undefined)}
                downloadProgress={downloadingTrackIds[track.id]}
                onPlay={() => onPlayTrack(track, playlistTracks)}
                onToggleLike={() => onToggleLike(track.id)}
                onDownload={() => onDownloadTrack(track)}
                onRemoveOffline={() => onRemoveTrackOffline(track.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
