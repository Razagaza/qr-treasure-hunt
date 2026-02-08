'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Home, Search, Loader2 } from 'lucide-react';

interface FoundTreasure {
  treasureId: number;
  score: number;
  foundAt: string;
  question?: string;
  hints?: string[];
}

interface DashboardData {
  group: string;
  username?: string; // Added username
  score: number;
  foundTreasures: FoundTreasure[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTreasure, setSelectedTreasure] = useState<FoundTreasure | null>(null);

  useEffect(() => {
    fetch('/api/groups/stats')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res);
        } else {
          // Handle error or no session
          setData(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center p-8"><Loader2 className="animate-spin" /></div>;

  if (!data) {
    return (
      <div className="flex-center p-8 flex-col gap-4 text-center">
        <p>Failed to load data or no group selected.</p>
        <Link href="/" className="btn-primary">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs opacity-50 mb-1">Hello, <span className="text-primary font-bold">{data.username || 'Hunter'}</span></p>
          <h1 className="text-2xl font-bold">Team {data.group}</h1>
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
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => router.push('/scan')}
          style={{
            width: '100%',
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          <ScanLine size={28} />
          Scan Treasure
        </button>
      </div>

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
