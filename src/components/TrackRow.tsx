import React from 'react';
import { Play, Pause, Heart, Download, CheckCircle2, MoreHorizontal, Music } from 'lucide-react';
import { Track } from '../types';

interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  isCurrent: boolean;
  isLiked: boolean;
  isOffline: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  onPlay: () => void;
  onToggleLike: () => void;
  onDownload: () => void;
  onRemoveOffline?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isPlaying,
  isCurrent,
  isLiked,
  isOffline,
  isDownloading,
  downloadProgress,
  onPlay,
  onToggleLike,
  onDownload,
  onRemoveOffline,
  onAddToQueue,
  onAddToPlaylist,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div
      className={`group relative flex items-center gap-4 px-4 py-2.5 rounded-md transition-colors ${
        isCurrent
          ? 'bg-white/10 text-[#1db954]'
          : 'hover:bg-white/5 text-neutral-300 hover:text-white'
      }`}
      onDoubleClick={onPlay}
    >
      {/* Index or Play Button */}
      <div className="w-8 flex items-center justify-center shrink-0">
        <span className={`text-sm font-medium ${isCurrent ? 'hidden' : 'group-hover:hidden text-neutral-400'}`}>
          {index + 1}
        </span>
        <button
          onClick={onPlay}
          className={`cursor-pointer ${isCurrent ? 'flex' : 'hidden group-hover:flex'} items-center justify-center text-white hover:scale-110 transition-transform`}
          title={isCurrent && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 text-[#1db954] fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current text-white" />
          )}
        </button>
      </div>

      {/* Artwork thumbnail & Title / Artist */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden bg-neutral-800 shadow">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400">
              <Music className="w-5 h-5" />
            </div>
          )}
          {isCurrent && isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-[#1db954] animate-pulse h-full" />
                <span className="w-0.5 bg-[#1db954] animate-pulse h-2" />
                <span className="w-0.5 bg-[#1db954] animate-pulse h-3" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${
              isCurrent ? 'text-[#1db954]' : 'text-white'
            }`}
          >
            {track.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-neutral-400 truncate">
            <span className="hover:underline cursor-pointer truncate">{track.artist}</span>
            {track.folderName && (
              <>
                <span>•</span>
                <span className="text-neutral-500 truncate">{track.folderName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Album name */}
      <div className="hidden md:block w-48 text-xs text-neutral-400 truncate hover:text-white">
        {track.album}
      </div>

      {/* Offline Status Badge */}
      <div className="flex items-center shrink-0">
        {isDownloading ? (
          <div className="flex items-center gap-1.5 text-xs text-[#1db954]">
            <div className="w-3.5 h-3.5 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
            {downloadProgress !== undefined && (
              <span className="text-[10px] font-mono">{downloadProgress}%</span>
            )}
          </div>
        ) : isOffline ? (
          <button
            onClick={onRemoveOffline}
            className="text-[#1db954] hover:text-red-400 transition-colors p-1"
            title="Downloaded offline. Click to remove."
          >
            <CheckCircle2 className="w-4 h-4 fill-[#1db954] text-black" />
          </button>
        ) : (
          <button
            onClick={onDownload}
            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition-opacity p-1"
            title="Download for offline listening"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Like Button */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onToggleLike}
          className={`p-1 transition-all ${
            isLiked
              ? 'text-[#1db954] opacity-100'
              : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white'
          }`}
          title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Duration */}
      <div className="w-12 text-right text-xs text-neutral-400 font-mono shrink-0">
        {formatDuration(track.duration)}
      </div>

      {/* Context Menu Button */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-1 w-48 bg-[#282828] border border-neutral-700 rounded-md shadow-2xl py-1 z-30 text-xs text-neutral-200"
            onMouseLeave={() => setShowMenu(false)}
          >
            {onAddToQueue && (
              <button
                onClick={() => {
                  onAddToQueue();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                Add to queue
              </button>
            )}
            {onAddToPlaylist && (
              <button
                onClick={() => {
                  onAddToPlaylist();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                Add to playlist
              </button>
            )}
            {isOffline ? (
              <button
                onClick={() => {
                  if (onRemoveOffline) onRemoveOffline();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2"
              >
                Remove download ({formatSize(track.offlineBlobSize || track.size)})
              </button>
            ) : (
              <button
                onClick={() => {
                  onDownload();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                Download offline
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
