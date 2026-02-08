import { saveGroupData, saveTreasureData, initDataDirs, GroupData, TreasureData } from '@/lib/file-db';
import { encrypt } from '@/lib/crypto';

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

    // 30 Treasures Data
    const treasuresSource = [
        // 0-4: Simple Riddles
        { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "Echo", t: "text", h: ["It repeats what you say.", "Starts with E."] },
        { q: "The more of this there is, the less you see. What is it?", a: "Darkness", t: "text", h: ["You need light to banish it.", "Starts with D."] },
        { q: "I have keys but no locks. I have a space but no room. You can enter, but never go outside. What am I?", a: "Keyboard", t: "choice", c: ["Keyboard", "Piano", "Map", "House"], h: ["You use it to type."] },
        { q: "What has hands but cannot clap?", a: "Clock", t: "text", h: ["It tells time.", "Tick tock."] },
        { q: "What gets wet while drying?", a: "Towel", t: "text", h: ["You use it after a shower."] },

        // 5-9: Logic & Math (Timed)
        { q: "If you have a bowl with six apples and you take away four, how many do you have?", a: "4", t: "choice", c: ["2", "4", "6", "0"], h: ["You took them, so they are yours."], time: 30 },
        { q: "What comes next in the sequence: 2, 4, 8, 16, ...?", a: "32", t: "text", h: ["Double the previous number."], time: 30 },
        { q: "I am an odd number. Take away a letter and I become even. What number am I?", a: "Seven", t: "text", h: ["7", "Spelled out S-E-V-E-N"], time: 45 },
        { q: "What has a head and a tail but no body?", a: "Coin", t: "choice", c: ["Coin", "Snake", "Worm", "Comet"], h: ["You flip it."], time: 30 },
        { q: "Divide 30 by half and add 10. What is the answer?", a: "70", t: "text", h: ["Dividing by half (0.5) is same as multiplying by 2.", "30 / 0.5 = 60"], time: 45 },

        // 10-14: Word Play
        { q: "Which word becomes shorter when you add 2 letters to it?", a: "Short", t: "text", h: ["Add 'er' to the end.", "The word is literally 'Short'."] },
        { q: "What starts with T, ends with T, and has T in it?", a: "Teapot", t: "choice", c: ["Teapot", "Tent", "Ticket", "Toast"], h: ["It holds tea."] },
        { q: "What begins with an E but only has one letter?", a: "Envelope", t: "text", h: ["You mail letters in it."] },
        { q: "What five-letter word becomes shorter when you add two letters to it?", a: "Short", t: "text", h: ["Wait, did I ask this already? No, logic is same.", "S_O_T"] },
        { q: "What occurs once in a minute, twice in a moment, but never in a thousand years?", a: "M", t: "text", h: ["Look at the spelling of the words.", "The letter M."] },

        // 15-19: Observation / Common Sense
        { q: "What has to be broken before you can use it?", a: "Egg", t: "choice", c: ["Egg", "Glass", "Promise", "Record"], h: ["You eat it for breakfast."] },
        { q: "I’m tall when I’m young, and I’m short when I’m old. What am I?", a: "Candle", t: "text", h: ["I melt away."] },
        { q: "What goes up but never comes down?", a: "Age", t: "text", h: ["You get older every year."] },
        { q: "You see me once in June, twice in November, and not at all in May. What am I?", a: "E", t: "text", h: ["The letter E."] },
        { q: "What can you catch, but not throw?", a: "Cold", t: "choice", c: ["Cold", "Ball", "Frisbee", "Glance"], h: ["Achoo!"] },

        // 20-24: Fun Trivia
        { q: "Which planet is known as the Red Planet?", a: "Mars", t: "choice", c: ["Mars", "Venus", "Jupiter", "Saturn"], h: ["Named after war god."] },
        { q: "How many legs does a spider have?", a: "8", t: "text", h: ["More than an insect (6)."] },
        { q: "What is the largest mammal in the world?", a: "Blue Whale", t: "choice", c: ["Blue Whale", "Elephant", "Giraffe", "Shark"], h: ["It lives in the ocean."] },
        { q: "What is H2O more commonly known as?", a: "Water", t: "text", h: ["You drink it."] },
        { q: "Which country gifted the Statue of Liberty to the USA?", a: "France", t: "choice", c: ["France", "UK", "Spain", "Germany"], h: ["Paris is its capital."] },

        // 25-29: Challenge Round
        { q: "The more you take, the more you leave behind. What are they?", a: "Footsteps", t: "text", h: ["Walk on sand."] },
        { q: "David's father has three sons: Snap, Crackle, and _____?", a: "David", t: "text", h: ["Read the question carefully.", "David's father..."] },
        { q: "What belongs to you, but other people use it more than you?", a: "Name", t: "text", h: ["Your identity."] },
        { q: "I can fly without wings. I can cry without eyes. Wherever I go, darkness follows me. What am I?", a: "Cloud", t: "choice", c: ["Cloud", "Bat", "Ghost", "Airplane"], h: ["Rain comes from me."] },
        { q: "What is full of holes but still holds water?", a: "Sponge", t: "text", h: ["Used for cleaning."] }
    ];

    // Create Treasures
    for (let i = 0; i < 30; i++) {
        const src = treasuresSource[i];

        const treasure: TreasureData = {
            id: i,
            question: src.q,
            type: src.t as 'text' | 'choice',
            choices: src.c, // undefined if text
            answer: src.a,
            points: (i + 1) * 10,
            hints: src.h,
            timeLimit: src.time
        };

        if (treasure.type === 'choice' && treasure.choices) {
            treasure.choices.sort(() => Math.random() - 0.5);
        }

        await saveTreasureData(i, treasure);

        // Log for debug
        const encryptedId = encrypt(String(i));
        console.log(`Treasure ID ${i} -> Encrypted QR: ${encryptedId}`);
    }

    console.log('Seeding Complete');
}
