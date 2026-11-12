// lib/cmsService.ts
import { cacheLife } from 'next/cache';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  imageUrl?: string;
  description?: string;
  subjects?: string[];
  content?: string;
}

export interface SiteBootstrapData {
  mission: string;
  board: string;
  giftpolicies: string;
  giftpolicies_faq: string;
  homeClips: DriveFileItem[];
  memorialItems: DriveFileItem[];
  legacyItems: DriveFileItem[];
  annualReports: DriveFileItem[];
}

/**
 * Decodes XML entities written by exiftool and strips leading/trailing quotes.
 */
function cleanXmlText(raw: string): string {
  return raw
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
}

/**
 * Extracts XMP metadata (<dc:description> and <dc:subject>) written by exiftool
 * directly from a WebP binary buffer without external dependencies.
 */
function extractWebpXmpMetadata(buffer: ArrayBuffer): {
  description: string;
  subjects: string[];
} {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

  // 1. Extract <dc:description> ... <rdf:li ...>TEXT</rdf:li>
  let description = '';
  const descBlock = text.match(/<dc:description[\s\S]*?<\/dc:description>/i);
  if (descBlock) {
    const liMatch = descBlock[0].match(/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
    if (liMatch) {
      description = cleanXmlText(liMatch[1]);
    }
  }

  // 2. Extract <dc:subject> ... <rdf:li>ITEM</rdf:li>
  const subjects: string[] = [];
  const subjBlock = text.match(/<dc:subject[\s\S]*?<\/dc:subject>/i);
  if (subjBlock) {
    const liMatches = subjBlock[0].matchAll(
      /<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/gi,
    );
    for (const m of liMatches) {
      const val = cleanXmlText(m[1]);
      if (val) subjects.push(val);
    }
  }

  return { description, subjects };
}

/**
 * Runs on the Next.js server during pre-rendering to extract exiftool metadata
 * (Description, Subject/Keywords) directly from the .webp files.
 */
async function enrichImagesWithExif(
  items: DriveFileItem[],
): Promise<DriveFileItem[]> {
  return Promise.all(
    items.map(async (item) => {
      const cleanName = item.name.replace(/\.[^/.]+$/, '');
      const imageUrl = `https://lh3.googleusercontent.com/d/${item.id}=w500`;
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${item.id}`;

      try {
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        const { description, subjects } = extractWebpXmpMetadata(arrayBuffer);

        return {
          ...item,
          name: cleanName,
          imageUrl,
          description: description || item.description || '',
          subjects,
        };
      } catch (err) {
        console.warn(`Metadata extraction skipped for ${item.name}:`, err);
        return {
          ...item,
          name: cleanName,
          imageUrl,
          subjects: [],
        };
      }
    }),
  );
}

/**
 * Pairs .md report files with their companion .png images in the AnnualReports folder,
 * downloads the Markdown text during pre-rendering, and rewrites relative image names
 * to direct Google Drive image URLs.
 */
async function enrichAnnualReports(
  items: DriveFileItem[],
): Promise<DriveFileItem[]> {
  const mdFiles = items.filter((f) => f.name.toLowerCase().endsWith('.md'));
  const imageFiles = items.filter(
    (f) =>
      f.mimeType?.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif)$/i.test(f.name),
  );

  // Map image filename -> direct Google Drive image URL
  const imageMap = new Map<string, string>();
  for (const img of imageFiles) {
    const directImgUrl =
      'https://lh3.googleusercontent.com/d/' + img.id + '=w1000';
    imageMap.set(img.name.toLowerCase(), directImgUrl.toString());
  }

  const enrichedReports = await Promise.all(
    mdFiles.map(async (report) => {
      // Turn "2025_AnnualReport.md" into "2025 Annual Report"
      const displayTitle = report.name
        .replace(/\.md$/i, '')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');

      const downloadUrl =
        'https://drive.google.com/uc?export=download&id=' + report.id;

      try {
        const res = await fetch(downloadUrl.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let markdown = await res.text();

        // Replace any relative image filenames (e.g. ![alt](2025_AnnualReport_Image_1.png))
        // with their direct Google Drive image URLs
        markdown = markdown.replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          (match, alt, src) => {
            const fileName = src.split('/').pop()?.trim().toLowerCase() || '';
            const mappedUrl = imageMap.get(fileName);
            return mappedUrl ? `![${alt}](${mappedUrl})` : match;
          },
        );

        // Normalize Google Docs spaced CSS properties and strip empty underline spans
        markdown = markdown
          .replace(
            /text\s*-\s*decoration\s*:\s*underline\s*;?/gi,
            'text-decoration: underline;',
          )
          .replace(/<span[^>]*>\s*<\/span>/gi, '');

        return {
          ...report,
          name: displayTitle,
          content: markdown,
        };
      } catch (err) {
        console.warn(`Failed to load report content for ${report.name}:`, err);
        return {
          ...report,
          name: displayTitle,
          content: 'Report content is currently unavailable.',
        };
      }
    }),
  );

  // Sort newest reports first (e.g., 2025 before 2024)
  return enrichedReports.sort((a, b) => b.name.localeCompare(a.name));
}

export async function fetchSiteBootstrapData(): Promise<SiteBootstrapData> {
  'use cache';
  cacheLife('hours');

  const baseUrl = process.env.AWS_LAMBDA_API_GATEWAY_URL;
  const fallback: SiteBootstrapData = {
    mission: '',
    board: '',
    giftpolicies: '',
    giftpolicies_faq: '',
    homeClips: [],
    memorialItems: [],
    legacyItems: [],
    annualReports: [],
  };

  if (!baseUrl) {
    console.error('Missing environment variable: AWS_LAMBDA_API_GATEWAY_URL');
    return fallback;
  }

  try {
    const response = await fetch(`${baseUrl}/salcf-load-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: 'site_bootstrap' }),
    });

    if (!response.ok) {
      throw new Error(`Lambda bootstrap fetch failed: ${response.status}`);
    }

    const rawData: SiteBootstrapData = await response.json();

    const [memorialItems, legacyItems, annualReports] = await Promise.all([
      enrichImagesWithExif(rawData.memorialItems || []),
      enrichImagesWithExif(rawData.legacyItems || []),
      enrichAnnualReports(rawData.annualReports || []),
    ]);

    return {
      ...rawData,
      memorialItems,
      legacyItems,
      annualReports,
    };
  } catch (error) {
    console.error('Error loading site bootstrap data:', error);
    return fallback;
  }
}
