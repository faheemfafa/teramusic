import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteAllOfflineModalProps {
  isOpen: boolean;
  trackCount: number;
  totalSizeBytes: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteAllOfflineModal: React.FC<DeleteAllOfflineModalProps> = ({
  isOpen,
  trackCount,
  totalSizeBytes,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const totalMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#242424] border border-neutral-700/80 rounded-xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-red-400 mb-4">
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete All Downloads?</h3>
            <p className="text-xs text-neutral-400">Offline storage cleanup</p>
          </div>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed mb-6">
          This will delete all <strong className="text-white">{trackCount} downloaded songs</strong> (
          <span className="text-[#1db954] font-medium">{totalMB} MB</span>) from your browser's
          local offline cache. You will only be able to stream them while connected to the internet.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-full text-sm font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 hover:scale-105"
          >
            <Trash2 className="w-4 h-4" />
            Delete All Downloads
          </button>
        </div>
      </div>
    </div>
  );
};
