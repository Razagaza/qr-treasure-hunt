'use client';

import { useState, useEffect } from 'react';
import { getTreasures, addTreasure, Treasure } from '@/lib/storage';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, QrCode as QrIcon } from 'lucide-react';

export default function AdminPage() {
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTreasures();
  }, []);

  const loadTreasures = () => {
    const list = getTreasures();
    // Sort by name for consistency
    list.sort((a, b) => a.name.localeCompare(b.name));
    setTreasures(list);
  };

  const handleAddTreasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setLoading(true);
    try {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));

      addTreasure(newName, newPoints, newDesc);

      setNewName('');
      setNewDesc('');
      setNewPoints(10);
      loadTreasures();
    } catch (error) {
      console.error("Error adding treasure:", error);
      alert("Failed to add treasure.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (uuid: string, name: string) => {
    const svg = document.getElementById(`qr-${uuid}`);
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
      downloadLink.download = `QR-${name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="admin-container">
      <header style={{ marginBottom: '2rem' }}>
        <h1>Admin Portal</h1>
        <p style={{ opacity: 0.7 }}>Generate and manage treasure QR codes</p>
      </header>

      <section className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Create New Treasure</h2>
        <form onSubmit={handleAddTreasure}>
          <div className="input-group">
            <label>Treasure Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Hidden Sofa"
              disabled={loading}
              required
            />
          </div>
          <div className="input-group">
            <label>Description (Embedded in QR)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g., You found the secret sofa!"
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label>Points</label>
            <input
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(parseInt(e.target.value))}
              disabled={loading}
              min="1"
            />
          </div>
          <button type="submit" className="btn-primary flex-center" style={{ width: '100%', gap: '0.5rem' }} disabled={loading}>
            <Plus size={20} />
            {loading ? 'Adding...' : 'Add Treasure'}
          </button>
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Existing Treasures</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {treasures.length === 0 && <p style={{ opacity: 0.5 }}>No treasures found.</p>}
          {treasures.map((t) => {
            // Generate QR Content: JSON string with id and description
            const qrValue = JSON.stringify({
              id: t.uuid,
              desc: t.description || ''
            });

            return (
              <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', background: 'none', WebkitTextFillColor: 'inherit' }}>{t.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.6 }}>{t.points} Points</p>
                  {t.description && <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>"{t.description}"</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.5rem', display: 'flex' }}>
                    <QRCodeSVG
                      id={`qr-${t.uuid}`}
                      value={qrValue}
                      size={64}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <button
                    onClick={() => downloadQR(t.uuid, t.name)}
                    className="flex-center"
                    style={{ background: 'var(--glass)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}
                    title="Download QR"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style jsx>{`
        .admin-container {
          max-width: 600px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
