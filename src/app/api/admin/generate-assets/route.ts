import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { seed } from '@/lib/seed';
import { db } from '@/lib/db-adapter';

export async function GET() {
    try {
        console.log('--- [API] Generating Assets Start ---');

        // 1. Seed
        await seed();

        // 2. Return JSON List (Skip        // Get from DB (Supabase or File)
        const mappings = await db.getAllQrMappings();

        // Reverse mapping for display
        const idToCode: Record<number, string> = {};
        for (const [code, id] of Object.entries(mappings)) {
            idToCode[id] = code;
        }

        const jsonList = [];
        for (let id = 0; id < 30; id++) {
            const code = idToCode[id];
            if (code) {
                jsonList.push({ id, code, qrData: JSON.stringify({ id: code, type: 'treasure' }) });
            }
        }

        console.log(`--- [API] Seeding Complete. Returning ${jsonList.length} codes. ---`);

        return NextResponse.json({
            success: true,
            message: `Seeding Complete. ${jsonList.length} codes generated.`,
            codes: jsonList
        });

    } catch (error) {
        console.error('Asset Generation Failed:', error);
        return NextResponse.json({ success: false, message: 'Failed', error: String(error) }, { status: 500 });
    }
}
