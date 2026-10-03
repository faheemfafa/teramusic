import React from 'react';
import { Sliders, X, RotateCcw } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_LABELS, EQ_PRESETS } from '../services/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: number[];
  currentPreset: string;
  onChangeGains: (gains: number[]) => void;
  onSelectPreset: (presetName: string) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  gains,
  currentPreset,
  onChangeGains,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const handleBandChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    onChangeGains(updated);
  };

  const handleReset = () => {
    onSelectPreset('Flat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#242424] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1db954]/10 text-[#1db954] rounded-lg">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Audio Equalizer</h3>
              <p className="text-xs text-neutral-400">Tailor your sound frequencies & audio profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Presets
              </span>
              <button
                onClick={handleReset}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(EQ_PRESETS).map((preset) => {
                const isActive = currentPreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => onSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1db954] text-black font-bold shadow-lg shadow-[#1db954]/20'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Vertical Sliders */}
          <div className="bg-[#181818] border border-neutral-800 rounded-xl p-6">
            <div className="grid grid-cols-5 gap-4 h-48 items-center justify-items-center">
              {EQ_FREQUENCIES.map((_, index) => {
                const gain = gains[index] || 0;
                return (
                  <div key={index} className="flex flex-col items-center h-full justify-between w-full">
                    <span className="text-[11px] font-mono font-medium text-neutral-400">
                      {gain > 0 ? `+${gain}` : gain} dB
                    </span>

                    <div className="relative flex-1 flex items-center justify-center my-2">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        onChange={(e) => handleBandChange(index, Number(e.target.value))}
                        className="w-32 -rotate-90 origin-center accent-[#1db954]"
                      />
                    </div>

                    <div className="text-center">
                      <span className="text-xs font-bold text-neutral-200">
                        {EQ_LABELS[index]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black transition-all hover:scale-105"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
