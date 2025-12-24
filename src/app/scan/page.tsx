'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collectTreasureLocal, getCurrentUserId } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  const [userId, setUserId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(0);
  const scannerRef = useRef<any>(null);
  const router = useRouter();

  // 1. Initialize User
  useEffect(() => {
    const uid = getCurrentUserId();
    setUserId(uid);
  }, []);

  // 2. Start Scanning when User is ready
  useEffect(() => {
    if (userId && status === 'idle') {
      setStatus('scanning');
    }
  }, [userId, status]);

  // 3. Initialize Scanner when status is 'scanning' (DOM element exists)
  useEffect(() => {
    if (status !== 'scanning') return;

    let scanner: any = null;
    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        if (!mounted) return;

        // Ensure element exists before initializing
        // Add a small delay to ensure DOM render
        await new Promise(resolve => setTimeout(resolve, 100));

        const element = document.getElementById('reader');
        if (!element) {
          console.error("Reader element not found");
          return;
        }

        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            videoConstraints: { facingMode: "environment" }
          },
          /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

      } catch (err) {
        console.error("Failed to load scanner", err);
      }
    };

    initScanner();

    function onScanSuccess(decodedText: string) {
      if (status === 'processing') return;
      handleScan(decodedText);
    }

    function onScanFailure(error: any) {
      // Ignore
    }

    return () => {
      mounted = false;
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleScan = async (scannedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }

    setStatus('processing');

    // Parse QR Content (JSON vs String)
    let treasureInput: any = scannedText; // string or object
    let desc = '';

    try {
      const data = JSON.parse(scannedText);
      if (data.id) {
        // Stateless QR Object
        treasureInput = {
          uuid: data.id,
          name: data.name,
          points: data.points,
          description: data.desc
        };
        desc = data.desc || '';
      }
    } catch (e) {
      // Not JSON, treat as raw UUID string (Legacy)
      treasureInput = scannedText;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = collectTreasureLocal(userId, treasureInput);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setDescription(desc);
      setPoints(result.points || 0);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setMessage('');
    setDescription('');
  };

  return (
    <div className="scan-container">
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'white' }}><ArrowLeft /></Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Scan Treasure</h1>
      </header>

      <div className="scanner-wrapper card">
        {/* Only render this specific div when scanning to ensure clean mounting/unmounting */}
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
              {description && (
                <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--secondary)' }}>
                  "{description}"
                </p>
              )}
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
