import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const groupCookie = request.cookies.get('treasure-group');
    const { pathname } = request.nextUrl;

    // Protect /scan, /dashboard, and /schedule
    if ((pathname.startsWith('/scan') || pathname.startsWith('/dashboard') || pathname.startsWith('/schedule')) && !groupCookie) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Create response
    const response = NextResponse.next();
    return response;
}

export const config = {
    matcher: ['/scan/:path*', '/dashboard/:path*', '/schedule/:path*'],
};
