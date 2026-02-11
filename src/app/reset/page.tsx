"use client";

import { useEffect } from 'react';

export default function ResetPage() {
    useEffect(() => {
        // Clear all cookies via API route
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
                // Clear local storage if any
                localStorage.clear();
                // Redirect to Home
                window.location.href = '/';
            });
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: 'white' }}>
            <h2>Resetting your session...</h2>
            <div className="spinner"></div>
            <style jsx>{`
                .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top: 4px solid #fff;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
