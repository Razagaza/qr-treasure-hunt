import { NextResponse } from 'next/server';
import { saveGroupData, GroupData } from '@/lib/file-db';

export async function POST() {
    try {
        const groups = ['A', 'B', 'C', 'D', 'E'];
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

            // Reset Groups: Score 0, Empty Data
            // We do this by updating all rows.
            // Note: Since 'groups' table key is ID, we might need to iterate or do a bulk update if possible.
            // Supabase 'update' without 'eq' updates all rows if RLS allows, but usually requires a where clause.
            // We can just iterate the known groups.
            const groups = ['A', 'B', 'C', 'D', 'E'];
            for (const group of groups) {
                await supabase
                    .from('groups')
                    .upsert({
                        id: group,
                        score: 0,
                        data: { foundTreasures: [] }
                    });
            }
            console.log('Supabase Data Reset');
        } else {
            // File Fallback
            const groups = ['A', 'B', 'C', 'D', 'E'];
            for (const group of groups) {
                const initialData: GroupData = {
                    id: group,
                    score: 0,
                    foundTreasures: []
                };
                await saveGroupData(group, initialData);
            }
        }
        return NextResponse.json({ success: true, message: 'Game Reset Complete' });
    } catch (error) {
        console.error('Reset Failed', error);
        return NextResponse.json({ success: false, message: 'Reset Failed' }, { status: 500 });
    }
}
