import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientHome from './ClientHome';

export default async function Home() {
  const cookieStore = await cookies();
  const group = cookieStore.get('treasure-group');
  const username = cookieStore.get('treasure-username');

  // Auto-redirect if already logged in
  if (group && username) {
    redirect('/dashboard');
  }

  return <ClientHome />;
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight, UserCircle } from 'lucide-react';

export function ClientHome() {
  const router = useRouter();
  const [step, setStep] = useState<'group' | 'name'>('group');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Select Group
  const handleGroupClick = (group: string) => {
    setSelectedGroup(group);
    setStep('name');
  };

  // Step 2: Submit Name & Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: selectedGroup,
          username: username
        }),
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
    <div className="home-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>QR Hunt</h1>
        <p style={{ opacity: 0.7 }}>
          {step === 'group' ? 'Select your team' : `Joining Team ${selectedGroup}`}
        </p>
      </header>

      {/* STEP 1: COMPACT GROUP GRID */}
      {step === 'group' && (
        <div className="group-grid">
          {['A', 'B', 'C', 'D'].map((group) => (
            <button
              key={group}
              className="group-card"
              onClick={() => handleGroupClick(group)}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{group}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>TEAM</span>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: NAME INPUT */}
      {step === 'name' && (
        <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: '320px', padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div className="input-group">
              <label style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem', display: 'block' }}>
                What's your name?
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <UserCircle size={20} style={{ position: 'absolute', left: '10px', opacity: 0.5 }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setStep('group')}
                style={{
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'white',
                  color: 'black',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Joining...' : 'Start'} <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </form>
      )}

      <style jsx>{`
        .group-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            width: 100%;
            max-width: 320px;
        }
        .group-card {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            cursor: pointer;
            transition: all 0.2s;
            color: white;
            aspect-ratio: 1/1; /* Square shape */
        }
        .group-card:active {
            transform: scale(0.95);
            background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
