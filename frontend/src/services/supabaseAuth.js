const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xyfhlgdyzxxvhryjvqcm.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_EmGwHAduz7UAe5h_YvizNw_iz7AADmR';

export const SUPABASE_AUTH_ENABLED = import.meta.env.VITE_SUPABASE_AUTH === 'true';
export const SUPABASE_AUTH_TOKEN_KEY = 'smartlab_supabase_access_token';
export const SUPABASE_REFRESH_TOKEN_KEY = 'smartlab_supabase_refresh_token';

function authHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

function persistSession(session) {
  if (!session?.access_token) return;
  localStorage.setItem(SUPABASE_AUTH_TOKEN_KEY, session.access_token);
  if (session.refresh_token) localStorage.setItem(SUPABASE_REFRESH_TOKEN_KEY, session.refresh_token);
}

export function clearSupabaseSession() {
  localStorage.removeItem(SUPABASE_AUTH_TOKEN_KEY);
  localStorage.removeItem(SUPABASE_REFRESH_TOKEN_KEY);
}

export function getSupabaseAccessToken() {
  return localStorage.getItem(SUPABASE_AUTH_TOKEN_KEY) || '';
}

export async function signInWithSupabasePassword({ email, password }) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.msg || payload?.message || 'Connexion Supabase refusee');
  }

  persistSession(payload);
  const user = payload.user || {};
  const metadata = { ...(user.app_metadata || {}), ...(user.user_metadata || {}) };
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    user,
    role: metadata.testlab_role || metadata.role || '',
    label: metadata.full_name || metadata.name || user.email || ''
  };
}

export async function signOutSupabase() {
  const token = getSupabaseAccessToken();
  if (token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders({ Authorization: `Bearer ${token}` })
    }).catch(() => {});
  }
  clearSupabaseSession();
}