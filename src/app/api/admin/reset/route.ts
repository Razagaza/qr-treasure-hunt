import { NextResponse } from 'next/server';
import { saveGroupData, GroupData } from '@/lib/file-db';

export async function POST() {
    try {
        const groups = ['A', 'B', 'C', 'D'];
        for (const group of groups) {
            const initialData: GroupData = {
                id: group,
                score: 0,
                foundTreasures: []
            };
            await saveGroupData(group, initialData);
        }
        return NextResponse.json({ success: true, message: 'Game Reset Complete' });
    } catch (error) {
        console.error('Reset Failed', error);
        return NextResponse.json({ success: false, message: 'Reset Failed' }, { status: 500 });
    }
}
