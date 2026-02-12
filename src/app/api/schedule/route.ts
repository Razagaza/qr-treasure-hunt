import { NextResponse } from 'next/server';
import { db } from '@/lib/db-adapter';

export async function GET() {
    try {
        const schedule = await db.getSchedule();
        return NextResponse.json({ success: true, schedule });
    } catch (error) {
        console.error('Schedule API Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
