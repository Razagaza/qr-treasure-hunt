import fs from 'fs/promises';
import path from 'path';

// In-Memory Fallback for Serverless/Read-Only Environments
const globalStore: any = {
    groups: {},
    treasures: {}
};

// Vercel/AWS Lambda often put app in /var/task. We try to use /tmp for writable if needed, 
// but for now let's just use memory if /data fails.
const DATA_DIR = path.join(process.cwd(), 'data');
const GROUPS_DIR = path.join(DATA_DIR, 'groups');
const TREASURES_DIR = path.join(DATA_DIR, 'treasures');

export interface GroupData {
    id: string;
    score: number;
    foundTreasures: { treasureId: number; score: number; foundAt: string }[];
}

export interface TreasureData {
    id: number;
    question: string;
    type: 'text' | 'choice';
    choices?: string[];
    answer: string;
    points: number;
    hints: string[];
    timeLimit?: number;
}

// Ensure Data Directories Exist
export async function initDataDirs() {
    try {
        await fs.mkdir(GROUPS_DIR, { recursive: true });
        await fs.mkdir(TREASURES_DIR, { recursive: true });
    } catch (error) {
        console.warn('[FileDB] Failed to create directories (likely read-only fs)', error);
        // Do not throw, finding files will just fail and fallback to memory
    }
}

// --- Group Operations ---

export async function getGroupData(groupId: string): Promise<GroupData | null> {
    // 1. Try Memory first (fastest & handles serverless warm instances)
    if (globalStore.groups[groupId]) {
        return globalStore.groups[groupId];
    }

    // 2. Try File
    try {
        const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        globalStore.groups[groupId] = parsed; // Cache it
        return parsed;
    } catch (error: any) {
        // 3. Fallback: If missing, return Initial Data (don't save to file yet if FS is broken)
        if (['A', 'B', 'C', 'D'].includes(groupId)) {
            const initialData: GroupData = {
                id: groupId,
                score: 0,
                foundTreasures: []
            };
            globalStore.groups[groupId] = initialData;
            return initialData;
        }
        return null;
    }
}

export async function saveGroupData(groupId: string, data: GroupData): Promise<void> {
    // 1. Update Memory
    globalStore.groups[groupId] = data;

    // 2. Try Persist to File
    try {
        await initDataDirs(); // Try to ensure dir exists
        const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        // console.log(`[FileDB] Memory-only mode for group ${groupId}`);
    }
}

// --- Treasure Operations ---

// Helper to keep seeded treasures in memory so we don't lose them on read-only fs
export async function saveTreasureData(id: number, data: TreasureData): Promise<void> {
    globalStore.treasures[id] = data;
    try {
        await initDataDirs();
        const filePath = path.join(TREASURES_DIR, `${id}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.warn(`[FileDB] Failed to save treasure ${id} to disk.`);
    }
}

export async function getTreasureData(id: number): Promise<TreasureData | null> {
    if (globalStore.treasures[id]) return globalStore.treasures[id];

    try {
        const filePath = path.join(TREASURES_DIR, `${id}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        globalStore.treasures[id] = parsed;
        return parsed;
    } catch (error) {
        return null;
    }
}

export async function getAllTreasures(): Promise<TreasureData[]> {
    // If memory has them, return memory (assuming complete set from seed)
    const memTreasures = Object.values(globalStore.treasures) as TreasureData[];
    if (memTreasures.length > 0) return memTreasures;

    try {
        const files = await fs.readdir(TREASURES_DIR);
        const treasures = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = await fs.readFile(path.join(TREASURES_DIR, file), 'utf-8');
                treasures.push(JSON.parse(data));
            }
        }
        // Cache All
        treasures.forEach(t => globalStore.treasures[t.id] = t);
        return treasures as TreasureData[];
    } catch (e) {
        return [];
    }
}
// --- QR Code Operations (Mapping) ---

const QR_CODES_FILE = path.join(DATA_DIR, 'qr_codes.json');

// Memory Cache for QRs
if (!globalStore.qrCodes) {
    globalStore.qrCodes = {}; // format: { "code_string": treasureId }
}

export async function saveQrCodeMapping(code: string, treasureId: number): Promise<void> {
    globalStore.qrCodes[code] = treasureId;
    try {
        await initDataDirs();
        // Load existing to merge
        let current: Record<string, number> = {};
        try {
            const data = await fs.readFile(QR_CODES_FILE, 'utf-8');
            current = JSON.parse(data);
        } catch (e) { /* ignore missing */ }

        current[code] = treasureId;
        await fs.writeFile(QR_CODES_FILE, JSON.stringify(current, null, 2));
    } catch (error) {
        // Silent fail in read-only environments - we have memory cache
        // console.debug(`[FileDB] Skipped saving QR mapping (Read-Only FS)`);
    }
}

export async function getTreasureIdByQr(code: string): Promise<number | null> {
    if (globalStore.qrCodes[code] !== undefined) return globalStore.qrCodes[code];

    try {
        const data = await fs.readFile(QR_CODES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        globalStore.qrCodes = parsed; // Update cache
        return parsed[code] ?? null;
    } catch (error) {
        return null;
    }
}

export async function getAllQrMappings(): Promise<Record<string, number>> {
    try {
        const data = await fs.readFile(QR_CODES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        globalStore.qrCodes = parsed;
        return parsed;
    } catch (error) {
        return globalStore.qrCodes || {};
    }
}
