"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';

export default function SchedulePage() {
    const router = useRouter();
    const [scheduleData, setScheduleData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/schedule');
                const data = await res.json();
                if (data.success) {
                    setScheduleData(data.schedule);
                }
            } catch (error) {
                console.error('Failed to fetch schedule:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="page-container">
            <header className="page-header">
                <button onClick={() => router.push('/dashboard')} className="back-btn">
                    <ArrowLeft size={24} />
                    Back
                </button>
                <h1 className="title">
                    <Clock className="icon" size={28} />
                    Event Schedule
                </h1>
            </header>

            <div className="card schedule-card">
                {loading ? (
                    <div className="loading-state">Loading schedule...</div>
                ) : scheduleData.length > 0 ? (
                    <table className="schedule-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>1동</th>
                                <th>3동</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scheduleData.map((row: any, i: number) => (
                                <tr key={i}>
                                    <td className="time-col">{row.time}</td>
                                    <td>{row.room1}</td>
                                    <td>{row.room3}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">No schedule available.</div>
                )}
            </div>

            <style jsx>{`
                .page-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 1.5rem;
                    color: white;
                    min-height: 100vh;
                }
                
                .page-header {
                    margin-bottom: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .back-btn {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    width: fit-content;
                    padding: 0;
                }
                .back-btn:hover { color: white; }

                .title {
                    font-size: 2rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin: 0;
                    background: linear-gradient(to right, #fde047, #facc15);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                :global(.icon) { color: #fde047; }

                .schedule-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1.5rem;
                    padding: 1.5rem;
                    overflow: hidden;
                }

                .schedule-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 1rem;
                }
                .schedule-table th {
                    text-align: left;
                    padding: 1rem;
                    color: #c084fc;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: bold;
                }
                .schedule-table td {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .schedule-table tr:last-child td {
                    border-bottom: none;
                }
                .time-col {
                    font-weight: bold;
                    color: #fde047;
                    width: 80px;
                }
                .loading-state, .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
