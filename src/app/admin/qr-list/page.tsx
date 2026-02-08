import { getAllQrMappings } from '@/lib/file-db';

export const dynamic = 'force-dynamic';

export default async function QrListPage() {
    const mappings = await getAllQrMappings(); // { "code": id }

    // Convert to array and sort by ID
    const treasures = Object.entries(mappings)
        .map(([code, id]) => ({ id, code }))
        .sort((a, b) => a.id - b.id);

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
            <h1>QR Code Data List (Mapped)</h1>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                Copy these JSON strings to generate your QR codes.
                These codes are mapped on the server to Treasure IDs.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                <thead>
                    <tr style={{ background: '#333' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>QR Data (JSON Format)</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Raw Code</th>
                    </tr>
                </thead>
                <tbody>
                    {treasures.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '0.5rem' }}>{t.id}</td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', color: '#4ade80' }}>
                                {JSON.stringify({ id: t.code, type: 'treasure' })}
                            </td>
                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.5 }}>
                                {t.code}
                            </td>
                        </tr>
                    ))}
                    {treasures.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>
                                No QR codes found. Run the seed script!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
