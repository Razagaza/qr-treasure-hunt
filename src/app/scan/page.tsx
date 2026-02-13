'use client';

import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Timer, X } from 'lucide-react';
import Link from 'next/link';

type ScanStatus = 'idle' | 'scanning' | 'validating' | 'solving' | 'submitting' | 'success' | 'error' | 'inactive';

interface Treasure {
  id: number;
  question: string;
  type: 'text' | 'choice' | 'number';
  choices?: string[];
  points: number;
  timeLimit?: number;
}

export default function ScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [treasure, setTreasure] = useState<Treasure | null>(null);
  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const scannerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setAnswer('');

        // Handle Timer Interaction
        if (data.treasure.timeLimit > 0) {
          setTimeLeft(data.treasure.timeLimit);
        } else {
          // Unlimited Time
          setTimeLeft(null);
        }

        setStatus('solving');

      } else {
        // Special Handling for "Bang" (Inactive)
        if (data.inactive) {
          setStatus('error'); // Changed to error to display message
          setMessage(data.message);
        } else if (data.alreadyFound) {
          setStatus('error');
          setMessage('Already found!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid QR Code');
        }
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

    setStatus('submitting');

    try {
      const res = await fetch('/api/scan/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treasureId: treasure.id,
          answer: answer // Note: if coming from event listener, ensure 'answer' is current
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setHints(data.hints || []);
      } else {
        setStatus('error');
        setMessage(data.message || 'Incorrect Answer');
        // If failedAndSaved is true, we show hints (Hint 2)
        if (data.failedAndSaved && data.hints) {
          setHints(data.hints);
        } else {
          setHints([]);
        }
      }
    } catch (err) {
      setStatus('error');
      setMessage('Submission failed');
    }
  };

  // Keep handleSubmit fresh for event listeners
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  // --- 6. Back Button & Unload Handling ---
  useEffect(() => {
    // Only active if solving and treasure has a time limit
    const isTimed = status === 'solving' && treasure?.timeLimit !== undefined && treasure.timeLimit > 0;

    if (isTimed) {
      // 1. Push a history state to trap the back button
      // We push a state so that when user clicks back, they pop this state but stay on the page (conceptually)
      // Then we detect that pop and submit.
      window.history.pushState({ solving: true }, '', window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        // User pressed back button
        // Prevent default navigation if possible (not really possible to cancel popstate fully without pushing again)
        // But more importantly: AUTO SUBMIT
        handleSubmitRef.current();
      };

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // User tried to reload or close tab
        // We can't guarantee async fetch will complete, but we can try.
        // We also show a confirmation dialog (standard browser behavior requires setting returnValue)
        e.preventDefault();
        e.returnValue = '';

        // Attempt submit
        handleSubmitRef.current();
      };

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [status, treasure]); // Re-run if status matches.

  const handleClose = () => {
    // Reset Everything
    setTreasure(null);
    setAnswer('');
    setStatus('idle');
  };

  // --- Render Helpers ---
  const isInputValid = answer.trim().length > 0;
  // Determine if this is a timed challenge
  const isTimeLimited = timeLeft !== null; // If timeLeft is not null, it's a timed treasure

  return (
    <div className="scan-container">
      {/* Header with Back Button - Hidden if Solving Checks & Timed */}
      {!(status === 'solving' && isTimeLimited) && (
        <div className="back-button-wrapper">
          <button
            onClick={() => router.push('/dashboard')}
            className="back-btn"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      )}
      <div id="reader" style={{ display: status === 'scanning' ? 'block' : 'none', marginTop: '3rem' }}></div>

      {/* Loading / Validating */}
      {(status === 'validating' || status === 'submitting') && (
        <div className="fullscreen-overlay flex-center flex-col">
          <Loader2 className="animate-spin" size={48} color="#6366f1" />
          <p className="loading-text">{status === 'validating' ? 'Verifying QR...' : 'Checking Answer...'}</p>
        </div>
      )}

      {/* Error / Result */}
      {status === 'error' && (
        <div className="card flex-center flex-col p-8 gap-4 text-center">
          <AlertCircle size={64} color="#ef4444" />
          <h2 className="title text-red">Oops!</h2>
          <p className="message">{message}</p>

          {/* Show Failure Hints if available */}
          {hints.length > 0 && (
            <div className="hints-box">
              <h3 className="hints-title">Hint Unlocked:</h3>
              {hints.map((h: string, i: number) => (
                <p key={i} className="hint-item">{h}</p>
              ))}
            </div>
          )}

          <button className="btn-primary" onClick={handleClose}>Close</button>
        </div>
      )}

      {/* Inactive "Bang" State */}
      {status === 'inactive' && (
        <div className="card flex-center flex-col p-8 gap-4 text-center">
          <div className="bang-icon">💥</div>
          <h2 className="title text-red">bang!</h2>
          <p className="message">{message}</p>
          <button className="btn-primary" onClick={handleClose}>Close</button>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="card flex-center flex-col p-8 gap-4 text-center">
          <CheckCircle2 size={64} color="#10b981" />
          <h2 className="title text-green">Correct!</h2>
          <div className="hints-box">
            <h3 className="hints-title">Unlocked Hints:</h3>
            {hints.map((h: string, i: number) => (
              <p key={i} className="hint-item">{h}</p>
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
            <button className="btn-primary" onClick={handleClose}>Scan Next</button>
          </div>
        </div>
      )}

      {/* Solving Interface */}
      {status === 'solving' && treasure && (
        <div className="card content-card">
          <div className="card-header">
            <span className="treasure-id">Treasure #{treasure.id}</span>
            {timeLeft !== null && (
              <div className={`timer ${timeLeft < 10 ? 'timer-critical' : ''}`}>
                <Timer size={16} />
                {timeLeft}s
              </div>
            )}
            {/* Show Close button in header if Unlimited Time (timeLeft is null) */}
            {!isTimeLimited && (
              <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-700">
                <X size={20} className="text-gray-400" />
              </button>
            )}
          </div>

          <h2 className="question-text" dangerouslySetInnerHTML={{ __html: treasure.question.replace(/\\n/g, '<br />') }}></h2>

          {treasure.type === 'choice' && treasure.choices ? (
            <div className="choices-list">
              {treasure.choices.map((choice: string) => (
                <button
                  key={choice}
                  className={`choice-btn ${answer === choice ? 'selected' : ''}`}
                  onClick={() => setAnswer(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <input
              type={treasure.type === 'number' ? 'number' : 'text'}
              inputMode={treasure.type === 'number' ? 'numeric' : 'text'}
              className="text-input"
              placeholder={treasure.type === 'number' ? 'Enter number...' : 'Enter your answer...'}
              value={answer}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAnswer(e.target.value)}
            />
          )}

          <div className="action-buttons">
            {!isTimeLimited && (
              <button
                className="btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!isInputValid}
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
             color: white;
             position: relative;
         }
         .back-button-wrapper {
             position: absolute;
             top: 1rem;
             left: 1rem;
             z-index: 20;
         }
         .back-btn {
             background: rgba(0,0,0,0.6);
             backdrop-filter: blur(4px);
             border: 1px solid rgba(255,255,255,0.2);
             border-radius: 50%;
             width: 40px;
             height: 40px;
             display: flex;
             align-items: center;
             justify-content: center;
             color: white;
             cursor: pointer;
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
         .gap-4 { gap: 1rem; }
         .p-8 { padding: 2rem; }
         .text-center { text-align: center; }

         .loading-text {
             margin-top: 1rem;
             font-size: 1.1rem;
             color: #e2e8f0;
         }
         
         .card {
             background: #1e293b;
             border-radius: 1rem;
             box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
             border: 1px solid #334155;
         }
         .content-card {
             padding: 1.5rem;
             display: flex;
             flex-direction: column;
             gap: 1.5rem;
             margin-top: 2rem;
         }

         .title { font-size: 1.5rem; font-weight: bold; margin: 0; }
         .text-red { color: #ef4444; }
         .text-green { color: #10b981; }
         .message { color: #cbd5e1; }

         .hints-box {
             background: #0f172a;
             padding: 1rem;
             border-radius: 0.5rem;
             width: 100%;
             text-align: left;
         }
         .hints-title { font-size: 0.875rem; opacity: 0.7; margin-bottom: 0.5rem; }
         .hint-item { color: #facc15; margin-bottom: 0.25rem; }

         .card-header {
             display: flex;
             justify-content: space-between;
             align-items: center;
         }
         .treasure-id { font-size: 0.75rem; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; }
         .timer {
             display: flex;
             align-items: center;
             gap: 0.5rem;
             font-family: monospace;
             color: #6366f1;
             font-weight: bold;
         }
         .timer-critical { color: #ef4444; }

         .question-text { font-size: 1.25rem; font-weight: bold; line-height: 1.4; margin: 0; white-space: pre-wrap; }

         .choices-list { display: flex; flex-direction: column; gap: 0.5rem; }
         .choice-btn {
             padding: 0.75rem;
             border-radius: 0.5rem;
             border: 1px solid #334155;
             background: transparent;
             color: white;
             text-align: left;
             cursor: pointer;
             transition: all 0.2s;
         }
         .choice-btn:hover { background: #334155; }
         .choice-btn.selected {
             background: #6366f1;
             border-color: #6366f1;
             color: white;
         }

         .text-input {
             padding: 0.75rem;
             background: #0f172a;
             border: 1px solid #334155;
             border-radius: 0.5rem;
             width: 100%;
             color: white;
             font-size: 1rem;
         }
         .text-input:focus { outline: none; border-color: #6366f1; }

         .action-buttons { display: flex; gap: 0.75rem; margin-top: 1rem; }
         .btn-primary {
             background: #6366f1;
             color: white;
             padding: 0.75rem 1.5rem;
             border-radius: 0.5rem;
             border: none;
             font-weight: 600;
             cursor: pointer;
             flex: 1;
             transition: opacity 0.2s;
         }
         .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
         .btn-primary:active { transform: translateY(1px); }

         .btn-secondary {
             background: #334155;
             color: white;
             padding: 0.75rem 1.5rem;
             border-radius: 0.5rem;
             border: none;
             font-weight: 600;
             cursor: pointer;
             flex: 1;
         }
         .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

         .animate-spin { animation: spin 1s linear infinite; }
         @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
         .bang-icon {
            font-size: 4rem;
            animation: bounce 0.5s infinite alternate;
        }
        @keyframes bounce {
            from { transform: scale(1); }
            to { transform: scale(1.2); }
        }
      `}</style>
    </div >
  );
}
