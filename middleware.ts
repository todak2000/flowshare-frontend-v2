// middleware.ts (root level)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/onboarding/login',
    '/onboarding/register',
  ];

  // Check if the current path is a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For API routes, check for authorization header
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }
    
    return NextResponse.next();
  }

  // For protected routes, check for auth token in cookies or redirect to login
  const authToken = request.cookies.get('authToken')?.value;
  
  if (!authToken && (pathname.startsWith('/dashboard') || pathname.startsWith('/production'))) {
    const loginUrl = new URL('/onboarding/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/production/:path*',
    '/api/:path*'
  ]
};