import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  X,
  HardDrive,
  Globe,
  Link as LinkIcon,
  Music,
  Upload,
  Check,
  Share2,
  Users,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  extractDriveFolderId,
  fetchCommunityDriveFolders,
  inspectPublicDriveFolder,
  parseTrackInfoFromFileName,
  driveStreamUrl,
  getDriveKey,
  setDriveKey,
  isNativeApp,
  publishDriveFolderToCommunity,
} from '../services/googleDriveService';
import { DriveFolder, Track } from '../types';

interface DriveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFolderWithTracks: (folder: DriveFolder, tracks: Track[]) => void;
}

export const DriveFolderModal: React.FC<DriveFolderModalProps> = ({
  isOpen,
  onClose,
  onAddFolderWithTracks,
}) => {
  const [activeTab, setActiveTab] = useState<'external' | 'community' | 'files'>('external');
  const [folderInput, setFolderInput] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [shareWithCommunity, setShareWithCommunity] = useState(!isNativeApp());
  const [apiKeyInput, setApiKeyInput] = useState(getDriveKey());
  const [authorName, setAuthorName] = useState('Music Explorer');
  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [detectedFolder, setDetectedFolder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Optional manual audio file IDs/links within the folder
  const [manualLinksInput, setManualLinksInput] = useState('');
  const [showManualLinks, setShowManualLinks] = useState(false);

  // Community folders list
  const [communityFolders, setCommunityFolders] = useState<DriveFolder[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  // File upload state for local audio
  const [localFolderName, setLocalFolderName] = useState('My Local Drive Music');

  // Load community folders when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingCommunity(true);
      fetchCommunityDriveFolders()
        .then((folders) => setCommunityFolders(folders))
        .finally(() => setLoadingCommunity(false));
    }
  }, [isOpen]);

  // Inspect folder URL when input changes (debounced)
  useEffect(() => {
    const id = extractDriveFolderId(folderInput);
    if (!id) {
      setDetectedFolder(null);
      return;
    }

    setInspecting(true);
    const timeout = setTimeout(() => {
      inspectPublicDriveFolder(id)
        .then((info) => {
          setDetectedFolder(info);
          if (!folderName && info.folderName) {
            setFolderName(info.folderName);
          }
        })
        .finally(() => setInspecting(false));
    }, 600);

    return () => clearTimeout(timeout);
  }, [folderInput, apiKeyInput]);

  if (!isOpen) return null;

  const handleConnectExternalFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const folderId = extractDriveFolderId(folderInput);
    if (!folderId) {
      setError('Please enter a valid Google Drive folder URL or Folder ID.');
      return;
    }

    setLoading(true);
    try {
      const name = folderName.trim() || detectedFolder?.folderName || `Drive Folder (${folderId.slice(0, 6)}...)`;
      const desc =
        folderDescription.trim() ||
        'External Google Drive music folder (open to anyone with link)';

      // Process manual file links if user added any
      const customTracks: Track[] = [];
      if (manualLinksInput.trim()) {
        const lines = manualLinksInput.split('\n').filter((l) => l.trim().length > 0);
        lines.forEach((line, idx) => {
          const match = line.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || line.match(/id=([a-zA-Z0-9_-]+)/);
          const fileId = match ? match[1] : line.trim();
          if (fileId) {
            const streamUrl = driveStreamUrl(fileId);
            customTracks.push({
              id: `gdrive-${fileId}`,
              title: `${name} - Track 0${idx + 1}`,
              artist: 'Google Drive Stream',
              album: name,
              duration: 200,
              url: streamUrl,
              source: 'google_drive',
              driveFileId: fileId,
              driveFolderId: `folder-${folderId}`,
              folderName: name,
              coverUrl:
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
              size: 4500000,
              addedAt: Date.now(),
            });
          }
        });
      }

      // If detected files were extracted by server inspection
      if (detectedFolder?.filesFound && detectedFolder.filesFound.length > 0) {
        detectedFolder.filesFound.forEach((file: any) => {
          if (!customTracks.some((t) => t.driveFileId === file.id)) {
            const info = parseTrackInfoFromFileName(file.name);
            const streamUrl = driveStreamUrl(file.id);
            customTracks.push({
              id: `gdrive-${file.id}`,
              title: info.title,
              artist: info.artist,
              album: name,
              duration: 195,
              url: streamUrl,
              source: 'google_drive',
              driveFileId: file.id,
              driveFolderId: `folder-${folderId}`,
              folderName: name,
              coverUrl:
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
              size: file.size,
              addedAt: Date.now(),
            });
          }
        });
      }

      if (customTracks.length === 0) {
        setError(
          detectedFolder?.error
            ? `Couldn't list songs: ${detectedFolder.error}`
            : "No songs found. Make sure the folder is shared as 'Anyone with the link' and contains audio files."
        );
        return;
      }

      const folder: DriveFolder = {
        id: `folder-${folderId}`,
        folderId,
        name,
        trackCount: customTracks.length,
        coverUrl:
          customTracks[0]?.coverUrl ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        color: '#10b981',
        description: desc,
        url: `https://drive.google.com/drive/folders/${folderId}`,
        isCustom: true,
        isOpenToAnyoneWithLink: true,
        author: authorName.trim() || 'Shared User',
        isCommunityShared: shareWithCommunity,
      };

      // Add to local library
      onAddFolderWithTracks(folder, customTracks);

      // If user selected "Sync & share with community", publish it globally!
      if (shareWithCommunity) {
        await publishDriveFolderToCommunity(folder, customTracks, authorName);
      }

      setSuccessMsg(
        `Added "${name}" with ${customTracks.length} tracks! ${
          shareWithCommunity ? 'Synced with community for everyone to enjoy.' : ''
        }`
      );

      setTimeout(() => {
        onClose();
        setFolderInput('');
        setFolderName('');
        setFolderDescription('');
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to add folder. Check link and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommunityFolder = (commFolder: DriveFolder) => {
    const tracks = commFolder.tracks || [];
    onAddFolderWithTracks(commFolder, tracks);
    setSuccessMsg(`Added community folder "${commFolder.name}" to your library!`);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, 1000);
  };

  const handleLocalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    const audioFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') || /\.(mp3|wav|m4a|flac|ogg|aac)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      setError('No audio files found. Please select MP3, WAV, M4A, FLAC, or OGG files.');
      return;
    }

    const folderId = `local-folder-${Date.now()}`;
    const name = localFolderName.trim() || 'My Music Folder';

    const tracks: Track[] = audioFiles.map((file, idx) => {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const blobUrl = URL.createObjectURL(file);
      return {
        id: `local-track-${Date.now()}-${idx}`,
        title: cleanTitle,
        artist: 'Local Music',
        album: name,
        duration: 180,
        url: blobUrl,
        source: 'local' as const,
        driveFolderId: folderId,
        folderName: name,
        coverUrl:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        size: file.size,
        addedAt: Date.now(),
        mimeType: file.type,
      };
    });

    const folder: DriveFolder = {
      id: folderId,
      name,
      trackCount: tracks.length,
      coverUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      color: '#3b82f6',
      description: `Local imported folder with ${tracks.length} tracks.`,
      isCustom: true,
    };

    onAddFolderWithTracks(folder, tracks);
    setSuccessMsg(`Imported ${tracks.length} tracks into "${name}"!`);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-[#242424] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1db954]/10 text-[#1db954] rounded-lg">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Connect External Google Drive Folder</h3>
              <p className="text-xs text-neutral-400">
                Open to anyone with link • Stream & sync for everyone to enjoy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 text-xs font-semibold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('external')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'external'
                ? 'border-b-2 border-[#1db954] text-[#1db954] bg-neutral-800/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            External Public Folder ID
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'community'
                ? 'border-b-2 border-[#1db954] text-[#1db954] bg-neutral-800/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Community Synced ({communityFolders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-b-2 border-[#1db954] text-[#1db954] bg-neutral-800/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Local Audio
          </button>
        </div>

        {/* Tab 1: External Public Google Drive Folder */}
        {activeTab === 'external' && (
          <form onSubmit={handleConnectExternalFolder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Public Link Badge */}
            <div className="p-3 bg-[#1db954]/10 border border-[#1db954]/30 rounded-lg flex items-start gap-2.5 text-xs text-neutral-300">
              <Globe className="w-4 h-4 text-[#1db954] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1db954]">Open to anyone with link: </span>
                Paste any Google Drive folder shared with "Anyone on the internet with the link can view". No login, passwords, or permissions required!
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#1db954]" />
                  Google Drive Folder Link or Folder ID
                </span>
                {inspecting && (
                  <span className="text-[11px] text-[#1db954] animate-pulse">
                    Verifying folder link...
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="https://drive.google.com/drive/folders/1aBcDeF... or raw Folder ID"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954] transition-colors"
                required
              />
              {detectedFolder && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#1db954]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Found: {detectedFolder.folderName} ({detectedFolder.filesFound?.length ?? 0} songs){detectedFolder.error ? ' - ' + detectedFolder.error : ''}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Google API key {isNativeApp() ? '(required in the app)' : '(optional)'}
              </label>
              <input
                type="password"
                placeholder="Paste once - saved on this device only"
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setDriveKey(e.target.value); }}
                className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chillhop Drive Music"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Curator / Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Vibe or Description
              </label>
              <input
                type="text"
                placeholder="e.g. Hand-picked synthwave and instrumental chill beats"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954]"
              />
            </div>

            {/* Sync & Share with community toggle */}
            <div className="p-3 bg-neutral-900 border border-neutral-700/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1db954]/20 rounded-lg text-[#1db954]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Sync & Share with Community</p>
                  <p className="text-[11px] text-neutral-400">
                    Allows other users in the app to discover and enjoy this music folder!
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shareWithCommunity}
                onChange={(e) => setShareWithCommunity(e.target.checked)}
                className="w-4 h-4 accent-[#1db954] cursor-pointer"
              />
            </div>

            {/* Optional manual track file links */}
            <div>
              <button
                type="button"
                onClick={() => setShowManualLinks(!showManualLinks)}
                className="text-xs text-[#1db954] hover:underline flex items-center gap-1 font-medium"
              >
                <Music className="w-3.5 h-3.5" />
                {showManualLinks ? 'Hide specific audio links' : '+ Add specific audio file links/IDs (optional)'}
              </button>

              {showManualLinks && (
                <div className="mt-2 space-y-1">
                  <textarea
                    rows={3}
                    placeholder="Paste one Google Drive audio link or ID per line:&#10;https://drive.google.com/file/d/1X.../view&#10;https://drive.google.com/file/d/1Y.../view"
                    value={manualLinksInput}
                    onChange={(e) => setManualLinksInput(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954] font-mono resize-none"
                  />
                  <p className="text-[11px] text-neutral-500">
                    If added, each link will be streamed directly from your Google Drive folder.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-[#1db954] flex items-center gap-2">
                <Check className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-full text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Connecting & Syncing...
                  </>
                ) : (
                  'Add & Sync Folder'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Community Synced Folders */}
        {activeTab === 'community' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#1db954]" />
                  Community Synced Drive Folders
                </h4>
                <p className="text-xs text-neutral-400">
                  Public music folders shared by the community so everyone can enjoy!
                </p>
              </div>
            </div>

            {loadingCommunity ? (
              <div className="py-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
                Loading community folders...
              </div>
            ) : communityFolders.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No community folders yet. Add an external Google Drive folder above to share the first one!
              </div>
            ) : (
              <div className="space-y-2.5">
                {communityFolders.map((cf) => (
                  <div
                    key={cf.id}
                    className="p-3 bg-[#181818] hover:bg-[#282828] border border-neutral-800 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                        {cf.coverUrl ? (
                          <img src={cf.coverUrl} alt={cf.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HardDrive className="w-6 h-6 text-[#1db954]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{cf.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {cf.author || 'Community'} • {cf.trackCount || cf.tracks?.length || 2} tracks
                        </p>
                        {cf.description && (
                          <p className="text-[10px] text-neutral-500 truncate mt-0.5">{cf.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddCommunityFolder(cf)}
                      className="px-3.5 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-bold shrink-0 transition-transform hover:scale-105"
                    >
                      + Add & Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Local Audio */}
        {activeTab === 'files' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Collection / Folder Name
              </label>
              <input
                type="text"
                value={localFolderName}
                onChange={(e) => setLocalFolderName(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#1db954]"
              />
            </div>

            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 hover:border-[#1db954] rounded-xl cursor-pointer bg-neutral-900/30 transition-colors group">
              <Music className="w-10 h-10 text-neutral-500 group-hover:text-[#1db954] mb-3 transition-colors" />
              <span className="text-sm font-semibold text-white">Click or drag audio files here</span>
              <span className="text-xs text-neutral-400 mt-1">
                Supports MP3, M4A, WAV, FLAC, OGG, AAC
              </span>
              <input
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac"
                onChange={handleLocalFiles}
                className="hidden"
              />
            </label>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-[#1db954] flex items-center gap-2">
                <Check className="w-4 h-4" />
                {successMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
