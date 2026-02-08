import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();

    // Clear all game cookies
    cookieStore.delete('treasure-group');
    cookieStore.delete('treasure-username');
    cookieStore.delete('treasure-found');

    return NextResponse.json({ success: true, message: 'Logged out' });
}
