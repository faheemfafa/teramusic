import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));

// NOTE: in-memory only. Sync codes and community folders reset when the server restarts.
const syncDatabase = {};
const communityDriveFolders = [
  {
    id: 'community-synthwave-public',
    folderId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    name: 'Synthwave Night Drive (Public)',
    author: 'Shared by Community',
    trackCount: 4,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
    description: 'Public Google Drive folder shared with "anyone with the link". Pure retrowave & darksynth.',
    addedAt: 1718000000000,
    tracks: [
      {
        id: 'comm-1',
        title: 'Neon Horizon',
        artist: 'Kavinsky Wave',
        album: 'Synthwave Night Drive',
        duration: 198,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverending_Story.mp3',
        source: 'google_drive',
        driveFolderId: 'community-synthwave-public',
        folderName: 'Synthwave Night Drive (Public)',
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
        size: 4720000,
        addedAt: 1718000000000,
      },
      {
        id: 'comm-2',
        title: 'Cyber Highway 2088',
        artist: 'Vector Pulse',
        album: 'Synthwave Night Drive',
        duration: 165,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-_Be_There.mp3',
        source: 'google_drive',
        driveFolderId: 'community-synthwave-public',
        folderName: 'Synthwave Night Drive (Public)',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
        size: 3950000,
        addedAt: 1718000000000,
      }
    ]
  },
  {
    id: 'community-lofi-public',
    folderId: '1w3YqU2a9XkmZ87LmNPQRSTV',
    name: 'Chillhop & Lofi Workspace (Public)',
    author: 'Drive Community',
    trackCount: 3,
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80',
    color: '#10b981',
    description: 'Relaxing public Drive audio folder for study, coding, and chill sessions.',
    addedAt: 1718100000000,
    tracks: [
      {
        id: 'comm-3',
        title: 'Rainy Afternoon Coffee',
        artist: 'Sleepy Panda',
        album: 'Chillhop Workspace',
        duration: 154,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverending_Story.mp3',
        source: 'google_drive',
        driveFolderId: 'community-lofi-public',
        folderName: 'Chillhop & Lofi Workspace (Public)',
        coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80',
        size: 3600000,
        addedAt: 1718100000000,
      },
      {
        id: 'comm-4',
        title: 'Floating Clouds in Shinjuku',
        artist: 'Nujabes Spirit',
        album: 'Chillhop Workspace',
        duration: 190,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-_Be_There.mp3',
        source: 'google_drive',
        driveFolderId: 'community-lofi-public',
        folderName: 'Chillhop & Lofi Workspace (Public)',
        coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80',
        size: 4500000,
        addedAt: 1718100000000,
      }
    ]
  }
];

// The audio proxy may only talk to these hosts (prevents use as an open proxy).
const ALLOWED = new Set(['www.googleapis.com', 'drive.google.com', 'drive.usercontent.google.com', 'docs.google.com', 'commondatastorage.googleapis.com']);
const okHost = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && ALLOWED.has(x.hostname); } catch { return false; } };

app.get('/api/drive/community-folders', (_q, res) => res.json({ success: true, folders: communityDriveFolders }));
app.post('/api/drive/community-folders', (req, res) => {
  const f = req.body;
  if (!f || !f.id) return res.status(400).json({ success: false, error: 'Invalid folder data' });
  const i = communityDriveFolders.findIndex((x) => x.id === f.id || (x.folderId && x.folderId === f.folderId));
  if (i >= 0) communityDriveFolders[i] = { ...communityDriveFolders[i], ...f, updatedAt: Date.now() };
  else communityDriveFolders.unshift({ ...f, addedAt: Date.now() });
  if (communityDriveFolders.length > 200) communityDriveFolders.length = 200;
  res.json({ success: true, folder: f, totalFolders: communityDriveFolders.length });
});

app.get('/api/drive/inspect-public', async (req, res) => {
  const folderId = String(req.query.id || '');
  if (!/^[\w-]{10,80}$/.test(folderId)) return res.status(400).json({ success: false, error: 'Missing or invalid folder id' });
  const fallback = { success: true, folderId, folderName: `Google Drive Folder (${folderId.slice(0, 8)})`, filesFound: [], isOpenToAnyoneWithLink: true };
  try {
    const r = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });
    const html = await r.text();
    let folderName = fallback.folderName;
    const t = html.match(/<title>(.*?)(?:\s*-\s*Google Drive)?<\/title>/i);
    if (t && t[1] && !t[1].toLowerCase().includes('google drive')) folderName = t[1].trim();
    const files = []; const seen = new Set();
    const re = /\["([a-zA-Z0-9_-]{25,45})",\s*"([^"]+\.(?:mp3|wav|m4a|flac|ogg|aac))"/gi;
    let m;
    while ((m = re.exec(html))) if (!seen.has(m[1])) { seen.add(m[1]); files.push({ id: m[1], name: m[2] }); }
    res.json({ success: true, folderId, folderName, filesFound: files,
      isOpenToAnyoneWithLink: !html.includes('Sign in to continue') && !html.includes('Access denied') });
  } catch { res.json(fallback); }
});

const syncId = (req) => String(req.params.id).toUpperCase();
app.get('/api/sync/:id', (req, res) => res.json({ success: true, syncId: syncId(req), data: syncDatabase[syncId(req)] || null }));
app.post('/api/sync/:id', (req, res) => {
  const id = syncId(req);
  if (!/^[A-Z0-9_-]{1,64}$/.test(id)) return res.status(400).json({ success: false, error: 'Invalid sync id' });
  if (!(id in syncDatabase) && Object.keys(syncDatabase).length >= 1000) return res.status(507).json({ success: false, error: 'Sync store full' });
  syncDatabase[id] = { ...req.body, lastSyncedAt: Date.now() };
  res.json({ success: true, syncId: id, lastSyncedAt: syncDatabase[id].lastSyncedAt });
});

app.get('/api/proxy-audio', async (req, res) => {
  let target = String(req.query.url || '');
  if (!okHost(target)) return res.status(400).send('URL not allowed');
  const headers = {};
  // Only ever send the user's Google token to Google's API host.
  const auth = (u) => (new URL(u).hostname === 'www.googleapis.com' && req.headers.authorization ? { Authorization: req.headers.authorization } : {});
  if (req.headers.range) headers.Range = req.headers.range;
  try {
    let r;
    for (let hop = 0; hop < 5; hop++) {
      r = await fetch(target, { headers: { ...headers, ...auth(target) }, redirect: 'manual' });
      const loc = r.headers.get('location');
      if (r.status >= 300 && r.status < 400 && loc) {
        target = new URL(loc, target).toString();
        if (!okHost(target)) return res.status(400).send('Redirect not allowed');
        continue;
      }
      break;
    }
    res.status(r.status);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const v = r.headers.get(h); if (v) res.setHeader(h, v);
    }
    if (!r.body) return res.end();
    const stream = Readable.fromWeb(r.body);
    req.on('close', () => stream.destroy());
    stream.on('error', () => res.end());
    stream.pipe(res);
  } catch { res.status(502).send('Proxy error'); }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_q, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Teramusic listening on ${PORT}`));
