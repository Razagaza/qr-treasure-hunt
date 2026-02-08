import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db-adapter';

export async function POST(request: Request) {
    try {
        const { qrData } = await request.json();
        console.log('--- [Validate API] Request Start ---');
        console.log('Received qrData:', qrData);

        const cookieStore = await cookies();
        // 0. Check Game Settings (Global Kill Switch)
        const qrEnabled = await db.getGameSettings('qr_enabled');
        if (qrEnabled === false) { // Explicit check for false, default true
            return NextResponse.json({
                success: false,
                message: 'QR Scanning is currently disabled for this phase of the game.'
            }, { status: 403 });
        }

        const groupCookie = cookieStore.get('treasure-group');

        if (!groupCookie) {
            console.log('Error: No group cookie');
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;
        let baseId: number | null = null;

        // 1. Resolve QR to Treasure ID (DB)
        let code = qrData;
        try {
            // Attempt to parse if it's a JSON string
            if (qrData.startsWith('{')) {
                const parsed = JSON.parse(qrData);
                if (parsed.id) code = parsed.id;
            }
        } catch (e) {
            console.log('[Validate] QR Parse Warning: Not a valid JSON, using raw string.');
        }

        // 1. Resolve QR to Treasure ID (DB)
        console.log(`[Validate] Lookup QR: ${code}`);
        const qrMapping = await db.getTreasureIdByQr(code);

        if (!qrMapping) {
            console.error(`[Validate] Error: QR Mapping Failed for code '${code}'`);
            if (process.env.NODE_ENV === 'development') {
                console.log('[Validate] Debug info: Ensure qr_codes table has data and code matches exactly.');
            }
            return NextResponse.json({ success: false, message: 'Invalid or unknown QR code' }, { status: 400 });
        }

        // Check QR Active Status (Primary Gate)
        if (qrMapping.active === false) {
            return NextResponse.json({
                success: false,
                message: '꽝! 아쉽지만 다음 기회에...',
                inactive: true
            }, { status: 200 });
        }

        baseId = qrMapping.id;
        console.log(`[Validate] Mapped ID: ${baseId}`);

        // 2. Calculate Target ID based on Group Offset
        const offsets: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const offset = offsets[group] || 0;
        const targetId = (baseId + offset) % 30;

        console.log(`Group: ${group}, Offset: ${offset}, Target Treasure ID: ${targetId}`);

        // 2.5 Check if Treasure is Active (Secondary Gate - Optional, but kept for safety)
        const treasure = await db.getTreasure(targetId);
        if (!treasure) return NextResponse.json({ success: false, message: 'Invalid Treasure Target' }, { status: 404 });

        // Note: User prefers QR codes table to manage active state, so we prioritize that. 
        // We can keep this if we want double-switch, but user said "JSON data lost", so maybe this is unreliable.
        // Let's assume if it exists, it's fine, unless explicit active=false exists in JSON.
        if (treasure.active === false) {
            return NextResponse.json({
                success: false,
                message: 'This treasure is currently disabled.',
                inactive: true
            }, { status: 200 });
        }

        // 3. Check if already found (File/Memory + Cookie)
        const groupData = await db.getGroup(group);
        let isAlreadyFound = groupData?.foundTreasures.some(t => t.treasureId === targetId);

        if (!isAlreadyFound) {
            // Check Cookie
            const foundCookie = cookieStore.get('treasure-found');
            if (foundCookie) {
                try {
                    const foundIds: number[] = JSON.parse(foundCookie.value);
                    if (foundIds.includes(targetId)) isAlreadyFound = true;
                } catch (e) { /* ignore */ }
            }
        }

        if (isAlreadyFound) {
            console.log('Status: Already found');
            return NextResponse.json({
                success: false,
                message: 'Already found this treasure!',
                alreadyFound: true
            });
        }

        // 4. Return Treasure Data (already fetched in step 2.5)
        console.log('Success: Return treasure data');
        console.log('--- [Validate API] Check End ---');

        // Return strict data needed for solving (hide answer/hints)
        return NextResponse.json({
            success: true,
            treasure: {
                id: treasure.id,
                question: treasure.question,
                type: treasure.type,
                choices: treasure.choices,
                points: treasure.points,
                timeLimit: treasure.timeLimit
            }
        });

    } catch (error) {
        console.error('[Validate API] Server Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
