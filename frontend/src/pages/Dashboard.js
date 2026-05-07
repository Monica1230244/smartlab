import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        essaisEnCours: 0,
        essaisComplete: 0,
        echantillonsActifs: 0,
        nonConformites: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Erreur chargement stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { icon: '🧪', value: stats.essaisEnCours, label: 'Essais en cours', color: '#3b9eff' },
        { icon: '✅', value: stats.essaisComplete, label: 'Essais complétés', color: '#00d4aa' },
        { icon: '📦', value: stats.echantillonsActifs, label: 'Échantillons actifs', color: '#f59e0b' },
        { icon: '⚠️', value: stats.nonConformites, label: 'Non-conformités', color: '#ef4444' }
    ];

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px' }}>Tableau de Bord</h1>
                <p style={{ color: 'var(--text3)', marginTop: '4px' }}>Bienvenue sur SMARTLAB</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {statCards.map((card, idx) => (
                    <div key={idx} style={{
                        background: 'var(--surface)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: "'Syne', sans-serif" }}>{loading ? '...' : card.value}</div>
                        <div style={{ color: 'var(--text3)', marginTop: '4px' }}>{card.label}</div>
                    </div>
                ))}
            </div>

            <div style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border)'
            }}>
                <h3>Activité récente</h3>
                <p style={{ color: 'var(--text3)', marginTop: '8px' }}>Bienvenue sur votre application SMARTLAB.</p>
            </div>
        </div>
    );
};

export default Dashboard;
