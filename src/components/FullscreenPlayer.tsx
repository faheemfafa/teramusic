import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Sliders,
  Moon,
  CheckCircle2,
  Music,
  Radio,
} from 'lucide-react';
import { RepeatMode, Track } from '../types';
import { audioEngine } from '../services/audioEngine';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
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
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: () => void;
  onOpenEq: () => void;
  onOpenSleepTimer: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
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
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onOpenEq,
  onOpenSleepTimer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics'>('visualizer');

  // Keyboard shortcut to close fullscreen with Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time Audio Visualizer Loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const freqData = audioEngine.getVisualizerData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / freqData.length) * 2.2;
      let x = 0;

      for (let i = 0; i < freqData.length; i++) {
        const barHeight = (freqData[i] / 255) * canvas.height * 0.95;

        // Spotify Green to Cyan gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#1db954');
        gradient.addColorStop(0.6, '#1ed760');
        gradient.addColorStop(1, '#38bdf8');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth - 3, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, isPlaying]);

  if (!isOpen || !currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col justify-between p-6 md:p-12 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200 select-none">
      {/* Dynamic blurred ambient glow in background */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] opacity-30 pointer-events-none"
        style={{ backgroundColor: '#1db954' }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[160px] opacity-25 pointer-events-none"
        style={{ backgroundColor: '#3b82f6' }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          <Radio className="w-4 h-4 text-[#1db954] animate-pulse" />
          Playing from {currentTrack.folderName || 'Google Drive'}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/10 rounded-full p-1 text-xs">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-3 py-1 rounded-full transition-colors ${
                activeTab === 'visualizer' ? 'bg-[#1db954] text-black font-bold' : 'text-neutral-300'
              }`}
            >
              Visualizer
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-3 py-1 rounded-full transition-colors ${
                activeTab === 'lyrics' ? 'bg-[#1db954] text-black font-bold' : 'text-neutral-300'
              }`}
            >
              Vibes & Info
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Minimize (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Main Stage */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 my-auto max-w-5xl mx-auto w-full">
        {/* Vinyl / Cover Art */}
        <div className="relative w-64 h-64 md:w-88 md:h-88 shrink-0 flex items-center justify-center">
          {/* Vinyl Record Behind Art */}
          <div
            className={`absolute inset-0 rounded-full bg-black border-4 border-neutral-800 shadow-2xl flex items-center justify-center transition-all ${
              isPlaying ? 'animate-spin-slow scale-105' : 'animate-spin-paused'
            }`}
          >
            <div className="w-24 h-24 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-[#1db954]" />
            </div>
          </div>

          {/* Main Cover Artwork */}
          <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-10 group">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <Music className="w-16 h-16 text-neutral-600" />
              </div>
            )}
          </div>
        </div>

        {/* Info & Visualizer / Lyrics */}
        <div className="flex-1 flex flex-col justify-center min-w-0 max-w-md w-full">
          <div className="flex items-center gap-2 mb-2">
            {isOffline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1db954]/20 text-[#1db954] text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Downloaded Offline
              </span>
            )}
            <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-neutral-300">
              {currentTrack.source === 'google_drive' ? 'Google Drive Audio' : 'High Quality Audio'}
            </span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold text-white truncate tracking-tight">
            {currentTrack.title}
          </h2>
          <p className="text-base md:text-xl text-neutral-400 font-medium truncate mt-1">
            {currentTrack.artist}
          </p>
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {currentTrack.album}
          </p>

          {/* Tab 1: Real-time Web Audio Visualizer */}
          {activeTab === 'visualizer' && (
            <div className="mt-6 bg-black/40 border border-neutral-800/80 rounded-xl p-4 flex flex-col items-center justify-center">
              <canvas
                ref={canvasRef}
                width={360}
                height={80}
                className="w-full h-20 rounded"
              />
              <span className="text-[10px] text-neutral-500 font-mono mt-2 tracking-wider">
                REAL-TIME FREQUENCY SPECTRUM • WEB AUDIO ANALYSER
              </span>
            </div>
          )}

          {/* Tab 2: Track Insights / Simulated Lyrics */}
          {activeTab === 'lyrics' && (
            <div className="mt-6 bg-black/40 border border-neutral-800/80 rounded-xl p-4 max-h-36 overflow-y-auto space-y-2 text-sm text-neutral-300">
              <p className="text-[#1db954] font-semibold text-xs uppercase tracking-wider">Vibe Insights</p>
              <p className="italic text-white">"Immerse in the smooth driving rhythms and deep bass frequencies."</p>
              <p className="text-xs text-neutral-400">
                Genre: {currentTrack.genre || 'Electronic / Lofi'} • Added to library: {new Date(currentTrack.addedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-10 max-w-3xl mx-auto w-full space-y-4">
        {/* Scrubber Timeline */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-mono text-neutral-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group py-2 cursor-pointer">
            <div className="relative h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[#1db954] rounded-full transition-all"
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
          <span className="text-xs font-mono text-neutral-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleLike}
              className={`p-2 transition-transform hover:scale-110 ${
                isLiked ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onOpenEq}
              className="p-2 text-neutral-400 hover:text-white hover:scale-110 transition-transform"
              title="Equalizer"
            >
              <Sliders className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSleepTimer}
              className="p-2 text-neutral-400 hover:text-white hover:scale-110 transition-transform"
              title="Sleep Timer"
            >
              <Moon className="w-5 h-5" />
            </button>
          </div>

          {/* Central Play Controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={onToggleShuffle}
              className={`p-2 transition-colors ${
                isShuffle ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={onPrev}
              className="p-2 text-neutral-200 hover:text-white hover:scale-110 transition-transform"
              title="Previous"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-14 h-14 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-all hover:scale-105 shadow-xl shadow-white/10"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 text-neutral-200 hover:text-white hover:scale-110 transition-transform"
              title="Next"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== 'off' ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              }`}
              title="Repeat"
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-32">
            <button
              onClick={onToggleMute}
              className="text-neutral-400 hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-24 accent-[#1db954]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
