'use client';

import { useEffect, useState } from 'react';
import { getCurrentUserId, getUserData, getTreasureByUuid, UserData, Treasure } from '@/lib/storage';
import { Award, Trophy, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface TreasureInfo extends Treasure { }

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null); // keeping 'user' name for consistency, though it's just ID or null
  const [userData, setUserData] = useState<UserData | null>(null);
  const [treasuresInfo, setTreasuresInfo] = useState<Record<string, TreasureInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getCurrentUserId();
    if (uid) {
      setUser({ uid });
      loadData(uid);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = (uid: string) => {
    const data = getUserData(uid);
    setUserData(data);
    if (loading) return <div className="flex-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!data) return <div className="flex-center p-8">Failed to load data</div>;

    return (
      <div className="dashboard-container">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Team {data.group}</h1>
            <p className="opacity-70">Dashboard</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-yellow-400">
              <Trophy size={20} />
              <span className="text-xl font-bold">{data.score}</span>
            </div>
            <span className="text-xs opacity-50">Total Points</span>
          </div>
        </header>

        <div className="stats-grid mb-8">
          <div className="card p-4 text-center">
            <h3 className="text-3xl font-bold text-primary">{data.foundTreasures.length}</h3>
            <p className="text-xs opacity-70 uppercase tracking-widest mt-1">Treasures Found</p>
          </div>
          <div className="card p-4 text-center">
            <h3 className="text-3xl font-bold text-emerald-400">{30 - data.foundTreasures.length}</h3>
            <p className="text-xs opacity-70 uppercase tracking-widest mt-1">Remaining</p>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Search size={18} /> Collection
        </h2>

        <div className="collection-list flex flex-col gap-3">
          {data.foundTreasures.map((t) => (
            <div
              key={t.treasureId}
              className="card p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setSelectedTreasure(t)}
            >
              <div>
                <h4 className="font-bold">Treasure #{t.treasureId}</h4>
                <p className="text-xs opacity-50">{new Date(t.foundAt).toLocaleTimeString()}</p>
              </div>
              <div className="text-emerald-400 font-bold">+{t.score}</div>
            </div>
          ))}

          {data.foundTreasures.length === 0 && (
            <div className="p-8 text-center opacity-50 border border-dashed border-slate-700 rounded-lg">
              No treasures found yet. Start scanning!
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedTreasure && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedTreasure(null)}>
            <div className="card w-full max-w-md p-6 bg-slate-900 border-slate-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Treasure #{selectedTreasure.treasureId}</h3>
                <button onClick={() => setSelectedTreasure(null)} className="p-1 hover:bg-slate-800 rounded">X</button>
              </div>

              <div className="mb-6">
                <p className="opacity-70 text-sm mb-2">Question:</p>
                <p className="font-medium">{selectedTreasure.question}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg">
                <p className="opacity-70 text-sm mb-3">Unlocked Hints:</p>
                {selectedTreasure.hints?.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2 last:mb-0">
                    <span className="text-yellow-400">💡</span>
                    <span className="text-sm">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur border-t border-slate-800 p-4 flex justify-around">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary">
            <Trophy size={20} />
            <span className="text-[10px]">Dashboard</span>
          </Link>
          <Link href="/scan" className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100">
            <div className="bg-primary text-black p-3 rounded-full -mt-8 border-4 border-slate-950">
              <Search size={24} />
            </div>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100">
            <Home size={20} />
            <span className="text-[10px]">Home</span>
          </Link>
        </nav>

        <style jsx>{`
        .dashboard-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 1.5rem;
            padding-bottom: 6rem; /* Nav space */
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .flex-center {
             display: flex;
             align-items: center;
             justify-content: center;
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
