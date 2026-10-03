import React from 'react';
import { Moon, X, Clock, Check } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimerRemaining: number | null; // seconds remaining, or null
  activeTimerType: string | null;
  onSetTimer: (minutes: number | 'end_of_track') => void;
  onCancelTimer: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeTimerRemaining,
  activeTimerType,
  onSetTimer,
  onCancelTimer,
}) => {
  if (!isOpen) return null;

  const timerOptions: { label: string; value: number | 'end_of_track' }[] = [
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: 'End of Track', value: 'end_of_track' },
  ];

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-[#242424] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1db954]/10 text-[#1db954] rounded-lg">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Sleep Timer</h3>
              <p className="text-xs text-neutral-400">Stop audio playback automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activeTimerRemaining !== null && (
            <div className="bg-[#181818] border border-[#1db954]/30 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#1db954] animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-white">Timer Active</p>
                  <p className="text-xs font-mono text-[#1db954]">
                    {activeTimerType === 'end_of_track'
                      ? 'Pauses at end of track'
                      : `${formatRemaining(activeTimerRemaining)} left`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onCancelTimer();
                }}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium text-neutral-300"
              >
                Turn off
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {timerOptions.map((opt) => {
              const isSelected =
                activeTimerType === String(opt.value) ||
                (activeTimerType === 'end_of_track' && opt.value === 'end_of_track');

              return (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    onSetTimer(opt.value);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30'
                      : 'hover:bg-white/5 text-neutral-300 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#1db954]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
