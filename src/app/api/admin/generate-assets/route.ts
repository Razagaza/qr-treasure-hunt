import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { seed } from '@/lib/seed';
import { getAllQrMappings } from '@/lib/file-db';

export async function GET() {
    try {
        console.log('--- [API] Generating Assets Start ---');

        // 1. Seed
        await seed();

        // 2. Generate Images
        const mappings = await getAllQrMappings();
        const PUBLIC_QRS_DIR = path.join(process.cwd(), 'public', 'qrs');

        if (!fs.existsSync(PUBLIC_QRS_DIR)) {
            fs.mkdirSync(PUBLIC_QRS_DIR, { recursive: true });
        }

        // Reverse mapping
        const idToCode: Record<number, string> = {};
        for (const [code, id] of Object.entries(mappings)) {
            idToCode[id] = code;
        }

        let count = 0;
        for (let id = 0; id < 30; id++) {
            const code = idToCode[id];
            if (!code) continue;

            const qrData = JSON.stringify({ id: code, type: 'treasure' });
            const filePath = path.join(PUBLIC_QRS_DIR, `${id}.png`);

            await QRCode.toFile(filePath, qrData, {
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            count++;
        }

        console.log(`--- [API] Generated ${count} QR images ---`);

        return NextResponse.json({
            success: true,
            message: `Generated ${count} QR codes in public/qrs`,
            count
        });

    } catch (error) {
        console.error('Asset Generation Failed:', error);
        return NextResponse.json({ success: false, message: 'Failed', error: String(error) }, { status: 500 });
    }
}
