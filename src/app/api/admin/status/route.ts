import { NextResponse } from 'next/server';
import { db } from '@/lib/db-adapter';

export async function GET() {
    try {
        const groups = ['A', 'B', 'C', 'D'];
        const status = [];

        for (const groupId of groups) {
            const groupData = await db.getGroup(groupId);

            // Calculate total treasures found
            const foundCount = groupData?.foundTreasures?.length || 0;
            const score = groupData?.score || 0;

            status.push({
                id: groupId,
                score,
                foundCount,
                foundTreasures: groupData?.foundTreasures || []
            });
        }

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error('Admin Status API Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
