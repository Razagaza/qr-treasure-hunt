
import { NextResponse } from 'next/server';
import { db } from '@/lib/db-adapter';

export async function GET() {
    try {
        const enabled = await db.getGameSettings('qr_enabled');
        return NextResponse.json({ success: true, qr_enabled: enabled ?? true });
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { qr_enabled } = body;

        if (typeof qr_enabled !== 'boolean') {
            return NextResponse.json({ success: false, message: 'Invalid value' }, { status: 400 });
        }

        await db.updateGameSettings('qr_enabled', qr_enabled);
        return NextResponse.json({ success: true, qr_enabled });
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
    }
}
