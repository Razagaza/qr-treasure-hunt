import { NextResponse } from 'next/server';
import { getAllTreasures } from '@/lib/file-db';
import { encrypt } from '@/lib/crypto';

export async function GET() {
    try {
        const treasures = await getAllTreasures();

        const enriched = treasures.map(t => ({
            id: t.id,
            question: t.question,
            points: t.points,
            encryptedQr: encrypt(String(t.id))
        }));

        return NextResponse.json({ success: true, treasures: enriched });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
