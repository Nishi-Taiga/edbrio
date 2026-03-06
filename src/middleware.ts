import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n middleware for API routes and admin routes (admin stays Japanese-only)
  if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  // Run next-intl middleware (handles locale detection, rewriting & redirect)
  const intlResponse = intlMiddleware(request);

  // Pass the intl response to updateSession so the rewrite/redirect is preserved
  // while still applying Supabase session refresh + security headers
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
