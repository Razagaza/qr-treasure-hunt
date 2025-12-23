'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collectTreasure } from '@/app/actions/collect';
import { auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Sign in anonymously if not already
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || status !== 'idle') return;

    // 2. Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;
    setStatus('scanning');

    function onScanSuccess(decodedText: string) {
      if (status === 'processing') return;
      
      handleScan(decodedText);
      // Clean up scanner after successful scan to prevent multiple triggers
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    }

    function onScanFailure(error: any) {
      // Ignore scan failures (usually means no QR in frame)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [user, status]);

  const handleScan = async (uuid: string) => {
    setStatus('processing');
    const result = await collectTreasure(user.uid, uuid);
    
    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setPoints(result.points || 0);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="scan-container">
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'white' }}><ArrowLeft /></Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Scan Treasure</h1>
      </header>

      <div className="scanner-wrapper card">
        {status === 'scanning' && <div id="reader"></div>}
        
        {status === 'processing' && (
          <div className="flex-center" style={{ flexDirection: 'column', padding: '3rem', gap: '1rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p>Verifying treasure...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex-center" style={{ flexDirection: 'column', padding: '3rem', gap: '1.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#10b981" />
            <div>
              <h2 style={{ marginBottom: '0.5rem', WebkitTextFillColor: '#10b981' }}>Treasure Found!</h2>
              <p style={{ opacity: 0.8 }}>{message}</p>
              <div className="points-badge">+{points} Points</div>
            </div>
            <button className="btn-primary" onClick={resetScanner} style={{ width: '100%' }}>
              Scan Next
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex-center" style={{ flexDirection: 'column', padding: '3rem', gap: '1.5rem', textAlign: 'center' }}>
            <AlertCircle size={64} color="#ef4444" />
            <div>
              <h2 style={{ marginBottom: '0.5rem', WebkitTextFillColor: '#ef4444' }}>Scanner Error</h2>
              <p style={{ opacity: 0.8 }}>{message}</p>
            </div>
            <button className="btn-primary" onClick={resetScanner} style={{ width: '100%', background: '#475569' }}>
              Try Again
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .scan-container {
          max-width: 500px;
          margin: 0 auto;
        }
        .scanner-wrapper {
          overflow: hidden;
          padding: 0;
        }
        #reader {
          width: 100%;
          border: none !important;
        }
        :global(#reader__dashboard) {
          padding: 1rem !important;
        }
        :global(#reader__status_span) {
           display: none;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .points-badge {
          display: inline-block;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-weight: 700;
          margin-top: 1rem;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
      `}</style>
    </div>
  );
}
