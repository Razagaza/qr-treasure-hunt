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
    type: 'text' | 'choice' | 'number';
    choices?: string[];
    answer: string;
    points: number;
    hints: string[];
    timeLimit?: number;
    active?: boolean;
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

// --- Concurrency Control ---
class Mutex {
    private mutex = Promise.resolve();

    lock(): Promise<() => void> {
        let begin: (unlock: () => void) => void = () => { };

        this.mutex = this.mutex.then(() => {
            return new Promise<void>(resolve => {
                begin = resolve;
            });
        });

        return new Promise<() => void>(resolve => {
            resolve(begin);
        });
    }

    async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
        const unlock = await this.lock();
        try {
            return await Promise.resolve(fn());
        } finally {
            unlock();
        }
    }
}

const groupLocks: Record<string, Mutex> = {};

function getGroupLock(groupId: string) {
    if (!groupLocks[groupId]) {
        groupLocks[groupId] = new Mutex();
    }
    return groupLocks[groupId];
}

// --- Group Operations ---

// Internal helper to read without locking (caller must handle lock if needed)
async function _getGroupDataInternal(groupId: string): Promise<GroupData | null> {
    // 1. Try Memory
    if (globalStore.groups[groupId]) {
        return globalStore.groups[groupId];
    }
    // 2. Try File
    try {
        const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        globalStore.groups[groupId] = parsed;
        return parsed;
    } catch (error: any) {
        // Fallback
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

// Internal helper to save without locking
async function _saveGroupDataInternal(groupId: string, data: GroupData): Promise<void> {
    globalStore.groups[groupId] = data;
    try {
        await initDataDirs();
        const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) { /* memory only */ }
}

export async function getGroupData(groupId: string): Promise<GroupData | null> {
    // Read does not need strict locking for this app, but if we wanted strong consistency we could lock.
    // For performance, we'll just read.
    return _getGroupDataInternal(groupId);
}

export async function saveGroupData(groupId: string, data: GroupData): Promise<void> {
    await getGroupLock(groupId).dispatch(async () => {
        await _saveGroupDataInternal(groupId, data);
    });
}

export async function updateGroupData(groupId: string, updateFn: (data: GroupData) => GroupData): Promise<GroupData | null> {
    return await getGroupLock(groupId).dispatch(async () => {
        // 1. Read (Inside Lock)
        const currentData = await _getGroupDataInternal(groupId);
        if (!currentData) return null;

        // 2. Modify (Inside Lock)
        const newData = updateFn(currentData);

        // 3. Write (Inside Lock - Atomic with Read)
        await _saveGroupDataInternal(groupId, newData);
        return newData;
    });
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
