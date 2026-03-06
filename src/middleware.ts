import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n middleware for API routes and admin routes
  if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
    return;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/(ja|en|fr|es|it|sv|ru|zh|ko|ar|pt|de|hi|zh-TW)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
