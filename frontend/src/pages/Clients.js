import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px' }}>Clients</h1>
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border)'
            }}>
                {loading ? (
                    <p>Chargement...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Raison sociale</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Contact</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Secteur</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px' }}><strong>{client.code}</strong></td>
                                    <td style={{ padding: '12px' }}>{client.raison_sociale}</td>
                                    <td style={{ padding: '12px' }}>{client.contact_nom || '-'}</td>
                                    <td style={{ padding: '12px' }}>{client.secteur || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Clients;
