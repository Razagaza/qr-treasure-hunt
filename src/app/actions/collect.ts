'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function collectTreasure(userId: string, treasureUuid: string) {
  if (!userId || !treasureUuid) {
    return { success: false, message: "Missing User ID or Treasure ID" };
  }

  try {
    // 1. Find the treasure by UUID
    const treasuresRef = collection(db, 'treasures');
    const q = query(treasuresRef, where("uuid", "==", treasureUuid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Invalid Treasure Code" };
    }

    const treasureDoc = querySnapshot.docs[0];
    const treasureData = treasureDoc.data();
    const treasureId = treasureDoc.id;

    // 2. Get User's collection
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create user if not exists
      await setDoc(userRef, {
        collectedTreasures: [treasureUuid],
        totalPoints: treasureData.points || 0,
        lastUpdated: new Date().toISOString()
      });
    } else {
      const userData = userSnap.data();
      const collected = userData.collectedTreasures || [];

      // 3. Check for duplicates
      if (collected.includes(treasureUuid)) {
        return { success: false, message: "Already collected this treasure!" };
      }

      // 4. Update collection
      await updateDoc(userRef, {
        collectedTreasures: arrayUnion(treasureUuid),
        totalPoints: (userData.totalPoints || 0) + (treasureData.points || 0),
        lastUpdated: new Date().toISOString()
      });
    }

    return { 
      success: true, 
      message: `Success! You found: ${treasureData.name}`,
      points: treasureData.points 
    };

  } catch (error) {
    console.error("Error collecting treasure:", error);
    return { success: false, message: "Internal Server Error" };
  }
}
