'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, QrCode as QrIcon, Loader2 } from 'lucide-react';

// We need to duplicate the type here or import from a shared location if possible
// For client side, we can't import server-only functions like `getTreasures` directly from file-db
// So we need an API route for admin to fetch treasures.

interface Treasure {
  id: number;
  question: string;
  points: number;
  // We compute the encrypted string on the server and send it here
  encryptedQr?: string;
}

export default function AdminPage() {
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [loading, setLoading] = useState(true);

  // We are not implementing "Add" right now as per user request ("admin najeong-e").
  // But we MUST show the existing seeded treasures so they can print QRs.

  useEffect(() => {
    fetch('/api/seed') // Re-trigger seed if needed, or just fetch. 
    // Actually we need a generic GET treasures route or just reuse the stats one?
    // Stats one is group specific.
    // Let's make a quick local fetch if we can, or just use the seed response if it returned data?
    // Better: Helper API for admin.

    // For now, let's just cheat and fetch the treasures via a new simple route
    // OR, just assume 0-29 and generate clientside? 
    // NO, we need the server-side encryption key. 
    // So we MUST have an API that returns { id, encryptedQr }.

    fetchTreasures();
  }, []);

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
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="admin-container">
      <header style={{ marginBottom: '2rem' }}>
        <h1>Admin Portal</h1>
        <p style={{ opacity: 0.7 }}>Generate QR codes for treasures 0-29</p>
      </header>

      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Existing Treasures</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {treasures.length === 0 && <p style={{ opacity: 0.5 }}>No treasures found. Run seed!</p>}
          {treasures.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Treasure #{t.id}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.6 }}>{t.points} Points</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>{t.question}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.5rem', display: 'flex' }}>
                  {t.encryptedQr && (
                    <QRCodeSVG
                      id={`qr-${t.id}`}
                      value={t.encryptedQr}
                      size={64}
                      level="M"
                      includeMargin={false}
                    />
                  )}
                </div>
                <button
                  onClick={() => downloadQR(t.id)}
                  className="flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                  title="Download QR"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .admin-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem;
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
