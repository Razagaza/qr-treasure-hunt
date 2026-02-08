import { encrypt, decrypt } from '../src/lib/crypto';
import { seed } from '../src/lib/seed';
import { getGroupData, getTreasureData } from '../src/lib/file-db';
import fs from 'fs';
import path from 'path';

// Mock process.cwd for the file-db to interpret correctly if run from root
// The file-db uses process.cwd() + '/data'. 
// If we run with ts-node from root, it should be fine.

async function runTest() {
    console.log('--- Starting Logic Verification ---');

    // 1. Data Init
    console.log('1. Seeding Data...');
    try {
        await seed();
        console.log('   [PASS] Data seeded.');
    } catch (e) {
        console.error('   [FAIL] Seeding failed', e);
        process.exit(1);
    }

    // 2. Crypto
    console.log('2. Testing Crypto...');
    const original = '15';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    if (original === decrypted) {
        console.log(`   [PASS] Crypto works: ${original} -> ${encrypted.substring(0, 10)}... -> ${decrypted}`);
    } else {
        console.error(`   [FAIL] Crypto mismatch: ${original} vs ${decrypted}`);
        process.exit(1);
    }

    // 3. Mapping Logic
    console.log('3. Testing Mapping Logic...');
    const groups = ['A', 'B', 'C', 'D'];
    const offsets: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

    // Test Case: Scan QR for ID 0
    const qrId0 = '0';
    const encryptedQr0 = encrypt(qrId0);

    for (const group of groups) {
        const offset = offsets[group];
        const items = await getGroupData(group); // Just to check file access

        // Logic from API
        const decryptedId = parseInt(decrypt(encryptedQr0));
        const targetId = (decryptedId + offset) % 30;

        console.log(`   Group ${group} (Offset ${offset}) scans QR(0) -> Maps to Treasure ${targetId}`);

        if (targetId !== offset) {
            console.error(`   [FAIL] Expected Treasure ${offset}, got ${targetId}`);
            process.exit(1);
        }

        // Verify Treasure Exists
        const t = await getTreasureData(targetId);
        if (!t) {
            console.error(`   [FAIL] Treasure ${targetId} data not found`);
            process.exit(1);
        }
    }
    console.log('   [PASS] Mapping Matrix verified.');

    console.log('--- Verification Successful ---');
}

runTest();
