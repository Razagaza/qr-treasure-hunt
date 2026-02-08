import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTreasureData, getGroupData, getTreasureIdByQr } from '@/lib/file-db';

export async function POST(request: Request) {
    try {
        const { qrData } = await request.json();
        console.log('--- [Validate API] Request Start ---');
        console.log('Received qrData:', qrData);

        const cookieStore = await cookies();
        const groupCookie = cookieStore.get('treasure-group');

        if (!groupCookie) {
            console.log('Error: No group cookie');
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;
        let baseId: number | null = null;

        // 1. Extract Code and Lookup ID
        // Support both raw string and JSON wrapper ({"id":"code","type":"treasure"})
        let codeToLookup = qrData;

        try {
            const parsed = JSON.parse(qrData);
            if (parsed.type === 'treasure' && parsed.id) {
                codeToLookup = parsed.id;
            }
        } catch (e) {
            // Not JSON, use raw
        }

        console.log('Code extracted for lookup:', codeToLookup);

        baseId = await getTreasureIdByQr(codeToLookup);
        console.log('Mapped Treasure ID:', baseId);

        if (baseId === null) {
            console.log('Error: Invalid QR code (mapping not found)');
            return NextResponse.json({ success: false, message: 'Invalid or unknown QR code' }, { status: 400 });
        }

        // 2. Calculate Target ID based on Group Offset
        const offsets: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const offset = offsets[group] || 0;
        const targetId = (baseId + offset) % 30;

        console.log(`Group: ${group}, Offset: ${offset}, Target Treasure ID: ${targetId}`);

        // 3. Check if already found
        const groupData = await getGroupData(group);
        const isAlreadyFound = groupData?.foundTreasures.some(t => t.treasureId === targetId);

        if (isAlreadyFound) {
            console.log('Status: Already found');
            return NextResponse.json({
                success: false,
                message: 'Already found this treasure!',
                alreadyFound: true
            });
        }

        // 4. Get Treasure Data
        const treasure = await getTreasureData(targetId);
        if (!treasure) {
            console.log('Error: Treasure data missing for ID', targetId);
            return NextResponse.json({ success: false, message: 'Treasure data not found. Contact Admin.' }, { status: 404 });
        }

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
