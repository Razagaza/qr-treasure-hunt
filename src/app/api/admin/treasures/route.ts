import { NextResponse } from 'next/server';
import { getAllTreasures, getAllQrMappings } from '@/lib/file-db';

export async function GET() {
    try {
        const treasures = await getAllTreasures();
        const qrMappings = await getAllQrMappings(); // { code: id }

        // Reverse mapping: { id: code }
        const idToCode: Record<number, string> = {};
        for (const [code, id] of Object.entries(qrMappings)) {
            idToCode[id] = code;
        }

        const treasuresWithQr = treasures.map(t => ({
            ...t,
            encryptedQr: idToCode[t.id] // Use 'encryptedQr' key for frontend compatibility, though it's raw code now
        }));

        return NextResponse.json({ success: true, treasures: treasuresWithQr });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch treasures' }, { status: 500 });
    }
}
