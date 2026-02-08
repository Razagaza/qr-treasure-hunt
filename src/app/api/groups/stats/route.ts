import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGroupData, getTreasureData, saveGroupData } from '@/lib/file-db';

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
        let groupData = await getGroupData(group);

        // Fallback for Read-Only FS or File Error
        if (!groupData) {
            console.warn(`[Stats] Group data missing for ${group}, using memory fallback.`);
            groupData = {
                id: group,
                score: 0,
                foundTreasures: []
            };
            // Try to save, but ignore error if it fails (e.g. read-only fs)
            try {
                await saveGroupData(group, groupData);
            } catch (saveErr) {
                console.warn('[Stats] Failed to persist auto-healed data:', saveErr);
            }
        }

        // Enrich found treasures with details
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
            username,
            score: groupData.score,
            foundTreasures
        });

    } catch (error) {
        console.error('[Stats] API Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
