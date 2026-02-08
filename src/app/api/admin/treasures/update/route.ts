import { NextResponse } from 'next/server';
import { saveTreasureData, getTreasureData } from '@/lib/file-db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, question, answer, points, hints, type, choices, timeLimit } = body;

        if (typeof id !== 'number') {
            return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
        }

        const existing = await getTreasureData(id);
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Treasure not found' }, { status: 404 });
        }

        const updated = {
            ...existing,
            question: question ?? existing.question,
            answer: answer ?? existing.answer,
            points: points ?? existing.points,
            hints: hints ?? existing.hints,
            type: type ?? existing.type,
            choices: choices ?? existing.choices,
            timeLimit: timeLimit ?? existing.timeLimit
        };

        await saveTreasureData(id, updated);

        return NextResponse.json({ success: true, message: 'Updated successfully', treasure: updated });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
