import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const TOKEN_KEY = 'smartlab_token';
const USER_KEY = 'smartlab_user';
const CURRENT_ROLE_KEY = 'smartlab_current_role';

const roleLabels = {
  responsable_appel: 'Responsable des offres',
  responsable_technique: 'Responsable technique',
  dg: 'Direction generale',
  responsable_labo: 'Responsable laboratoire',
  receptionniste: 'Reception'
};

export const authProfiles = [
  { role: 'responsable_appel', label: roleLabels.responsable_appel, email: 'offres@testlab.com', initials: 'RO' },
  { role: 'responsable_technique', label: roleLabels.responsable_technique, email: 'rt@testlab.com', initials: 'RT' },
  { role: 'dg', label: roleLabels.dg, email: 'dg@testlab.com', initials: 'DG' },
  { role: 'responsable_labo', label: roleLabels.responsable_labo, email: 'labo@testlab.com', initials: 'RL' },
  { role: 'receptionniste', label: roleLabels.receptionniste, email: 'reception@testlab.com', initials: 'RC' }
];

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      localStorage.setItem(CURRENT_ROLE_KEY, parsedUser.role);
      window.dispatchEvent(new CustomEvent('smartlab:role-changed', { detail: parsedUser.role }));
    }
    setLoading(false);
  }, [token]);

  const login = async ({ email, password, role }) => {
    const profile = authProfiles.find((item) => item.role === role);
    if (!profile) {
      toast.error('Selectionnez un role valide');
      return false;
    }
    if (!password || password.length < 4) {
      toast.error('Mot de passe requis');
      return false;
    }

    const nextUser = {
      ...profile,
      email: email || profile.email,
      name: profile.label
    };
    const nextToken = `smartlab-${role}-${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(CURRENT_ROLE_KEY, role);
    setToken(nextToken);
    setUser(nextUser);
    window.dispatchEvent(new CustomEvent('smartlab:role-changed', { detail: role }));
    toast.success(`Connecte: ${profile.label}`);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    toast.success('Deconnexion reussie');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, roleLabels }}>
      {children}
    </AuthContext.Provider>
  );
};
