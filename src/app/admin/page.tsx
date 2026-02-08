'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, QrCode as QrIcon, Loader2 } from 'lucide-react';

interface Treasure {
  id: number;
  question: string;
  answer: string;
  points: number;
  type: 'text' | 'choice';
  choices?: string[];
  timeLimit?: number;
  hints?: string[];
  encryptedQr?: string;
}

export default function AdminPage() {
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTreasure, setEditingTreasure] = useState<Treasure | null>(null);

  // Game Settings State
  const [qrEnabled, setQrEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetchTreasures();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/game-settings');
      const data = await res.json();
      if (data.success) {
        setQrEnabled(data.qr_enabled);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const toggleGameParams = async () => {
    const newState = !qrEnabled;
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/game-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_enabled: newState })
      });
      const data = await res.json();
      if (data.success) {
        setQrEnabled(data.qr_enabled);
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (e) {
      alert('Error updating settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchTreasures = async () => {
    try {
      const res = await fetch('/api/admin/treasures');
      if (res.ok) {
        const data = await res.json();
        setTreasures(data.treasures);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (id: number) => {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Treasure-${id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    // Base64 encode using a safe method for unicode
    const base64 = btoa(unescape(encodeURIComponent(svgData)));
    img.src = "data:image/svg+xml;base64," + base64;
  };

  if (loading) return <div className="flex-center p-8"><Loader2 className="animate-spin" color="#6366f1" size={48} /></div>;

  return (
    <div className="admin-container">
      <header className="header">
        <div>
          <h1>Admin Portal</h1>
          <p className="subtitle">Manage Game & Treasures</p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Migration Button */}
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow transition-colors"
            onClick={async () => {
              if (!confirm('Run Data Migration (Server Files -> Supabase)?')) return;
              try {
                const res = await fetch('/api/admin/migrate', { method: 'POST' });
                const json = await res.json();
                alert('Migration Results:\n' + JSON.stringify(json.results, null, 2));
              } catch (e) {
                alert('Migration Failed');
              }
            }}
          >
            MIGRATE DATA
          </button>

          <button
            className="reset-btn"
            onClick={async () => {
              if (!confirm('Are you sure you want to RESET ALL GAME DATA? This cannot be undone.')) return;
              await fetch('/api/admin/reset', { method: 'POST' });
              alert('Game Reset!');
            }}
          >
            RESET GAME
          </button>
        </div>
      </header>

      <section>
        <h2 className="section-title">Existing Treasures</h2>
        <div className="treasure-list">
          {treasures.length === 0 && <p className="empty-text">No treasures found. Run seed!</p>}
          {treasures.map((t) => (
            <div key={t.id} className="card treasure-card">
              <div className="treasure-info">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="treasure-title">Treasure #{t.id}</h3>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newActive = t.active === false ? true : false;
                      setTreasures(curr => curr.map(item => item.id === t.id ? { ...item, active: newActive } : item));

                      await fetch('/api/admin/treasures/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: t.id, active: newActive })
                      });
                    }}
                    className={`text-xs px-2 py-1 rounded font-bold ${t.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {t.active !== false ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>
                <p className="treasure-subtitle">{t.points} Points</p>
                <p className="treasure-question">{t.question}</p>
                <div className="treasure-answer">A: {t.answer}</div>
              </div>
              <div className="action-group">
                <button
                  onClick={() => setEditingTreasure(t)}
                  className="edit-btn"
                >
                  Edit
                </button>
                <div className="qr-wrapper">
                  {t.encryptedQr && (
                    <QRCodeSVG
                      id={`qr-${t.id}`}
                      value={JSON.stringify({ id: t.encryptedQr, type: 'treasure' })}
                      size={64}
                      level="M"
                      includeMargin={false}
                    />
                  )}
                </div>
                <button
                  onClick={() => downloadQR(t.id)}
                  className="icon-btn"
                  title="Download QR"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit Modal */}
      {editingTreasure && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Edit Treasure #{editingTreasure.id}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editingTreasure) return;

              const res = await fetch('/api/admin/treasures/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingTreasure)
              });

              if (res.ok) {
                alert('Updated!');
                setEditingTreasure(null);
                fetchTreasures(); // Refresh list
              } else {
                alert('Failed to update');
              }
            }}>
              <div className="form-grid">
                <div>
                  <label>Question</label>
                  <input
                    className="input-field"
                    value={editingTreasure.question}
                    onChange={e => setEditingTreasure({ ...editingTreasure, question: e.target.value })}
                  />
                </div>
                <div>
                  <label>Answer (Exact Match)</label>
                  <input
                    className="input-field"
                    value={editingTreasure.answer}
                    onChange={e => setEditingTreasure({ ...editingTreasure, answer: e.target.value })}
                  />
                </div>
                <div className="two-col">
                  <div>
                    <label>Points</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingTreasure.points}
                      onChange={e => setEditingTreasure({ ...editingTreasure, points: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label>Time Limit (Seconds)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editingTreasure.timeLimit || ''}
                      onChange={e => setEditingTreasure({ ...editingTreasure, timeLimit: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="None"
                    />
                  </div>
                </div>

                <div>
                  <label>Input Type</label>
                  <select
                    className="input-field"
                    value={editingTreasure.type}
                    onChange={e => setEditingTreasure({ ...editingTreasure, type: e.target.value as 'text' | 'choice' })}
                  >
                    <option value="text">Text Input</option>
                    <option value="choice">Multiple Choice</option>
                  </select>
                </div>

                {editingTreasure.type === 'choice' && (
                  <div>
                    <label>Choices (Comma separated)</label>
                    <input
                      className="input-field"
                      value={editingTreasure.choices?.join(',') || ''}
                      onChange={e => setEditingTreasure({ ...editingTreasure, choices: e.target.value.split(',') })}
                    />
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setEditingTreasure(null)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="test-zone">
        <h2>🛠 Test Zone</h2>
        <p className="subtitle">Scan this QR code to test the game flow (Treasure ID: 0)</p>

        {treasures.find(t => t.id === 0)?.encryptedQr ? (
          <>
            <div className="qr-large">
              <QRCodeSVG
                value={treasures.find(t => t.id === 0)!.encryptedQr!}
                size={200}
              />
            </div>
            <p className="raw-qr">
              Raw: {treasures.find(t => t.id === 0)!.encryptedQr!.substring(0, 10)}...
            </p>
          </>
        ) : (
          <p style={{ color: 'orange' }}>Loading or Treasure 0 not found...</p>
        )}
      </section>

      <style jsx>{`
        .admin-container {
          max-width: 800px;
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
        }
        h1 { margin: 0; font-size: 2rem; font-weight: bold; }
        .subtitle { opacity: 0.7; margin: 0.5rem 0 0 0; }

        .reset-btn {
            background: #ef4444;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }

        .section-title { font-size: 1.25rem; margin-bottom: 1rem; }
        .treasure-list { display: grid; gap: 1rem; }
        .empty-text { opacity: 0.5; }

        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 0.75rem;
            padding: 1rem;
        }
        
        .treasure-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .treasure-info { flex: 1; min-width: 200px; }
        .treasure-title { margin: 0; font-size: 1.1rem; font-weight: bold; }
        .treasure-subtitle { margin: 0; font-size: 0.875rem; opacity: 0.6; }
        .treasure-question { margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9; }
        .treasure-answer { font-size: 0.75rem; opacity: 0.4; margin-top: 0.25rem; }

        .action-group { display: flex; align-items: center; gap: 0.5rem; }
        .edit-btn {
            background: #3b82f6;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            font-size: 0.875rem;
        }
        .qr-wrapper {
            padding: 0.5rem;
            background: white;
            border-radius: 0.5rem;
            display: flex;
        }
        .icon-btn {
            background: rgba(255,255,255,0.1);
            color: white;
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
        }

        /* Modal */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .modal-content {
            background: #1e293b;
            padding: 1.5rem;
            border-radius: 1rem;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-title { font-size: 1.25rem; margin-bottom: 1rem; margin-top: 0; }
        
        .form-grid { display: grid; gap: 1rem; }
        label { display: block; font-size: 0.875rem; margin-bottom: 0.5rem; opacity: 0.8; }
        .input-field {
            width: 100%;
            padding: 0.75rem;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 0.5rem;
            color: white;
            font-size: 1rem;
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        .modal-actions { display: flex; gap: 1rem; margin-top: 1rem; }
        .cancel-btn {
            flex: 1;
            padding: 0.75rem;
            background: #334155;
            color: white;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
        }
        .save-btn {
            flex: 1;
            padding: 0.75rem;
            background: #3b82f6;
            color: white;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }

        /* Test Zone */
        .test-zone {
            margin-top: 3rem;
            padding: 1.5rem;
            background: #222;
            border-radius: 12px;
        }
        .qr-large {
            background: white;
            padding: 1rem;
            display: inline-block;
            border-radius: 8px;
        }
        .raw-qr {
            font-size: 0.8rem;
            margin-top: 0.5rem;
            font-family: monospace;
            color: #888;
        }

        .flex-center { display: flex; align-items: center; justify-content: center; height: 100vh; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
