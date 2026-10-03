import React from 'react';
import { Download, Trash2, Play, Shuffle, WifiOff, HardDrive, AlertCircle } from 'lucide-react';
import { Track } from '../../types';
import { TrackRow } from '../TrackRow';

interface OfflineViewProps {
  offlineTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  likedTrackIds: string[];
  offlineOnlyMode: boolean;
  downloadingTrackIds: Record<string, number>;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onShufflePlay: (queueList: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onRemoveTrackOffline: (trackId: string) => void;
  onOpenDeleteAllModal: () => void;
  onToggleOfflineOnly: () => void;
}

export const OfflineView: React.FC<OfflineViewProps> = ({
  offlineTracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  offlineOnlyMode,
  downloadingTrackIds,
  onPlayTrack,
  onShufflePlay,
  onToggleLike,
  onRemoveTrackOffline,
  onOpenDeleteAllModal,
  onToggleOfflineOnly,
}) => {
  const totalSizeBytes = offlineTracks.reduce(
    (acc, t) => acc + (t.offlineBlobSize || t.size || 0),
    0
  );
  const totalMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Spotify-styled Hero Header */}
      <div className="relative p-6 md:p-8 bg-gradient-to-b from-[#1db954]/40 via-[#121212]/80 to-[#121212] flex flex-col md:flex-row items-end gap-6">
        <div className="w-44 h-44 md:w-52 md:h-52 bg-gradient-to-br from-[#1db954] to-emerald-800 rounded-xl shadow-2xl flex items-center justify-center shrink-0 text-black">
          <Download className="w-24 h-24" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1db954] mb-1 block">
            Offline Storage
          </span>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white mb-3">
            Downloaded Songs
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-neutral-300">
            <span className="font-semibold text-white">Local Cache</span>
            <span>•</span>
            <span className="text-[#1db954] font-bold">{offlineTracks.length} tracks</span>
            <span>•</span>
            <span className="font-mono text-neutral-400">{totalMB} MB stored</span>
            <span>•</span>
            <span>Plays anywhere without internet</span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {offlineTracks.length > 0 && (
            <>
              <button
                onClick={() => onPlayTrack(offlineTracks[0], offlineTracks)}
                className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl shadow-[#1db954]/30 hover:scale-105 transition-all"
                title="Play all offline"
              >
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </button>

              <button
                onClick={() => onShufflePlay(offlineTracks)}
                className="p-3 text-neutral-400 hover:text-white transition-colors"
                title="Shuffle all offline"
              >
                <Shuffle className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Delete All Downloads button */}
          {offlineTracks.length > 0 && (
            <button
              onClick={onOpenDeleteAllModal}
              className="px-4 py-2 rounded-full border border-red-500/40 hover:border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Downloads
            </button>
          )}
        </div>

        {/* Offline Only Mode Toggle */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 text-xs">
          <WifiOff className={`w-4 h-4 ${offlineOnlyMode ? 'text-[#1db954]' : 'text-neutral-400'}`} />
          <span className="text-neutral-300 font-medium">Offline Only Mode</span>
          <button
            onClick={onToggleOfflineOnly}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              offlineOnlyMode ? 'bg-[#1db954]' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                offlineOnlyMode ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Track List or Empty State */}
      <div className="px-6">
        {offlineTracks.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800/80 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-500">
              <HardDrive className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No downloaded songs yet</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Click the download arrow <Download className="w-3.5 h-3.5 inline text-[#1db954]" /> next to
              any song or in any Google Drive folder to save it locally in your browser. Downloaded songs
              can be played completely offline!
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

            {offlineTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isPlaying={isPlaying && currentTrackId === track.id}
                isCurrent={currentTrackId === track.id}
                isLiked={likedTrackIds.includes(track.id)}
                isOffline={true}
                isDownloading={Boolean(downloadingTrackIds[track.id] !== undefined)}
                downloadProgress={downloadingTrackIds[track.id]}
                onPlay={() => onPlayTrack(track, offlineTracks)}
                onToggleLike={() => onToggleLike(track.id)}
                onDownload={() => {}}
                onRemoveOffline={() => onRemoveTrackOffline(track.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
