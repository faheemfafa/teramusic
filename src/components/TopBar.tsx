import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  FolderPlus,
  Sliders,
  HardDrive,
  Download,
} from 'lucide-react';
import { ViewType } from '../types';

interface TopBarProps {
  currentView: ViewType;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onOpenAddFolder: () => void;
  onOpenSync: () => void;
  onOpenEq: () => void;
  syncCode: string;
  isSyncing: boolean;
  totalOfflineMB: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onOpenAddFolder,
  onOpenSync,
  onOpenEq,
  syncCode,
  isSyncing,
  totalOfflineMB,
}) => {
  return (
    <header className="h-16 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between border-b border-neutral-900/40">
      {/* Navigation History & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or Drive folders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#242424] border border-transparent focus:border-white/20 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Action Buttons & Sync */}
      <div className="flex items-center gap-3">
        {/* Storage Badge */}
        {totalOfflineMB > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Download className="w-3.5 h-3.5 text-[#1db954]" />
            <span>{totalOfflineMB.toFixed(1)} MB Offline</span>
          </div>
        )}

        {/* Equalizer Quick Button */}
        <button
          onClick={onOpenEq}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          title="Equalizer & Sound"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Add Google Drive Folder */}
        <button
          onClick={onOpenAddFolder}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all hover:scale-105"
        >
          <FolderPlus className="w-4 h-4 text-[#1db954]" />
          <span className="hidden md:inline">Connect Drive Folder</span>
        </button>

        {/* Cross-Platform Device Sync Pill */}
        <button
          onClick={onOpenSync}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all hover:scale-105 shadow-md shadow-[#1db954]/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="font-mono">{syncCode}</span>
        </button>
      </div>
    </header>
  );
};
