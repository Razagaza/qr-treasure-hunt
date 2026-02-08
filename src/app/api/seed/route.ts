import { NextResponse } from 'next/server';
import { seed } from '@/lib/seed';

export async function GET() {
    try {
        await seed();
        return NextResponse.json({ success: true, message: 'Seeding complete' });
    } catch (error) {
        console.error('Seeding failed:', error);
        return NextResponse.json({ success: false, message: 'Seeding failed' }, { status: 500 });
    }
}
