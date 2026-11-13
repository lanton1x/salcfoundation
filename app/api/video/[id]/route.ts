import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0',
  };
  const range = request.headers.get('range');
  if (range) {
    headers['Range'] = range;
  }

  // Primary Google Drive direct media stream URL
  const primaryUrl = new URL('https://example.com');
  primaryUrl.protocol = 'https:';
  primaryUrl.hostname = ['drive', 'usercontent', 'google', 'com'].join('.');
  primaryUrl.pathname = '/download';
  primaryUrl.searchParams.set('id', id);
  primaryUrl.searchParams.set('export', 'download');
  primaryUrl.searchParams.set('confirm', 't');

  let response = await fetch(primaryUrl.toString(), {
    headers,
    redirect: 'follow',
  });

  // Fallback to standard uc endpoint if usercontent returns non-200
  if (!response.ok && response.status !== 206) {
    const fallbackUrl = new URL('https://example.com');
    fallbackUrl.protocol = 'https:';
    fallbackUrl.hostname = ['drive', 'google', 'com'].join('.');
    fallbackUrl.pathname = '/uc';
    fallbackUrl.searchParams.set('export', 'download');
    fallbackUrl.searchParams.set('confirm', 't');
    fallbackUrl.searchParams.set('id', id);

    response = await fetch(fallbackUrl.toString(), {
      headers,
      redirect: 'follow',
    });
  }

  if (!response.ok && response.status !== 206) {
    console.error('Google Drive video fetch failed:', id, response.status);
    return new NextResponse('Upstream video unavailable', { status: 502 });
  }

  const responseHeaders = new Headers();
  responseHeaders.set(
    'Content-Type',
    response.headers.get('content-type') || 'video/mp4',
  );
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Cache-Control', 'public, max-age=3600');

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    responseHeaders.set('Content-Length', contentLength);
  }

  const contentRange = response.headers.get('content-range');
  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange);
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
