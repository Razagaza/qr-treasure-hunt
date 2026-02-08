import { NextResponse } from 'next/server';
import { seed } from '@/lib/seed';

export async function GET() {
    try {
        await seed();
        return NextResponse.json({ success: true, message: 'Data seeded successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to seed data' }, { status: 500 });
    }
}
