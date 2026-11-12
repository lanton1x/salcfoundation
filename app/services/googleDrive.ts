import { drive_v3, google } from 'googleapis';
import { cache } from 'react';
import ExifReader from 'exifreader';

let cachedAuthClient: drive_v3.Drive | null = null;

export interface MemorialItem {
  id: string;
  name: string; // Person's name (extracted from the clean filename)
  lifespan: string; // Parsed from XMP:Description (e.g. "1940 - 2026")
  donors: string[]; // Parsed from XMP:Subject
  imageUrl: string; // Direct webViewLink / thumbnailLink source
}

export interface MetadataImageItem {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  imageUrl: string;
}

// Define a safe type reflecting ExifReader's internal array value variants
type ExifTagValueVariant = string | number | { description: string };

/**
 * Singleton Auth Provider: Initializes once at application launch
 */
function getAuthorizedDriveClient() {
  if (cachedAuthClient) return cachedAuthClient;

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.warn(
      'Google Drive credentials missing. Operating in static fallback mode.',
    );
    return null;
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://googleapis.com'],
    });

    cachedAuthClient = google.drive({ version: 'v3', auth });
    return cachedAuthClient;
  } catch (error) {
    console.error('Failed to initialize Google Auth client Singleton:', error);
    return null;
  }
}

/**
 * Highly Critical Content (Cached with low-overhead React caching)
 */
export const fetchMarkdownFile = cache(
  async (folderId: string, filename: string): Promise<string> => {
    const drive = getAuthorizedDriveClient();
    if (!drive) return `Fallback audit data for ${filename}`;

    try {
      const listRes = await drive.files.list({
        q: `'${folderId}' in parents and name = '${filename}' and trashed = false`,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const fileId = listRes.data.files?.[0]?.id;
      if (!fileId) return `### ${filename} not found.`;

      const fileRes = await drive.files.get({
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      });

      return typeof fileRes.data === 'string'
        ? fileRes.data
        : JSON.stringify(fileRes.data);
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      return `### Connection Fallback\nStewardship data temporary offline.`;
    }
  },
);

export interface DriveMediaItem {
  id: string;
  name: string;
  webViewLink?: string;
  thumbnailLink?: string;
  description?: string;
}

export interface MetadataImageItem {
  id: string;
  name: string; // Cleaned filename (e.g., 'John and Jane Doe')
  description: string; // Memorial: Lifespan | Legacy: Trust / Estate name
  subjects: string[]; // Memorial: Donors | Legacy: Trustees / Executors
  imageUrl: string;
}

/**
 * On-Demand Assets (Cached with an explicit Incremental Static Regeneration interval)
 * Revalidates in the background every 15 minutes (900 seconds) without delaying page delivery.
 */
export async function fetchFolderContents(
  folderId: string,
): Promise<DriveMediaItem[]> {
  const drive = getAuthorizedDriveClient();
  if (!drive) return [];

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, webViewLink, thumbnailLink, description)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return (res.data.files || []).map((file: drive_v3.Schema$File) => ({
      id: file.id || '',
      name: file.name || '',
      webViewLink: file.webViewLink || '',
      thumbnailLink: file.thumbnailLink || '',
      description: file.description || '',
    }));
  } catch (error) {
    console.error('Error fetching folder payload:', error);
    return [];
  }
}

export async function fetchImagesWithMetadata(
  folderId: string,
): Promise<MetadataImageItem[]> {
  const drive = getAuthorizedDriveClient();
  if (!drive) return [];

  try {
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType satisfies 'image/' and trashed = false`,
      fields: 'files(id, name, webViewLink, thumbnailLink)',
      pageSize: 100,
    });

    const files = listRes.data.files || [];

    const items = await Promise.all(
      files.map(async (file) => {
        try {
          if (!file.id) return null;

          // Pull binary payload down from Drive storage array vectors
          const mediaRes = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'arraybuffer' },
          );

          const buffer = Buffer.from(mediaRes.data as ArrayBuffer);
          const tags = ExifReader.load(buffer);

          // Standardize XMP value reading keys
          const parsedDescription =
            tags['Description']?.description ||
            tags['XMP:Description']?.value ||
            '';

          let parsedSubjects: string[] = [];
          const subjectTag = tags['Subject'] || tags['XMP:Subject'];

          if (subjectTag) {
            if (Array.isArray(subjectTag.value)) {
              // Cast the array element values safely using our explicit variant type alias
              parsedSubjects = (subjectTag.value as ExifTagValueVariant[]).map(
                (v) => {
                  if (v && typeof v === 'object' && 'description' in v) {
                    return v.description;
                  }
                  return String(v);
                },
              );
            } else if (typeof subjectTag.value === 'string') {
              parsedSubjects = (subjectTag.value as string)
                .split(',')
                .map((s) => s.trim());
            }
          }

          // Strip file extensions cleanly (.webp, .jpg, etc.)
          const cleanName = file.name
            ? file.name.replace(/\.[^/.]+$/, '')
            : 'Unknown Benefactor';

          return {
            id: file.id,
            name: cleanName,
            description: String(parsedDescription).trim(),
            subjects: parsedSubjects.filter(Boolean),
            // Grab high-resolution thumbnail context links
            imageUrl:
              file.thumbnailLink?.replace(/=s\d+$/, '=s800') ||
              file.webViewLink ||
              '',
          };
        } catch (err) {
          console.error(
            `Skipping metadata layout parsing for file ${file.name}:`,
            err,
          );
          return {
            id: file.id || '',
            name: file.name?.replace(/\.[^/.]+$/, '') || 'Unknown',
            description: '',
            subjects: [],
            imageUrl: file.thumbnailLink || '',
          };
        }
      }),
    );

    return items.filter((item): item is MetadataImageItem => item !== null);
  } catch (error) {
    console.error('Error in fetchImagesWithMetadata engine processing:', error);
    return [];
  }
}
