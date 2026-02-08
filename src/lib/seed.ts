import { saveGroupData, saveTreasureData, initDataDirs, GroupData, TreasureData, saveQrCodeMapping } from '@/lib/file-db';
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

    console.log('Seeding treasures with Random Mapped Codes...');

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
        { q: "What comes next in the sequence: 2, 4, 8, 16, ...?", a: "32", t: "choice", c: ["24", "32", "64", "20"], h: ["Double the previous number."] },
        { q: "I am an odd number. Take away a letter and I become even. What number am I?", a: "Seven", t: "text", h: ["Spell it out.", "7"], time: 45 },
        { q: "Which weighs more? A pound of feathers or a pound of bricks?", a: "Same", t: "choice", c: ["Feathers", "Bricks", "Same", "Neither"], h: ["Both are one pound."], time: 30 },
        { q: "Divide 30 by half and add 10. What is the answer?", a: "70", t: "choice", c: ["25", "40", "70", "50"], h: ["Dividing by half means multiplying by 2."], time: 45 }, // 30 / 0.5 = 60 + 10 = 70

        // 10-14: Word & Trivia
        { q: "What word is spelled incorrectly in every dictionary?", a: "Incorrectly", t: "text", h: ["Look at the question carefully."] },
        { q: "What goes up but never comes down?", a: "Age", t: "text", h: ["It increases every year."] },
        { q: "What has a head and a tail but no body?", a: "Coin", t: "choice", c: ["Snake", "Coin", "Comet", "Map"], h: ["You use it to pay."] },
        { q: "What begins with T, ends with T, and has T in it?", a: "Teapot", t: "text", h: ["It holds tea."] },
        { q: "What has many teeth but cannot bite?", a: "Comb", t: "text", h: ["You use it for your hair."] },

        // 15-19: Observation
        { q: "What has a neck but no head?", a: "Bottle", t: "choice", c: ["Bottle", "Shirt", "Guitar", "Snake"], h: ["Actually, all options are valid answers, but try 'All of them'."] }, // Trick: Let's set answer to "All of them" or stick to one. Let's say "Bottle" usually. But let's verify choices. "Bottle" is classic. "Shirt" also works. Let's make it specific: "Bottle"
        // Wait, I will fix the answer to "Bottle" for simplicity or change the question.
        // Let's use: "What has a neck but no head?" -> Bottle.

        { q: "What has one eye but can't see?", a: "Needle", t: "text", h: ["Used for sewing."] },
        { q: "What has legs but cannot walk?", a: "Table", t: "choice", c: ["Table", "Chair", "Bed", "All of them"], h: ["Furniture."] },
        { q: "What breaks as soon as you say its name?", a: "Silence", t: "text", h: ["Shhh..."] },
        { q: "The more you take, the more you leave behind. What are they?", a: "Footsteps", t: "text", h: ["Walking in sand."] },

        // 20-24: Harder Logic
        { q: "A man dies of old age on his 25th birthday. How is this possible?", a: "Born on February 29", t: "choice", c: ["He was a dog", "Born on February 29", "Time travel", "Typo"], h: ["Leap year."] },
        { q: "I run all around a backyard, yet I never move. What am I?", a: "Fence", t: "text", h: ["Encloses the yard."] },
        { q: "What can travel all around the world without leaving its corner?", a: "Stamp", t: "text", h: ["On a letter."] },
        { q: "What kind of room has no doors or windows?", a: "Mushroom", t: "text", h: ["It's a fungus."] },
        { q: "If you drop me I'm sure to crack, but give me a smile and I'll always smile back. What am I?", a: "Mirror", t: "text", h: ["Reflection."] },

        // 25-29: Final Boss
        { q: "I am light as a feather, yet the strongest man cannot hold me for much more than a minute. What am I?", a: "Breath", t: "text", h: ["You need it to live."] },
        { q: "The person who makes it has no need of it; the person who buys it has no use for it. The person who uses it can neither see nor feel it. What is it?", a: "Coffin", t: "text", h: ["For the dead."] },
        { q: "What gets bigger the more you take away?", a: "Hole", t: "text", h: ["Digging."] },
        { q: "Paul's height is six feet, he's an assistant at a butcher's shop, and wears size 9 shoes. What does he weigh?", a: "Meat", t: "text", h: ["He works at a butcher's."] },
        { q: "Final Treasure: What is the most valuable thing in this game?", a: "Fun", t: "choice", c: ["Points", "Gold", "Fun", "Winning"], h: ["It's not about the score."] }
    ];

    // Modify specific questions to match answers
    treasuresSource[15].a = "Bottle";
    treasuresSource[15].c = ["Bottle", "Shirt", "Guitar", "Snake"];
    treasuresSource[17].a = "Table";

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

        // --- NEW QR LOGIC ---
        const qrCode = generateRandomCode(); // Random 8 chars
        await saveQrCodeMapping(qrCode, i);

        console.log(`Treasure ID ${i} -> QR Code: ${qrCode}`);
    }

    console.log('Seeding Complete');
}
