import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// In-memory sync store with persistence in memory
const syncDatabase: Record<string, any> = {};

// Community shared Google Drive folders synced for everyone to enjoy
const communityDriveFolders: any[] = [
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

function syncApiPlugin(): Plugin {
  return {
    name: 'teramusic-sync-and-proxy-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Community Google Drive Folders: GET
        if (req.method === 'GET' && url.startsWith('/api/drive/community-folders')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, folders: communityDriveFolders }));
          return;
        }

        // Community Google Drive Folders: POST (Sync external folder with the community)
        if (req.method === 'POST' && url.startsWith('/api/drive/community-folders')) {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const newFolder = JSON.parse(body);
              if (newFolder && newFolder.id) {
                // If folder already exists, update it; otherwise add to top
                const existingIdx = communityDriveFolders.findIndex(f => f.id === newFolder.id || (f.folderId && f.folderId === newFolder.folderId));
                if (existingIdx >= 0) {
                  communityDriveFolders[existingIdx] = { ...communityDriveFolders[existingIdx], ...newFolder, updatedAt: Date.now() };
                } else {
                  communityDriveFolders.unshift({
                    ...newFolder,
                    addedAt: Date.now()
                  });
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, folder: newFolder, totalFolders: communityDriveFolders.length }));
                return;
              }
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Invalid folder data' }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Failed to parse JSON' }));
            }
          });
          return;
        }

        // Public Google Drive Folder Inspect Endpoint
        if (req.method === 'GET' && url.startsWith('/api/drive/inspect-public')) {
          const queryParams = new URL(url, 'http://localhost:3000').searchParams;
          const folderId = queryParams.get('id');
          if (!folderId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Missing folder id' }));
            return;
          }

          // Fetch public folder webpage
          const targetUrl = `https://drive.google.com/drive/folders/${folderId}`;
          fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
          })
            .then(async fetchRes => {
              const html = await fetchRes.text();
              // Extract page title (folder name)
              let folderName = `Google Drive Folder (${folderId.slice(0, 6)}...)`;
              const titleMatch = html.match(/<title>(.*?)(?:\s*-\s*Google Drive)?<\/title>/i);
              if (titleMatch && titleMatch[1] && !titleMatch[1].toLowerCase().includes('google drive')) {
                folderName = titleMatch[1].trim();
              }

              // Extract any audio file IDs or file titles present in JSON / HTML
              const audioExtensions = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'];
              const foundFiles: any[] = [];
              const seenIds = new Set<string>();

              // Regex to detect JSON file objects like ["id", "title.mp3", ...]
              const fileRegex = /\["([a-zA-Z0-9_-]{25,45})",\s*"([^"]+\.(?:mp3|wav|m4a|flac|ogg|aac))"/gi;
              let match;
              while ((match = fileRegex.exec(html)) !== null) {
                const id = match[1];
                const filename = match[2];
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  foundFiles.push({ id, name: filename });
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                folderId,
                folderName,
                filesFound: foundFiles,
                isOpenToAnyoneWithLink: !html.includes('Sign in to continue') && !html.includes('Access denied'),
              }));
            })
            .catch(err => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                folderId,
                folderName: `Google Drive Folder (${folderId.slice(0, 8)})`,
                filesFound: [],
                isOpenToAnyoneWithLink: true,
              }));
            });
          return;
        }

        // Cross-platform sync GET
        if (req.method === 'GET' && url.startsWith('/api/sync/')) {
          const syncId = url.replace('/api/sync/', '').split('?')[0].toUpperCase();
          res.setHeader('Content-Type', 'application/json');
          const data = syncDatabase[syncId] || null;
          res.end(JSON.stringify({ success: true, syncId, data }));
          return;
        }

        // Cross-platform sync POST
        if (req.method === 'POST' && url.startsWith('/api/sync/')) {
          const syncId = url.replace('/api/sync/', '').split('?')[0].toUpperCase();
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              syncDatabase[syncId] = {
                ...parsed,
                lastSyncedAt: Date.now(),
              };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, syncId, lastSyncedAt: syncDatabase[syncId].lastSyncedAt }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
          });
          return;
        }

        // Google Drive / Audio proxy for smooth streaming & CORS handling
        if (req.method === 'GET' && url.startsWith('/api/proxy-audio')) {
          const queryParams = new URL(url, 'http://localhost:3000').searchParams;
          const targetUrl = queryParams.get('url');
          const authHeader = req.headers['authorization'];

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }

          const fetchHeaders: Record<string, string> = {};
          if (authHeader) {
            fetchHeaders['Authorization'] = authHeader;
          }
          if (req.headers['range']) {
            fetchHeaders['Range'] = req.headers['range'] as string;
          }

          fetch(targetUrl, { headers: fetchHeaders })
            .then(async fetchRes => {
              res.statusCode = fetchRes.status;
              fetchRes.headers.forEach((value, key) => {
                if (key.toLowerCase() !== 'content-encoding') {
                  res.setHeader(key, value);
                }
              });
              res.setHeader('Access-Control-Allow-Origin', '*');
              const buffer = await fetchRes.arrayBuffer();
              res.end(Buffer.from(buffer));
            })
            .catch(err => {
              console.error('Audio proxy error:', err);
              res.statusCode = 502;
              res.end('Proxy error');
            });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
