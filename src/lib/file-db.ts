import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const GROUPS_DIR = path.join(DATA_DIR, 'groups');
const TREASURES_DIR = path.join(DATA_DIR, 'treasures');

export interface GroupData {
    id: string; // 'A', 'B', 'C', 'D'
    score: number;
    foundTreasures: {
        treasureId: number;
        foundAt: string; // ISO string
        score: number;
    }[];
}

export interface TreasureData {
    id: number; // 0-29
    question: string;
    type: 'text' | 'choice';
    choices?: string[]; // If type is choice
    correctAnswer: string;
    points: number;
    hints: string[]; // [hint1, hint2]
    timeLimit?: number; // seconds, optional
}

// Ensure directories exist
export async function initDataDirs() {
    await fs.mkdir(GROUPS_DIR, { recursive: true });
    await fs.mkdir(TREASURES_DIR, { recursive: true });
}

// --- Group Operations ---

export async function getGroupData(groupId: string): Promise<GroupData | null> {
    try {
        const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

export async function saveGroupData(groupId: string, data: GroupData): Promise<void> {
    const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// --- Treasure Operations ---

export async function getTreasureData(treasureId: number): Promise<TreasureData | null> {
    try {
        const filePath = path.join(TREASURES_DIR, `${treasureId}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

export async function saveTreasureData(treasureId: number, data: TreasureData): Promise<void> {
    const filePath = path.join(TREASURES_DIR, `${treasureId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getAllTreasures(): Promise<TreasureData[]> {
    const files = await fs.readdir(TREASURES_DIR);
    const treasures: TreasureData[] = [];
    for (const file of files) {
        if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(TREASURES_DIR, file), 'utf-8');
            treasures.push(JSON.parse(data));
        }
    }
    return treasures.sort((a, b) => a.id - b.id);
}
