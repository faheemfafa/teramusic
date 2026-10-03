import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Play,
  Share2,
  HardDrive,
  Users,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { DriveFolder, Track } from '../../types';
import { fetchCommunityDriveFolders } from '../../services/googleDriveService';

interface CommunityViewProps {
  onOpenAddFolder: () => void;
  onPlayFolder: (folder: DriveFolder, tracks: Track[]) => void;
  onAddToLibrary: (folder: DriveFolder, tracks: Track[]) => void;
  savedFolderIds: Set<string>;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  onOpenAddFolder,
  onPlayFolder,
  onAddToLibrary,
  savedFolderIds,
}) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCommunityFolders = () => {
    setLoading(true);
    fetchCommunityDriveFolders()
      .then((data) => setFolders(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCommunityFolders();
  }, []);

  const handleShareFolder = (folder: DriveFolder) => {
    const url = `${window.location.origin}${window.location.pathname}?folder=${folder.folderId || folder.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(folder.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 p-6 pb-28 text-white">
      {/* Hero Header */}
      <div className="relative p-6 md:p-8 bg-gradient-to-b from-emerald-800 via-teal-900 to-[#121212] rounded-2xl flex flex-col md:flex-row items-end justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#1db954] to-teal-500 rounded-2xl shadow-xl flex items-center justify-center shrink-0 text-black">
            <Globe className="w-14 h-14 md:w-18 md:h-18" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#1db954] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Public Google Drive Sync
            </span>
            <h1 className="text-2xl md:text-5xl font-black tracking-tight text-white mb-2">
              Community Drive Folders
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-xl">
              Audio folders shared with "anyone with the link". Add your own Google Drive folder ID to sync it with listeners everywhere!
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddFolder}
          className="px-5 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black text-xs md:text-sm font-bold flex items-center gap-2 shadow-xl shadow-[#1db954]/20 hover:scale-105 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Add External Public Folder
        </button>
      </div>

      {/* Folders Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1db954]" />
            Synced Public Music Folders ({folders.length})
          </h2>
          <button
            onClick={loadCommunityFolders}
            className="text-xs text-neutral-400 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-neutral-400 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
            Loading synced public folders...
          </div>
        ) : folders.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800 mx-auto flex items-center justify-center text-neutral-500">
              <HardDrive className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">No community folders synced yet</h3>
            <p className="text-xs text-neutral-400">
              Be the first! Click "+ Add External Public Folder" to paste a Google Drive folder link open to anyone.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => {
              const tracks = folder.tracks || [];
              const isSaved = savedFolderIds.has(folder.id);

              return (
                <div
                  key={folder.id}
                  className="p-4 bg-[#181818] hover:bg-[#222222] border border-neutral-800/80 rounded-2xl flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow">
                      {folder.coverUrl ? (
                        <img
                          src={folder.coverUrl}
                          alt={folder.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HardDrive className="w-12 h-12 text-[#1db954]" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-[#1db954] flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public Link
                      </div>

                      {tracks.length > 0 && (
                        <button
                          onClick={() => onPlayFolder(folder, tracks)}
                          className="absolute right-3 bottom-3 w-11 h-11 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                          title="Play now"
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-white truncate">{folder.name}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Curated by <span className="text-neutral-200">{folder.author || 'Drive User'}</span> • {tracks.length || folder.trackCount || 2} tracks
                    </p>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-2">
                      {folder.description || 'Public Google Drive music folder open to anyone with the link.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <button
                      onClick={() => handleShareFolder(folder)}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      title="Copy link to share this music with anyone"
                    >
                      {copiedId === folder.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#1db954]" />
                          <span className="text-[#1db954]">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onAddToLibrary(folder, tracks)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isSaved
                          ? 'bg-white/10 text-[#1db954] cursor-default'
                          : 'bg-[#1db954] hover:bg-[#1ed760] text-black hover:scale-105'
                      }`}
                    >
                      {isSaved ? 'In Library' : '+ Add to Library'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
