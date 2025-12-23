'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Award, Trophy, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  collectedTreasures: string[];
  totalPoints: number;
}

interface TreasureInfo {
  uuid: string;
  name: string;
  points: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [treasuresInfo, setTreasuresInfo] = useState<Record<string, TreasureInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to user data
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUserData(data);
        
        // Fetch treasure details if we don't have them
        if (data.collectedTreasures?.length > 0) {
          const q = query(collection(db, 'treasures'), where("uuid", "in", data.collectedTreasures));
          const tSnap = await getDocs(q);
          const info: Record<string, TreasureInfo> = {};
          tSnap.forEach(d => {
            const tData = d.data() as TreasureInfo;
            info[tData.uuid] = tData;
          });
          setTreasuresInfo(info);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ marginTop: '1rem', opacity: 0.6 }}>Loading your collection...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center' }}>
        <Award size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
        <h2>No treasures yet!</h2>
        <p style={{ marginBottom: '2rem', opacity: 0.7 }}>Go find some QR codes to start your journey.</p>
        <Link href="/scan" className="btn-primary">Start Scanning</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Link href="/" style={{ color: 'white' }}><ArrowLeft /></Link>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>My Collection</h1>
        </div>
        
        <div className="card stats-grid">
            <div className="stat-item">
                <Trophy size={24} color="#fbbf24" />
                <div>
                    <div className="stat-label">Total Points</div>
                    <div className="stat-value">{userData.totalPoints}</div>
                </div>
            </div>
            <div className="stat-item">
                <Award size={24} color="var(--primary)" />
                <div>
                    <div className="stat-label">Stamps Found</div>
                    <div className="stat-value">{userData.collectedTreasures.length}</div>
                </div>
            </div>
        </div>
      </header>

      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Discovered Treasures</h2>
        <div className="treasures-grid">
           {userData.collectedTreasures.map((uuid) => {
             const info = treasuresInfo[uuid];
             return (
               <div key={uuid} className="card treasure-card">
                 <div className="flex-center icon-circle">
                   <MapPin size={24} color="white" />
                 </div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 600 }}>{info?.name || 'Unknown Treasure'}</div>
                   <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>+{info?.points || 0} pts</div>
                 </div>
               </div>
             );
           })}
        </div>
      </section>

      <style jsx>{`
        .dashboard-container {
          max-width: 600px;
          margin: 0 auto;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.6;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
        }
        .treasures-grid {
          display: grid;
          gap: 1rem;
        }
        .treasure-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        }
        .icon-circle {
          width: 48px;
          height: 48px;
          background: var(--primary);
          border-radius: 50%;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
