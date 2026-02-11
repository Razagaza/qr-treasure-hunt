'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, User, ArrowRight, Sparkles, UserCircle } from 'lucide-react';

export default function ClientHome() {
    const router = useRouter();
    const [step, setStep] = useState<'group' | 'name'>('group');
    const [group, setGroup] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const groups = ['A', 'B', 'C', 'D', 'E'];

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset your local session?')) return;
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/'; // Hard reload to clear state
    };

    const handleGroupSelect = (selectedGroup: string) => {
        setGroup(selectedGroup);
        setStep('name');
    };

    const handleStart = async () => {
        if (!username.trim()) return;

        // Confirmation Check
        if (!confirm(`Join Group ${group} as "${username}"?`)) return;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group, username })
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert('Login failed. Please try again.');
            }
        } catch (e) {
            alert('An error occurred.');
        }
    };

    return (
        <div className="home-container">
            <div className="content-wrapper">
                <div className="header-section">
                    <div className="icon-wrapper">
                        <Sparkles color="#fde047" size={32} />
                    </div>
                    <h1 className="title">Treasure Hunt</h1>
                    <p className="subtitle">Select your team to begin the hunt!</p>
                    <button onClick={handleReset} className="reset-link">
                        Reset Session
                    </button>
                </div>

                <div className="card form-card">
                    {step === 'group' ? (
                        <div className="step-content">
                            <div className="step-header">
                                <h2 className="step-title">
                                    <Users size={20} color="#d8b4fe" />
                                    Select Your Group
                                </h2>
                                <p className="step-description">Choose your assigned team letter</p>
                            </div>

                            <div className="group-grid">
                                {groups.map((group) => (
                                    <button
                                        key={group}
                                        onClick={() => handleGroupSelect(group)}
                                        className="group-btn"
                                    >
                                        <div className="group-letter">{group}</div>
                                        <div className="group-label">Team</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="step-content">
                            <div className="step-header">
                                <h2 className="step-title">
                                    <UserCircle size={20} color="#d8b4fe" />
                                    Enter Your Name
                                </h2>
                                <p className="step-description">Team {group}</p>
                            </div>

                            <div className="input-section">
                                <div className="input-wrapper">
                                    <User className="input-icon" size={20} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your name"
                                        className="styled-input"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    />
                                </div>

                                <div className="button-row">
                                    <button
                                        onClick={() => setStep('group')}
                                        className="btn-secondary"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        disabled={!username.trim()}
                                        className="btn-primary start-btn"
                                    >
                                        Start Game
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .home-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #000000 100%);
                    color: white;
                }
                .content-wrapper {
                    width: 100%;
                    max-width: 400px;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    animation: fadeIn 0.7s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .header-section {
                    text-align: center;
                }
                .icon-wrapper {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    margin-bottom: 1rem;
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .title {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin: 0;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to right, #ffffff, #e9d5ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .subtitle {
                    color: #e9d5ff;
                    opacity: 0.8;
                }

                .reset-link {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 0.75rem;
                    margin-top: 1rem;
                    cursor: pointer;
                    text-decoration: underline;
                }
                .reset-link:hover {
                    color: rgba(255, 255, 255, 0.6);
                }

                .form-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1.5rem;
                    padding: 2rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .step-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .step-header {
                    text-align: center;
                }
                .step-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                    color: white;
                }
                .step-description {
                    font-size: 0.875rem;
                    color: #9ca3af;
                }

                /* Groups Grid */
                .group-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .group-btn {
                    position: relative;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    aspect-ratio: 1; 
                }
                .group-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: scale(1.02);
                    box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.2);
                }
                .group-btn:active {
                    transform: scale(0.95);
                }
                .group-letter {
                    font-size: 2.25rem;
                    font-weight: bold;
                    color: white;
                    margin-bottom: 0.25rem;
                }
                .group-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: rgba(233, 213, 255, 0.6);
                }

                /* Input Section */
                .input-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .input-wrapper {
                    position: relative;
                }
                :global(.input-icon) {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    pointer-events: none;
                }
                .styled-input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    padding: 1rem 1rem 1rem 3rem; /* Left padding for icon */
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .styled-input:focus {
                    border-color: rgba(168, 85, 247, 0.5);
                    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
                }
                
                .button-row {
                    display: flex;
                    gap: 0.75rem;
                }
                .btn-secondary {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #d1d5db;
                    border-radius: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .start-btn {
                    flex: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    border: none;
                }
                .start-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Global classes from global.css might be available, but we define specifics here to contain it */
                .btn-primary {
                    background: linear-gradient(to right, #9333ea, #4f46e5);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .btn-primary:hover:not(:disabled) {
                    filter: brightness(1.1);
                    box-shadow: 0 0 15px rgba(147, 51, 234, 0.4);
                }
            `}</style>
        </div>
    );
}

