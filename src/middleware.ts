import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip static files
  if (
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.startsWith('/_next/image') ||
    request.nextUrl.pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }
  
  // Get the incoming response
  const response = NextResponse.next();
  
  // Add no-cache headers to all non-static responses
  response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export const config = {
  // Match all routes except specific static asset patterns
  matcher: [
    // Exclude Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ],
}; 