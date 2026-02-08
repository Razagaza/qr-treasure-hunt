import { saveGroupData, saveTreasureData, initDataDirs, GroupData, TreasureData } from '@/lib/file-db';
import { encrypt } from '@/lib/crypto';
import type { NextApiRequest, NextApiResponse } from 'next'; // Using API route for convenience running

// This is a temporary script/route to initialize data
export async function seed() {
    await initDataDirs();

    // Create Groups
    const groups = ['A', 'B', 'C', 'D'];
    for (const group of groups) {
        const initialData: GroupData = {
            id: group,
            score: 0,
            foundTreasures: []
        };
        await saveGroupData(group, initialData);
        console.log(`Created Group ${group}`);
    }

    // Create Treasures (0-29)
    for (let i = 0; i < 30; i++) {
        const isMath = i % 2 === 0;
        const isTimed = i % 5 === 0; // Every 5th is timed

        // Generate simple math problem or trivia
        const question = isMath
            ? `What is ${i + 5} + ${i * 2}?`
            : `What is the capital of FakeCountry${i}?`;

        const answer = isMath
            ? String((i + 5) + (i * 2))
            : `Capital${i}`;

        const treasure: TreasureData = {
            id: i,
            question: question,
            type: isMath ? 'text' : 'choice', // Alternate types
            choices: isMath ? undefined : [`Capital${i}`, `City${i}`, `Town${i}`, `Village${i}`],
            answer: answer,
            points: (i + 1) * 10,
            hints: [`Hint 1 for Treasure ${i}`, `The answer starts with ${answer[0]}`],
            timeLimit: isTimed ? 30 : undefined
        };

        if (!isMath && treasure.choices) {
            // Shuffle choices slightly
            treasure.choices.sort(() => Math.random() - 0.5);
        }

        await saveTreasureData(i, treasure);

        // Generate and Log Encrypted Mapping
        // Recall: Mapping is (baseId + groupOffset) % 30
        // We want the QR code to be just an integer ID encrypted.
        // When a user scans QR 'X', Group A maps to X, Group B maps to X+1...
        // Effectively, we just need QR codes 0-29.
        const encryptedId = encrypt(String(i));
        console.log(`Treasure ID ${i} -> Encrypted QR: ${encryptedId}`);
    }

    console.log('Seeding Complete');
}
