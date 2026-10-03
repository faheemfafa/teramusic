import React, { useState } from 'react';
import { Folder, Play, Shuffle, Download, Trash2, HardDrive, ExternalLink } from 'lucide-react';
import { DriveFolder, Track } from '../../types';
import { TrackRow } from '../TrackRow';

interface FolderDetailViewProps {
  folder: DriveFolder;
  folderTracks: Track[];
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
  onDownloadAllFolder: (tracks: Track[]) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export const FolderDetailView: React.FC<FolderDetailViewProps> = ({
  folder,
  folderTracks,
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
  onDownloadAllFolder,
  onDeleteFolder,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const totalDuration = folderTracks.reduce((acc, t) => acc + t.duration, 0);
  const totalMins = Math.floor(totalDuration / 60);

  const downloadedCount = folderTracks.filter((t) => offlineTrackIds.has(t.id)).length;
  const isFullyDownloaded = folderTracks.length > 0 && downloadedCount === folderTracks.length;

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Hero Header */}
      <div
        className="relative p-6 md:p-8 flex flex-col md:flex-row items-end gap-6"
        style={{
          background: `linear-gradient(to bottom, ${folder.color || '#1db954'}40, #121212)`,
        }}
      >
        <div className="w-44 h-44 md:w-52 md:h-52 rounded-xl overflow-hidden shadow-2xl bg-neutral-800 shrink-0 flex items-center justify-center">
          {folder.coverUrl ? (
            <img src={folder.coverUrl} alt={folder.name} className="w-full h-full object-cover" />
          ) : (
            <Folder className="w-24 h-24" style={{ color: folder.color || '#1db954' }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-1 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#1db954]" />
            Google Drive Audio Folder
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 truncate">
            {folder.name}
          </h1>
          <p className="text-xs text-neutral-300 mb-3 max-w-xl">
            {folder.description || 'Audio tracks directly loaded from Google Drive folder.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-neutral-300">
            <span className="font-semibold text-white">Google Drive</span>
            <span>•</span>
            <span className="text-[#1db954] font-bold">{folderTracks.length} tracks</span>
            {folderTracks.length > 0 && (
              <>
                <span>•</span>
                <span className="text-neutral-400">approx {totalMins} min</span>
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
          {folderTracks.length > 0 && (
            <>
              <button
                onClick={() => onPlayTrack(folderTracks[0], folderTracks)}
                className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl shadow-[#1db954]/30 hover:scale-105 transition-all"
                title="Play folder"
              >
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </button>

              <button
                onClick={() => onShufflePlay(folderTracks)}
                className="p-3 text-neutral-400 hover:text-white transition-colors"
                title="Shuffle folder"
              >
                <Shuffle className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Download Entire Folder button */}
          <button
            onClick={() => onDownloadAllFolder(folderTracks)}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              isFullyDownloaded
                ? 'bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/40'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Download entire folder for offline listening"
          >
            <Download className="w-4 h-4" />
            {isFullyDownloaded ? 'Folder Downloaded' : 'Download All to Offline'}
          </button>

          {folder.url && (
            <a
              href={folder.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              title="Open folder in Google Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Remove Custom Folder option */}
        {folder.isCustom && onDeleteFolder && (
          <div>
            {showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Disconnect?</span>
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-bold text-white"
                >
                  Yes, Remove
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
                title="Disconnect this Google Drive folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tracks Table */}
      <div className="px-6">
        {folderTracks.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">
            No audio files found in this Google Drive folder.
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

            {folderTracks.map((track, index) => (
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
                onPlay={() => onPlayTrack(track, folderTracks)}
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
