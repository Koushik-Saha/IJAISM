import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match old article URLs like /5-16-74-article/amlids_25002
  const match = pathname.match(/^\/[^/]+-article\/([^/]+)$/);
  if (match) {
    const articleId = match[1];
    const url = request.nextUrl.clone();
    url.pathname = `/article-redirect/${articleId}`;
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: ['/:path*-article/:articleId*'],
};
