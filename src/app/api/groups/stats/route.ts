import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db-adapter';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const groupCookie = cookieStore.get('treasure-group');
        const userCookie = cookieStore.get('treasure-username');

        if (!groupCookie) {
            return NextResponse.json({ success: false, message: 'No group selected' }, { status: 401 });
        }

        const group = groupCookie.value;
        const username = userCookie ? decodeURIComponent(userCookie.value) : 'Guest';

        // Attempt to get data, auto-heal if missing is handled in file-db but we double check here
        let groupData = await db.getGroup(group);

        // Save merged back to DB/File if needed
        // await db.saveGroup(group, groupData);
        // Fallback for Read-Only FS or File Error
        if (!groupData) {
            console.warn(`[Stats] Group data missing for ${group}, using memory fallback.`);
            groupData = {
                id: group,
                score: 0,
                foundTreasures: []
            };
        }

        // --- Cookie Persistence Merge ---
        const foundCookie = cookieStore.get('treasure-found');
        if (foundCookie) {
            try {
                const foundIds: number[] = JSON.parse(foundCookie.value);
                // Merge into groupData if not already present
                for (const id of foundIds) {
                    if (!groupData.foundTreasures.some(ft => ft.treasureId === id)) {
                        const t = await db.getTreasure(id);
                        if (t) {
                            groupData.foundTreasures.push({
                                treasureId: id,
                                foundAt: new Date().toISOString(), // Approximate
                                score: t.points
                            });
                            groupData.score += t.points;
                        }
                    }
                }
            } catch (e) { console.warn('[Stats] Cookie parse failed', e); }
        }

        // Enrich found treasures with details
        const foundTreasures = await Promise.all(
            groupData.foundTreasures.map(async (ft) => {
                const treasure = await db.getTreasure(ft.treasureId);
                return {
                    ...ft,
                    question: treasure?.question,
                    hints: treasure?.hints
                };
            })
        );

        // Sort by most recently found
        foundTreasures.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());

        return NextResponse.json({
            success: true,
            group,
            username,
            score: groupData.score,
            foundTreasures
        });

    } catch (error) {
        console.error('[Stats] API Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
