import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { group, username } = await request.json();

        if (!['A', 'B', 'C', 'D', 'E'].includes(group)) {
            return NextResponse.json({ success: false, message: 'Invalid group' }, { status: 400 });
        }

        const cookieStore = await cookies();

        // 1. Set Group Cookie
        cookieStore.set({
            name: 'treasure-group',
            value: group,
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        // 2. Set Username Cookie (New)
        if (username) {
            cookieStore.set({
                name: 'treasure-username',
                value: encodeURIComponent(username), // Simple encoding
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            });
        }

        return NextResponse.json({ success: true, group, username });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
