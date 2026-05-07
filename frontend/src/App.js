import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [essais, setEssais] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Appel au backend
        axios.get('http://localhost:5000/api/essais')
            .then(response => {
                setEssais(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Erreur:', error);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0b0f1a 0%, #1a1a2e 100%)',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '20px',
                textAlign: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h1 style={{ color: '#3b9eff', margin: 0 }}>🧪 SMARTLAB</h1>
                <p style={{ color: '#aaa', margin: '5px 0 0' }}>Gestion de Laboratoire ISO 17025</p>
            </div>

            {/* Contenu */}
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <div style={{ background: 'rgba(59,158,255,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px' }}>🧪</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>47</div>
                        <div style={{ color: '#aaa' }}>Essais en cours</div>
                    </div>
                    <div style={{ background: 'rgba(0,212,170,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px' }}>✅</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>128</div>
                        <div style={{ color: '#aaa' }}>Essais complétés</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px' }}>📦</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>93</div>
                        <div style={{ color: '#aaa' }}>Échantillons</div>
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px' }}>⚠️</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>2</div>
                        <div style={{ color: '#aaa' }}>Non-conformités</div>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <h2 style={{ color: '#3b9eff', marginBottom: '20px' }}>📋 Derniers essais</h2>
                    {loading ? (
                        <p>Chargement...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>N° Essai</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Client</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {essais.map(essai => (
                                    <tr key={essai.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '10px' }}><strong>{essai.numero}</strong></td>
                                        <td style={{ padding: '10px' }}>{essai.type_essai}</td>
                                        <td style={{ padding: '10px' }}>{essai.client_nom}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{
                                                background: essai.statut === 'en_cours' ? 'rgba(59,158,255,0.2)' : 'rgba(0,212,170,0.2)',
                                                color: essai.statut === 'en_cours' ? '#3b9eff' : '#00d4aa',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px'
                                            }}>
                                                {essai.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
