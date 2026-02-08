import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db-adapter';

export async function POST(request: Request) {
    try {
        const { treasureId, answer } = await request.json();
        const cookieStore = await cookies();
        const groupCookie = cookieStore.get('treasure-group');

        if (!groupCookie) {
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;

        // 2. Get Treasure Data
        const treasure = await db.getTreasure(treasureId);

        if (!treasure) {
            return NextResponse.json({ success: false, message: 'Treasure not found' }, { status: 404 });
        }

        // Validate Answer (Case insensitive)
        const isCorrect = treasure.answer.trim().toLowerCase() === answer.trim().toLowerCase();

        if (!isCorrect) {
            // Return Failure Message + 2nd Hint (Index 1)
            return NextResponse.json({
                success: false,
                message: 'Incorrect answer',
                hints: treasure.hints.length > 1 ? [treasure.hints[1]] : []
            });
        }

        // 1. Get Group Data (DB)
        const groupData = await db.getGroup(group);
        if (groupData) {
            // Check if already found to prevent double counting
            if (!groupData.foundTreasures.some(t => t.treasureId === treasureId)) {
                const pointsAwarded = treasure.points;
                // 4. Update Group Data (DB)
                groupData.score += pointsAwarded;
                groupData.foundTreasures.push({
                    treasureId,
                    score: pointsAwarded,
                    foundAt: new Date().toISOString()
                });
                await db.saveGroup(group, groupData);
            }
        }

        // --- Cookie Persistence (for Read-Only FS) ---
        const foundCookie = cookieStore.get('treasure-found');
        let foundlist: number[] = [];
        if (foundCookie) {
            try {
                foundlist = JSON.parse(foundCookie.value);
            } catch (e) { /* ignore */ }
        }
        if (!foundlist.includes(treasureId)) {
            foundlist.push(treasureId);
        }

        const response = NextResponse.json({
            success: true,
            message: 'Correct!',
            points: treasure.points,
            hints: treasure.hints.length > 0 ? [treasure.hints[0]] : [] // Return 1st Hint (Index 0)
        });

        response.cookies.set({
            name: 'treasure-found',
            value: JSON.stringify(foundlist),
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
