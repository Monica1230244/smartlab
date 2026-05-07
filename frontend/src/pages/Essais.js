import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Essais = () => {
    const [essais, setEssais] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEssais();
    }, []);

    const fetchEssais = async () => {
        try {
            const res = await api.get('/essais');
            setEssais(res.data);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px' }}>Gestion des Essais</h1>
                <button
                    onClick={() => toast.success('Formulaire d\'ajout (simulation)')}
                    style={{
                        background: 'var(--accent)',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >+ Nouvel Essai</button>
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
                                <th style={{ padding: '12px', textAlign: 'left' }}>N° Essai</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Client</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {essais.map((essai) => (
                                <tr key={essai.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px' }}><strong>{essai.numero}</strong></td>
                                    <td style={{ padding: '12px' }}>{essai.type_essai}</td>
                                    <td style={{ padding: '12px' }}>{essai.client_nom || '-'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            background: essai.statut === 'en_cours' ? 'rgba(59,158,255,0.1)' : 'rgba(0,212,170,0.1)',
                                            color: essai.statut === 'en_cours' ? 'var(--accent)' : 'var(--accent2)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px'
                                        }}>{essai.statut === 'en_cours' ? 'En cours' : 'Terminé'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && essais.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px' }}>Aucun essai trouvé</p>
                )}
            </div>
        </div>
    );
};

export default Essais;
