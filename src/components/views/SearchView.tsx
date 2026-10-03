import React from 'react';
import { Search, Folder, HardDrive, Music, Download } from 'lucide-react';
import { DriveFolder, Track, ViewType } from '../../types';
import { TrackRow } from '../TrackRow';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  tracks: Track[];
  driveFolders: DriveFolder[];
  currentTrackId?: string;
  isPlaying: boolean;
  likedTrackIds: string[];
  offlineTrackIds: Set<string>;
  downloadingTrackIds: Record<string, number>;
  onPlayTrack: (track: Track, queueList: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onDownloadTrack: (track: Track) => void;
  onRemoveTrackOffline: (trackId: string) => void;
  onNavigate: (view: ViewType, id?: string) => void;
}

const CATEGORIES = [
  { name: 'Google Drive Audio', color: '#10b981', type: 'folder' },
  { name: 'Synthwave & Cyber', color: '#8b5cf6', type: 'genre', query: 'Synthwave' },
  { name: 'Lofi Chill & Beats', color: '#f59e0b', type: 'genre', query: 'Lofi' },
  { name: 'Deep Focus Ambient', color: '#3b82f6', type: 'genre', query: 'Ambient' },
  { name: 'Acoustic Guitar', color: '#ec4899', type: 'genre', query: 'Acoustic' },
  { name: 'Downloaded Offline', color: '#1db954', type: 'offline' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  tracks,
  driveFolders,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  offlineTrackIds,
  downloadingTrackIds,
  onPlayTrack,
  onToggleLike,
  onDownloadTrack,
  onRemoveTrackOffline,
  onNavigate,
}) => {
  const query = searchQuery.trim().toLowerCase();

  const filteredTracks = query
    ? tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query) ||
          t.album.toLowerCase().includes(query) ||
          (t.folderName && t.folderName.toLowerCase().includes(query)) ||
          (t.genre && t.genre.toLowerCase().includes(query))
      )
    : [];

  const filteredFolders = query
    ? driveFolders.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          (f.description && f.description.toLowerCase().includes(query))
      )
    : [];

  return (
    <div className="space-y-6 p-6 pb-28 text-white">
      {/* Search Header Input */}
      <div className="relative max-w-xl">
        <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="What do you want to play?"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#242424] border border-transparent focus:border-white/20 rounded-full pl-12 pr-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none transition-all shadow-lg"
          autoFocus
        />
      </div>

      {/* When query is empty: Browse Categories */}
      {!query && (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Browse All Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => {
                  if (cat.type === 'offline') {
                    onNavigate('offline');
                  } else if (cat.query) {
                    onSearchChange(cat.query);
                  }
                }}
                className="relative h-40 p-4 rounded-xl overflow-hidden cursor-pointer hover:scale-102 transition-all shadow-lg select-none group"
                style={{ backgroundColor: cat.color }}
              >
                <h3 className="text-xl font-bold text-white max-w-[80%] leading-tight">
                  {cat.name}
                </h3>
                <div className="absolute -right-3 -bottom-3 w-24 h-24 rotate-25 shadow-xl rounded-lg bg-black/20 flex items-center justify-center text-white/80 group-hover:scale-110 transition-transform">
                  <Music className="w-12 h-12" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* When query is present: Matching Results */}
      {query && (
        <div className="space-y-8">
          {/* Matching Folders */}
          {filteredFolders.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white">Google Drive Folders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => onNavigate('folder', folder.id)}
                    className="p-3 bg-[#181818] hover:bg-[#282828] rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-neutral-800 flex items-center justify-center">
                      {folder.coverUrl ? (
                        <img
                          src={folder.coverUrl}
                          alt={folder.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Folder className="w-10 h-10 text-[#1db954]" />
                      )}
                    </div>
                    <p className="font-bold text-xs truncate">{folder.name}</p>
                    <p className="text-[11px] text-neutral-400">Google Drive Folder</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Matching Songs */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              Songs ({filteredTracks.length})
            </h3>

            {filteredTracks.length === 0 && filteredFolders.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">
                <p className="text-sm">No results found for "{searchQuery}".</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Try checking spelling or search for artist, folder name, or album.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTracks.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={index}
                    isPlaying={isPlaying && currentTrackId === track.id}
                    isCurrent={currentTrackId === track.id}
                    isLiked={likedTrackIds.includes(track.id)}
                    isOffline={offlineTrackIds.has(track.id)}
                    isDownloading={Boolean(downloadingTrackIds[track.id] !== undefined)}
                    downloadProgress={downloadingTrackIds[track.id]}
                    onPlay={() => onPlayTrack(track, filteredTracks)}
                    onToggleLike={() => onToggleLike(track.id)}
                    onDownload={() => onDownloadTrack(track)}
                    onRemoveOffline={() => onRemoveTrackOffline(track.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
