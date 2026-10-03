import React from 'react';
import {
  Home,
  Search,
  Library,
  Heart,
  Download,
  Folder,
  Plus,
  Radio,
  WifiOff,
  RefreshCw,
  FolderPlus,
  Globe,
} from 'lucide-react';
import { DriveFolder, Playlist, ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  selectedId?: string;
  playlists: Playlist[];
  driveFolders: DriveFolder[];
  likedCount: number;
  offlineCount: number;
  offlineOnlyMode: boolean;
  syncCode: string;
  isSyncing: boolean;
  onNavigate: (view: ViewType, id?: string) => void;
  onOpenCreatePlaylist: () => void;
  onOpenAddDriveFolder: () => void;
  onOpenSyncModal: () => void;
  onToggleOfflineOnly: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedId,
  playlists,
  driveFolders,
  likedCount,
  offlineCount,
  offlineOnlyMode,
  syncCode,
  isSyncing,
  onNavigate,
  onOpenCreatePlaylist,
  onOpenAddDriveFolder,
  onOpenSyncModal,
  onToggleOfflineOnly,
}) => {
  return (
    <aside className="w-64 bg-[#000000] flex flex-col h-full select-none border-r border-neutral-900/60 p-3 gap-2">
      {/* Brand Header & Top Nav Card */}
      <div className="bg-[#121212] rounded-lg p-4 space-y-4">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-black font-black text-lg group-hover:scale-105 transition-transform shadow-md shadow-[#1db954]/20">
            <Radio className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white group-hover:text-[#1db954] transition-colors">
              Teramusic
            </span>
            <span className="block text-[10px] font-mono text-neutral-400">
              DRIVE • OFFLINE • SYNC
            </span>
          </div>
        </div>

        {/* Primary Nav */}
        <nav className="space-y-1">
          <button
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition-colors ${
              currentView === 'home'
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            Home
          </button>

          <button
            onClick={() => onNavigate('search')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition-colors ${
              currentView === 'search'
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search className="w-5 h-5" />
            Search
          </button>

          <button
            onClick={() => onNavigate('community')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition-colors ${
              currentView === 'community'
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-5 h-5 text-[#1db954]" />
            Public Drive Music
          </button>
        </nav>
      </div>

      {/* Library & Custom Shelves Card */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 py-2 text-neutral-400">
          <button
            onClick={() => onNavigate('library')}
            className={`flex items-center gap-2 text-sm font-bold hover:text-white transition-colors ${
              currentView === 'library' ? 'text-white' : ''
            }`}
          >
            <Library className="w-5 h-5" />
            Your Library
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenAddDriveFolder}
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Connect Google Drive Folder"
            >
              <FolderPlus className="w-4 h-4 text-[#1db954]" />
            </button>
            <button
              onClick={onOpenCreatePlaylist}
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Create Playlist"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Offline Mode Toggle Bar */}
        <div className="my-2 p-2 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className={`w-3.5 h-3.5 ${offlineOnlyMode ? 'text-[#1db954]' : 'text-neutral-500'}`} />
            <span className={offlineOnlyMode ? 'text-[#1db954] font-semibold' : 'text-neutral-400'}>
              Offline Only Mode
            </span>
          </div>
          <button
            onClick={onToggleOfflineOnly}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              offlineOnlyMode ? 'bg-[#1db954]' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                offlineOnlyMode ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Quick Collections: Liked & Downloads */}
        <div className="space-y-1 mb-2">
          {/* Liked Songs */}
          <button
            onClick={() => onNavigate('liked')}
            className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left ${
              currentView === 'liked' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-300'
            }`}
          >
            <div className="w-9 h-9 rounded bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow">
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-white">Liked Songs</p>
              <p className="text-[11px] text-neutral-400">{likedCount} tracks</p>
            </div>
          </button>

          {/* Offline Downloads */}
          <button
            onClick={() => onNavigate('offline')}
            className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left ${
              currentView === 'offline' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-300'
            }`}
          >
            <div className="w-9 h-9 rounded bg-[#1db954] flex items-center justify-center shrink-0 shadow text-black">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold truncate text-white">Offline Downloads</p>
              </div>
              <p className="text-[11px] text-neutral-400">{offlineCount} downloaded</p>
            </div>
          </button>
        </div>

        <div className="h-px bg-neutral-800/80 my-1" />

        {/* Scrollable list of Playlists and Google Drive Folders */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
          {/* Drive Folders Section */}
          <div className="pt-1 pb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-500 px-2 tracking-wider">
              Google Drive Folders
            </span>
            {driveFolders.map((folder) => {
              const isSelected = currentView === 'folder' && selectedId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => onNavigate('folder', folder.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors text-left truncate ${
                    isSelected
                      ? 'bg-white/10 text-[#1db954] font-semibold'
                      : 'hover:bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Folder
                    className="w-4 h-4 shrink-0"
                    style={{ color: folder.color || '#1db954' }}
                  />
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
          </div>

          {/* User Playlists Section */}
          <div className="pt-2 pb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-500 px-2 tracking-wider">
              Playlists
            </span>
            {playlists.length === 0 ? (
              <p className="text-[11px] text-neutral-500 px-2 py-1">No playlists yet</p>
            ) : (
              playlists.map((playlist) => {
                const isSelected = currentView === 'playlist' && selectedId === playlist.id;
                return (
                  <button
                    key={playlist.id}
                    onClick={() => onNavigate('playlist', playlist.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors text-left truncate ${
                      isSelected
                        ? 'bg-white/10 text-[#1db954] font-semibold'
                        : 'hover:bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: playlist.coverColor }}
                    />
                    <span className="truncate">{playlist.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Cross-Platform Device Sync Status Footer */}
        <div className="pt-2 border-t border-neutral-800">
          <button
            onClick={onOpenSyncModal}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#1db954] shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate font-mono">
                  {syncCode}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">Device Sync Active</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#1db954] group-hover:underline">
              Sync
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
