'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Trophy, Target } from 'lucide-react';

interface GroupStatus {
  id: string;
  score: number;
  foundCount: number;
  foundTreasures: { treasureId: number; score: number; foundAt: string; foundBy?: string }[];
}

export default function AdminPage() {
  const [status, setStatus] = useState<GroupStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (e) {
      console.error('Failed to load status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && status.length === 0) return <div className="flex-center p-8"><Loader2 className="animate-spin" color="#6366f1" size={48} /></div>;

  return (
    <div className="admin-container">
      <header className="header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Live Game Status</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            className="refresh-btn"
            onClick={fetchStatus}
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>

          <button
            className="reset-btn"
            onClick={async () => {
              if (!confirm('Are you sure you want to RESET ALL GAME DATA? This cannot be undone.')) return;
              await fetch('/api/admin/reset', { method: 'POST' });
              alert('Game Reset!');
              fetchStatus();
            }}
          >
            RESET GAME
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        {status.map((group) => (
          <div key={group.id} className="card group-card">
            <div className="group-header">
              <div className="group-avatar">{group.id}</div>
              <h2 className="group-title">Team {group.id}</h2>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <Trophy className="stat-icon text-yellow-500" size={20} />
                <div>
                  <span className="stat-value">{group.score}</span>
                  <span className="stat-label">Points</span>
                </div>
              </div>
              <div className="stat-item">
                <Target className="stat-icon text-blue-400" size={20} />
                <div>
                  <span className="stat-value">{group.foundCount}</span>
                  <span className="stat-label">Treasures</span>
                </div>
              </div>
            </div>

            <div className="treasures-list">
              {group.foundTreasures && group.foundTreasures.length > 0 ? (
                <div className="treasure-grid">
                  {group.foundTreasures.sort((a, b) => a.treasureId - b.treasureId).map((ft) => (
                    <span
                      key={ft.treasureId}
                      className="treasure-badge"
                      title={`Found at ${new Date(ft.foundAt).toLocaleTimeString()}`}
                    >
                      #{ft.treasureId}
                      {ft.foundBy && <span className="finder-name">({ft.foundBy})</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="no-treasures">No treasures found yet</div>
              )}
            </div>
          </div>
        ))}
      </section>

      <style jsx>{`
        .admin-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 1.5rem;
          color: white;
          min-height: 100vh;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            background: rgba(255,255,255,0.05);
            padding: 1.5rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
        }
        h1 { margin: 0; font-size: 2rem; font-weight: bold; }
        .subtitle { opacity: 0.7; margin: 0.5rem 0 0 0; }

        .reset-btn {
            background: #ef4444;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        .reset-btn:hover { background: #dc2626; }
        
        .refresh-btn {
            background: rgba(255,255,255,0.1);
            color: white;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .refresh-btn:hover { background: rgba(255,255,255,0.2); }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }

        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 1rem;
            padding: 1.5rem;
            transition: transform 0.2s;
        }
        .group-card:hover { transform: translateY(-5px); }
        
        .group-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .group-avatar {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }
        .group-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: bold;
        }

        .stats-row {
            display: flex;
            justify-content: space-around;
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .stat-icon { opacity: 0.8; }
        .text-yellow-500 { color: #eab308; }
        .text-blue-400 { color: #60a5fa; }

        .stat-value {
            display: block;
            font-size: 1.5rem;
            font-weight: bold;
            line-height: 1;
        }
        .stat-label {
            font-size: 0.75rem;
            opacity: 0.6;
            text-transform: uppercase;
        }

        .treasures-list {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .treasure-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .treasure-badge {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }
        .finder-name {
            font-size: 0.75rem;
            opacity: 0.8;
            color: #a7f3d0;
            font-weight: normal;
        }
        .no-treasures {
            font-size: 0.8rem;
            color: rgba(255,255,255,0.3);
            text-align: center;
            font-style: italic;
        }

        .flex-center { display: flex; align-items: center; justify-content: center; height: 100vh; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
