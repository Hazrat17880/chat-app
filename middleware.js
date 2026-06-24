import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/otp-verification',
  '/forgot-password',
  '/reset-password',
  '/api/login',
  '/api/signup',
  '/api/send-otp',
  '/api/verify-otp',
];

// Routes that should redirect to chat if already authenticated (EXCLUDING forgot-password)
const authRoutes = ['/login', '/signup', '/otp-verification'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If token exists and trying to access auth routes (login/signup), redirect to chat
  // EXCLUDING forgot-password and reset-password
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // If no token and trying to access protected routes, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If token exists and trying to access protected routes, verify it
  if (token && !isPublicRoute) {
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-username', decoded.username);
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-user-role', decoded.role || 'user');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Token is invalid or expired
      console.error('Token verification failed:', error.message);
      
      // Clear invalid token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('refreshToken');
      return response;
    }
  }

  // Allow public routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except protected ones)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};