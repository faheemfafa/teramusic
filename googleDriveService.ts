export interface DriveTrack {
  id: string;
  title: string;
  url: string;
}

/**
 * Extracts a Google Drive File ID from standard file share or view URLs.
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;

  // Handles /d/FILE_ID/ formats
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];

  // Handles id=FILE_ID parameter formats
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Parses a single Google Drive share link into a playable track object.
 */
export function parseDriveLink(inputUrl: string): DriveTrack | null {
  const fileId = extractDriveFileId(inputUrl);
  if (!fileId) return null;

  return {
    id: fileId,
    title: `Drive Track (${fileId.slice(0, 6)})`,
    url: `https://docs.google.com/uc?export=download&id=${fileId}`
  };
}

/**
 * Main service interface expected by TeraMusic view components.
 */
export const googleDriveService = {
  fetchTracksFromFolder: async (folderUrlOrId: string): Promise<DriveTrack[]> => {
    const singleTrack = parseDriveLink(folderUrlOrId);
    if (singleTrack) {
      return [singleTrack];
    }
    return [];
  }
};

export default googleDriveService;
