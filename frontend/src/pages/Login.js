import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authProfiles, useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('responsable_appel');
  const [loading, setLoading] = useState(false);
  const { login, user, useSupabaseAuth } = useAuth();
  const navigate = useNavigate();
  const selectedProfile = authProfiles.find((profile) => profile.role === role);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const success = await login({ email, password, role });
    setLoading(false);
    if (success) navigate('/', { replace: true });
  };

  return (
    <div className="loginPage">
      <form className="loginPanel" onSubmit={handleSubmit}>
        <div className="loginBrand">
          <div className="brandMark">TL</div>
          <h1>TEST<span>LAB</span></h1>
          <p>{useSupabaseAuth ? 'Connexion securisee par Supabase Auth' : 'Connexion locale de demonstration'}</p>
        </div>

        {!useSupabaseAuth && (
          <label>
            <span>Role utilisateur</span>
            <select value={role} onChange={(event) => {
              const nextRole = event.target.value;
              const profile = authProfiles.find((item) => item.role === nextRole);
              setRole(nextRole);
              setEmail(profile?.email || '');
            }}>
              {authProfiles.map((profile) => <option key={profile.role} value={profile.role}>{profile.label}</option>)}
            </select>
          </label>
        )}

        <label>
          <span>Email professionnel</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@entreprise.com" autoComplete="username" required />
        </label>

        <label>
          <span>Mot de passe</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" autoComplete="current-password" required />
        </label>

        <button className="primaryButton" type="submit" disabled={loading}>
          {loading ? 'Verification...' : 'Se connecter'}
        </button>

        {!useSupabaseAuth && <div className="loginProfiles">
          {authProfiles.map((profile) => (
            <button type="button" className={profile.role === role ? 'active' : ''} key={profile.role} onClick={() => { setRole(profile.role); setEmail(profile.email); }}>
              <strong>{profile.initials}</strong>
              <span>{profile.label}</span>
            </button>
          ))}
        </div>}

        <small className="loginSecurityNote">
          {useSupabaseAuth ? 'Votre role et vos permissions sont recuperes depuis votre compte securise.' : 'Le mode local est reserve aux demonstrations.'}
        </small>
      </form>
    </div>
  );
}

export default Login;
