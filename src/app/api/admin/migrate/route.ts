
import { NextResponse } from 'next/server';
import { db } from '@/lib/db-adapter';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Supabase Admin Client (for direct DB manipulation if adapter doesn't suffice)
// Using NON-PUBLIC key if available, else anon key (might need RLS policies to allow insert)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST() {
    try {
        const results = {
            groups: 0,
            treasures: 0,
            qr_codes: 0,
            errors: [] as string[]
        };

        const DATA_DIR = path.join(process.cwd(), 'data');

        // 1. Groups
        try {
            const groupsDir = path.join(DATA_DIR, 'groups');
            const files = await fs.readdir(groupsDir);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const content = await fs.readFile(path.join(groupsDir, file), 'utf-8');
                const data = JSON.parse(content);

                const { error } = await supabase.from('groups').upsert({
                    id: data.id,
                    score: data.score,
                    data: { foundTreasures: data.foundTreasures }
                });
                if (error) results.errors.push(`Group ${data.id}: ${error.message}`);
                else results.groups++;
            }
        } catch (e) {
            results.errors.push('Groups dir not found or empty');
        }

        /*
        // 2. Treasures
        try {
            const treasuresDir = path.join(DATA_DIR, 'treasures');
            const files = await fs.readdir(treasuresDir);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const content = await fs.readFile(path.join(treasuresDir, file), 'utf-8');
                const data = JSON.parse(content);

                const { error } = await supabase.from('treasures').upsert({
                    id: data.id,
                    content: data
                });
                if (error) results.errors.push(`Treasure ${data.id}: ${error.message}`);
                else results.treasures++;
            }
        } catch (e) {
            results.errors.push('Treasures dir not found');
        }

        // 3. QR Codes
        try {
            const qrFile = path.join(DATA_DIR, 'qr_codes.json');
            const content = await fs.readFile(qrFile, 'utf-8');
            const mappings = JSON.parse(content);

            for (const [code, id] of Object.entries(mappings)) {
                const { error } = await supabase.from('qr_codes').upsert({
                    code: code,
                    treasure_id: id as number
                });
                if (error) results.errors.push(`QR ${code}: ${error.message}`);
            }
            results.qr_codes = Object.keys(mappings).length;
        } catch (e) {
            results.errors.push('qr_codes.json not found');
        }
        */

        return NextResponse.json({ success: true, results });

    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
