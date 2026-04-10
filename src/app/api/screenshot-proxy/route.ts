import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for resolved Lightshot image URLs (slug -> direct URL)
const lightshotCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * API route that proxies screenshot images.
 * For prnt.sc (Lightshot) URLs, it fetches the page, extracts the og:image, and redirects.
 * For other URLs, it redirects directly to the image.
 *
 * Usage: /api/screenshot-proxy?url=https://prnt.sc/XXXXX
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Handle Lightshot URLs
    if (url.includes('prnt.sc') || url.includes('lightshot')) {
      const directUrl = await resolveLightshotUrl(url);
      if (directUrl) {
        // Proxy the image directly to avoid CORS/referrer issues
        const imgResponse = await fetch(directUrl, {
          headers: {
            'Referer': 'https://prnt.sc/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (imgResponse.ok) {
          const contentType = imgResponse.headers.get('content-type') || 'image/png';
          const buffer = await imgResponse.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
          });
        }
      }

      // Fallback: redirect to the original URL
      return NextResponse.redirect(url);
    }

    // For non-Lightshot URLs, simply redirect
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Screenshot proxy error:', error);
    return NextResponse.redirect(url);
  }
}

async function resolveLightshotUrl(pageUrl: string): Promise<string | null> {
  // Check cache first
  const cached = lightshotCache.get(pageUrl);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }

  try {
    // Fetch the Lightshot page HTML
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract the image URL from og:image meta tag
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);

    if (ogMatch?.[1]) {
      const directUrl = ogMatch[1];
      lightshotCache.set(pageUrl, { url: directUrl, expires: Date.now() + CACHE_TTL });
      return directUrl;
    }

    // Fallback: look for the main screenshot image tag
    const imgMatch = html.match(/<img[^>]+id=["']screenshot-image["'][^>]+src=["']([^"']+)["']/i)
      || html.match(/src=["']([^"']+)["'][^>]+id=["']screenshot-image["']/i)
      || html.match(/<img[^>]+class=["'][^"']*screenshot[^"']*["'][^>]+src=["']([^"']+)["']/i);

    if (imgMatch?.[1]) {
      const directUrl = imgMatch[1];
      lightshotCache.set(pageUrl, { url: directUrl, expires: Date.now() + CACHE_TTL });
      return directUrl;
    }

    // Fallback: look for img.lightshot.app URLs anywhere in the HTML
    const lightshotImgMatch = html.match(/https?:\/\/img\.lightshot\.app\/[^\s"'<>]+/i);
    if (lightshotImgMatch?.[0]) {
      const directUrl = lightshotImgMatch[0];
      lightshotCache.set(pageUrl, { url: directUrl, expires: Date.now() + CACHE_TTL });
      return directUrl;
    }

    return null;
  } catch (error) {
    console.error('Failed to resolve Lightshot URL:', error);
    return null;
  }
}
