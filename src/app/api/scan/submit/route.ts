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
        const rawUsername = cookieStore.get('treasure-username')?.value;
        const username = rawUsername ? decodeURIComponent(rawUsername) : undefined;

        // 2. Get Treasure Data
        const treasure = await db.getTreasure(treasureId);

        if (!treasure) {
            return NextResponse.json({ success: false, message: 'Treasure not found' }, { status: 404 });
        }

        // Validate Answer (Case insensitive)
        const isCorrect = treasure.answer.trim().toLowerCase() === answer.trim().toLowerCase();

        if (!isCorrect) {
            // "One Strike" Logic: Failure = Found with 0 Score
            // 1. Get Group Data (DB)
            const groupData = await db.getGroup(group);
            if (groupData) {
                // Check if already found (prevent double writing)
                if (!groupData.foundTreasures.some(t => t.treasureId === treasureId)) {
                    groupData.foundTreasures.push({
                        treasureId,
                        score: 0, // Zero points for failure
                        foundAt: new Date().toISOString(),
                        foundBy: username
                    });
                    await db.saveGroup(group, groupData);
                }
            }

            // --- Cookie Persistence ---
            const foundCookie = cookieStore.get('treasure-found');
            let foundlist: number[] = [];
            if (foundCookie) {
                try { foundlist = JSON.parse(foundCookie.value); } catch (e) { /* ignore */ }
            }
            if (!foundlist.includes(treasureId)) {
                foundlist.push(treasureId);
            }
            // We need to update cookie in response, so we create response below

            const response = NextResponse.json({
                success: false,
                message: 'Wrong Answer! Hint 2 is revealed. (No Resubmission)',
                hints: treasure.hints.length > 1 ? [treasure.hints[1]] : [],
                failedAndSaved: true // Flag for frontend
            });

            response.cookies.set({
                name: 'treasure-found',
                value: JSON.stringify(foundlist),
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            return response;
        }

        // 1. Update Group Data Atomically (Mutex Protected)
        await db.updateGroup(group, (groupData) => {
            // Check if already found to prevent double counting
            if (!groupData.foundTreasures.some((t: any) => t.treasureId === treasureId)) {
                const pointsAwarded = treasure.points;
                groupData.score += pointsAwarded;

                groupData.foundTreasures.push({
                    treasureId,
                    score: pointsAwarded,
                    foundAt: new Date().toISOString(),
                    foundBy: username // Save decoded username
                });
            }
            return groupData;
        });

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
