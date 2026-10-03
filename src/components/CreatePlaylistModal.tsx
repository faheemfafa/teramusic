import React, { useState } from 'react';
import { ListMusic, X } from 'lucide-react';
import { Playlist } from '../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (playlist: Playlist) => void;
}

const COLOR_OPTIONS = [
  '#1db954', // Spotify Green
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#10b981', // Emerald
];

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      coverColor,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onCreate(newPlaylist);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#242424] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg text-black transition-colors"
              style={{ backgroundColor: coverColor }}
            >
              <ListMusic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">New Playlist</h3>
              <p className="text-xs text-neutral-400">Organize your Drive music tracks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Playlist Name
            </label>
            <input
              type="text"
              placeholder="e.g. Late Night Drive"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954]"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="Give your playlist a vibe or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#1db954] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Cover Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCoverColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    coverColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#242424]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 rounded-full text-xs font-bold bg-[#1db954] hover:bg-[#1ed760] text-black transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
