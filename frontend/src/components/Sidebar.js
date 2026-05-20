import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { path: '/', icon: '📊', label: 'Dashboard' },
        { path: '/essais', icon: '🧪', label: "Objets d'essais" },
        { path: '/clients', icon: '🏢', label: 'Clients' },
        { path: '/devis', icon: '📋', label: 'Devis' },
        { path: '/commandes', icon: '🧾', label: 'Commandes' },
        { path: '/projets', icon: '📁', label: 'Projets' },
        { path: '/equipements', icon: '⚙️', label: 'Équipements' },
        { path: '/echantillons', icon: '📦', label: 'Échantillons' },
        { path: '/rapports', icon: '📄', label: 'Rapports' },
        { path: '/personnel', icon: '👥', label: 'Personnel' },
        { path: '/audits', icon: '✅', label: 'Audits' },
        { path: '/non-conformites', icon: '⚠️', label: 'Non-conformités' },
        { path: '/parametres', icon: '🔧', label: 'Paramètres' },
    ];

    return (
        <div style={{
            width: collapsed ? '70px' : '260px',
            background: 'var(--surface)',
            minHeight: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            transition: 'width 0.3s',
            zIndex: 100,
            borderRight: '1px solid var(--border)'
        }}>
            <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px'
                }}>SL</div>
                {!collapsed && <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 'bold' }}><span style={{ color: 'var(--accent)' }}>SMART</span>LAB</span>}
            </div>

            <div style={{ padding: '16px 12px' }}>
                {navItems.map(item => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            marginBottom: '4px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: location.pathname === item.path ? 'var(--surface2)' : 'transparent',
                            color: location.pathname === item.path ? 'var(--accent)' : 'var(--text2)',
                            justifyContent: collapsed ? 'center' : 'flex-start'
                        }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </div>
                ))}
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', borderTop: '1px solid var(--border)' }}>
                <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--accent4)', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                    <span>🚪</span>
                    {!collapsed && <span>Déconnexion</span>}
                </div>
                <button onClick={() => setCollapsed(!collapsed)} style={{
                    marginTop: '12px',
                    width: '100%',
                    background: 'var(--surface2)',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--text2)',
                    cursor: 'pointer'
                }}>{collapsed ? '→' : '←'}</button>
            </div>
        </div>
    );
};

export default Sidebar;
