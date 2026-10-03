import React from 'react';
import { Play, Heart, Download, Folder, Music, ArrowRight, FolderPlus, Globe, Sparkles } from 'lucide-react';
import { DriveFolder, Playlist, Track, ViewType } from '../../types';

interface HomeViewProps {
  tracks: Track[];
  driveFolders: DriveFolder[];
  playlists: Playlist[];
  likedCount: number;
  offlineTracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onNavigate: (view: ViewType, id?: string) => void;
  onOpenAddFolder: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  driveFolders,
  playlists,
  likedCount,
  offlineTracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onNavigate,
  onOpenAddFolder,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 p-6 pb-24 text-white">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
          {getGreeting()}
        </h1>
        <p className="text-xs text-neutral-400">
          Stream music directly from Google Drive folders • Save offline • Sync across devices
        </p>
      </div>

      {/* Community Public Drive Announcement Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-neutral-900 to-[#181818] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#1db954]/20 text-[#1db954]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1db954]" />
              External Public Google Drive Folders
            </h4>
            <p className="text-xs text-neutral-400">
              Have a Google Drive music folder open to anyone with the link? Add it and sync so more people can enjoy your playlist!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('community')}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Explore Public Music
          </button>
          <button
            onClick={onOpenAddFolder}
            className="px-3.5 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-xs font-bold text-black transition-colors"
          >
            + Add Folder ID
          </button>
        </div>
      </div>

      {/* Top Quick 6-Pack Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Liked Songs Quick Card */}
        <div
          onClick={() => onNavigate('liked')}
          className="group flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-all cursor-pointer shadow relative"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shrink-0">
            <Heart className="w-7 h-7 fill-white text-white" />
          </div>
          <div className="px-4 flex-1 font-bold text-sm truncate">Liked Songs</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('liked');
            }}
            className="mr-3 w-10 h-10 rounded-full bg-[#1db954] text-black items-center justify-center shadow-lg shadow-black/40 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hidden sm:flex"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Offline Downloads Quick Card */}
        <div
          onClick={() => onNavigate('offline')}
          className="group flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-all cursor-pointer shadow relative"
        >
          <div className="w-16 h-16 bg-[#1db954] flex items-center justify-center shrink-0 text-black">
            <Download className="w-7 h-7" />
          </div>
          <div className="px-4 flex-1">
            <p className="font-bold text-sm truncate">Offline Downloads</p>
            <p className="text-xs text-neutral-400">{offlineTracks.length} saved</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('offline');
            }}
            className="mr-3 w-10 h-10 rounded-full bg-[#1db954] text-black items-center justify-center shadow-lg shadow-black/40 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hidden sm:flex"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Drive Folders Quick Cards */}
        {driveFolders.slice(0, 4).map((folder) => {
          const folderTracks = tracks.filter((t) => t.driveFolderId === folder.id);
          return (
            <div
              key={folder.id}
              onClick={() => onNavigate('folder', folder.id)}
              className="group flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-all cursor-pointer shadow relative"
            >
              <div className="w-16 h-16 relative shrink-0 overflow-hidden bg-neutral-800">
                {folder.coverUrl ? (
                  <img
                    src={folder.coverUrl}
                    alt={folder.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-7 h-7 text-neutral-400" />
                  </div>
                )}
              </div>
              <div className="px-4 flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{folder.name}</p>
                <p className="text-xs text-neutral-400">{folderTracks.length} tracks</p>
              </div>
              {folderTracks.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(folderTracks[0], folderTracks);
                  }}
                  className="mr-3 w-10 h-10 rounded-full bg-[#1db954] text-black items-center justify-center shadow-lg shadow-black/40 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hidden sm:flex"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Shelf 1: Google Drive Folders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Google Drive Music Folders
            </h2>
            <p className="text-xs text-neutral-400">Streamed straight from cloud audio folders</p>
          </div>
          <button
            onClick={onOpenAddFolder}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1db954] hover:underline"
          >
            <FolderPlus className="w-4 h-4" />
            + Connect Folder
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {driveFolders.map((folder) => {
            const folderTracks = tracks.filter((t) => t.driveFolderId === folder.id);
            return (
              <div
                key={folder.id}
                onClick={() => onNavigate('folder', folder.id)}
                className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-all duration-300 cursor-pointer flex flex-col relative"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-neutral-800 shadow-md">
                  {folder.coverUrl ? (
                    <img
                      src={folder.coverUrl}
                      alt={folder.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                      <Folder className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}

                  {folderTracks.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(folderTracks[0], folderTracks);
                      }}
                      className="absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl shadow-black/60 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 hover:scale-105"
                      title="Play folder"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-sm text-white truncate">{folder.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  {folder.description || `${folderTracks.length} tracks available`}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Shelf 2: Downloaded for Offline Playback (if any exist) */}
      {offlineTracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Download className="w-5 h-5 text-[#1db954]" />
                Saved for Offline Playback
              </h2>
              <p className="text-xs text-neutral-400">
                Ready to play anytime without internet connection
              </p>
            </div>
            <button
              onClick={() => onNavigate('offline')}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
            >
              See all ({offlineTracks.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {offlineTracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track, offlineTracks)}
                className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-all duration-300 cursor-pointer flex flex-col relative"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-neutral-800 shadow-md">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}

                  <button
                    className="absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl shadow-black/60 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 hover:scale-105"
                    title="Play track"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white truncate">{track.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shelf 3: Your Custom Playlists */}
      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Your Playlists</h2>
              <p className="text-xs text-neutral-400">Custom mixes synced across all your devices</p>
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
            >
              See all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => {
              const playlistTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));
              return (
                <div
                  key={playlist.id}
                  onClick={() => onNavigate('playlist', playlist.id)}
                  className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-all duration-300 cursor-pointer flex flex-col relative"
                >
                  <div
                    className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 shadow-md flex items-center justify-center text-black"
                    style={{ backgroundColor: playlist.coverColor }}
                  >
                    <Music className="w-14 h-14" />
                    {playlistTracks.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack(playlistTracks[0], playlistTracks);
                        }}
                        className="absolute right-2 bottom-2 w-11 h-11 rounded-full bg-black text-[#1db954] flex items-center justify-center shadow-xl shadow-black/60 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white truncate">{playlist.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                    {playlist.description || `${playlist.trackIds.length} tracks`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
