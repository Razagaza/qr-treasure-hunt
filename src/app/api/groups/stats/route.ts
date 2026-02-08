import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGroupData, getTreasureData } from '@/lib/file-db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const groupCookie = cookieStore.get('treasure-group');

        if (!groupCookie) {
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;
        const groupData = await getGroupData(group);

        if (!groupData) {
            return NextResponse.json({ success: false, message: 'Group data not found' }, { status: 404 });
        }

        // Enrich found treasures with details (hints are allowed to be seen now)
        const foundTreasures = await Promise.all(
            groupData.foundTreasures.map(async (ft) => {
                const t = await getTreasureData(ft.treasureId);
                return {
                    ...ft,
                    question: t?.question,
                    hints: t?.hints
                };
            })
        );

        // Sort by most recently found
        foundTreasures.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());

        return NextResponse.json({
            success: true,
            group,
            score: groupData.score,
            foundTreasures
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
