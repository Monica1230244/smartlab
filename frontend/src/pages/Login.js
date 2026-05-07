import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);
        if (success) navigate('/');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '20px'
        }}>
            <div style={{
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '40px',
                width: '100%',
                maxWidth: '420px',
                border: '1px solid var(--border)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>SL</div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px' }}>SMART<span style={{ color: 'var(--accent)' }}>LAB</span></h1>
                    <p style={{ color: 'var(--text3)', fontSize: '14px', marginTop: '8px' }}>Gestion de Laboratoire ISO 17025</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text2)' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@smartlab.com"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text2)' }}>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text3)' }}>
                    <p>admin@smartlab.com / admin123</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
