import React, { useState } from 'react';
import {
  Folder,
  ListMusic,
  Heart,
  Download,
  Plus,
  FolderPlus,
  Play,
  HardDrive,
} from 'lucide-react';
import { DriveFolder, Playlist, Track, ViewType } from '../../types';

interface LibraryViewProps {
  playlists: Playlist[];
  driveFolders: DriveFolder[];
  tracks: Track[];
  likedCount: number;
  offlineCount: number;
  onNavigate: (view: ViewType, id?: string) => void;
  onOpenCreatePlaylist: () => void;
  onOpenAddFolder: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  driveFolders,
  tracks,
  likedCount,
  offlineCount,
  onNavigate,
  onOpenCreatePlaylist,
  onOpenAddFolder,
}) => {
  const [filter, setFilter] = useState<'all' | 'playlists' | 'folders' | 'offline'>('all');

  return (
    <div className="space-y-6 p-6 pb-28 text-white">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Your Library</h1>
          <p className="text-xs text-neutral-400 mt-1">
            All your Drive audio folders, custom playlists, and offline music
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-[#1db954]" />
            Connect Drive Folder
          </button>
          <button
            onClick={onOpenCreatePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-xs font-bold text-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'all' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('folders')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'folders'
              ? 'bg-white text-black'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Drive Folders ({driveFolders.length})
        </button>
        <button
          onClick={() => setFilter('playlists')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'playlists'
              ? 'bg-white text-black'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Playlists ({playlists.length})
        </button>
        <button
          onClick={() => setFilter('offline')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === 'offline'
              ? 'bg-white text-black'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Downloaded ({offlineCount})
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Liked Songs card if all */}
        {(filter === 'all' || filter === 'playlists') && (
          <div
            onClick={() => onNavigate('liked')}
            className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors cursor-pointer flex flex-col"
          >
            <div className="aspect-square w-full rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow">
              <Heart className="w-12 h-12 fill-current" />
            </div>
            <h3 className="font-bold text-sm text-white truncate">Liked Songs</h3>
            <p className="text-xs text-neutral-400 mt-1">Playlist • {likedCount} tracks</p>
          </div>
        )}

        {/* Offline Downloads card if all or offline */}
        {(filter === 'all' || filter === 'offline') && (
          <div
            onClick={() => onNavigate('offline')}
            className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors cursor-pointer flex flex-col"
          >
            <div className="aspect-square w-full rounded-lg overflow-hidden mb-3 bg-[#1db954] flex items-center justify-center text-black shadow">
              <Download className="w-12 h-12" />
            </div>
            <h3 className="font-bold text-sm text-white truncate">Offline Downloads</h3>
            <p className="text-xs text-neutral-400 mt-1">Local Storage • {offlineCount} tracks</p>
          </div>
        )}

        {/* Drive Folders */}
        {(filter === 'all' || filter === 'folders') &&
          driveFolders.map((folder) => {
            const folderTracks = tracks.filter((t) => t.driveFolderId === folder.id);
            return (
              <div
                key={folder.id}
                onClick={() => onNavigate('folder', folder.id)}
                className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors cursor-pointer flex flex-col"
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden mb-3 bg-neutral-800 flex items-center justify-center shadow">
                  {folder.coverUrl ? (
                    <img
                      src={folder.coverUrl}
                      alt={folder.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Folder className="w-12 h-12 text-[#1db954]" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-white truncate">{folder.name}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Google Drive • {folderTracks.length} tracks
                </p>
              </div>
            );
          })}

        {/* Playlists */}
        {(filter === 'all' || filter === 'playlists') &&
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onNavigate('playlist', playlist.id)}
              className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors cursor-pointer flex flex-col"
            >
              <div
                className="aspect-square w-full rounded-lg overflow-hidden mb-3 shadow flex items-center justify-center text-black"
                style={{ backgroundColor: playlist.coverColor }}
              >
                <ListMusic className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-sm text-white truncate">{playlist.name}</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Playlist • {playlist.trackIds.length} tracks
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};
