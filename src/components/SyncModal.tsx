import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Smartphone, Download, Upload, X, ShieldCheck } from 'lucide-react';
import { SyncData } from '../types';
import { exportLibraryJson, importLibraryJson } from '../services/syncService';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  isSyncing: boolean;
  lastSyncedAt?: number;
  currentSyncData: SyncData;
  onPairSyncCode: (targetCode: string) => Promise<boolean>;
  onRestoreBackup: (data: SyncData) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncCode,
  isSyncing,
  lastSyncedAt,
  currentSyncData,
  onPairSyncCode,
  onRestoreBackup,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairSuccess, setPairSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}?sync=${syncCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairError(null);
    setPairSuccess(null);

    const clean = inputCode.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setPairError('Please enter a valid 6-character sync code.');
      return;
    }

    setPairLoading(true);
    try {
      const ok = await onPairSyncCode(clean);
      if (ok) {
        setPairSuccess(`Device successfully paired with code "${clean}"! Library is synced.`);
        setInputCode('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setPairError(`Could not find library for code "${clean}". Verify code and try again.`);
      }
    } catch (err: any) {
      setPairError(err?.message || 'Pairing error.');
    } finally {
      setPairLoading(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportLibraryJson(currentSyncData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teramusic-backup-${syncCode}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = importLibraryJson(content);
      if (parsed) {
        onRestoreBackup(parsed);
        setPairSuccess('Library successfully restored from backup file!');
        setTimeout(() => onClose(), 1500);
      } else {
        setPairError('Invalid backup file. Could not restore.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#242424] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1db954]/10 text-[#1db954] rounded-lg">
              <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Cross-Platform Sync</h3>
              <p className="text-xs text-neutral-400">Sync playlists, liked songs & settings across devices</p>
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
          {/* Section 1: This Device Sync Code */}
          <div className="bg-[#181818] border border-neutral-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Your Device Sync Code
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#1db954]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {lastSyncedAt ? 'Cloud Synced' : 'Ready'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 border border-neutral-800 rounded-lg p-3">
              <span className="text-2xl font-mono font-bold tracking-widest text-[#1db954]">
                {syncCode}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                  title="Copy sync code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#1db954]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-md bg-[#1db954]/20 hover:bg-[#1db954]/30 text-xs font-semibold text-[#1db954] flex items-center gap-1.5 transition-colors"
                  title="Copy link to open on phone"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Link Copied' : 'Phone Link'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              Open Teramusic on any phone, tablet, or other browser and enter this code to keep your library synchronized!
            </p>
          </div>

          {/* Section 2: Pair with Another Device */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Pair with Another Device</h4>
            <form onSubmit={handlePairSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-char code (e.g. TERA-XXXX)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#181818] border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#1db954]"
              />
              <button
                type="submit"
                disabled={pairLoading || !inputCode.trim()}
                className="px-4 py-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                {pairLoading ? 'Connecting...' : 'Pair & Load'}
              </button>
            </form>
          </div>

          {pairError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {pairError}
            </div>
          )}

          {pairSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-[#1db954] flex items-center gap-2">
              <Check className="w-4 h-4" />
              {pairSuccess}
            </div>
          )}

          {/* Section 3: Backup & Restore */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Manual library portability:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="hover:text-white flex items-center gap-1 py-1 px-2.5 rounded bg-white/5 hover:bg-white/10"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
              <label className="hover:text-white flex items-center gap-1 py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Restore JSON
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
