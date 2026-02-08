
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting Migration...');

    const DATA_DIR = path.join(process.cwd(), 'data');
    const GROUPS_DIR = path.join(DATA_DIR, 'groups');
    const TREASURES_DIR = path.join(DATA_DIR, 'treasures');
    const QR_FILE = path.join(DATA_DIR, 'qr_codes.json');

    // 1. Groups
    console.log('Migrating Groups...');
    try {
        const files = await fs.readdir(GROUPS_DIR);
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const content = await fs.readFile(path.join(GROUPS_DIR, file), 'utf-8');
            const data = JSON.parse(content);

            const { error } = await supabase.from('groups').upsert({
                id: data.id,
                score: data.score,
                data: { foundTreasures: data.foundTreasures }
            });
            if (error) console.error(`Failed to migrate group ${data.id}:`, error.message);
            else console.log(`Migrated Group ${data.id}`);
        }
    } catch (e) {
        console.warn('Skipping Groups (dir not found or empty)');
    }

    // 2. Treasures
    console.log('Migrating Treasures...');
    try {
        const files = await fs.readdir(TREASURES_DIR);
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const content = await fs.readFile(path.join(TREASURES_DIR, file), 'utf-8');
            const data = JSON.parse(content);

            const { error } = await supabase.from('treasures').upsert({
                id: data.id,
                content: data
            });
            if (error) console.error(`Failed to migrate treasure ${data.id}:`, error.message);
            else console.log(`Migrated Treasure ${data.id}`);
        }
    } catch (e) {
        console.warn('Skipping Treasures');
    }

    // 3. QR Codes
    console.log('Migrating QR Codes...');
    try {
        const content = await fs.readFile(QR_FILE, 'utf-8');
        const mappings = JSON.parse(content);

        for (const [code, id] of Object.entries(mappings)) {
            const { error } = await supabase.from('qr_codes').upsert({
                code: code,
                treasure_id: id
            });
            if (error) console.error(`Failed to migrate QR ${code}:`, error.message);
        }
        console.log(`Migrated ${Object.keys(mappings).length} QR codes.`);
    } catch (e) {
        console.warn('Skipping QR Codes');
    }

    console.log('Migration Complete');
}

migrate();
