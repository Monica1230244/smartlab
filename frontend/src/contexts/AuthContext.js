import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listRecords, upsertRecord } from '../services/localStore';
import { SUPABASE_AUTH_ENABLED, signInWithSupabasePassword, signOutSupabase } from '../services/supabaseAuth';
import { authProfiles, roleLabels } from '../config/permissions';

const AuthContext = createContext();
const TOKEN_KEY = 'smartlab_token';
const USER_KEY = 'smartlab_user';
const CURRENT_ROLE_KEY = 'smartlab_current_role';

export { authProfiles };
export const useAuth = () => useContext(AuthContext);

function profileId(role) {
  return `profile-${role}`;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const applyUser = (nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(CURRENT_ROLE_KEY, nextUser.role);
    setUser(nextUser);
    window.dispatchEvent(new CustomEvent('smartlab:role-changed', { detail: nextUser.role }));
    window.dispatchEvent(new CustomEvent('smartlab:profile-changed', { detail: nextUser }));
  };

  const loadProfile = async (baseUser) => {
    if (!baseUser?.role) return baseUser;
    try {
      const profiles = await listRecords('profiles');
      const remoteProfile = profiles.find((profile) => (
        profile.id === profileId(baseUser.role) || profile.role === baseUser.role || profile.email === baseUser.email
      ));
      return remoteProfile ? { ...baseUser, ...remoteProfile } : baseUser;
    } catch (error) {
      console.warn('Profil Supabase indisponible:', error);
      return baseUser;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateUser = async () => {
      const savedUser = localStorage.getItem(USER_KEY);
      if (token && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const syncedUser = await loadProfile(parsedUser);
        if (!cancelled) applyUser(syncedUser);
      }
      if (!cancelled) setLoading(false);
    };

    hydrateUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async ({ email, password, role }) => {
    const selectedProfile = authProfiles.find((item) => item.role === role);
    if (!selectedProfile) {
      toast.error('Selectionnez un role valide');
      return false;
    }
    if (!password || password.length < 4) {
      toast.error('Mot de passe requis');
      return false;
    }

    if (SUPABASE_AUTH_ENABLED) {
      try {
        const session = await signInWithSupabasePassword({ email: email || selectedProfile.email, password });
        const roleFromAuth = session.role || role;
        const profile = authProfiles.find((item) => item.role === roleFromAuth) || selectedProfile;
        const baseUser = {
          ...profile,
          email: session.user?.email || email || profile.email,
          name: session.label || profile.label,
          supabase_user_id: session.user?.id || '',
          auth_provider: 'supabase'
        };
        const nextUser = await loadProfile(baseUser);
        localStorage.setItem(TOKEN_KEY, session.accessToken);
        setToken(session.accessToken);
        applyUser(nextUser);
        toast.success(`Connecte Supabase: ${profile.label}`);
        return true;
      } catch (error) {
        toast.error(error?.message || 'Connexion Supabase impossible');
        return false;
      }
    }

    const baseUser = {
      ...selectedProfile,
      email: email || selectedProfile.email,
      name: selectedProfile.label,
      auth_provider: 'local_profile'
    };
    const nextUser = await loadProfile(baseUser);
    const nextToken = `smartlab-${role}-${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    applyUser(nextUser);
    toast.success(`Connecte: ${selectedProfile.label}`);
    return true;
  };

  const logout = async () => {
    if (SUPABASE_AUTH_ENABLED) await signOutSupabase();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    toast.success('Deconnexion reussie');
  };

  const updateProfile = async (profile) => {
    if (!user?.role) {
      toast.error('Reconnectez-vous avant de modifier le profil');
      return false;
    }

    const nextUser = {
      ...(user || {}),
      ...profile,
      id: profileId(user.role),
      role: user.role,
      initials: user.initials,
      label: user.label
    };
    applyUser(nextUser);

    const saved = await upsertRecord('profiles', nextUser);
    if (saved.__syncError) {
      toast.error(`Profil enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
      return false;
    }

    toast.success('Profil synchronise avec Supabase');
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfile, roleLabels, useSupabaseAuth: SUPABASE_AUTH_ENABLED }}>
      {children}
    </AuthContext.Provider>
  );
};


