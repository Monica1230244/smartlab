import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authProfiles, useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('smartlab123');
  const [role, setRole] = useState('responsable_appel');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const selectedProfile = authProfiles.find((profile) => profile.role === role);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const success = await login({ email: email || selectedProfile?.email, password, role });
    setLoading(false);
    if (success) navigate('/', { replace: true });
  };

  return (
    <div className="loginPage">
      <form className="loginPanel" onSubmit={handleSubmit}>
        <div className="loginBrand">
          <div className="brandMark">TL</div>
          <h1>SMART<span>LAB</span></h1>
          <p>Connexion par profil metier</p>
        </div>

        <label>
          <span>Role utilisateur</span>
          <select value={role} onChange={(event) => {
            const nextRole = event.target.value;
            const profile = authProfiles.find((item) => item.role === nextRole);
            setRole(nextRole);
            setEmail(profile?.email || '');
          }}>
            {authProfiles.map((profile) => (
              <option key={profile.role} value={profile.role}>{profile.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={selectedProfile?.email || 'utilisateur@testlab.com'}
          />
        </label>

        <label>
          <span>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            required
          />
        </label>

        <button className="primaryButton" type="submit" disabled={loading}>
          {loading ? 'Connexion...' : `Entrer comme ${selectedProfile?.label || 'utilisateur'}`}
        </button>

        <div className="loginProfiles">
          {authProfiles.map((profile) => (
            <button
              type="button"
              className={profile.role === role ? 'active' : ''}
              key={profile.role}
              onClick={() => {
                setRole(profile.role);
                setEmail(profile.email);
              }}
            >
              <strong>{profile.initials}</strong>
              <span>{profile.label}</span>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

export default Login;
