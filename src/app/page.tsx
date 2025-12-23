import Link from 'next/link';
import { QrCode, Map, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="home-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>QR Treasure Hunt</h1>
        <p style={{ opacity: 0.8 }}>Find and scan QR codes to collect stamps!</p>
      </header>

      <div className="grid" style={{ display: 'grid', gap: '1.5rem' }}>
        <Link href="/scan" style={{ textDecoration: 'none' }}>
          <div className="card flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <QrCode size={48} strokeWidth={1.5} color="var(--primary)" />
            <h2 style={{ marginBottom: 0 }}>Start Scanning</h2>
            <p style={{ textAlign: 'center', opacity: 0.7 }}>Point your camera at a treasure QR code</p>
          </div>
        </Link>

        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="card flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <Map size={48} strokeWidth={1.5} color="var(--secondary)" />
            <h2 style={{ marginBottom: 0 }}>My Collection</h2>
            <p style={{ textAlign: 'center', opacity: 0.7 }}>View your collected stamps and points</p>
          </div>
        </Link>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center' }}>
        <Link href="/admin" style={{ color: 'var(--primary)', opacity: 0.5, fontSize: '0.875rem' }}>
          Admin Portal
        </Link>
      </footer>
    </div>
  );
}
