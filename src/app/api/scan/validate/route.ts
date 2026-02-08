import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/crypto';
import { getTreasureData, getGroupData } from '@/lib/file-db';

export async function POST(request: Request) {
    try {
        const { qrData } = await request.json();
        const cookieStore = await cookies();
        const groupCookie = cookieStore.get('treasure-group');

        if (!groupCookie) {
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;
        let baseId: number;

        // 1. Decrypt QR (Handles both raw string and JSON wrapper)
        let encryptedString = qrData;
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(qrData);
            if (parsed.type === 'treasure' && parsed.id) {
                encryptedString = parsed.id;
            }
        } catch (e) {
            // Not JSON, assume raw string
        }

        try {
            const decrypted = decrypt(encryptedString);
            baseId = parseInt(decrypted, 10);
            if (isNaN(baseId)) throw new Error('Invalid ID');
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid or corrupted QR code' }, { status: 400 });
        }

        // 2. Calculate Target ID based on Group Offset
        const offsets: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const offset = offsets[group] || 0;
        const targetId = (baseId + offset) % 30;

        // 3. Check if already found
        const groupData = await getGroupData(group);
        const isAlreadyFound = groupData?.foundTreasures.some(t => t.treasureId === targetId);

        if (isAlreadyFound) {
            return NextResponse.json({
                success: false,
                message: 'Already found this treasure!',
                alreadyFound: true
            });
        }

        // 4. Get Treasure Data
        const treasure = await getTreasureData(targetId);
        if (!treasure) {
            return NextResponse.json({ success: false, message: 'Treasure data not found. Contact Admin.' }, { status: 404 });
        }

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
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
