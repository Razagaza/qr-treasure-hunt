import { NextResponse } from 'next/server';
import { seed } from '@/lib/seed';

export async function POST() {
    try {
        console.log('Starting Manual Seed...');
        await seed();
        return NextResponse.json({ success: true, message: 'Data Seeded Successfully' });
    } catch (e: any) {
        console.error('Seed Failed', e);
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
