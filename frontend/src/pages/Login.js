import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authProfiles, defaultRouteForRole } from '../config/permissions';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { login, user, useSupabaseAuth } = useAuth();
  const navigate = useNavigate();
  const selectedRole = searchParams.get('role') || '';
  const selectedProfile = authProfiles.find((profile) => profile.role === selectedRole);

  useEffect(() => {
    if (!selectedProfile) {
      navigate('/roles', { replace: true });
      return;
    }
    setEmail((current) => current || selectedProfile.email);
  }, [navigate, selectedProfile]);

  if (user) return <Navigate to={defaultRouteForRole(user.role)} replace />;
  if (!selectedProfile) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const success = await login({ email, password, role: selectedRole });
    setLoading(false);
    if (success) navigate(defaultRouteForRole(selectedRole), { replace: true });
  };

  return (
    <div className="loginPage">
      <form className="loginPanel" onSubmit={handleSubmit}>
        <button type="button" className="loginBackButton" onClick={() => navigate('/roles')}>
          &lt; Changer de role
        </button>

        <div className="loginBrand">
          <div className="brandMark">TL</div>
          <h1>TEST<span>LAB</span></h1>
          <p>{useSupabaseAuth ? 'Connexion securisee par Supabase Auth' : 'Connexion locale de demonstration'}</p>
        </div>

        <div className="loginRoleBadge">
          <strong>{selectedProfile.initials}</strong>
          <span><small>Role selectionne</small>{selectedProfile.label}</span>
        </div>

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

        <small className="loginSecurityNote">
          {useSupabaseAuth ? 'Le compte Supabase doit posseder ce role. Les menus et donnees sont ensuite limites a votre fonction.' : 'Le mode local est reserve aux demonstrations.'}
        </small>
      </form>
    </div>
  );
}

export default Login;
