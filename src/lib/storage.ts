import { v4 as uuidv4 } from 'uuid';

export interface Treasure {
    id: string;
    uuid: string;
    name: string;
    description?: string;
    points: number;
    createdAt: string;
}

export interface UserData {
    uid: string;
    collectedTreasures: string[]; // List of Treasure UUIDs
    totalPoints: number;
    lastUpdated: string;
}

const KEYS = {
    TREASURES: 'qr_hunt_treasures',
    USERS: 'qr_hunt_users',
    CURRENT_USER: 'qr_hunt_current_user_id',
};

// --- Storage Helpers ---

const getItems = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
};

const setItems = <T>(key: string, items: T[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(items));
};

// --- Treasure Methods ---

export const getTreasures = (): Treasure[] => {
    return getItems<Treasure>(KEYS.TREASURES);
};

export const addTreasure = (name: string, points: number, description: string = ''): Treasure => {
    const treasures = getTreasures();
    const newTreasure: Treasure = {
        id: uuidv4(),
        uuid: uuidv4(),
        name,
        description,
        points,
        createdAt: new Date().toISOString(),
    };
    treasures.push(newTreasure);
    setItems(KEYS.TREASURES, treasures);
    return newTreasure;
};

export const getTreasureByUuid = (uuid: string): Treasure | undefined => {
    const treasures = getTreasures();
    return treasures.find((t) => t.uuid === uuid);
};

// --- User/Auth Methods ---

export const getCurrentUserId = (): string => {
    if (typeof window === 'undefined') return '';
    let uid = localStorage.getItem(KEYS.CURRENT_USER);
    if (!uid) {
        uid = uuidv4();
        localStorage.setItem(KEYS.CURRENT_USER, uid);
    }
    return uid;
};

export const getUserData = (userId: string): UserData => {
    const users = getItems<UserData>(KEYS.USERS);
    let user = users.find((u) => u.uid === userId);

    if (!user) {
        user = {
            uid: userId,
            collectedTreasures: [],
            totalPoints: 0,
            lastUpdated: new Date().toISOString(),
        };
        users.push(user);
        setItems(KEYS.USERS, users);
    }

    return user;
};

export const collectTreasureLocal = (userId: string, treasureUuid: string): { success: boolean; message: string; points?: number } => {
    const treasure = getTreasureByUuid(treasureUuid);

    if (!treasure) {
        return { success: false, message: "Invalid Treasure Code" };
    }

    const users = getItems<UserData>(KEYS.USERS);
    const userIndex = users.findIndex((u) => u.uid === userId);

    // Should ideally be created by getUserData call before this, but handle safety
    let user = userIndex >= 0 ? users[userIndex] : {
        uid: userId,
        collectedTreasures: [],
        totalPoints: 0,
        lastUpdated: new Date().toISOString(),
    };

    if (user.collectedTreasures.includes(treasureUuid)) {
        return { success: false, message: "Already collected this treasure!" };
    }

    // Update User
    user.collectedTreasures.push(treasureUuid);
    user.totalPoints += treasure.points;
    user.lastUpdated = new Date().toISOString();

    if (userIndex >= 0) {
        users[userIndex] = user;
    } else {
        users.push(user);
    }

    setItems(KEYS.USERS, users);

    return {
        success: true,
        message: `Success! You found: ${treasure.name}`,
        points: treasure.points
    };
};
