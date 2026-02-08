import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { seed } from '../src/lib/seed';
import { getAllQrMappings } from '../src/lib/file-db';

async function generate() {
    console.log('--- 1. Seeding Data ---');
    await seed();
    console.log('✅ Seeding Complete. qr_codes.json should exist.');

    console.log('--- 2. Generating QR Images ---');
    const mappings = await getAllQrMappings();
    // mappings: { "CODE": ID }

    const PUBLIC_QRS_DIR = path.join(process.cwd(), 'public', 'qrs');
    if (!fs.existsSync(PUBLIC_QRS_DIR)) {
        fs.mkdirSync(PUBLIC_QRS_DIR, { recursive: true });
    }

    // Reverse mapping to get Code by ID
    const idToCode: Record<number, string> = {};
    for (const [code, id] of Object.entries(mappings)) {
        idToCode[id] = code;
    }

    for (let id = 0; id < 30; id++) {
        const code = idToCode[id];
        if (!code) {
            console.warn(`⚠️ No code found for Treasure ID ${id}`);
            continue;
        }

        const qrData = JSON.stringify({ id: code, type: 'treasure' });
        const filePath = path.join(PUBLIC_QRS_DIR, `${id}.png`);

        await QRCode.toFile(filePath, qrData, {
            width: 300,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        console.log(`Generated public/qrs/${id}.png`);
    }

    console.log('✅ All QR images generated in public/qrs/');
}

generate().catch(console.error);
