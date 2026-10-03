import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  ListMusic,
  Sliders,
  Moon,
  CheckCircle2,
  Music,
} from 'lucide-react';
import { RepeatMode, Track } from '../types';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isLiked: boolean;
  isOffline: boolean;
  playbackSpeed: number;
  activeSleepTimerMinutes: number | null;
  isQueueOpen: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: () => void;
  onToggleQueue: () => void;
  onOpenFullscreen: () => void;
  onOpenEq: () => void;
  onOpenSleepTimer: () => void;
  onChangeSpeed: (speed: number) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  isLiked,
  isOffline,
  playbackSpeed,
  activeSleepTimerMinutes,
  isQueueOpen,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleQueue,
  onOpenFullscreen,
  onOpenEq,
  onOpenSleepTimer,
  onChangeSpeed,
}) => {
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const currentVol = isMuted ? 0 : volume;

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekTime(ratio * (duration || 0));
  };

  const speeds = [0.8, 1.0, 1.25, 1.5, 2.0];

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onChangeSpeed(speeds[nextIndex]);
  };

  return (
    <footer className="h-22 bg-[#181818] border-t border-neutral-800/80 px-4 grid grid-cols-3 items-center z-40 relative select-none">
      {/* Left: Track Details */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        {currentTrack ? (
          <>
            <div
              onClick={onOpenFullscreen}
              className="relative w-14 h-14 rounded overflow-hidden shrink-0 bg-neutral-800 group cursor-pointer shadow"
              title="Expand to Fullscreen"
            >
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  <Music className="w-6 h-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p
                  onClick={onOpenFullscreen}
                  className="text-sm font-semibold text-white truncate hover:underline cursor-pointer"
                >
                  {currentTrack.title}
                </p>
                {isOffline && (
                  <span title="Playing from offline storage">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954] shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 truncate hover:text-white cursor-pointer hover:underline">
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={onToggleLike}
              className={`p-1.5 transition-transform hover:scale-110 shrink-0 ${
                isLiked ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              }`}
              title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <div className="w-14 h-14 rounded bg-neutral-800/60 flex items-center justify-center">
              <Music className="w-6 h-6 text-neutral-600" />
            </div>
            <span>No track selected</span>
          </div>
        )}
      </div>

      {/* Center: Controls and Seekbar */}
      <div className="flex flex-col items-center max-w-xl mx-auto w-full gap-1.5">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 transition-colors relative ${
              isShuffle ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
            title="Enable shuffle"
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
            )}
          </button>

          <button
            onClick={onPrev}
            className="p-1.5 text-neutral-300 hover:text-white transition-transform hover:scale-105"
            title="Previous track"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="w-9 h-9 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:pointer-events-none shadow"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-neutral-300 hover:text-white transition-transform hover:scale-105"
            title="Next track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1.5 transition-colors relative ${
              repeatMode !== 'off' ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeatMode !== 'off' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
            )}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-[11px] font-mono text-neutral-400 w-8 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="relative flex-1 group py-1.5 cursor-pointer"
            onMouseEnter={() => setIsHoveringSeek(true)}
            onMouseLeave={() => {
              setIsHoveringSeek(false);
              setHoverSeekTime(null);
            }}
            onMouseMove={handleSeekMouseMove}
          >
            {/* Timestamp popup on hover */}
            {isHoveringSeek && hoverSeekTime !== null && (
              <div
                className="absolute -top-7 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-white -translate-x-1/2 pointer-events-none z-30"
                style={{
                  left: `${(hoverSeekTime / (duration || 1)) * 100}%`,
                }}
              >
                {formatTime(hoverSeekTime)}
              </div>
            )}

            <div className="relative h-1 w-full bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-colors ${
                  isHoveringSeek ? 'bg-[#1db954]' : 'bg-white'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[11px] font-mono text-neutral-400 w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Sound & Feature Tools */}
      <div className="flex items-center justify-end gap-2.5 pl-4">
        {/* Playback Speed */}
        <button
          onClick={cycleSpeed}
          className="text-xs font-mono font-bold text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-white/10"
          title="Playback speed"
        >
          {playbackSpeed}x
        </button>

        {/* Equalizer */}
        <button
          onClick={onOpenEq}
          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
          title="Audio Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Sleep Timer */}
        <button
          onClick={onOpenSleepTimer}
          className={`p-1.5 transition-colors relative ${
            activeSleepTimerMinutes !== null ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
          }`}
          title="Sleep Timer"
        >
          <Moon className="w-4 h-4" />
          {activeSleepTimerMinutes !== null && (
            <span className="absolute -top-1 -right-1 text-[9px] bg-[#1db954] text-black font-bold px-1 rounded-full">
              {activeSleepTimerMinutes}m
            </span>
          )}
        </button>

        {/* Queue Drawer Toggle */}
        <button
          onClick={onToggleQueue}
          className={`p-1.5 transition-colors ${
            isQueueOpen ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
          }`}
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-1.5 group">
          <button
            onClick={onToggleMute}
            className="text-neutral-400 hover:text-white p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {currentVol === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : currentVol < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="relative w-20 flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={currentVol}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full accent-[#1db954] h-1"
            />
          </div>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={onOpenFullscreen}
          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
          title="Fullscreen Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
