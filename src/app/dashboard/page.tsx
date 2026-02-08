'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Home, Search, Loader2, ScanLine } from 'lucide-react';

interface FoundTreasure {
  treasureId: number;
  score: number;
  foundAt: string;
  question?: string;
  hints?: string[];
}

interface DashboardData {
  group: string;
  username?: string;
  score: number;
  foundTreasures: FoundTreasure[];
}

export default function Dashboard() {
  const router = useRouter();
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

  if (loading) return <div className="flex-center p-8"><Loader2 className="animate-spin" color="#6366f1" size={48} /></div>;

  if (!data) {
    return (
      <div className="flex-center p-8 flex-col gap-4 text-center">
        <p>Failed to load data or no group selected.</p>
        <Link href="/" className="btn-primary">Go to Login</Link>
        <style jsx>{`
            .flex-center { display: flex; align-items: center; justify-content: center; height: 100vh; color: white; }
            .flex-col { flex-direction: column; }
            .gap-4 { gap: 1rem; }
            .btn-primary { background: #6366f1; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <p className="welcome-text">Hello, <span className="username">{data.username || 'Hunter'}</span></p>
          <h1 className="group-title">Team {data.group}</h1>
        </div>
        <div className="score-box">
          <div className="score-value">
            <Trophy size={20} color="#facc15" />
            <span>{data.score}</span>
          </div>
          <span className="score-label">Total Points</span>
        </div>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <h3 className="stat-value text-primary">{data.foundTreasures.length}</h3>
          <p className="stat-label">Treasures Found</p>
        </div>
        <div className="card stat-card">
          <h3 className="stat-value text-green">{30 - data.foundTreasures.length}</h3>
          <p className="stat-label">Remaining</p>
        </div>
      </div>

      <h2 className="section-title">
        <Search size={18} /> Collection
      </h2>

      <div className="collection-list">
        {data.foundTreasures.map((t) => (
          <div
            key={t.treasureId}
            className="card treasure-item"
            onClick={() => setSelectedTreasure(t)}
          >
            <div>
              <h4 className="treasure-name">Treasure #{t.treasureId}</h4>
              <p className="treasure-time">{new Date(t.foundAt).toLocaleTimeString()}</p>
            </div>
            <div className="treasure-score">+{t.score}</div>
          </div>
        ))}

        {data.foundTreasures.length === 0 && (
          <div className="empty-state">
            No treasures found yet. Start scanning!
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTreasure && (
        <div className="modal-overlay" onClick={() => setSelectedTreasure(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Treasure #{selectedTreasure.treasureId}</h3>
              <button onClick={() => setSelectedTreasure(null)} className="close-btn">X</button>
            </div>

            <div className="modal-body">
              <p className="field-label">Question:</p>
              <p className="field-value">{selectedTreasure.question}</p>
            </div>

            <div className="hints-section">
              <p className="field-label">Unlocked Hints:</p>
              {selectedTreasure.hints?.map((h, i) => (
                <div key={i} className="hint-row">
                  <span className="hint-icon">💡</span>
                  <span className="hint-text">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div className="footer-nav">
        <button
          onClick={() => router.push('/scan')}
          className="scan-btn"
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
            padding-bottom: 8rem; /* Nav space */
            color: white;
            min-height: 100vh;
        }
        
        /* Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
        }
        .welcome-text { font-size: 0.8rem; opacity: 0.6; margin: 0; margin-bottom: 0.25rem; }
        .username { color: #818cf8; font-weight: bold; }
        .group-title { font-size: 1.75rem; font-weight: bold; margin: 0; }
        
        .score-box { text-align: right; }
        .score-value { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            color: #facc15; 
            font-size: 1.5rem; 
            font-weight: bold; 
        }
        .score-label { font-size: 0.75rem; opacity: 0.5; }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
        }
        .stat-card {
            padding: 1.5rem;
            text-align: center;
        }
        .stat-value { font-size: 2.25rem; font-weight: bold; margin: 0; }
        .text-primary { color: #818cf8; }
        .text-green { color: #34d399; }
        .stat-label { font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.5rem; }

        /* Collection */
        .section-title {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .collection-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .treasure-item {
            padding: 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: background 0.2s;
        }
        .treasure-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .treasure-name { font-weight: bold; margin: 0; font-size: 1rem; }
        .treasure-time { font-size: 0.8rem; opacity: 0.5; margin: 0; }
        .treasure-score { color: #34d399; font-weight: bold; font-size: 1.1rem; }

        .empty-state {
            padding: 3rem;
            text-align: center;
            opacity: 0.5;
            border: 1px dashed rgba(255, 255, 255, 0.2);
            border-radius: 1rem;
        }

        /* Modal */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 50;
            display: flex;
            align-items: flex-end; /* Mobile bottom sheet style */
            justify-content: center;
            padding: 1rem;
        }
        @media (min-width: 640px) {
            .modal-overlay { align-items: center; }
        }
        .modal-content {
            background: #1e293b; 
            width: 100%;
            max-width: 450px;
            padding: 1.5rem;
            border-radius: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
        }
        .modal-title { font-size: 1.5rem; font-weight: bold; margin: 0; }
        .close-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 0.5rem;
        }
        .close-btn:hover { color: white; }
        
        .modal-body { margin-bottom: 2rem; }
        .field-label { font-size: 0.875rem; opacity: 0.6; margin-bottom: 0.5rem; }
        .field-value { font-size: 1.1rem; font-weight: 500; }

        .hints-section {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 1rem;
        }
        .hint-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
        .hint-text { font-size: 0.95rem; }
        
        /* Footer Nav */
        .footer-nav {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100% - 3rem);
            max-width: 460px;
            z-index: 10;
        }
        .scan-btn {
            width: 100%;
            padding: 1.25rem;
            border-radius: 1rem;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            font-size: 1.25rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            cursor: pointer;
            box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
            transition: transform 0.2s;
        }
        .scan-btn:active { transform: scale(0.98); }

        .flex-center { display: flex; align-items: center; justify-content: center; height: 100vh; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
