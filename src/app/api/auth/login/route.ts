import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { group } = await request.json();

        if (!['A', 'B', 'C', 'D'].includes(group)) {
            return NextResponse.json({ success: false, message: 'Invalid group' }, { status: 400 });
        }

        // Set cookie
        (await cookies()).set({
            name: 'treasure-group',
            value: group,
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return NextResponse.json({ success: true, group });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
