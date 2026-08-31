import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy to the FastAPI data service.
 *
 * Keeps the backend origin out of the browser and reads LH44_API_URL at request
 * time, so a deployment can be repointed without rebuilding. When the service is
 * absent it returns a structured 503 that the client components render as their
 * documented unavailable states rather than an exception.
 */
const API = process.env.LH44_API_URL ?? 'http://localhost:8044';
const TIMEOUT_MS = 30_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const search = request.nextUrl.search;
  const target = `${API}/api/${path.map(encodeURIComponent).join('/')}${search}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(target, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        // Finished sessions are immutable; this is a safe shared-cache window.
        'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    console.warn(`[lh44] data service unreachable at ${target}:`, error);
    return NextResponse.json(
      {
        available: false,
        reason: aborted
          ? 'The data service did not respond in time. Session loads can take a while on a cold cache.'
          : 'The FastF1 data service is not running. Start the backend to load live session data.',
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }
}
