const DEFAULT_SUPABASE_URL = 'https://xyfhlgdyzxxvhryjvqcm.supabase.co';
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_EmGwHAduz7UAe5h_YviZNw_iz7AADmR';

// Supabase Auth is the secure default. Set VITE_SUPABASE_AUTH=false only for local demos.
export const SUPABASE_AUTH_ENABLED = import.meta.env.VITE_SUPABASE_AUTH !== 'false';
export const SUPABASE_AUTH_TOKEN_KEY = 'smartlab_supabase_access_token';
export const SUPABASE_REFRESH_TOKEN_KEY = 'smartlab_supabase_refresh_token';
export const SUPABASE_EXPIRES_AT_KEY = 'smartlab_supabase_expires_at';

function authHeaders(token = SUPABASE_KEY, extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + (token || SUPABASE_KEY),
    'Content-Type': 'application/json',
    ...extra
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Supabase ne repond pas dans le delai imparti.');
    throw new Error('Projet Supabase injoignable. Verifiez l URL du projet et la connexion internet.');
  } finally {
    window.clearTimeout(timeout);
  }
}

function readJson(response) {
  return response.json().catch(() => ({}));
}

function sessionDetails(payload) {
  const user = payload?.user || {};
  const metadata = { ...(user.app_metadata || {}), ...(user.user_metadata || {}) };
  return {
    accessToken: payload?.access_token || '',
    refreshToken: payload?.refresh_token || '',
    expiresAt: payload?.expires_at || (payload?.expires_in ? Math.floor(Date.now() / 1000) + payload.expires_in : 0),
    user,
    role: metadata.testlab_role || metadata.role || '',
    label: metadata.full_name || metadata.name || user.email || ''
  };
}

function persistSession(session) {
  if (!session?.accessToken) return;
  localStorage.setItem(SUPABASE_AUTH_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) localStorage.setItem(SUPABASE_REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.expiresAt) localStorage.setItem(SUPABASE_EXPIRES_AT_KEY, String(session.expiresAt));
}

export function clearSupabaseSession() {
  localStorage.removeItem(SUPABASE_AUTH_TOKEN_KEY);
  localStorage.removeItem(SUPABASE_REFRESH_TOKEN_KEY);
  localStorage.removeItem(SUPABASE_EXPIRES_AT_KEY);
}

export function getSupabaseAccessToken() {
  return localStorage.getItem(SUPABASE_AUTH_TOKEN_KEY) || '';
}

async function fetchCurrentUser(accessToken) {
  const response = await fetchWithTimeout(SUPABASE_URL + '/auth/v1/user', { headers: authHeaders(accessToken) });
  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(payload?.msg || payload?.message || 'Session Supabase invalide');
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function refreshSession(refreshToken) {
  const response = await fetchWithTimeout(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(payload?.error_description || payload?.msg || 'Session expiree');
    error.status = response.status;
    throw error;
  }
  const session = sessionDetails(payload);
  persistSession(session);
  return session;
}

export async function getCurrentSupabaseSession() {
  const accessToken = getSupabaseAccessToken();
  if (!accessToken) return null;

  try {
    const user = await fetchCurrentUser(accessToken);
    const session = sessionDetails({ access_token: accessToken, user });
    session.refreshToken = localStorage.getItem(SUPABASE_REFRESH_TOKEN_KEY) || '';
    session.expiresAt = Number(localStorage.getItem(SUPABASE_EXPIRES_AT_KEY) || 0);
    return session;
  } catch (error) {
    const refreshToken = localStorage.getItem(SUPABASE_REFRESH_TOKEN_KEY) || '';
    if (error?.status === 401 && refreshToken) {
      try {
        return await refreshSession(refreshToken);
      } catch (refreshError) {
        clearSupabaseSession();
        return null;
      }
    }
    if (error?.status === 401) clearSupabaseSession();
    throw error;
  }
}

export async function signInWithSupabasePassword({ email, password }) {
  if (!email || !password) throw new Error('Email et mot de passe requis.');
  const response = await fetchWithTimeout(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email: email.trim().toLowerCase(), password })
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.msg || payload?.message || 'Email ou mot de passe incorrect.');
  }
  const session = sessionDetails(payload);
  persistSession(session);
  return session;
}

export async function signOutSupabase() {
  const token = getSupabaseAccessToken();
  if (token) {
    await fetchWithTimeout(SUPABASE_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: authHeaders(token)
    }, 8000).catch(() => {});
  }
  clearSupabaseSession();
}

export function getSupabaseConfig() {
  return { url: SUPABASE_URL, hasPublishableKey: Boolean(SUPABASE_KEY) };
}
