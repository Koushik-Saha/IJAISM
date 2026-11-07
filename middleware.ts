import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Scanner/probe paths that hit the site constantly (Vercel observability
// top-404 list: /wp, /wordpress, /cms, /site, /swedbank-denmark, ...).
// None of these exist in this app — answer at the edge with a plain 404 so
// probes never reach a page render or the database.
// NOTE: /admin is deliberately NOT blocked — it is a real route in this app.
const BLOCKED_PATHS = new Set([
  '/wp',
  '/wordpress',
  '/cms',
  '/site',
  '/swedbank-denmark',
  '/wp-login.php',
  '/xmlrpc.php',
  '/.env',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BLOCKED_PATHS.has(pathname) || pathname.startsWith('/wp-admin')) {
    return new NextResponse(null, { status: 404 });
  }

  // Match old article URLs like /5-16-74-article/amlids_25002
  const match = pathname.match(/^\/[^/]+-article\/([^/]+)$/);
  if (match) {
    const articleId = match[1];
    const url = request.nextUrl.clone();
    url.pathname = `/article-redirect/${articleId}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*-article/:articleId*',
    '/wp',
    '/wordpress',
    '/cms',
    '/site',
    '/swedbank-denmark',
    '/wp-login.php',
    '/xmlrpc.php',
    '/.env',
    '/wp-admin/:path*',
  ],
};
