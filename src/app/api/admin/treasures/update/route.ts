import { NextResponse } from 'next/server';
import { db } from '@/lib/db-adapter';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, question, answer, points, hints, type, choices, timeLimit, active } = body;

        if (typeof id !== 'number') {
            return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
        }

        const existing = await db.getTreasure(id);
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
            timeLimit: timeLimit ?? existing.timeLimit,
            active: active ?? existing.active
        };

        await db.saveTreasure(id, body);

        return NextResponse.json({ success: true, message: 'Updated successfully', treasure: updated });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
