import React from 'react';
import { X, Trash2, Play, Music, ArrowUp, ArrowDown } from 'lucide-react';
import { Track } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  onSelectQueueIndex: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onMoveQueueItem: (from: number, to: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  queue,
  queueIndex,
  onSelectQueueIndex,
  onRemoveFromQueue,
  onMoveQueueItem,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  const upNext = queue.slice(queueIndex + 1);

  return (
    <aside className="fixed right-0 top-0 bottom-24 w-80 md:w-96 bg-[#181818] border-l border-neutral-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h3 className="font-bold text-base">Play Queue</h3>
        <div className="flex items-center gap-2">
          {upNext.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-white/10"
              title="Clear up next"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing */}
        {currentTrack && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 block">
              Now Playing
            </span>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-neutral-800">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    <Music className="w-6 h-6" />
                  </div>
                )}
                {isPlaying && (
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
                <p className="text-sm font-semibold text-[#1db954] truncate">{currentTrack.title}</p>
                <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Next In Queue ({upNext.length})
            </span>
          </div>

          {upNext.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              Queue is empty. Select a song or folder to add tracks.
            </p>
          ) : (
            <div className="space-y-1">
              {upNext.map((track, i) => {
                const actualIndex = queueIndex + 1 + i;
                return (
                  <div
                    key={`${track.id}-${actualIndex}`}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-xs"
                  >
                    <span className="w-4 text-neutral-500 font-mono text-center">
                      {i + 1}
                    </span>

                    <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-neutral-800">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate group-hover:text-[#1db954] transition-colors">
                        {track.title}
                      </p>
                      <p className="text-neutral-400 truncate">{track.artist}</p>
                    </div>

                    {/* Controls on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelectQueueIndex(actualIndex)}
                        className="p-1 hover:text-[#1db954]"
                        title="Play now"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      {i > 0 && (
                        <button
                          onClick={() => onMoveQueueItem(actualIndex, actualIndex - 1)}
                          className="p-1 hover:text-white"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {i < upNext.length - 1 && (
                        <button
                          onClick={() => onMoveQueueItem(actualIndex, actualIndex + 1)}
                          className="p-1 hover:text-white"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveFromQueue(actualIndex)}
                        className="p-1 hover:text-red-400"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
