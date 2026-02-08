import { encrypt } from '@/lib/crypto';

export default function QrListPage() {
    const treasures = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        encrypted: encrypt(String(i))
    }));

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
            <h1>QR Code Data List</h1>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                Copy these encrypted strings to generate your QR codes physically if needed.
                (Note: The IV changes every time you encrypt, but all valid encryptions decode to the same ID).
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                <thead>
                    <tr style={{ background: '#333' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>QR Data (JSON Format)</th>
                    </tr>
                </thead>
                <tbody>
                    {treasures.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '0.5rem' }}>{t.id}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                {JSON.stringify({ id: t.encrypted, type: 'treasure' })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
