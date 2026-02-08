'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Timer } from 'lucide-react';
import Link from 'next/link';

type ScanStatus = 'idle' | 'scanning' | 'validating' | 'solving' | 'submitting' | 'success' | 'error';

interface Treasure {
  id: number;
  question: string;
  type: 'text' | 'choice';
  choices?: string[];
  points: number;
  timeLimit?: number;
}

export default function ScanPage() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [treasure, setTreasure] = useState<Treasure | null>(null);
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const scannerRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. Init Logic ---
  useEffect(() => {
    if (status === 'idle') {
      setStatus('scanning');
    }
  }, [status]);

  // --- 2. Scanner Logic ---
  useEffect(() => {
    if (status !== 'scanning') return;

    let scanner: any = null;
    let mounted = true;

    const initScanner = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM
        const element = document.getElementById('reader');
        if (!element || !mounted) return;

        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            videoConstraints: { facingMode: "environment" },
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        scanner.render(onScanSuccess, (err: any) => console.warn(err));
        scannerRef.current = scanner;
      } catch (err) {
        console.error("Scanner init failed", err);
      }
    };

    initScanner();

    function onScanSuccess(decodedText: string) {
      if (status !== 'scanning') return;
      handleScan(decodedText);
    }

    return () => {
      mounted = false;
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [status]);

  // --- 3. Validation Logic ---
  const handleScan = async (qrData: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { });
      scannerRef.current = null;
    }

    setStatus('validating');

    try {
      const res = await fetch('/api/scan/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();

      if (data.success) {
        setTreasure(data.treasure);
        setStatus('solving');
        setAnswer('');

        // Start Timer if needed
        if (data.treasure.timeLimit) {
          setTimeLeft(data.treasure.timeLimit);
        } else {
          setTimeLeft(null);
        }

      } else {
        setStatus('error');
        setMessage(data.message || 'Validation failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error occurred');
    }
  };

  // --- 4. Timer Logic ---
  useEffect(() => {
    if (status === 'solving' && timeLeft !== null) {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        // Time up! Auto submit or Fail? 
        // User requirement: "카운트 다운 끝나면 자동 제출이야"
        handleSubmit();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [status, timeLeft]);

  // --- 5. Submission Logic ---
  const handleSubmit = async () => {
    if (!treasure) return;

    // Disable multiple submits
    if (status === 'submitting') return;

    // Prevent submitting empty unless it's a timeout force-submit? 
    // User said: "제출은 입력칸에 뭐가 있어야만 버튼이 활성화" -> Implies manual submit needs input. 
    // But auto-submit might send empty. Let's allow empty for auto-submit case.

    setStatus('submitting');

    try {
      const res = await fetch('/api/scan/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treasureId: treasure.id,
          answer: answer
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setHints(data.hints || []);
      } else {
        // If wrong answer, user might want to try again? 
        // Or "보물을 못 찾은 거로 할거야"? 
        // User said: "보물을 제출하지 않고 닫기 할 수도 있는데 이 경우에는 보물을 못 찾은 거로 할거야."
        // If submitted and wrong -> likely should show "Wrong" and maybe allow retry or fail?
        // Let's assume standard quiz: Wrong = Error state, or just Feedback.
        // For now, let's treat as Error state allow retry if timer permits? 
        // User didn't specify retry logic explicitly, but "hint is revealed" only on success.

        setStatus('error');
        setMessage(data.message || 'Incorrect Answer');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Submission failed');
    }
  };

  const handleClose = () => {
    // Reset Everything
    setTreasure(null);
    setAnswer('');
    setStatus('idle');
  };

  // --- Render Helpers ---
  const isInputValid = answer.trim().length > 0;
  const isTimerActive = timeLeft !== null && timeLeft > 0;

  return (
    <div className="scan-container">
      <div id="reader" style={{ display: status === 'scanning' ? 'block' : 'none' }}></div>

      {/* Loading / Validating */}
      {(status === 'validating' || status === 'submitting') && (
        <div className="fullscreen-overlay flex-center flex-col">
          <Loader2 className="animate-spin" size={48} />
          <p>{status === 'validating' ? 'Verifying QR...' : 'Checking Answer...'}</p>
        </div>
      )}

      {/* Error / Result */}
      {status === 'error' && (
        <div className="card flex-center flex-col p-8 gap-4 text-center">
          <AlertCircle size={64} color="#ef4444" />
          <h2 className="text-red-500">Oops!</h2>
          <p>{message}</p>
          <button className="btn-primary bg-slate-600" onClick={handleClose}>Close</button>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="card flex-center flex-col p-8 gap-4 text-center">
          <CheckCircle2 size={64} color="#10b981" />
          <h2 className="text-emerald-500">Correct!</h2>
          <div className="bg-slate-800 p-4 rounded-lg w-full">
            <h3 className="text-sm opacity-70 mb-2">Unlocked Hints:</h3>
            {hints.map((h, i) => (
              <p key={i} className="text-yellow-400 mb-1">💡 {h}</p>
            ))}
          </div>
          <button className="btn-primary" onClick={handleClose}>Scan Next</button>
        </div>
      )}

      {/* Solving Interface */}
      {status === 'solving' && treasure && (
        <div className="card p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xs opacity-50">Treasure #{treasure.id}</span>
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 font-mono ${timeLeft < 10 ? 'text-red-500' : 'text-primary'}`}>
                <Timer size={16} />
                {timeLeft}s
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold">{treasure.question}</h2>

          {treasure.type === 'choice' && treasure.choices ? (
            <div className="flex flex-col gap-2">
              {treasure.choices.map((choice) => (
                <button
                  key={choice}
                  className={`p-3 rounded border text-left transition-colors ${answer === choice
                      ? 'bg-primary border-primary text-black'
                      : 'bg-transparent border-slate-700 hover:bg-slate-800'
                    }`}
                  onClick={() => setAnswer(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text" // User said "Numbers mostly" but text is flexible
              className="p-3 bg-slate-900 border border-slate-700 rounded w-full"
              placeholder="Enter your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}

          <div className="flex gap-3 mt-4">
            <button
              className="btn-primary flex-1 bg-slate-700 disabled:opacity-50"
              onClick={handleClose}
              disabled={isTimerActive} // "보물 중에 시간 제한이 있는 거는 닫기 버튼이 활성화되지 않고"
            >
              Close
            </button>
            <button
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!isInputValid} // "입력칸에 뭐가 있어야만 버튼이 활성화"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
         .scan-container {
             max-width: 500px;
             margin: 0 auto;
             padding: 1rem;
             min-height: 80vh;
         }
         .fullscreen-overlay {
             position: fixed;
             inset: 0;
             background: rgba(0,0,0,0.8);
             z-index: 50;
         }
         .flex-center {
             display: flex;
             align-items: center;
             justify-content: center;
         }
         .flex-col {
             flex-direction: column;
         }
         .p-8 { padding: 2rem; }
         .gap-4 { gap: 1rem; }
       `}</style>
    </div>
  );
}
