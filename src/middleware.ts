import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const groupCookie = request.cookies.get('treasure-group');
    const { pathname } = request.nextUrl;

    // Protect /scan and /dashboard
    if ((pathname.startsWith('/scan') || pathname.startsWith('/dashboard')) && !groupCookie) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Create response
    const response = NextResponse.next();
    return response;
}

export const config = {
    matcher: ['/scan/:path*', '/dashboard/:path*'],
};
