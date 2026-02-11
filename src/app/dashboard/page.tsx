'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Home, Search, Loader2, ScanLine, Clock } from 'lucide-react';

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
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="title">Team {data.group}</h1>
          <div className="user-info">
            {data.username && <span className="username">Agent {data.username}</span>}
          </div>
        </div>
        <div className="score-card">
          <Trophy color="#fde047" size={24} />
          <span className="score">{data.score} pts</span>
        </div>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <h3 className="stat-value text-primary">{data.foundTreasures.length}</h3>
          <p className="stat-label">Treasures Found</p>
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
        <div className="nav-grid">
          <button
            onClick={() => router.push('/schedule')}
            className="nav-btn secondary-btn"
          >
            <Clock size={24} />
            Schedule
          </button>
          <button
            onClick={() => router.push('/scan')}
            className="nav-btn primary-btn"
          >
            <ScanLine size={24} />
            Scan
          </button>
        </div>
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
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        .header-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        .reset-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.75rem;
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
            width: calc(100% - 2rem);
            max-width: 480px;
            z-index: 10;
        }
        .nav-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 1rem;
        }
        .nav-btn {
            padding: 1rem;
            border-radius: 1rem;
            border: none;
            font-size: 1.1rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .nav-btn:active { transform: scale(0.96); }

        .primary-btn {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
        }
        .secondary-btn {
            background: rgba(30, 41, 59, 0.9);
            color: #e2e8f0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .flex-center { display: flex; align-items: center; justify-content: center; height: 100vh; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
