import { GroupData, TreasureData } from './file-db'; // Re-use interfaces
import * as fileDb from './file-db';
import { supabase } from './supabase';

export interface IDatabase {
    // Groups
    getGroup(id: string): Promise<GroupData | null>;
    saveGroup(id: string, data: GroupData): Promise<void>;

    // Treasures
    getTreasure(id: number): Promise<TreasureData | null>;
    getAllTreasures(): Promise<TreasureData[]>;
    saveTreasure(id: number, data: TreasureData): Promise<void>;

    // QR Codes
    getTreasureIdByQr(code: string): Promise<number | null>;
    saveQrCodeMapping(code: string, treasureId: number): Promise<void>;
    getAllQrMappings(): Promise<Record<string, number>>;

    // Game Settings
    getGameSettings(key: string): Promise<any>;
    updateGameSettings(key: string, value: any): Promise<void>;
}

// --- Supabase Adapter ---
export const SupabaseAdapter: IDatabase = {
    async getGroup(id: string) {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        // Merge structured data
        return {
            id: data.id,
            score: data.score,
            foundTreasures: data.data?.foundTreasures || []
        };
    },

    async saveGroup(id: string, data: GroupData) {
        const { error } = await supabase
            .from('groups')
            .upsert({
                id: id,
                score: data.score,
                data: { foundTreasures: data.foundTreasures }
            });

        if (error) console.error('Supabase SaveGroup Error:', error);
    },

    async getTreasure(id: number) {
        const { data, error } = await supabase
            .from('treasures')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data.content as TreasureData;
    },

    async getAllTreasures() {
        const { data, error } = await supabase
            .from('treasures')
            .select('*');

        if (error || !data) return [];
        return data.map(row => row.content as TreasureData);
    },

    async saveTreasure(id: number, data: TreasureData) {
        const { error } = await supabase
            .from('treasures')
            .upsert({
                id: id,
                content: data
            });
        if (error) console.error('Supabase SaveTreasure Error:', error);
    },

    async getTreasureIdByQr(code: string) {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('treasure_id')
            .eq('code', code)
            .single();

        if (error || !data) return null;
        return data.treasure_id;
    },

    async saveQrCodeMapping(code: string, treasureId: number) {
        const { error } = await supabase
            .from('qr_codes')
            .upsert({ code, treasure_id: treasureId });
        if (error) console.error('Supabase SaveQR Error:', error);
    },

    async getAllQrMappings() {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('code, treasure_id');

        if (error || !data) return {};

        const map: Record<string, number> = {};
        data.forEach((row: any) => {
            map[row.code] = row.treasure_id;
        });
        return map;
    },

    async getGameSettings(key: string) {
        const { data, error } = await supabase
            .from('game_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) return null;
        return data.value;
    },

    async updateGameSettings(key: string, value: any) {
        const { error } = await supabase
            .from('game_settings')
            .upsert({ key, value });
        if (error) console.error('Supabase SaveSettings Error:', error);
    }
};

// --- File Adapter (Wrapper around existing file-db) ---
export const FileAdapter: IDatabase = {
    getGroup: fileDb.getGroupData,
    saveGroup: fileDb.saveGroupData,
    getTreasure: fileDb.getTreasureData,
    getAllTreasures: fileDb.getAllTreasures,
    saveTreasure: fileDb.saveTreasureData,
    getTreasureIdByQr: fileDb.getTreasureIdByQr,
    saveQrCodeMapping: fileDb.saveQrCodeMapping,
    getAllQrMappings: fileDb.getAllQrMappings,

    // Mock Settings for FileDB (Memory Only)
    getGameSettings: async (key: string) => {
        // Return true by default for 'qr_enabled' so it works out of box
        if (key === 'qr_enabled') return true;
        return null;
    },
    updateGameSettings: async (key: string, value: any) => {
        // No-op for file db
        console.log(`[FileDB] Mock update setting ${key} = ${value}`);
    }
};

// --- Factory ---
// Default to Supabase, fallback provided via config if needed
// For now, we will try Supabase, if it fails (e.g. no env vars), we might fallback,
// but typically we want to be explicit.
const USE_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export const db: IDatabase = USE_SUPABASE ? SupabaseAdapter : FileAdapter;
