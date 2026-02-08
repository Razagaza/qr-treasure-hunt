'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGroupSelect = async (group: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to join group');
      }
    } catch (error) {
      console.error('Login failed', error);
      alert('Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>QR Treasure Hunt</h1>
        <p style={{ opacity: 0.8 }}>Select your team to begin</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '400px' }}>
        {['A', 'B', 'C', 'D'].map((group) => (
          <button
            key={group}
            className="card flex-center"
            onClick={() => handleGroupSelect(group)}
            disabled={loading}
            style={{
              flexDirection: 'column',
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{group}</h2>
            <span style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>Team {group}</span>
          </button>
        ))}
      </div>

      {loading && <p className="animate-pulse">Joining team...</p>}
    </div>
  );
}
