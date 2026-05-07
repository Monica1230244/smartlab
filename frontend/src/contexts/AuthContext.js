import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('smartlab_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => logout())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('smartlab_token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            toast.success('Connexion réussie');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur de connexion');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('smartlab_token');
        setToken(null);
        setUser(null);
        toast.success('Déconnexion réussie');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
