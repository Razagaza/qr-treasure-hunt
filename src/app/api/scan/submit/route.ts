import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTreasureData, getGroupData, saveGroupData } from '@/lib/file-db';

export async function POST(request: Request) {
    try {
        const { treasureId, answer } = await request.json();
        const cookieStore = await cookies();
        const groupCookie = cookieStore.get('treasure-group');

        if (!groupCookie) {
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;
        const treasure = await getTreasureData(treasureId);

        if (!treasure) {
            return NextResponse.json({ success: false, message: 'Treasure not found' }, { status: 404 });
        }

        // Validate Answer (Case insensitive)
        const isCorrect = treasure.answer.trim().toLowerCase() === answer.trim().toLowerCase();

        if (!isCorrect) {
            return NextResponse.json({ success: false, message: 'Incorrect answer' });
        }

        // Update Group Data
        const groupData = await getGroupData(group);
        if (groupData) {
            // Check if already found to prevent double counting
            if (!groupData.foundTreasures.some(t => t.treasureId === treasureId)) {
                groupData.score += treasure.points;
                groupData.foundTreasures.push({
                    treasureId,
                    foundAt: new Date().toISOString(),
                    score: treasure.points
                });
                await saveGroupData(group, groupData);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Correct!',
            points: treasure.points,
            hints: treasure.hints
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
