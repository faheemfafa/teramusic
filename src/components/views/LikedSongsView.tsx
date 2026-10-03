import React from 'react';
import { Heart, Play, Shuffle, Download, Music } from 'lucide-react';
import { Track } from '../../types';
import { TrackRow } from '../TrackRow';

interface LikedSongsViewProps {
  likedTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  offlineTrackIds: Set<string>;
  downloadingTrackIds: Record<string, number>;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onShufflePlay: (queueList: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onDownloadTrack: (track: Track) => void;
  onRemoveTrackOffline: (trackId: string) => void;
  onDownloadAllLiked: () => void;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({
  likedTracks,
  currentTrackId,
  isPlaying,
  offlineTrackIds,
  downloadingTrackIds,
  onPlayTrack,
  onShufflePlay,
  onToggleLike,
  onDownloadTrack,
  onRemoveTrackOffline,
  onDownloadAllLiked,
}) => {
  const totalDuration = likedTracks.reduce((acc, t) => acc + t.duration, 0);
  const totalMins = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Hero Header */}
      <div className="relative p-6 md:p-8 bg-gradient-to-b from-indigo-700 via-purple-900 to-[#121212] flex flex-col md:flex-row items-end gap-6">
        <div className="w-44 h-44 md:w-52 md:h-52 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-xl shadow-2xl flex items-center justify-center shrink-0 text-white">
          <Heart className="w-24 h-24 fill-current" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-1 block">
            Playlist
          </span>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white mb-3">
            Liked Songs
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-neutral-300">
            <span className="font-semibold text-white">Synced with your account</span>
            <span>•</span>
            <span className="text-[#1db954] font-bold">{likedTracks.length} songs</span>
            {likedTracks.length > 0 && (
              <>
                <span>•</span>
                <span className="text-neutral-400">about {totalMins} min</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Row */}
      {likedTracks.length > 0 && (
        <div className="px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onPlayTrack(likedTracks[0], likedTracks)}
              className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl shadow-[#1db954]/30 hover:scale-105 transition-all"
              title="Play all liked songs"
            >
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </button>

            <button
              onClick={() => onShufflePlay(likedTracks)}
              className="p-3 text-neutral-400 hover:text-white transition-colors"
              title="Shuffle"
            >
              <Shuffle className="w-6 h-6" />
            </button>

            <button
              onClick={onDownloadAllLiked}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              title="Download all for offline"
            >
              <Download className="w-3.5 h-3.5 text-[#1db954]" />
              Download All
            </button>
          </div>
        </div>
      )}

      {/* Tracks */}
      <div className="px-6">
        {likedTracks.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800/80 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-500">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Songs you like will appear here</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Save songs by clicking the heart icon on any track in your Google Drive folders or
              playlists.
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

            {likedTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isPlaying={isPlaying && currentTrackId === track.id}
                isCurrent={currentTrackId === track.id}
                isLiked={true}
                isOffline={offlineTrackIds.has(track.id)}
                isDownloading={Boolean(downloadingTrackIds[track.id] !== undefined)}
                downloadProgress={downloadingTrackIds[track.id]}
                onPlay={() => onPlayTrack(track, likedTracks)}
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
