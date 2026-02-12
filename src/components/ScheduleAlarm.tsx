'use client';

import { useEffect, useState, useRef } from 'react';

export default function ScheduleAlarm() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [activeAlarm, setActiveAlarm] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastTriggeredRef = useRef<string | null>(null); // Prevent duplicate triggers for same minute

    useEffect(() => {
        // 1. Fetch Schedule
        fetch('/api/schedule')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSchedule(data.schedule);
            })
            .catch(err => console.error('Alarm Schedule Fetch Error:', err));

        // 2. Start Timer (Check every 10s)
        intervalRef.current = setInterval(checkTime, 10000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            stopAlarm();
        };
    }, []);

    const checkTime = () => {
        // Use KST (UTC+9)
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Seoul',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        }); // Returns "HH:MM"

        // Prevent multiple triggers in same minute
        if (lastTriggeredRef.current === timeString) return;

        // Check if any event matches current time
        const event = schedule.find((s: any) => s.time === timeString);

        if (event) {
            lastTriggeredRef.current = timeString;
            triggerAlarm(event);
        }
    };

    const triggerAlarm = (event: any) => {
        setActiveAlarm(event.room1 || event.room3 || 'Event Time!');
        playBeep();
    };

    const playBeep = () => {
        // Web Audio API
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // Octave up

            // Beep pattern: Beep-Beep ... Beep-Beep
            // For simplicity, just a continuous alerting pulse loop
            // actually, let's make it loop manually or use basic oscillator

            // Simple Beep Sequence
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();

            // Pulsing volume for alarm effect
            const now = ctx.currentTime;
            gainNode.gain.setValueAtTime(1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            oscillator.stop(now + 0.5);

            // Loop it
            // Simple loop using setInterval for the sound effect while active
            // (Not ideal for precise audio, but sufficient for simple alarm)
            const loopId = setInterval(() => {
                if (ctx.state === 'closed') { clearInterval(loopId); return; }
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                osc.start();
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.stop(ctx.currentTime + 0.2);
            }, 1000);

            // Store loop ID to clear? 
            // Better strategy: component state for "isAlarming" drives an effect that plays sound.
            // But we are here. Let's stick to simple single-shot logic or just handle 'stop' carefully.
            // Current implementation: One beep above, then interval loop.
            // Let's refine: The View is open -> Effect should run loop.

        } catch (e) {
            console.error('Audio Play Error:', e);
        }
    };

    // Better Audio Logic: useEffect on activeAlarm
    useEffect(() => {
        let soundInterval: NodeJS.Timeout;

        if (activeAlarm) {
            const playSound = () => {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                // Alarm Sound: High-Low-High
                const now = ctx.currentTime;
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(440, now + 0.1);
                osc.frequency.setValueAtTime(880, now + 0.2);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);

                osc.start();
                osc.stop(now + 0.4);
            };

            playSound(); // Immediate
            soundInterval = setInterval(playSound, 2000); // Repeat every 2s
        }

        return () => {
            if (soundInterval) clearInterval(soundInterval);
        };
    }, [activeAlarm]);


    const stopAlarm = () => {
        setActiveAlarm(null);
    };

    if (!activeAlarm) return null;

    return (
        <div className="alarm-overlay">
            <div className="alarm-card">
                <div className="alarm-icon">⏰</div>
                <h2>It's Time!</h2>
                <p className="event-name">{activeAlarm}</p>
                <div className="kst-badge">KST {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
                <button onClick={stopAlarm} className="dismiss-btn">
                    Dismiss
                </button>
            </div>

            <style jsx>{`
                .alarm-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                    animation: fadeIn 0.3s;
                }
                .alarm-card {
                    background: #1e1b4b;
                    border: 2px solid #facc15;
                    padding: 2rem;
                    border-radius: 1.5rem;
                    text-align: center;
                    color: white;
                    box-shadow: 0 0 50px rgba(253, 224, 71, 0.4);
                    animation: pulse 1.5s infinite;
                    max-width: 90%;
                    width: 320px;
                }
                .alarm-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                h2 {
                    font-size: 2rem;
                    margin: 0 0 0.5rem 0;
                    color: #fca5a5;
                }
                .event-name {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #fde047;
                    margin-bottom: 0.5rem;
                }
                .kst-badge {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    margin-bottom: 2rem;
                    color: #94a3b8;
                    display: inline-block;
                }
                .dismiss-btn {
                    background: white;
                    color: black;
                    border: none;
                    padding: 1rem 2rem;
                    font-size: 1.25rem;
                    font-weight: bold;
                    border-radius: 1rem;
                    cursor: pointer;
                    width: 100%;
                    transition: transform 0.1s;
                }
                .dismiss-btn:active {
                    transform: scale(0.95);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(253, 224, 71, 0.4); transform: scale(1); }
                    70% { box-shadow: 0 0 0 20px rgba(253, 224, 71, 0); transform: scale(1.02); }
                    100% { box-shadow: 0 0 0 0 rgba(253, 224, 71, 0); transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
