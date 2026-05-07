import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Topbar = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const getTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path === '/essais') return 'Gestion des Essais';
        if (path === '/clients') return 'Clients';
        if (path === '/equipements') return 'Équipements';
        if (path === '/rapports') return 'Rapports';
        return 'SMARTLAB';
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            toast.success(`Recherche : ${searchTerm}`);
        }
    };

    return (
        <div style={{
            height: '60px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            marginLeft: '260px'
        }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px' }}>{getTitle()}</h2>

            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', margin: '0 20px' }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text)',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text2)' }}>{user?.prenom} {user?.nom}</span>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }}>{user?.prenom?.[0]}{user?.nom?.[0]}</div>
            </div>
        </div>
    );
};

export default Topbar;
