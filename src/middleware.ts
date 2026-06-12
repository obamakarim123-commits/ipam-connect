import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes = ['/dashboard', '/courses', '/messages', '/directory', '/settings'];
const publicRoutes = ['/', '/auth/signin', '/auth/error'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith('/api');

  // Allow all public routes
  if (isPublicRoute || isApiRoute) {
    return NextResponse.next();
  }

  // Redirect to signin if accessing protected route without token
  if (isProtectedRoute && !token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.append('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to signin page if directly accessing /auth/signin with token
  if (pathname === '/auth/signin' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
